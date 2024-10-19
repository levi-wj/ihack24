function createBubble (country) {
  const bubContainer = document.createElement('div');
  const bubble = document.createElement('img');
  const dialog = document.createElement('div');
  const amazonCenterCol = document.getElementById('centerCol');

  bubble.src = chrome.runtime.getURL('/img/logo_notif48.png');
  bubble.setAttribute('width', 40);
  bubble.classList.add('cc-bubble');

  dialog.classList.add('cc-dialog');
  dialog.innerText = `This product is made in ${country}`;

  bubContainer.classList.add('cc-bubble-container');
  bubContainer.appendChild(bubble);
  bubContainer.appendChild(dialog);

  amazonCenterCol.insertBefore(bubContainer, amazonCenterCol.firstChild);
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
      const res = await getCountryOfOrigin(asin);
      const countryName = res[0].countryName;

      insertCSS(tabId);

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createBubble,
        args: [countryName],
      });
    }
  }
});