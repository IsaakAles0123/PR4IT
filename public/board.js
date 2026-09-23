const STORAGE_KEY = "masterskaya-board";

const COLUMNS = [
  { id: "idea", title: "Задумано" },
  { id: "doing", title: "В работе" },
  { id: "review", title: "На проверке" },
  { id: "done", title: "Сделано" },
];

const STARTER_TASKS = [
  {
    id: "seed-paper",
    title: "Купить акварельную бумагу",
    details: "Формат А3, плотная, на группу из 16 человек.",
    status: "idea",
    createdAt: 1715000001000,
  },
  {
    id: "seed-chess",
    title: "Подготовить партию для шахмат",
    details: "Короткая учебная партия и три задачи на мат в один ход.",
    status: "doing",
    createdAt: 1715000002000,
  },
  {
    id: "seed-stories",
    title: "Собрать рассказы на субботу",
    details: "Три коротких текста, которые можно прочитать вслух за час.",
    status: "review",
    createdAt: 1715000003000,
  },
  {
    id: "seed-light",
    title: "Проверить свет в читальном зале",
    details: "Лампы над столами и запасные лампочки в шкафу.",
    status: "done",
    createdAt: 1715000004000,
  },
];

const board = document.querySelector("#board");
const counter = document.querySelector("#counter");
const messages = document.querySelector("#messages");
const taskForm = document.querySelector("#task-form");
const searchInput = document.querySelector("#search");
const sortSelect = document.querySelector("#sort");

let tasks = loadTasks();
let editingId = null;
let drag = null;
const loadedFromBrowser = Boolean(localStorage.getItem(STORAGE_KEY));

if (!loadedFromBrowser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function columnTitle(status) {
  const column = COLUMNS.find((item) => item.id === status);
  return column ? column.title : status;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return STARTER_TASKS.map((task) => ({ ...task }));
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((task) => COLUMNS.some((column) => column.id === task.status));
  } catch (error) {
    return [];
  }
}

function saveTasks(text) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  if (text) {
    showMessage(`${text} Сохранено в браузере.`);
  }
}

function showMessage(text) {
  messages.textContent = text;
}

function visibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    if (!query) {
      return true;
    }
    return (
      task.title.toLowerCase().includes(query) ||
      task.details.toLowerCase().includes(query)
    );
  });

  const sorted = [...filtered];
  if (sortSelect.value === "old") {
    sorted.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sortSelect.value === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  } else {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  }

  return sorted;
}

function renderTask(task) {
  if (editingId === task.id) {
    return `<article class="task is-editing" data-id="${escapeHtml(task.id)}" draggable="false">
      <form class="edit-form">
        <input class="edit-title" value="${escapeHtml(task.title)}" maxlength="120" required>
        <input class="edit-details" value="${escapeHtml(task.details)}" maxlength="300">
        <div class="edit-actions">
          <button type="submit">Сохранить</button>
          <button type="button" data-action="cancel">Отмена</button>
        </div>
      </form>
    </article>`;
  }

  const details = task.details
    ? `<p>${escapeHtml(task.details)}</p>`
    : "";

  return `<article class="task" data-id="${escapeHtml(task.id)}">
    <h3>${escapeHtml(task.title)}</h3>
    ${details}
    <div class="task-actions">
      <button type="button" data-action="edit">Изменить</button>
      <button type="button" data-action="delete">Удалить</button>
    </div>
  </article>`;
}

function render() {
  const shown = visibleTasks();
  const byStatus = Object.fromEntries(COLUMNS.map((column) => [column.id, []]));
  shown.forEach((task) => {
    byStatus[task.status].push(task);
  });

  board.innerHTML = COLUMNS.map((column) => {
    const columnTasks = byStatus[column.id];
    const cards = columnTasks.length
      ? columnTasks.map(renderTask).join("")
      : `<p class="column-empty">Перетащите задачу сюда</p>`;

    return `<section class="column" data-status="${column.id}">
      <header>
        <h3>${column.title}</h3>
        <span class="column-count">${columnTasks.length}</span>
      </header>
      <div class="column-list">${cards}</div>
    </section>`;
  }).join("");

  const shownText =
    shown.length === tasks.length
      ? `Всего задач: ${tasks.length}`
      : `Показано ${shown.length} из ${tasks.length}`;
  counter.textContent = shownText;
}

