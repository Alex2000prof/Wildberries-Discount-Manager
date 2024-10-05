console.log("content.js loaded");

const apiKey =
  ""; // Замените на ваш API ключ
let container; // Для интерфейса
let interfaceOpen = false; // Состояние интерфейса
let observer; // Глобальная переменная для хранения экземпляра MutationObserver
let interfaceCreated = false;
let allVariantsContainer;
let mainInterface;
let isProcessing = false;

function getItemIDFromURL() {
  const url = window.location.href; // Получаем текущий URL
  const itemIDMatch = url.match(/\/catalog\/(\d+)\/detail\.aspx/); // Регулярное выражение для извлечения itemID

  if (itemIDMatch && itemIDMatch[1]) {
    return parseInt(itemIDMatch[1], 10); // Преобразуем itemID в целое число
  } else {
    console.error("Item ID не найден в URL.");
    return null; // Если itemID не найден, возвращаем null
  }
}

async function fetchDiscount(itemID, createInterfaceFlag = true) {
  const limit = 1;
  const offset = 0;
  const api_url = `https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter?filterNmID=${itemID}&limit=${limit}&offset=${offset}`;

  try {
    const response = await fetch(api_url, {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log("Полученные данные для itemID", itemID, ":", data);

    if (data.data && data.data.listGoods && data.data.listGoods.length > 0) {
      const currentDiscount = data.data.listGoods[0].discount;
      const currentPrice = data.data.listGoods[0].sizes[0].price;
      console.log("Текущая скидка:", currentDiscount);
      console.log("Текущая цена:", currentPrice);

      if (createInterfaceFlag) {
        const finalPriceFromSite = await fetchPrice(itemID);
        createInterface(currentDiscount, currentPrice, finalPriceFromSite);
      }

      return { currentDiscount, currentPrice };
    } else {
      console.error("Товар не найден");
    }
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
  }
}

async function fetchPrice(itemID) {
  const api_url = `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-445275&spp=30&nm=${itemID}`;
  try {
    const response = await fetch(api_url, {
      method: "GET",
    });

    if (!response.ok) {
      console.error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const salePriceU = data.data.products[0].salePriceU;
    console.log("Текущая цена:", salePriceU / 100); // Логируем цену
    return salePriceU / 100; // Возвращаем цену
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
  }
}

// Обновленная функция observeURLChanges
function observeURLChanges() {
  let lastItemID = getItemIDFromURL(); // Храним последний itemID
  console.log("Начальный ItemID:", lastItemID); // Логируем начальный itemID

  observer = new MutationObserver(() => {
    const newItemID = getItemIDFromURL();

    // Проверяем, изменился ли itemID
    if (newItemID && newItemID !== lastItemID) {
      console.log(`ItemID изменился: ${lastItemID} -> ${newItemID}`); // Логируем изменение itemID
      lastItemID = newItemID; // Обновляем последний itemID

      // Проверяем, был ли уже создан интерфейс
      if (!interfaceCreated) {
        fetchDiscount(newItemID); // Выполняем новый запрос при изменении itemID
        fetchPrice(newItemID);
      } else {
        console.log("Интерфейс уже создан, пропускаем создание");
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer; // Возвращаем объект наблюдателя, если нужно
}

// Функция для запуска отслеживания по действию, например, при клике на кнопку
function startObserving() {
  console.log("Отслеживание изменений URL запущено.");
  observeURLChanges();
}
window.onload = () => {
  createToggleButton();
};

function createToggleButton() {
  console.log("Начинаем создание кнопки...");

  // Находим заголовок h1
  const titleElement = document.querySelector(".product-page__title");

  console.log("titleElement найден:", !!titleElement);

  // Проверка на существование кнопки
  if (titleElement && !document.querySelector(".toggle-button")) {
    const toggleButton = document.createElement("button");
    toggleButton.className = "toggle-button"; // Устанавливаем класс для кнопки
    toggleButton.textContent = "Изменить цену"; // Текст кнопки
    toggleButton.style.backgroundColor = "#a73afd"; // Фиолетовый фон кнопки
    toggleButton.style.color = "#fff"; // Белый текст
    toggleButton.style.border = "none"; // Без бордера
    toggleButton.style.borderRadius = "4px"; // Скругленные углы
    toggleButton.style.padding = "10px 15px"; // Отступы
    toggleButton.style.cursor = "pointer"; // Курсор при наведении
    toggleButton.style.fontSize = "14px"; // Размер шрифта
    toggleButton.style.fontWeight = "bold"; // Полужирный текст
    toggleButton.style.transition = "background-color 0.3s, transform 0.2s"; // Плавный переход
    toggleButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"; // Легкая тень
    toggleButton.style.marginTop = "2px"; // Отступ справа
    toggleButton.style.marginBottom = "4px";

    // Эффекты при наведении
    toggleButton.addEventListener("mouseenter", () => {
      toggleButton.style.backgroundColor = "#b05cf5"; // Более светлый фиолетовый при наведении
      toggleButton.style.transform = "scale(1.05)"; // Увеличение при наведении
    });

    toggleButton.addEventListener("mouseleave", () => {
      toggleButton.style.backgroundColor = "#a73afd"; // Возврат к оригинальному цвету
      toggleButton.style.transform = "scale(1)"; // Возврат к оригинальному размеру
    });

    // Вставляем кнопку после заголовка
    titleElement.parentNode.insertBefore(
      toggleButton,
      titleElement.nextSibling
    );

    // Добавляем событие на нажатие кнопки

    // Добавляем событие на нажатие кнопки
    toggleButton.addEventListener("click", () => {
      if (isProcessing) {
        console.log("Подождите, пока завершится текущий процесс.");
        showAlertClose("Подождите!");
        return; // Предотвращаем открытие интерфейса, если идет процесс
      }
      if (!interfaceCreated) {
        console.log("Кнопка нажата!"); // Логируем нажатие кнопки
        let itemID = getItemIDFromURL();
        console.log("Полученный itemID:", itemID); // Логируем itemID

        startObserving(); // Запускаем наблюдение за изменениями URL
        fetchDiscount(itemID); // Вызов функции для получения данных по скидке

        interfaceCreated = true; // Устанавливаем флаг, что интерфейс был создан
      } else {
        console.warn("Интерфейс уже был создан");
      }
    });

    console.log("Кнопка добавлена");
  } else if (!titleElement) {
    console.warn("Элемент с заголовком не найден");
  } else {
    console.warn("Кнопка уже добавлена");
  }
}

// Функция для отслеживания изменений в DOM
function observeChanges() {
  console.log("Начинаем наблюдение за изменениями в DOM...");
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // Проверка, изменился ли заголовок
        if (mutation.target.matches(".product-page__title")) {
          console.log("Изменения в DOM найдены");
          createToggleButton(); // Вызываем создание кнопки
        }
      }
    }
  });

  // Начинаем наблюдение за изменениями в теле документа
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("Наблюдение запущено");
}

observeChanges(); // Начинаем наблюдение

function createInterface(currentDiscount, currentPrice, finalPriceFromSite) {
  const titleElement = document.querySelector(".product-page__title");

  console.log("titleElement найден:", !!titleElement);

  // Проверка на существование элемента заголовка
  if (titleElement) {
    let container = document.createElement("div");
    container.style.position = "relative"; // Позиционирование относительно родителя
    container.style.marginTop = "10px"; // Отступ сверху от заголовка
    container.style.backgroundColor = "#ffffff"; // Белый фон
    container.style.border = "2px solid #a73afd"; // Фиолетовый бордер
    container.style.padding = "20px"; // Увеличенные отступы
    container.style.zIndex = "1000"; // Убедимся, что контейнер выше остальных элементов
    container.style.boxShadow = "0 6px 30px rgba(0,0,0,0.3)"; // Более сильная тень
    container.style.width = "425px"; // Увеличенная ширина
    container.style.borderRadius = "4px"; // Скругленные углы
    container.style.fontFamily = "'Arial', sans-serif"; // Шрифт

    // Добавляем стиль для заголовка
    const title = document.createElement("h2");
    title.textContent = "Информация о скидке"; // Заголовок
    title.style.fontSize = "58px"; // Увеличенный размер шрифта
    title.style.color = "#333"; // Цвет заголовка
    title.style.marginBottom = "15px"; // Отступ снизу

    // Добавляем информацию о ценах
    const discountInfo = document.createElement("p");
    discountInfo.textContent = `Текущая скидка: ${currentDiscount}%`;
    discountInfo.style.fontSize = "52px"; // Увеличенный размер шрифта
    discountInfo.style.color = "#666"; // Цвет текста

    const priceInfo = document.createElement("p");
    priceInfo.textContent = `Текущая цена: ${currentPrice}₽`;
    priceInfo.style.fontSize = "55px"; // Увеличенный размер шрифта
    priceInfo.style.color = "#666"; // Цвет текста

    const finalPriceInfo = document.createElement("p");
    finalPriceInfo.textContent = `Финальная цена: ${finalPriceFromSite}₽`;
    finalPriceInfo.style.fontSize = "52px"; // Увеличенный размер шрифта
    finalPriceInfo.style.color = "#666"; // Цвет текста

    // Добавляем элементы в контейнер
    container.appendChild(title);
    container.appendChild(discountInfo);
    container.appendChild(priceInfo);
    container.appendChild(finalPriceInfo);

    const intermediatePrice = currentPrice * (1 - currentDiscount / 100);
    const wbDiscount = calculateWBDiscount(
      finalPriceFromSite,
      intermediatePrice
    );

    container.innerHTML = `
    <h3 style="color: #5B2E91; margin-bottom: 15px;">Изменение скидки</h3>
    <label id="apply_all_label" style = "font-size: 100px;">
    <input type="checkbox" id="apply-to-all" style="width: 20px; height: 20px; cursor: pointer; border: 1px solid #5b2e91; accent-color: #5b2e91;" /> Применить ко всем цветам
    </label>

    <label for="desired-price">Желаемая цена:</label>
    
    <input type="number" id="desired-price" placeholder="Введите желаемую цену" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px;" />
    <div>
      <label>Будущая цена:</label>
      <span id="futurePrice">0</span>
    </div>
    <div>
      <label style="display: none">Текущая цена (основная):</label>
      <span id="current-price" style="display: none">${currentPrice}</span>
    </div>
    <div>
      <label>Текущая скидка:</label>
      <span id="current-discount">${currentDiscount}%</span>
    </div>
    <div>
      <label style="display: none">Промежуточная цена со скидкой продавца:</label>
      <span id="intermediate-price" style="display: none">${intermediatePrice.toFixed(
        2
      )}</span>
    </div>
    <div>
      <label>Скидка Wildberries (X):</label>
      <span id="wb-discount">${wbDiscount.toFixed(2)}%</span>
    </div>
    <div>
      <label>Цена на сайте:</label>
      <span id="final-price-from-site">${finalPriceFromSite.toFixed(2)}</span>
    </div>
    <div>
      <label>Новая скидка:</label>
      <span id="new-discount">0%</span>
    </div>
    <button id="update-discount" style="background-color: #5B2E91; color: #ffffff; border: none; border-radius: 8px; padding: 12px; cursor: pointer; width: 100%; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: background-color 0.3s;">Изменить скидку</button>
    <button id="close-interface" style="background-color: #ff4d4d; color: #ffffff; border: none; border-radius: 8px; padding: 12px; cursor: pointer; width: 100%; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: background-color 0.3s;">Закрыть</button>
    `;

    // Стилизация элементов
    const labels = container.querySelectorAll("label");
    labels.forEach((label) => {
      label.style.color = "#5B2E91"; // Фиолетовый цвет для текстов
      label.style.fontSize = "26px"; // Увеличенный размер шрифта для меток
    });

    const inputFields = container.querySelectorAll("input, span");
    inputFields.forEach((field) => {
      field.style.fontSize = "26px"; // Увеличенный размер шрифта
      field.style.marginBottom = "10px"; // Отступы между полями
    });

    const buttons = container.querySelectorAll("button");
    buttons.forEach((button) => {
      // Эффект при наведении
      button.addEventListener("mouseenter", () => {
        button.style.opacity = "0.8"; // Уменьшаем непрозрачность при наведении
        button.style.fontSize = "26px";
      });
      button.addEventListener("mouseleave", () => {
        button.style.opacity = "1"; // Возвращаем прозрачность
        button.style.fontSize = "16px";
      });
    });

    titleElement.insertAdjacentElement("afterend", container);

    document.getElementById("desired-price").addEventListener("input", () => {
      const desiredPrice = parseFloat(
        document.getElementById("desired-price").value
      );

      if (!isNaN(desiredPrice) && desiredPrice > 0) {
        // Рассчитываем текущую цену с учетом скидки Wildberries
        const currentPrice = parseFloat(
          document.getElementById("current-price").textContent
        );
        const wbDiscountDecimal = wbDiscount / 100;

        // Находим максимальную цену с учетом текущей цены и скидки Wildberries
        const maxPossiblePrice = Math.floor(
          currentPrice * (1 - wbDiscountDecimal)
        );

        // Вычисляем необходимую скидку, чтобы цена приближалась к желаемой
        const newDiscount = calculateNewDiscount(
          desiredPrice - 50,
          maxPossiblePrice
        );

        document.getElementById("new-discount").textContent = `${newDiscount}%`;

        const futurePrice = Math.round(
          currentPrice * (1 - newDiscount / 100) * (1 - wbDiscount / 100)
        );
        document.getElementById("futurePrice").textContent =
          futurePrice.toFixed(0);
      }
    });

    // Функция для расчета новой скидки
    function calculateNewDiscount(desiredPrice, maxPossiblePrice) {
      const newDiscount =
        ((maxPossiblePrice - desiredPrice) / maxPossiblePrice) * 100;
      return Math.round(newDiscount); // Округляем до целого числа
    }

    // Обработчик события для кнопки обновления скидки
    document
      .getElementById("update-discount")
      .addEventListener("click", async () => {
        if (isProcessing) {
          console.log("Подождите, пока завершится текущий процесс.");
          return; // Предотвращаем повторное нажатие, если уже в процессе
        }

        isProcessing = true; // Устанавливаем флаг, что процесс начат
        console.log("Процесс начат...");
        const newDiscount = parseInt(
          document.getElementById("new-discount").textContent
        );
        const currentPrice = parseFloat(
          document.getElementById("current-price").textContent
        );
        const itemID = getItemIDFromURL();
        const applyToAll = document.getElementById("apply-to-all").checked; // Проверка галочки
        try {
          if (applyToAll) {
            const allColorIDs = await getColorVariantArticleIDs(); // Получаем все цветовые варианты

            // Создаем контейнер для всех цветовых вариантов, если его еще нет
            if (!allVariantsContainer) {
              createAllVariantsContainer();
            }

            // Очищаем предыдущие данные контейнера
            allVariantsContainer.innerHTML = "";

            // Получаем информацию о каждом цвете и добавляем её в контейнер
            for (let colorID of allColorIDs) {
              const discountData = await fetchDiscount(colorID, false); // Получаем данные о скидке, передаем false чтобы не создавать интерфейс

              if (
                discountData &&
                discountData.currentDiscount !== undefined &&
                discountData.currentPrice !== undefined
              ) {
                const { currentDiscount, currentPrice } = discountData;

                // Добавляем информацию о каждом цвете в общий контейнер
                const variantInfo = document.createElement("p");
                variantInfo.textContent = `Цвет ${colorID}: Текущая скидка: ${currentDiscount}%, Текущая цена: ${currentPrice}₽`;
                allVariantsContainer.appendChild(variantInfo);
              } else {
                console.warn(
                  `Не удалось получить корректные данные для артикула ${colorID}`
                );
              }

              // Обновление скидок для каждого цвета
              if (!isNaN(newDiscount) && currentPrice !== undefined) {
                try {
                  await updateDiscount(colorID, newDiscount, currentPrice); // Обновляем скидку для каждого цвета
                  console.log(`Скидка обновлена для артикула ${colorID}`);
                  container.remove();
                  interfaceOpen = false;
                } catch (error) {
                  console.error(
                    `Ошибка при обновлении скидки для артикула ${colorID}:`,
                    error
                  );
                }
              }
            }
          } else {
            // Логика для одного артикула
            if (!isNaN(newDiscount) && currentPrice !== undefined) {
              try {
                await updateDiscount(itemID, newDiscount, currentPrice); // Передаем itemID, newDiscount и currentPrice
                console.log(`Скидка обновлена для артикула ${itemID}`);
                container.remove();
                interfaceOpen = false;
              } catch (error) {
                console.error("Ошибка при обновлении скидки:", error);
              }
            } else {
              console.error("Некорректная новая скидка или цена");
            }
          }
        } finally {
          // Сбрасываем флаг после завершения обработки
          isProcessing = false;
          console.log("Процесс завершен.");

          // Закрываем интерфейсы после применения изменений
          if (allVariantsContainer) {
            allVariantsContainer.remove();
            allVariantsContainer = null; // Сбрасываем ссылку на контейнер
          }

          const mainInterface = document.querySelector(".interface-container");
          if (mainInterface) {
            mainInterface.remove(); // Удаляем основной интерфейс
            interfaceOpen = false; // Обновляем флаг
          }

          // Отключаем наблюдателя
          if (observer) {
            observer.disconnect();
            console.log("Наблюдение остановлено.");
          }
        }
      });
    document
      .getElementById("apply-to-all")
      .addEventListener("change", async (event) => {
        if (event.target.checked) {
          // Создаем контейнер, если он еще не создан
          if (!allVariantsContainer) {
            createAllVariantsContainer();
          }

          // Очищаем предыдущие данные
          allVariantsContainer.innerHTML = "";
        } else {
          // Если галочка снята, удаляем контейнер
          if (allVariantsContainer) {
            allVariantsContainer.remove();
            allVariantsContainer = null; // Сбрасываем ссылку на контейнер
          }
        }
      });

    function createAllVariantsContainer() {
      allVariantsContainer = document.createElement("div");
      allVariantsContainer.style.display = "none";
      allVariantsContainer.style.marginTop = "20px";
      allVariantsContainer.style.fontSize = "12px"; // Маленький шрифт
      allVariantsContainer.style.border = "1px solid #a73afd"; // Фиолетовая обводка контейнера
      allVariantsContainer.style.padding = "10px"; // Отступы
      allVariantsContainer.style.borderRadius = "5px"; // Скругленные углы
      allVariantsContainer.style.backgroundColor = "#f9f9f9"; // Светлый фон
      allVariantsContainer.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)"; // Легкая тень

      const titleElement = document.querySelector(".product-page__title");
      titleElement.insertAdjacentElement("afterend", allVariantsContainer);
    }

    const closeButton = document.getElementById("close-interface");
    closeButton.addEventListener("click", () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container); // Закрываем основной интерфейс
        console.log("Основной интерфейс закрыт."); // Логируем закрытие интерфейса
      }

      // Сбрасываем флаг создания интерфейса
      interfaceCreated = false;

      // Удаляем контейнер для всех цветовых вариантов, если он существует
      if (allVariantsContainer && allVariantsContainer.parentNode) {
        allVariantsContainer.parentNode.removeChild(allVariantsContainer);
        console.log("Контейнер с вариантами цветов закрыт."); // Логируем удаление контейнера вариантов
        allVariantsContainer = null; // Сбрасываем ссылку на контейнер
      }

      // Отключаем наблюдателя, если он существует
      if (observer) {
        observer.disconnect(); // Отключаем наблюдателя
        console.log("Наблюдение остановлено."); // Логируем остановку наблюдения
      }
    });

    titleElement.insertAdjacentElement("afterend", container);
  }
}

