import datetime
import requests

ACTIVE_COMMENT_THRESHOLD = 5
REQUEST_URL = 'https://www.reddit.com/r/programming/new.json?limit=100&show=all'
USER_AGENT = 'DailyProgrammingPosts/1.0 by fytpet (Contact: fytpet@gmail.com)'


def to_eastern_standard_time(utc_time):
    return utc_time + datetime.timedelta(hours=-5)


def today():
    utc_now = datetime.datetime.utcnow()
    est_now = to_eastern_standard_time(utc_now)
    return est_now.date()


def yesterday():
    return today() - datetime.timedelta(days=1)


class Post:
    def __init__(self, data):
        self.data = data

    def is_yesterday(self):
        created_utc = datetime.datetime.fromtimestamp(self.data['created_utc'])
        return to_eastern_standard_time(created_utc).date() == yesterday()

    def is_active(self):
        return self.num_comments() >= ACTIVE_COMMENT_THRESHOLD

    def num_comments(self):
        return self.data["num_comments"]

    def title(self):
        return self.data['title']

    def url(self):
        return self.data['url']

    def permalink(self):
        return f'https://www.reddit.com{self.data["permalink"]}'

    def __str__(self):
        return f'{self.title()}\n{self.url()}\n{self.permalink()}\n{self.num_comments()}'


def main():
    response = requests.get(REQUEST_URL, headers={"User-agent": USER_AGENT})
    if response.status_code == 200:
        posts = [Post(child['data']) for child in response.json()['data']['children']]
        print(len(posts), 'posts fetched')

        yesterdays_posts = [post for post in posts if post.is_yesterday()]
        print(len(yesterdays_posts), 'posts yesterday')

        yesterdays_active_posts = [post for post in yesterdays_posts if post.is_active()]
        print(len(yesterdays_active_posts), 'active posts yesterday')

        for post in yesterdays_active_posts:
            print(f'\n{post}')
    else:
        exit(response.status_code)


if __name__ == '__main__':
    main()