function addTask(title, details, status) {
  const task = {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    details,
    status,
    createdAt: Date.now(),
  };
  tasks.push(task);
  saveTasks(`Задача «${task.title}» добавлена в «${columnTitle(status)}».`);
  render();
}

function moveTask(id, status) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return;
  }

  if (task.status === status) {
    showMessage(`«${task.title}» остаётся в колонке «${columnTitle(status)}».`);
    render();
    return;
  }

  task.status = status;
  saveTasks(`«${task.title}» перенесена в «${columnTitle(status)}».`);
  render();
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return;
  }
  tasks = tasks.filter((item) => item.id !== id);
  if (editingId === id) {
    editingId = null;
  }
  saveTasks(`Задача «${task.title}» удалена.`);
  render();
}

function updateTask(id, title, details) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return;
  }
  task.title = title;
  task.details = details;
  editingId = null;
  saveTasks(`Задача «${task.title}» изменена.`);
  render();
}

function clearDragStyles() {
  document.querySelectorAll(".column.is-over").forEach((column) => {
    column.classList.remove("is-over");
  });
  if (!drag) {
    return;
  }
  drag.card.classList.remove("is-dragging");
  drag.card.style.transform = "";
}

function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  const card = drag.card;
  const id = drag.id;
  const active = drag.active;
  try {
    card.releasePointerCapture(event.pointerId);
  } catch (error) {
    // Захват указателя уже снят.
  }
  const under = document.elementFromPoint(event.clientX, event.clientY);
  const column = under ? under.closest(".column") : null;
  clearDragStyles();
  card.style.transform = "";
  drag = null;

  if (!active) {
    return;
  }

  if (!column) {
    showMessage("Перенос отменён, задача осталась на месте.");
    return;
  }

  moveTask(id, column.dataset.status);
}

board.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  if (event.target.closest("button, input, textarea, select, a, form")) {
    return;
  }

  const card = event.target.closest(".task");
  if (!card || card.classList.contains("is-editing")) {
    return;
  }

  drag = {
    id: card.dataset.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    card,
  };
  card.setPointerCapture(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.active && Math.hypot(dx, dy) < 6) {
    return;
  }

  if (!drag.active) {
    drag.active = true;
    drag.card.classList.add("is-dragging");
    const task = tasks.find((item) => item.id === drag.id);
    showMessage(task ? `Переносим «${task.title}».` : "Переносим задачу.");
  }

  drag.card.style.transform = `translate(${dx}px, ${dy}px)`;
  const under = document.elementFromPoint(event.clientX, event.clientY);
  const column = under ? under.closest(".column") : null;
  document.querySelectorAll(".column.is-over").forEach((item) => {
    if (item !== column) {
      item.classList.remove("is-over");
    }
  });
  if (column) {
    column.classList.add("is-over");
  }
});

document.addEventListener("pointerup", finishDrag);
document.addEventListener("pointercancel", finishDrag);

board.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }
  const card = actionButton.closest(".task");
  const id = card.dataset.id;

  if (actionButton.dataset.action === "delete") {
    deleteTask(id);
    return;
  }

  if (actionButton.dataset.action === "edit") {
    editingId = id;
    render();
    return;
  }

  if (actionButton.dataset.action === "cancel") {
    editingId = null;
    showMessage("Редактирование отменено.");
    render();
  }
});

board.addEventListener("submit", (event) => {
  const form = event.target.closest(".edit-form");
  if (!form) {
    return;
  }
  event.preventDefault();
  const card = form.closest(".task");
  const title = form.querySelector(".edit-title").value.trim();
  const details = form.querySelector(".edit-details").value.trim();

  if (!title) {
    showMessage("Название задачи не может быть пустым.");
    return;
  }

  updateTask(card.dataset.id, title, details);
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = String(formData.get("title") || "").trim();
  const details = String(formData.get("details") || "").trim();
  const status = String(formData.get("status") || "idea");

  if (!title) {
    showMessage("Введите название задачи.");
    return;
  }

  addTask(title, details, status);
  taskForm.reset();
});

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
document.querySelector("#filter-form").addEventListener("submit", (event) => {
  event.preventDefault();
});

render();
showMessage(
  loadedFromBrowser
    ? "Доска открыта. Задачи загружены из браузера."
    : "На доске примеры дел мастерской. Они уже сохранены в этом браузере."
);