function calculateWBDiscount(finalPrice, intermediatePrice) {
  return ((intermediatePrice - finalPrice) / intermediatePrice) * 100; // Скидка WB
}

function calculateNewDiscount(desiredPrice, currentPrice) {
  const newDiscount = ((currentPrice - desiredPrice) / currentPrice) * 100; // Новая скидка
  return Math.floor(newDiscount); // Округляем до целого числа
}
// Функция для создания уведомления

async function updateDiscount(nmID, discount, currentPrice) {
  const api_url =
    "https://discounts-prices-api.wildberries.ru/api/v2/upload/task";

  const payload = {
    data: [
      {
        nmID: nmID,
        price: currentPrice,
        discount: discount,
      },
    ],
  };

  console.log("Отправляемые данные:", JSON.stringify(payload));

  try {
    const response = await fetch(api_url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ошибка при обновлении скидки: ${response.status}`);
    }

    const result = await response.json();
    console.log("Скидка успешно обновлена:", result);
    interfaceCreated = false;
    showAlert(
      "Цена успешно обновилась! Чтобы увидеть новую цену и изменить цену перезагрузите страницу."
    );

    // Получаем актуальные данные после обновления скидки
    // Вызываем новую функцию
  } catch (error) {
    console.error("Ошибка при обновлении скидки:", error);
  }
}
// Создаем стили для уведомления
// Создаем стили для уведомления
const styles = `
    #custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: none;
        transition: opacity 0.5s ease, transform 0.5s ease;
        opacity: 0;
        transform: translateY(-20px);
    }
    #custom-alert.show {
        opacity: 1;
        transform: translateY(0);
    }
    #custom-alert.hidden {
        opacity: 0;
        pointer-events: none;
    }
    #custom-alert button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        cursor: pointer;
        font-weight: bold;
        margin-left: 10px;
        border-radius: 4px;
        padding: 5px 10px;
        transition: background 0.3s;
    }
    #custom-alert button:hover {
        background: rgba(255, 255, 255, 0.4);
    }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Создаем элемент для уведомления
