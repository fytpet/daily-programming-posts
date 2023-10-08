import datetime
import os
import requests
from google.cloud import firestore

ACTIVE_COMMENT_THRESHOLD = 5
REQUEST_URL = 'https://www.reddit.com/r/programming/new.json?limit=100&show=all'
USER_AGENT = 'DailyProgrammingPosts/1.0 by fytpet (Contact: fytpet@gmail.com)'

TASK_INDEX = os.getenv('CLOUD_RUN_TASK_INDEX', 0)
TASK_ATTEMPT = os.getenv('CLOUD_RUN_TASK_ATTEMPT', 0)


class Post:
    def __init__(self, data):
        self.data = data

    def created_utc(self):
        return datetime.datetime.fromtimestamp(self.data['created_utc'], tz=datetime.timezone.utc)

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

    def __str__(self):
        return f'{self.title()}\n{self.url()}\n{self.permalink()}\n{self.num_comments()} comments'


def get_documents_existence_map(db, collection_ref, active_posts):
    document_refs = [collection_ref.document(post.name()) for post in active_posts]
    documents = db.get_all(document_refs)
    return {document.id: document.exists for document in documents}


def main():
    print(f"Starting Task #{TASK_INDEX}, Attempt #{TASK_ATTEMPT}...")

    response = requests.get(REQUEST_URL, headers={"User-agent": USER_AGENT})
    if not response.status_code == 200:
        exit(response.status_code)

    posts = [Post(child['data']) for child in response.json()['data']['children']]
    print(len(posts), 'posts fetched')

    active_posts = [post for post in posts if post.is_active()]
    print(len(active_posts), 'active posts')

    db = firestore.Client()
    collection_ref = db.collection('posts')
    documents_existence_map = get_documents_existence_map(db, collection_ref, active_posts)

    new_active_posts = [post for post in active_posts if not documents_existence_map[post.name()]]
    print(len(new_active_posts), 'new active posts')

    today = datetime.datetime.utcnow().date()

    batch = db.batch()
    for post in new_active_posts:
        print(f'\n{post}')
        doc_ref = collection_ref.document(post.name())
        batch.set(doc_ref, {
            'created': post.created_utc(),
            'name': post.name(),
            'num_comments': post.num_comments(),
            'permalink': post.permalink(),
            'score': post.score(),
            'subreddit': post.subreddit(),
            'title': post.title(),
            'url': post.url(),
            'day': today.isoformat()
        })
    batch.commit()

    print(f"Completed Task #{TASK_INDEX}.")


if __name__ == '__main__':
    main()
