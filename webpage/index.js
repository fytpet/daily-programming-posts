const MIN_DATE = "2023-10-08";
const ELEVEN_HOURS = 11 * 60 * 60 * 1000;

function getActiveDay() {
  const activeDate = new Date(Date.now() - ELEVEN_HOURS);

  const year = activeDate.getUTCFullYear();
  const month = String(activeDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(activeDate.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getSelectedDay(defaultDay) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return urlSearchParams.get('date') ?? defaultDay;
}

function onSelectedDateChanged(e) {
  window.location.href = `${window.location.pathname}?date=${e.target.value}`;
}

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
    const title = document.getElementById('title');
    title.textContent = `${title.textContent} - ${selectedDate}`;

  } catch (error) {
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'Something went wrong, please come back later while we sort this out.'
    document.getElementById('post-list').appendChild(errorMessage);
  }
}

const activeDay = getActiveDay();
const selectedDate = getSelectedDay(activeDay);

const jsonUrl = `https://storage.googleapis.com/daily-posts-bucket/data/${selectedDate}-posts.json`;

const dateInput = document.getElementById('date-input');
dateInput.max = activeDay;
dateInput.min = MIN_DATE;
dateInput.value = selectedDate;
dateInput.addEventListener('change', onSelectedDateChanged);

displayPosts().then();