const alertBox = document.createElement("div");
alertBox.id = "custom-alert";
document.body.appendChild(alertBox);

// Функция для отображения уведомления
function showAlert(message) {
  alertBox.textContent = message; // Устанавливаем новый текст сообщения

  // Проверяем, есть ли кнопка, и если нет, создаем ее
  let closeButton = alertBox.querySelector("button");
  if (!closeButton) {
    closeButton = document.createElement("button");
    closeButton.textContent = "Закрыть";
    alertBox.appendChild(closeButton); // Добавляем кнопку в уведомление

    // Закрытие уведомления по клику на кнопку
    closeButton.onclick = () => {
      hideAlert(); // Вызываем отдельную функцию для скрытия
    };
  }

  alertBox.style.display = "block"; // Показываем уведомление
  alertBox.classList.remove("hidden"); // Убираем класс скрытия
  alertBox.classList.add("show"); // Добавляем класс для показа

  // Убедимся, что уведомление будет скрыто через 5 секунд
  setTimeout(() => {
    hideAlert(); // Вызываем отдельную функцию для скрытия
  }, 5000); // Уведомление будет показано 5 секунд
}

// Функция для скрытия уведомления
function hideAlert() {
  alertBox.classList.remove("show"); // Убираем класс показа
  alertBox.classList.add("hidden"); // Добавляем класс скрытия

  // Задержка для анимации
  setTimeout(() => {
    alertBox.style.display = "none"; // Прячем уведомление после задержки
  }, 500); // Задержка соответствует времени анимации
}

