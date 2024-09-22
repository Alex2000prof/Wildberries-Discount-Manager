console.log("content.js loaded");

const apiKey = ""; 
const itemID = 198342691; 
const limit = 1;
const offset = 0;
let container; // for the interface
let interfaceOpen = false; // interface state
let toggleButton; // button for opening the interface

async function fetchDiscount() {
  const api_url = `https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter?filterNmID=${itemID}&limit=${limit}&offset=${offset}`;

  try {
    const response = await fetch(api_url, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log("Received data:", data);

    if (data.data && data.data.listGoods && data.data.listGoods.length > 0) {
      const currentDiscount = data.data.listGoods[0].discount; // current discount
      const currentPrice = data.data.listGoods[0].sizes[0].price; // current price

      const finalPriceFromSite = await getFinalPriceFromSite(); // get the final price from the site
      createInterface(currentDiscount, currentPrice, finalPriceFromSite);
    } else {
      console.error("Item not found");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function getFinalPriceFromSite() {
  return new Promise((resolve) => {
    const finalPriceElement = document.querySelector(
      "ins.price-block__final-price.wallet, ins.price-block__final-price"
    );

    if (finalPriceElement) {
      resolve(
        parseFloat(finalPriceElement.textContent.replace(/[^0-9.]/g, ""))
      );
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        const finalPriceElement = document.querySelector(
          "ins.price-block__final-price.wallet, ins.price-block__final-price"
        );

        if (finalPriceElement) {
          obs.disconnect();
          resolve(
            parseFloat(finalPriceElement.textContent.replace(/[^0-9.]/g, ""))
          );
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        console.warn("Element with the final price was not found on the page.");
        resolve(0);
      }, 15000);
    }
  });
}

function createToggleButton() {
  toggleButton = document.createElement("button");
  toggleButton.textContent = "Open Price Modifier";
  toggleButton.style.position = "fixed";
  toggleButton.style.top = "20px";
  toggleButton.style.right = "20px";
  toggleButton.style.backgroundColor = "#5B2E91"; 
  toggleButton.style.color = "#fff"; 
  toggleButton.style.border = "none"; 
  toggleButton.style.borderRadius = "5px"; 
  toggleButton.style.padding = "10px"; 
  toggleButton.style.cursor = "pointer"; 
  toggleButton.style.zIndex = "1000"; 
  toggleButton.addEventListener("click", () => {
    if (interfaceOpen) {
      container.remove();
      container = null; 
      interfaceOpen = false; 
    } else {
      fetchDiscount();
    }
  });

  document.body.appendChild(toggleButton);
}

function createInterface(currentDiscount, currentPrice, finalPriceFromSite) {
  container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "120px"; 
  container.style.right = "20px";
  container.style.backgroundColor = "#fff"; 
  container.style.border = "1px solid #ccc"; 
  container.style.padding = "10px";
  container.style.zIndex = "1000";
  container.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  container.style.width = "250px";

  const intermediatePrice = currentPrice * (1 - currentDiscount / 100);
  const wbDiscount = calculateWBDiscount(finalPriceFromSite, intermediatePrice);

  container.innerHTML = `
    <label for="desired-price">Desired Price:</label>
    <input type="number" id="desired-price" placeholder="Enter desired price" />
    <div>
      <label>Current Price (base):</label>
      <span id="current-price">${currentPrice}</span>
    </div>
    <div>
      <label>Intermediate Price (seller discount):</label>
      <span id="intermediate-price">${intermediatePrice.toFixed(2)}</span>
    </div>
    <div>
      <label>Price on Site:</label>
      <span id="final-price-from-site">${finalPriceFromSite.toFixed(2)}</span>
    </div>
    <div>
      <label>Current Discount:</label>
      <span id="current-discount">${currentDiscount}%</span>
    </div>
    <div>
      <label>Wildberries Discount (X):</label>
      <span id="wb-discount">${wbDiscount.toFixed(2)}%</span>
    </div>
    <div>
      <label>New Discount:</label>
      <span id="new-discount">0%</span>
    </div>
    <div>
      <label>Future Price (approx):</label>
      <span id="future-price">0</span>
    </div>
    <button id="update-discount">Update Discount</button>
    <button id="close-interface">Close</button>
  `;

  // Style elements
  const labels = container.querySelectorAll("label");
  labels.forEach((label) => {
    label.style.color = "#5B2E91"; 
  });

  const inputFields = container.querySelectorAll("input, span");
  inputFields.forEach((field) => {
    field.style.fontSize = "14px"; 
  });

  const buttons = container.querySelectorAll("button");
  buttons.forEach((button) => {
    button.style.backgroundColor = "#5B2E91"; 
    button.style.color = "#fff"; 
    button.style.border = "none"; 
    button.style.borderRadius = "5px"; 
    button.style.cursor = "pointer"; 
    button.style.padding = "8px 12px"; 
    button.style.marginTop = "5px"; 
    button.style.width = "100%"; 
    button.style.boxShadow = "0 1px 5px rgba(0,0,0,0.2)"; 
    button.style.transition = "background-color 0.3s"; 
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#4A2A73"; 
    });
    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#5B2E91"; 
    });
  });

  document.body.appendChild(container);

  document.getElementById("desired-price").addEventListener("input", () => {
    const desiredPrice = parseInt(
      document.getElementById("desired-price").value
    );
    if (!isNaN(desiredPrice) && desiredPrice > 0) {
      const newDiscount = calculateNewDiscount(desiredPrice, currentPrice);
      document.getElementById("new-discount").textContent = `${newDiscount}%`;

      const futurePrice =
        desiredPrice - Math.round((desiredPrice * wbDiscount) / 100);
      document.getElementById("future-price").textContent =
        futurePrice.toFixed(0);
    }
  });

  document
    .getElementById("update-discount")
    .addEventListener("click", updateDiscount);

  document.getElementById("close-interface").addEventListener("click", () => {
    container.remove();
    container = null;
    interfaceOpen = false;
  });

  interfaceOpen = true;
}

function calculateNewDiscount(desiredPrice, currentPrice) {
  const newDiscount = ((currentPrice - desiredPrice) / currentPrice) * 100;
  return newDiscount.toFixed(2);
}

function calculateWBDiscount(finalPrice, intermediatePrice) {
  const wbDiscount =
    ((intermediatePrice - finalPrice) / intermediatePrice) * 100;
  return wbDiscount;
}

function updateDiscount() {
  const newDiscountValue = document.getElementById("new-discount").textContent;
  console.log("Setting new discount:", newDiscountValue);
  alert(
    "Updating the discount... Unfortunately, this functionality is not yet implemented."
  );
}

createToggleButton();
