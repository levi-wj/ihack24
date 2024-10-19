function createBubble (country) {
  const amazonCenterCol = document.getElementById('centerCol');
  const bubContainer = document.createElement('div');
  const bubble = document.createElement('img');
  const dialog = document.createElement('div');

  bubble.src = chrome.runtime.getURL('/img/logo48.png');
  bubble.setAttribute('width', 40);
  bubble.classList.add('cc-bubble');

  dialog.classList.add('cc-dialog');
  if (country) {
    dialog.classList.add('issue');
    dialog.innerText = `This product is made in ${country}`;
  } else {
    dialog.innerText = 'We found no issues with this product';
  }

  bubContainer.classList.add('cc-bubble-container');
  bubContainer.appendChild(bubble);
  bubContainer.appendChild(dialog);

  // Delete spinner
  amazonCenterCol.removeChild(document.getElementById('cc-spinner'));

  amazonCenterCol.insertBefore(bubContainer, amazonCenterCol.firstChild);
}

function createSpinner () {
  const amazonCenterCol = document.getElementById('centerCol');
  const spinner = document.createElement('img');

  spinner.src = chrome.runtime.getURL('/img/css-loader.gif');
  spinner.setAttribute('width', 40);
  spinner.classList.add('cc-spinner');
  spinner.id = 'cc-spinner';

  amazonCenterCol.insertBefore(spinner, amazonCenterCol.firstChild);
}

function insertCSS (tabId) {
  chrome.scripting.insertCSS({
    target: { tabId },
    files: ["styles.css"],
  });
}

const getCountryOfOrigin = async (asin) => {
  // It's not stealing if they don't know you're doing it
  const data = await fetch('https://www.wecultivate.us/snippet/amazon-search-page/get-origins-from-feedback', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "unknownOrigins":[ { "asin": asin } ]
    })
  });
  return await data.json();
};

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const split = tab.url.split('/');
    const asin = split[5];

    if (split[2] === 'www.amazon.com' && split[4] === 'dp' && asin) {
      insertCSS(tabId);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createSpinner,
      });

      const res = await getCountryOfOrigin(asin);
      const countryName = res?.[0]?.countryName;

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createBubble,
        args: [countryName || null],
      });
    }
  }
});