const stylesClose = `
    #custom-alert-box {
        position: fixed;
        top: 100px; /* Смещаем ниже, чтобы не было в верхнем углу */
        right: 20px;
        background: #e0e0e0; /* Серый фон */
        color: #333; /* Темно-серый цвет текста */
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: none;
        transition: opacity 0.5s ease, transform 0.5s ease;
        opacity: 0;
        transform: translateY(-20px);
    }
    #custom-alert-box.custom-show {
        opacity: 1;
        transform: translateY(0);
    }
    #custom-alert-box.custom-hidden {
        opacity: 0;
        pointer-events: none;
    }
    #custom-alert-box button.custom-alert-close-btn {
        background: rgba(50, 50, 50, 0.2); /* Серый цвет для кнопки */
        border: none;
        color: #333; /* Темно-серый цвет текста на кнопке */
        cursor: pointer;
        font-weight: bold;
        margin-left: 10px;
        border-radius: 4px;
        padding: 5px 10px;
        transition: background 0.3s;
    }
    #custom-alert-box button.custom-alert-close-btn:hover {
        background: rgba(50, 50, 50, 0.4); /* Более темный серый при наведении */
    }
`;

function hideAlertClose() {
  alertBoxClose.classList.remove("custom-show"); // Убираем класс показа
  alertBoxClose.classList.add("custom-hidden"); // Добавляем класс скрытия

  // Задержка для анимации
  setTimeout(() => {
    alertBoxClose.style.display = "none"; // Прячем уведомление после задержки
  }, 500); // Задержка соответствует времени анимации
}

