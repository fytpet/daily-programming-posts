const ELEVEN_HOURS = 11 * 60 * 60 * 1000;

const activeDate = new Date(Date.now() - ELEVEN_HOURS);

const year = activeDate.getUTCFullYear();
const month = String(activeDate.getUTCMonth() + 1).padStart(2, '0');
const day = String(activeDate.getUTCDate()).padStart(2, '0');

const activeDay = `${year}-${month}-${day}`;

const jsonUrl = `https://storage.googleapis.com/daily-posts-bucket/data/${activeDay}-posts.json`;

function createLinkElement(href, textContent) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = textContent;
  link.target = '_blank';
  return link;
}

async function displayPosts() {
  try {
    const response = await fetch(jsonUrl);
    const data = await response.json();
    for (const post of data.data) {
      const postContainer = document.createElement('div');
      postContainer.className = 'post-container';
      postContainer.role = 'listitem';

      postContainer.appendChild(createLinkElement(post['url'], post['title']));
      postContainer.appendChild(createLinkElement(post['permalink'], ` [${post['num_comments']} comments]`));

      document.getElementById('post-list').appendChild(postContainer);
    }
    const title = document.getElementById("title");
    title.textContent = `${title.textContent} - ${activeDay}`;

  } catch (error) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'Something went wrong, please come back later while we sort this out.'
    document.getElementById('post-list').appendChild(errorMessage);
  }
}

displayPosts().then();
