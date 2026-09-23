const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { createRepository } = require("./lib/database");
const {
  getActiveUsers,
  getUserNames,
  findUserById,
  getUsersStatistics,
  groupUsersByCity,
} = require("./lib/data-utils");
const { expenseTracker } = require("./lib/expense-tracker");

const port = Number(process.env.PORT || 4173);
const cardClasses = ["", "card-frost", "card-ember"];
const cardLinks = [
  { href: "/schedule", label: "Смотреть расписание" },
  { href: "/people", label: "Кто ведёт занятия" },
  { href: "/schedule", label: "Субботний час" },
];
const images = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 160'%3E%3Crect width='240' height='160' fill='%232a2118'/%3E%3Crect x='58' y='28' width='124' height='104' fill='%23f6efe2'/%3E%3Cpath d='M58 28 h31 v26 h-31 z M120 28 h31 v26 h-31 z M89 54 h31 v26 h-31 z M151 54 h31 v26 h-31 z M58 80 h31 v26 h-31 z M120 80 h31 v26 h-31 z M89 106 h31 v26 h-31 z M151 106 h31 v26 h-31 z' fill='%23b42318'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 160'%3E%3Crect width='240' height='160' fill='%230c1c2e'/%3E%3Ccircle cx='78' cy='78' r='28' fill='%237dffe0'/%3E%3Ccircle cx='128' cy='70' r='24' fill='%23ffd56a'/%3E%3Ccircle cx='166' cy='92' r='22' fill='%23e35b2f'/%3E%3Crect x='46' y='118' width='150' height='14' fill='%23dffaf3'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 160'%3E%3Crect width='240' height='160' fill='%233a120e'/%3E%3Cpath d='M40 38 h70 l10 18 v66 H40 z' fill='%23fff1e0'/%3E%3Cpath d='M200 38 h-70 l-10 18 v66 H200 z' fill='%23ffd7a1'/%3E%3Cpath d='M110 56 v66' stroke='%23b42318' stroke-width='4'/%3E%3C/svg%3E",
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }
  return date.toLocaleString("ru-RU", { hour12: false });
}

function formatMoney(amount) {
  return `${Number(amount).toFixed(2)} руб.`;
}

function toUtilsUsers(users) {
  return users.map((user) => ({
    id: user.id,
    name: user.full_name,
    isActive: user.role !== "участник",
    age: 0,
    city: user.role,
  }));
}

function sourceText(source) {
  if (source === "postgresql") {
    return "Данные читаются из PostgreSQL, база masterskaya.";
  }
  return "PostgreSQL сейчас недоступен, поэтому показаны те же записи, что лежат в schema.sql.";
}

