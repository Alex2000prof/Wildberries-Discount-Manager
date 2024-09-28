console.log("content.js loaded");

const apiKey =
  ""; // Замените на ваш API ключ
let container; // Для интерфейса
let interfaceOpen = false; // Состояние интерфейса
let toggleButton; // Кнопка для открытия интерфейса
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

// Пример использования
const itemID = getItemIDFromURL();

async function fetchDiscount() {
  const limit = 1; // Устанавливаем лимит
  const offset = 0; // Устанавливаем офсет
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
    console.log("Полученные данные:", data);

    if (data.data && data.data.listGoods && data.data.listGoods.length > 0) {
      const currentDiscount = data.data.listGoods[0].discount; // Текущая скидка
      const currentPrice = data.data.listGoods[0].sizes[0].price; // Текущая цена
      // const nmID = data.data.listGoods[0].nmID;

      const finalPriceFromSite = await getFinalPriceFromSite(); // Получаем конечную цену с сайта
      createInterface(currentDiscount, currentPrice, finalPriceFromSite);
    } else {
      console.error("Товар не найден");
    }
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
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
        console.warn("Элемент с конечной ценой не найден на странице.");
        resolve(0);
      }, 15000);
    }
  });
}

function createToggleButton() {
  const priceContainer = document.querySelector(".product-page__aside-sticky");
  const priceNotContainer = document.querySelector(
    ".price-block__final-price.wallet "
  );

  if (priceContainer && priceNotContainer) {
    const priceElement = priceContainer.querySelector(
      ".price-block__final-price.wallet"
    );

    if (priceElement && !document.querySelector(".toggle-button")) {
      const toggleButton = document.createElement("button");
      toggleButton.className = "toggle-button"; // Устанавливаем класс для кнопки
      toggleButton.textContent = "Изменить цену"; // Текст кнопки
      toggleButton.style.backgroundColor = "#a73afd"; // Фиолетовый фон кнопки
      toggleButton.style.color = "#fff"; // Белый текст
      toggleButton.style.border = "none"; // Без бордера
      toggleButton.style.borderRadius = "4px"; // Скругленные углы
      toggleButton.style.padding = "10px 15px"; // Отступы
      toggleButton.style.cursor = "pointer"; // Курсор при наведении
      toggleButton.style.marginLeft = "10px"; // Отступ слева от цены
      toggleButton.style.fontSize = "14px"; // Размер шрифта
      toggleButton.style.fontWeight = "bold"; // Полужирный текст
      toggleButton.style.transition = "background-color 0.3s, transform 0.2s"; // Плавный переход
      toggleButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)"; // Легкая тень

      // Эффекты при наведении
      toggleButton.addEventListener("mouseenter", () => {
        toggleButton.style.backgroundColor = "#b05cf5"; // Более светлый фиолетовый при наведении
        toggleButton.style.transform = "scale(1.05)"; // Увеличение при наведении
      });

      toggleButton.addEventListener("mouseleave", () => {
        toggleButton.style.backgroundColor = "#a73afd"; // Возврат к оригинальному цвету
        toggleButton.style.transform = "scale(1)"; // Возврат к оригинальному размеру
      });

      // Вставляем кнопку сразу после элемента priceElement
      priceElement.parentNode.insertBefore(
        toggleButton,
        priceElement.nextSibling
      );

      // Добавляем событие на нажатие кнопки
      toggleButton.addEventListener("click", () => {
        fetchDiscount(); // Вызов функции для изменения цены
      });
    } else if (!priceElement) {
      console.warn("Элемент с финальной ценой не найден");
    } else {
      console.warn("Кнопка уже добавлена");
    }
  } else {
    console.warn("Контейнер с ценой не найден");
  }
}

// Функция для отслеживания изменений в DOM
function observeChanges() {
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        createToggleButton(); // Проверяем и добавляем кнопку
      }
    }
  });

  // Начинаем наблюдение за изменениями в теле документа
  observer.observe(document.body, { childList: true, subtree: true });
}

