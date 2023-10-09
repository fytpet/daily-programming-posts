const MIN_DATE = '2023-10-08';
const ELEVEN_HOURS = 11 * 60 * 60 * 1000;

function getCurrentDate() {
  const currentDate = new Date(Date.now() - ELEVEN_HOURS);
  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSelectedDate(currentDate) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return urlSearchParams.get('date') ?? currentDate;
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

async function displayPosts(selectedDate) {
  try {
    const jsonUrl = `https://storage.googleapis.com/daily-posts-bucket/data/${selectedDate}-posts.json`;
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

function initializeDateInput(currentDate, selectedDate) {
  const dateInput = document.getElementById('date-input');
  dateInput.max = currentDate;
  dateInput.min = MIN_DATE;
  dateInput.value = selectedDate;
  dateInput.addEventListener('change', onSelectedDateChanged);
}

function main() {
  const currentDate = getCurrentDate();
  const selectedDate = getSelectedDate(currentDate);

  initializeDateInput(currentDate, selectedDate);
  displayPosts(selectedDate).then();
}

main();
