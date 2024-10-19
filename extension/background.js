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
  // document.getElementById('output').innerText = JSON.stringify(json);
};

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const asin = tab.url.split('/')[5];
    const res = await getCountryOfOrigin(asin);
    console.log(res);
  }
});