// Проверка наличия цены при загрузке страницы
createToggleButton(); // Первая проверка
observeChanges(); // Начинаем наблюдение

function createInterface(currentDiscount, currentPrice, finalPriceFromSite) {
  let container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "200px"; // Сместим вниз от кнопки
  container.style.right = "20px";
  container.style.backgroundColor = "#ffffff"; // Белый фон
  container.style.border = "2px solid #a73afd"; // Фиолетовый бордер
  container.style.padding = "30px"; // Увеличенные отступы
  container.style.zIndex = "1000";
  container.style.boxShadow = "0 6px 30px rgba(0,0,0,0.3)"; // Более сильная тень
  container.style.width = "700px"; // Увеличенная ширина
  container.style.borderRadius = "12px"; // Скругленные углы
  container.style.fontFamily = "'Arial', sans-serif"; // Шрифт
  container.style.marginRight = "60px"; // Отступ справа

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
  const wbDiscount = calculateWBDiscount(finalPriceFromSite, intermediatePrice);

  container.innerHTML = `
    <h3 style="color: #5B2E91; margin-bottom: 15px;">Изменение скидки</h3>
    <label for="desired-price">Желаемая цена:</label>
    <input type="number" id="desired-price" placeholder="Введите желаемую цену" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px;" />
    <div>
      <label>Текущая цена (основная):</label>
      <span id="current-price">${currentPrice}</span>
    </div>
    <div>
      <label>Промежуточная цена со скидкой продавца:</label>
      <span id="intermediate-price">${intermediatePrice.toFixed(2)}</span>
    </div>
    <div>
      <label>Цена на сайте:</label>
      <span id="final-price-from-site">${finalPriceFromSite.toFixed(2)}</span>
    </div>
    <div>
      <label>Текущая скидка:</label>
      <span id="current-discount">${currentDiscount}%</span>
    </div>
    <div>
      <label>Скидка Wildberries (X):</label>
      <span id="wb-discount">${wbDiscount.toFixed(2)}%</span>
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

  document.body.appendChild(container);

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
      const maxPossiblePrice = currentPrice * (1 - wbDiscountDecimal);

      // Вычисляем необходимую скидку, чтобы цена приближалась к желаемой
      const newDiscount = calculateNewDiscount(desiredPrice, maxPossiblePrice);

      document.getElementById("new-discount").textContent = `${newDiscount}%`;
    }
  });

  // Функция для расчета новой скидки
  function calculateNewDiscount(desiredPrice, maxPossiblePrice) {
    const newDiscount =
      ((maxPossiblePrice - desiredPrice) / maxPossiblePrice) * 100;
    return Math.round(newDiscount); // Округляем до целого числа
  }

  document
    .getElementById("update-discount")
    .addEventListener("click", async () => {
      const newDiscount = parseInt(
        document.getElementById("new-discount").textContent
      );
      const currentPrice = parseFloat(
        document.getElementById("current-price").textContent
      );

      if (!isNaN(newDiscount) && currentPrice !== undefined) {
        try {
          await updateDiscount(itemID, newDiscount, currentPrice); // Передаем itemID, newDiscount и currentPrice
          // Закрываем интерфейс после успешного обновления
          container.remove();
          interfaceOpen = false; // Устанавливаем состояние интерфейса как закрытое
        } catch (error) {
          console.error("Ошибка при обновлении скидки:", error);
        }
      } else {
        console.error("Некорректная новая скидка или цена");
      }
    });

  const closeButton = document.getElementById("close-interface");
  closeButton.addEventListener("click", () => {
    document.body.removeChild(container); // Закрываем интерфейс
  });

  document.body.appendChild(container);
}

function calculateWBDiscount(finalPrice, intermediatePrice) {
  return ((intermediatePrice - finalPrice) / intermediatePrice) * 100; // Скидка WB
}

function calculateNewDiscount(desiredPrice, currentPrice) {
  const newDiscount = ((currentPrice - desiredPrice) / currentPrice) * 100; // Новая скидка
  return Math.round(newDiscount); // Округляем до целого числа
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
    showAlert(
      "Цена успешно обновилась! Чтобы увидеть новую цену и изменить цену перезагрузите страницу."
    );

    // Получаем актуальные данные после обновления скидки
    // Вызываем новую функцию
  } catch (error) {
    console.error("Ошибка при обновлении скидки:", error);
    showAlert("Ошибка при обновлении скидки!");
  }
}
// Создаем стили для уведомления
// Создаем стили для уведомления
const styles = `
    #custom-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); /* Градиентный фон */
        color: white; /* Цвет текста */
        padding: 20px; /* Отступы */
        border-radius: 8px; /* Скругленные углы */
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); /* Тень */
        z-index: 1000; /* Поверх других элементов */
        display: none; /* Скрыто по умолчанию */
        transition: opacity 0.5s ease, transform 0.5s ease; /* Плавный переход */
        opacity: 0; /* Начальная непрозрачность */
        transform: translateY(-20px); /* Сдвиг вверх */
    }
    #custom-alert.show {
        opacity: 1; /* Полная непрозрачность */
        transform: translateY(0); /* Вернуться на место */
    }
    #custom-alert.hidden {
        opacity: 0; /* Прозрачность при скрытии */
        pointer-events: none; /* Отключаем события мыши */
    }
    #custom-alert button {
        background: rgba(255, 255, 255, 0.2); /* Полупрозрачный фон */
        border: none; /* Без границы */
        color: white; /* Цвет текста */
        cursor: pointer; /* Указатель */
        font-weight: bold; /* Жирный текст */
        margin-left: 10px; /* Отступ от текста */
        border-radius: 4px; /* Скругленные углы */
        padding: 5px 10px; /* Отступы */
        transition: background 0.3s; /* Плавный переход */
    }
    #custom-alert button:hover {
        background: rgba(255, 255, 255, 0.4); /* Изменение фона при наведении */
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
  alertBox.textContent = message; // Устанавливаем текст сообщения
  alertBox.style.display = "block"; // Показываем уведомление
  alertBox.classList.add("show"); // Добавляем класс для показа

  // Закрытие уведомления по клику на кнопку
  const closeButton = document.createElement("button");
  closeButton.textContent = "Закрыть";
  alertBox.appendChild(closeButton);

  closeButton.onclick = () => {
    alertBox.classList.remove("show"); // Убираем класс показа
    alertBox.classList.add("hidden"); // Добавляем класс скрытия
    setTimeout(() => {
      alertBox.style.display = "none"; // Прячем уведомление после задержки
      alertBox.removeChild(closeButton); // Удаляем кнопку
    }, 500); // Задержка соответствует времени анимации
  };

  // Автоматическое скрытие уведомления через 5 секунд
  setTimeout(() => {
    alertBox.classList.remove("show"); // Убираем класс показа
    alertBox.classList.add("hidden"); // Добавляем класс скрытия
    setTimeout(() => {
      alertBox.style.display = "none"; // Прячем уведомление после задержки
      alertBox.removeChild(closeButton); // Удаляем кнопку
    }, 500);
  }, 5000); // Уведомление будет показано 5 секунд
}

// Пример использования функции
document
  .getElementById("update-discount")
  .addEventListener("click", async () => {
    const newDiscount = parseInt(
      document.getElementById("new-discount").textContent
    );
    const currentPrice = parseFloat(
      document.getElementById("current-price").textContent
    );

    if (!isNaN(newDiscount) && currentPrice !== undefined) {
      try {
        await updateDiscount(itemID, newDiscount, currentPrice);
        showAlert("Скидка успешно обновлена!"); // Показываем уведомление
        container.remove();
        interfaceOpen = false;
      } catch (error) {
        console.error("Ошибка при обновлении скидки:", error);
      }
    } else {
      console.error("Некорректная новая скидка или цена");
    }
  });

// Инициализация
createToggleButton();