function layout({ current, heading, subheading, source, body }) {
  const links = [
    ["/", "Кружки"],
    ["/schedule", "Расписание"],
    ["/people", "Люди"],
    ["/budget", "Бюджет"],
  ];
  const menu = links
    .map(([href, label]) => {
      const currentClass = href === current ? " is-current" : "";
      return `<a class="${currentClass.trim()}" href="${href}">${label}</a>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)} — Мастерская</title>
  <link rel="stylesheet" href="/style.css?v=2">
</head>
<body>
  <header class="site-header">
    <p class="contacts">Дом творчества · 8 800 250-19-04</p>
    <nav class="menu">${menu}</nav>
    <h1>Мастерская</h1>
    <h2>${escapeHtml(subheading)}</h2>
  </header>
  <p class="source">${escapeHtml(sourceText(source))}</p>
  ${body}
</body>
</html>`;
}

function renderHome(workshops, source) {
  const cards = workshops
    .map((workshop, index) => {
      const cardClass = cardClasses[index] || "";
      const link = cardLinks[index] || cardLinks[0];
      const image = images[index] || images[0];
      return `<article class="card ${cardClass}">
        <img src="${image}" alt="${escapeHtml(workshop.title)}">
        <h3>${escapeHtml(workshop.title)}</h3>
        <p class="description">${escapeHtml(workshop.description)}</p>
        <p class="author">Запись создал: ${escapeHtml(workshop.author_name)}</p>
        <a href="${link.href}">${link.label}</a>
      </article>`;
    })
    .join("");

  const body = `<main>
    <section class="catalog">
      <p class="highlight">Акция: субботнее чтение вслух — свободный вход для семей</p>
      ${cards}
    </section>
    <section class="info">
      <h3>Как устроен дом творчества</h3>
      <ul>
        <li>Кружки для детей и взрослых</li>
        <li>Небольшие группы в своих кабинетах</li>
        <li>Преподаватель закреплён в расписании</li>
        <li>Семейные занятия по субботам</li>
      </ul>
    </section>
  </main>`;

  return layout({
    current: "/",
    heading: "Кружки",
    subheading: "Дом творчества для детей и взрослых: шахматы, акварель и чтение вслух",
    source,
    body,
  });
}

function renderSchedule(rows, source) {
  const tableRows = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.title)}</td>
        <td>${escapeHtml(row.teacher_name)}</td>
        <td>${escapeHtml(row.room_title)}</td>
        <td>${escapeHtml(row.day)}</td>
        <td class="time">${escapeHtml(row.starts_at)}–${escapeHtml(row.ends_at)}</td>
        <td>${escapeHtml(row.author_name)}</td>
      </tr>`
    )
    .join("");

  const body = `<main>
    <section class="panel">
      <h3>Расписание занятий</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Кружок</th>
              <th>Преподаватель</th>
              <th>Кабинет</th>
              <th>День</th>
              <th>Время</th>
              <th>Кто создал кружок</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </section>
  </main>`;

  return layout({
    current: "/schedule",
    heading: "Расписание",
    subheading: "Кружок, преподаватель и кабинет из связанных таблиц",
    source,
    body,
  });
}

function renderPeople(users, query, source) {
  const utilsUsers = toUtilsUsers(users);
  const names = getUserNames(utilsUsers);
  const stats = getUsersStatistics(utilsUsers);
  const groups = groupUsersByCity(utilsUsers);
  const staff = getActiveUsers(utilsUsers);
  const requestedId = Number(query.id);
  const found = query.id ? findUserById(utilsUsers, requestedId) : null;
  const searchText = query.id
    ? found
      ? `Найден: ${found.name}`
      : "Пользователь с таким id не найден."
    : "Введите id, чтобы найти человека функцией findUserById.";

  const userRows = users
    .map(
      (user) => `<tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.full_name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.login)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>${formatDate(user.created_at)}</td>
      </tr>`
    )
    .join("");

  const groupBlocks = Object.entries(groups)
    .map(
      ([role, people]) =>
        `<li><strong>${escapeHtml(role)}</strong>: ${people.map((person) => escapeHtml(person.name)).join(", ")}</li>`
    )
    .join("");

  const body = `<main>
    <section class="panel">
      <h3>Пользователи базы</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>ФИО</th>
              <th>email</th>
              <th>login</th>
              <th>role</th>
              <th>created_at</th>
            </tr>
          </thead>
          <tbody>${userRows}</tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h3>Подсчёт из практической №1</h3>
      <p>Имена: ${names.map((name) => escapeHtml(name)).join(", ")}</p>
      <p>Всего ${stats.total}: сотрудников ${stats.active}, участников ${stats.inactive}.</p>
      <p>Сотрудники: ${staff.map((user) => escapeHtml(user.name)).join(", ")}</p>
      <p>Группы ниже собраны функцией groupUsersByCity: вместо города в неё передана роль.</p>
      <ul>${groupBlocks}</ul>
      <form method="get" action="/people">
        <label>id <input name="id" value="${escapeHtml(query.id || "")}" inputmode="numeric"></label>
        <button type="submit">Найти</button>
      </form>
      <p>${escapeHtml(searchText)}</p>
    </section>
  </main>`;

  return layout({
    current: "/people",
    heading: "Люди",
    subheading: "Пользователи базы и функции Data Utils",
    source,
    body,
  });
}

function renderBudget(query, source) {
  const expenses = expenseTracker.expenses;
  const total = expenseTracker.getTotalAmount();
  const statistics = expenseTracker.getCategoryStatistics();
  const current = expenseTracker.getCurrentExpense();
  const category = (query.category || "").trim();
  const categoryItems = category ? expenseTracker.getExpensesByCategory(category) : [];
  const categorySum = categoryItems.reduce((sum, item) => sum + item.amount, 0);
  const found = expenses.find((item) => String(item.id) === String(query.found || ""));

  const rows = expenses
    .map((expense, index) => {
      const mark = index === expenseTracker.currentIndex ? " current" : "";
      const note = expense.note ? ` (${escapeHtml(expense.note)})` : "";
      return `<tr class="${mark.trim()}">
        <td>${expense.id}</td>
        <td>${escapeHtml(expense.title)}${note}</td>
        <td>${formatMoney(expense.amount)}</td>
        <td>${escapeHtml(expense.category)}</td>
        <td>${mark ? "текущий" : ""}</td>
      </tr>`;
    })
    .join("");

  const statRows = Object.values(statistics)
    .map(
      (item) =>
        `<li>${escapeHtml(item.title)}: ${item.count} шт., ${formatMoney(item.total)}</li>`
    )
    .join("");

  const notice = query.notice
    ? `<p class="notice">${escapeHtml(query.notice)}</p>`
    : "";
  const foundText = found
    ? `<p>Найден расход: ${escapeHtml(found.title)}${found.note ? `, примечание: ${escapeHtml(found.note)}` : ""}.</p>`
    : "";
  const categoryText = category
    ? `<p>В категории «${escapeHtml(category)}»: ${categoryItems.length} шт., потрачено ${formatMoney(categorySum)}.</p>`
    : "";

  const body = `<main>
    <section class="panel forms">
      <h3>Бюджет мастерской</h3>
      ${notice}
      <p>Текущая запись: ${current ? escapeHtml(current.title) : "не выбрана"}</p>
      <form method="post" action="/budget/add">
        <h3>Новый расход</h3>
        <label>Название <input name="title" required></label>
        <label>Сумма <input name="amount" required></label>
        <label>Категория <input name="category" required></label>
        <div><button type="submit">Добавить</button></div>
      </form>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>id</th><th>Название</th><th>Сумма</th><th>Категория</th><th></th></tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="5">Расходов пока нет.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="receipt">
        <h3>Чек</h3>
        <p>Итого: ${formatMoney(total)}</p>
      </div>
      <ul class="stats">${statRows}</ul>
      <form method="get" action="/budget">
        <label>Категория <input name="category" value="${escapeHtml(category)}"></label>
        <button type="submit">Посчитать категорию</button>
      </form>
      ${categoryText}
      <form method="post" action="/budget/find">
        <label>Часть названия <input name="query"></label>
        <label>Примечание <input name="note"></label>
        <div><button type="submit">Найти</button></div>
      </form>
      ${foundText}
      <form method="post" action="/budget/delete">
        <label>id <input name="id" inputmode="numeric"></label>
        <div><button type="submit">Удалить</button></div>
      </form>
      <form method="post" action="/budget/switch">
        <input type="hidden" name="step" value="1">
        <button type="submit">Следующий расход</button>
      </form>
      <form method="post" action="/budget/switch">
        <input type="hidden" name="step" value="-1">
        <button type="submit">Предыдущий расход</button>
      </form>
    </section>
  </main>`;

  return layout({
    current: "/budget",
    heading: "Бюджет",
    subheading: "Учёт расходов мастерской на основе трекера из практической №2",
    source,
    body,
  });
}

function redirect(response, location) {
  response.writeHead(303, { Location: location });
  response.end();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(Object.fromEntries(new URLSearchParams(raw)));
    });
    request.on("error", reject);
  });
}

function sendHtml(response, html) {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

expenseTracker.addExpense("Набор акварели", 890, "материалы");
expenseTracker.addExpense("Шахматные часы", 2400, "инвентарь");
expenseTracker.addExpense("Сборник рассказов", 650, "книги");

async function start() {
  const repository = await createRepository();
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const pathname = url.pathname;

      if (request.method === "GET" && pathname === "/style.css") {
        const css = fs.readFileSync(path.join(__dirname, "public", "style.css"));
        response.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
        response.end(css);
        return;
      }

      if (request.method === "GET" && pathname === "/") {
        sendHtml(response, renderHome(await repository.workshops(), repository.source));
        return;
      }

      if (request.method === "GET" && pathname === "/schedule") {
        sendHtml(response, renderSchedule(await repository.schedule(), repository.source));
        return;
      }

      if (request.method === "GET" && pathname === "/people") {
        sendHtml(
          response,
          renderPeople(await repository.users(), Object.fromEntries(url.searchParams), repository.source)
        );
        return;
      }

      if (request.method === "GET" && pathname === "/budget") {
        sendHtml(
          response,
          renderBudget(Object.fromEntries(url.searchParams), repository.source)
        );
        return;
      }

      if (request.method === "POST" && pathname === "/budget/add") {
        const form = await readBody(request);
        const created = expenseTracker.addExpense(form.title, form.amount, form.category);
        const notice = created
          ? "Расход добавлен."
          : "Проверьте название, сумму и категорию.";
        redirect(response, `/budget?notice=${encodeURIComponent(notice)}`);
        return;
      }

      if (request.method === "POST" && pathname === "/budget/find") {
        const form = await readBody(request);
        const found = expenseTracker.findExpenseByTitle(form.query, form.note);
        const notice = found ? "Расход найден." : "Расход не найден или строка поиска пустая.";
        const foundQuery = found ? `&found=${found.id}` : "";
        redirect(response, `/budget?notice=${encodeURIComponent(notice)}${foundQuery}`);
        return;
      }

      if (request.method === "POST" && pathname === "/budget/delete") {
        const form = await readBody(request);
        const removed = expenseTracker.deleteExpense(form.id);
        const notice = removed ? "Расход удалён." : "Не удалось удалить расход.";
        redirect(response, `/budget?notice=${encodeURIComponent(notice)}`);
        return;
      }

      if (request.method === "POST" && pathname === "/budget/switch") {
        const form = await readBody(request);
        const current = expenseTracker.switchExpense(form.step);
        const notice = current
          ? `Текущий расход: ${current.title}`
          : "Переключать нечего.";
        redirect(response, `/budget?notice=${encodeURIComponent(notice)}`);
        return;
      }

      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Страница не найдена");
    } catch (error) {
      console.error(error);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Ошибка сервера");
    }
  });

  server.listen(port, () => {
    console.log(`Мастерская: http://127.0.0.1:${port}`);
  });
}

start();