const styleSheetClose = document.createElement("style");
styleSheetClose.type = "text/css";
styleSheetClose.innerText = stylesClose;
document.head.appendChild(styleSheetClose);

// Создаем элемент для уведомления
const alertBoxClose = document.createElement("div");
alertBoxClose.id = "custom-alert-box";
document.body.appendChild(alertBoxClose);

// Функция для отображения уведомления
function showAlertClose(message) {
  alertBoxClose.textContent = message; // Устанавливаем новый текст сообщения

  // Проверяем, есть ли кнопка, и если нет, создаем ее
  let closeButton = alertBoxClose.querySelector(
    "button.custom-alert-close-btn"
  );
  if (!closeButton) {
    closeButton = document.createElement("button");
    closeButton.classList.add("custom-alert-close-btn"); // Добавляем новый класс для кнопки
    closeButton.textContent = "Закрыть";
    alertBoxClose.appendChild(closeButton); // Добавляем кнопку в уведомление

    // Закрытие уведомления по клику на кнопку
    closeButton.onclick = () => {
      hideAlertClose(); // Вызываем отдельную функцию для скрытия
    };
  }

  alertBoxClose.style.display = "block"; // Показываем уведомление
  alertBoxClose.classList.remove("custom-hidden"); // Убираем класс скрытия
  alertBoxClose.classList.add("custom-show"); // Добавляем класс для показа

  // Убедимся, что уведомление будет скрыто через 5 секунд
  setTimeout(() => {
    hideAlertClose(); // Вызываем отдельную функцию для скрытия
  }, 5000); // Уведомление будет показано 5 секунд
}

//PART 2

async function getColorVariantArticleIDs() {
  const colorItems = document.querySelectorAll(
    "div.custom-slider__item.j-color"
  );
  const articleIDs = [];

  colorItems.forEach((item) => {
    const link = item.querySelector('a.img-plug[href*="/catalog/"]');
    if (link) {
      const match = link.href.match(/\/catalog\/(\d+)\//);
      if (match && match[1]) {
        const articleID = parseInt(match[1], 10);
        articleIDs.push(articleID);
      }
    }
  });

  console.log("Найденные артикулы:", articleIDs);
  return articleIDs;
}
