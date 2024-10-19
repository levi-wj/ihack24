function createBubble (country) {
  const bubble = document.createElement('div');
  const amazonCoreprice = document.getElementById('centerCol');
  bubble.classList.add('bubble');
  bubble.innerText = country;
  amazonCoreprice.insertAdjacentElement('afterend', bubble);
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

      console.log(countryName);

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createBubble,
        args: [countryName],
      });
    }
  }
});