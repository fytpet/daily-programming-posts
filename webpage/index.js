const MIN_DATE = '2023-10-08';
const ELEVEN_HOURS = 11 * 60 * 60 * 1000; // data is available each day at 11am UTC
const HTML_ENTITIES_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x60;': '`',
};

function unescape(str) {
  let result = str;
  for (const entity in HTML_ENTITIES_MAP) {
    result = result.replace(new RegExp(entity, 'g'), HTML_ENTITIES_MAP[entity]);
  }
  return result;
}

function getCurrentDate() {
  const currentDate = new Date(Date.now() - ELEVEN_HOURS);
  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSelectedDate(currentDate) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  return urlSearchParams.get('date') || currentDate;
}

function onSelectedDateChanged(e, currentDate) {
  if (currentDate === e.target.value) {
    window.location.href = window.location.pathname;
  } else {
    window.location.href = `${window.location.pathname}?date=${e.target.value}`;
  }
}

function createLinkElement(href, textContent) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = textContent;
  link.target = '_blank';
  return link;
}

function displayErrorMessage() {
  const errorMessage = document.createElement('p');
  errorMessage.textContent = 'Something went wrong, please come back later while we sort this out.';
  document.getElementsByTagName('body')[0].appendChild(errorMessage);
}

async function fetchPosts(selectedDate) {
  const jsonUrl = `./data/${selectedDate}-posts.json`;
  const response = await fetch(jsonUrl);
  const data = await response.json();
  return data.data;
}

function displaySelectedDateInTitle(selectedDate) {
  const title = document.getElementById('title');
  const selectedDateNonBreaking = selectedDate.replaceAll('-', '‑');
  title.textContent = `${title.textContent} - ${selectedDateNonBreaking}`;
}

function displayPost(postList, post) {
  const postContainer = document.createElement('div');
  postContainer.className = 'post-container';
  postContainer.role = 'listitem';
  postContainer.appendChild(createLinkElement(post['url'], unescape(post['title'])));
  postContainer.appendChild(createLinkElement(post['permalink'], ` [${post['num_comments']} comments]`));
  postList.appendChild(postContainer);
}

function displayPosts(posts, selectedDate) {
  const postList = document.getElementById('post-list')
  posts.forEach((post) => displayPost(postList, post));
  displaySelectedDateInTitle(selectedDate);
}

function initializeDateInput(currentDate, selectedDate) {
  const dateInput = document.getElementById('date-input');
  dateInput.max = currentDate;
  dateInput.min = MIN_DATE;
  dateInput.value = selectedDate;
  dateInput.addEventListener('change', (e) => onSelectedDateChanged(e, currentDate));
}

function main() {
  try {
    const currentDate = getCurrentDate();
    const selectedDate = getSelectedDate(currentDate);

    initializeDateInput(currentDate, selectedDate);
    fetchPosts(selectedDate)
      .then((posts) => displayPosts(posts, selectedDate))
      .catch((error) => {
        console.error(error);
        displayErrorMessage();
      });
  } catch (error) {
    console.error(error);
    displayErrorMessage();
  }
}

onpageshow = () => {
  const dateInput = document.getElementById('date-input');
  dateInput.value = getSelectedDate(getCurrentDate());
};

main();
