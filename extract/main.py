import datetime
import json
import os
import requests
from google.cloud import firestore, storage

ACTIVE_COMMENT_THRESHOLD = 5
REQUEST_URL = 'https://www.reddit.com/r/programming/new.json?limit=100&show=all'
USER_AGENT = 'DailyProgrammingPosts/1.0 by fytpet (Contact: fytpet@gmail.com)'

BUCKET_NAME = 'dailyprogramming.fytilis.com'

TASK_INDEX = os.getenv('CLOUD_RUN_TASK_INDEX', 0)
TASK_ATTEMPT = os.getenv('CLOUD_RUN_TASK_ATTEMPT', 0)


class Post:
    def __init__(self, data):
        self.data = data

    def created_utc(self):
        return datetime.datetime.fromtimestamp(
            self.data['created_utc'],
            tz=datetime.timezone.utc,
        )

    def is_active(self):
        return self.num_comments() >= ACTIVE_COMMENT_THRESHOLD

    def num_comments(self):
        return self.data["num_comments"]

    def score(self):
        return self.data['score']

    def title(self):
        return self.data['title']

    def subreddit(self):
        return self.data['subreddit']

    def name(self):
        return self.data['name']

    def url(self):
        return self.data['url']

    def permalink(self):
        return f'https://www.reddit.com{self.data["permalink"]}'

    def to_dto(self, today):
        return {
            'created': self.created_utc().isoformat(),
            'name': self.name(),
            'num_comments': self.num_comments(),
            'permalink': self.permalink(),
            'score': self.score(),
            'subreddit': self.subreddit(),
            'title': self.title(),
            'url': self.url(),
            'day': today,
        }


def get_documents_existence_map(db, collection_ref, active_posts):
    document_refs = [collection_ref.document(post.name()) for post in active_posts]
    documents = db.get_all(document_refs)
    return {document.id: document.exists for document in documents}


def save_posts_to_firestore(db, collection_ref, new_active_posts, today):
    batch = db.batch()
    for post in new_active_posts:
        doc_ref = collection_ref.document(post.name())
        batch.set(doc_ref, post.to_dto(today))
    batch.commit()


def save_json_to_storage(new_active_posts, utc_now, today):
    posts_json = json.dumps({
        'data': [post.to_dto(today) for post in new_active_posts],
        'date': today,
        'created_at': utc_now.isoformat()
    })
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(BUCKET_NAME)
    filename = f'data/{today}-posts.json'
    blob = bucket.blob(filename)
    blob.upload_from_string(posts_json)
    print(f'File {filename} uploaded to {BUCKET_NAME}.')


def main(*_):
    print(f"Starting Task #{TASK_INDEX}, Attempt #{TASK_ATTEMPT}...")

    response = requests.get(REQUEST_URL, headers={"User-agent": USER_AGENT})
    if not response.status_code == 200:
        exit(response.status_code)

    posts = [Post(child['data']) for child in response.json()['data']['children']]
    print(len(posts), 'posts fetched')

    active_upvoted_posts = [post for post in posts if post.is_active() and post.score() > 0]
    print(len(active_upvoted_posts), 'active upvoted posts')

    db = firestore.Client()
    collection_ref = db.collection('posts')
    documents_existence_map = get_documents_existence_map(db, collection_ref, active_upvoted_posts)

    new_active_upvoted_posts = [
        post for post in active_upvoted_posts
        if not documents_existence_map[post.name()]
    ]
    print(len(new_active_upvoted_posts), 'new active upvoted posts')

    utc_now = datetime.datetime.utcnow()
    today = utc_now.date().isoformat()

    save_posts_to_firestore(db, collection_ref, new_active_upvoted_posts, today)
    save_json_to_storage(new_active_upvoted_posts, utc_now, today)

    print(f"Completed Task #{TASK_INDEX}.")
