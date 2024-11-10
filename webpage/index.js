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

function getLatestDate() {
  const latestDate = new Date(Date.now() - ELEVEN_HOURS);
  const year = latestDate.getUTCFullYear();
  const month = String(latestDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(latestDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSelectedDate(latestDate) {
  const urlDate = new URLSearchParams(window.location.search).get('date');
  return urlDate || latestDate;
}

function dateToString(date) {
  return date.toISOString().split('T')[0];
}

function onSelectedDateChanged(selectedDate, latestDate) {
  if (latestDate === selectedDate) {
    window.location.href = window.location.pathname;
  } else {
    window.location.href = `${window.location.pathname}?date=${selectedDate}`;
  }
}

function createAnchorElement(href, textContent) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.textContent = textContent;
  anchor.target = '_blank';
  return anchor;
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
  postContainer.appendChild(createAnchorElement(post['url'], unescape(post['title'])));
  postContainer.appendChild(createAnchorElement(post['permalink'], ` [${post['num_comments']} comments]`));
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
  dateInput.addEventListener('change', (e) => onSelectedDateChanged(e.target.value, currentDate));
}

function main() {
  try {
    const latestDate = getLatestDate();
    const selectedDate = getSelectedDate(latestDate);

    initializeDateInput(latestDate, selectedDate);

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
  const previousDateAnchor = document.getElementById('previous-date');
  const nextDateAnchor = document.getElementById('next-date');
  const latestDate = getLatestDate();
  const selectedDate = getSelectedDate(latestDate);

  dateInput.value = selectedDate;

  if (selectedDate <= MIN_DATE) {
    previousDateAnchor.classList.add('date-link__disabled');
  } else {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    previousDateAnchor.href = `${window.location.pathname}?date=${dateToString(previousDate)}`;
  }

  if (selectedDate >= latestDate) {
    nextDateAnchor.classList.add('date-link__disabled');
  } else {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDateAnchor.href = `${window.location.pathname}?date=${dateToString(nextDate)}`;
  }
};

main();
