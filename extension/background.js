function getPrompt (country, productName) {
  return `The following is a government dataset about specific countries, types of goods produced by them, and whether or not forced or child labor was involved.\r\n\r\nBEGIN DATA\r\nCountry\/Area\tTVPRA Input Good\tChild Labor\tForced Labor\tCountry\/Area\tTVPRA Downstream Good\tDownstream Goods at Risk\r\nBolivia\tZinc\tX\t\tSouth Korea\tIndium\tConductive Glass,Touchscreen Devices, Flatscreen Devices, Televisions, Phones, Tablets, Semiconductors, Solar Panels, Indium-tin Oxide, and LEDs\r\nChina\tAluminum\t\tX\tChina\tAuto Parts and Components (Aluminum) \tAutomotive Vehicles, Aircrafts, Household Appliances, Healthcare Equipment, Electronics, Food Packaging, Beverage Cans, Construction Supplies and Tools\r\nChina\tCotton\t\tX\tChina\tGarments (Cotton) \tGarments, Textiles, Cotton-Based Products\r\nChina\tPolysilicon\t\tX\tChina\tPhotovoltaic Ingots\tSilica-Based Products, Solar Products, Semiconductors\r\nChina\tPolysilicon\t\tX\tChina\tSolar Cells\tSilica-Based Products, Solar Products, Semiconductors\r\nC\u00F4te d\u2019Ivoire \tCocoa\tX\t\tC\u00F4te d\u2019Ivoire \tChocolate\tCandy, Baked Goods, Beverages, Ice Cream, Cosmetic Products, Soap\r\nC\u00F4te d\u2019Ivoire and Ghana\tCocoa\tX\t\tCocoa Butter \tCandy, Baked Goods, Beverages, Ice Cream, Cosmetic Products, Soap\r\nDemocratic Republic of the Congo\tCopper Ore\tX\t\tDemocratic Republic of the Congo\tCopper Products \tElectric Vehicles, Electrical Equipment, Electrical Wiring, Brass, Steel, Telecommunications Products, Construction Materials\r\nDominican Republic\tSugarcane\t\tX\tDominican Republic\tBagasse \tBeverages, Alcoholic Beverages, Candy, Baked Goods, Processed Food Products, Animal Feed, Paper, Pulp, Construction Materials, Biofuels, Industrial Chemicals, Medicines, Medicinal Alcohol\r\nDominican Republic\tSugarcane\t\tX\tDominican Republic\tRum\tBeverages, Alcoholic Beverages, Candy, Baked Goods, Processed Food Products, Animal Feed, Paper, Pulp, Construction Materials, Biofuels, Industrial Chemicals, Medicines, Medicinal Alcohol\r\nGhana\tCocoa\tX\t\tGhana\tCococa Products, Baked Goods, Beverages, Ice Cream, Cosmetic Products, Soap\r\nIndonesia\tPalm Fruit\tX\tX\tIndonesia\tCrude Palm Kernel Oil\tCooking Oils, Animal Feed, Baked Goods, Biofuels, Beverages, Household and Industrial Products, Infant Formula, Personal Care Products and Cosmetic Products\r\nMalawi\tTobacco\tX\tX\tMalawi\tCigarettes (Tobacco) \tTobacco Products\r\nMalaysia\tPalm Fruit\tX\tX\tIndia\tCooking Oil (Palm Oil Blends)\tAnimal Feed, Baked Goods, Beverages, Household and Industrial Products, Personal Care Products, Cosmetic Products, Infant Formula, Shortening, Pet Food\r\nPhilippines\tCoconut\tX\t\tPhilippines\tCoconut Oil \tAnimal Feed, Household and Industrial Items, Bakery Items, Personal Care and Cosmetic Products\r\nThailand\tFish\t\tX\tThailand\tAnimal Feed\tShrimp, Poultry, Cosmetics, Supplements, Pet Food\r\nEND DATA\r\n\r\nUsing the data provided here, predict whether this following amazon product involved child or forced labor in its creation.\r\n\r\nAmazon product title: ${productName}\r\nSeller country: ${country}\r\n\r\nYour response must be ONLY a SINGLE object of strict JSON format. It must match this example exactly:\r\n\r\n{ \"flag\": \"0 or 1\", \"confidence\": \"0-100%\" }\r\n\r\nflag is whether you think that this product aligns with one of the rows in the table that involves either child or forced labor.\r\nconfidence is a percentage that weighs how likely the prediction is correct strictly based on the provided data.`;
}

function createBubble (country, aiResult) {
  const amazonCenterCol = document.getElementById('centerCol');
  const bubContainer = document.createElement('div');
  const bubble = document.createElement('img');
  const dialog = document.createElement('div');

  // Delete spinner
  amazonCenterCol.removeChild(document.getElementById('cc-spinner'));

  dialog.innerText = 'We found no issues with this product';

  bubble.setAttribute('width', 40);
  bubble.src = chrome.runtime.getURL('/img/logo48.png');
  bubble.classList.add('cc-bubble');

  dialog.classList.add('cc-dialog');

  bubContainer.classList.add('cc-bubble-container');
  bubContainer.appendChild(bubble);
  bubContainer.appendChild(dialog);

  try {
    const aiRating = JSON.parse(aiResult.response);

    if (aiRating.flag === '1') {
      bubble.src = chrome.runtime.getURL('/img/logo_notif48.png');
      dialog.classList.add('issue');
      dialog.innerText = `These types of products made in ${country} may involve unethical labor practices. AI prediction confidence: ${aiRating.confidence}`;
    }
  } catch (e) {
    console.error('Error parsing AI result', e);
  }

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
      "unknownOrigins":[{ "asin": asin }]
    })
  });
  return await data.json();
};

const getAIResult = async (country, productName) => {
  const data = await fetch('https://ai.nortories.com/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      "model": "llama3.2:1b",
      "stream": false,
      "options": {"temperature": 0},
      "prompt": getPrompt(country, productName),
    })
  });
  return data.json();
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    const split = tab.url.split('/');
    const productName = split[3];
    const asin = split[5];

    if (split[2] === 'www.amazon.com' && split[4] === 'dp' && asin) {
      insertCSS(tabId);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createSpinner,
      });

      const res = await getCountryOfOrigin(asin);
      const countryName = res?.[0]?.countryName || null;
      let aiResult = null;
      if (countryName) {
        console.log('Gettings AI result for', countryName, productName);
        aiResult = await getAIResult(countryName, productName);
        console.log(aiResult);
      }

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: createBubble,
        args: [countryName, aiResult],
      });
    }
  }
});