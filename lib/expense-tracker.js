let expenses = [];
let nextId = 1;

function parseAmount(amount) {
  if (typeof amount === "number") {
    return amount;
  }

  if (typeof amount !== "string") {
    return Number.NaN;
  }

  return Number(amount.trim().replace(",", "."));
}

function validateExpenseInput(title, amount, category) {
  if (typeof title !== "string" || title.trim() === "") {
    return "Название расхода не может быть пустым.";
  }

  const numericAmount = parseAmount(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return "Сумма должна быть положительным числом.";
  }

  if (typeof category !== "string" || category.trim() === "") {
    return "Категория не может быть пустой.";
  }

  return null;
}

function formatMoney(amount) {
  return `${amount.toFixed(2)} руб.`;
}

function formatExpense(expense) {
  const note = expense.note ? ` | примечание: ${expense.note}` : "";
  return `[id: ${expense.id}] ${expense.title} — ${formatMoney(expense.amount)} | категория: ${expense.category}${note}`;
}

function addExpense(title, amount, category) {
  const error = validateExpenseInput(title, amount, category);

  if (error) {
    console.log(`Ошибка: ${error}`);
    return null;
  }

  const expense = {
    id: nextId,
    title: title.trim(),
    amount: parseAmount(amount),
    category: category.trim(),
  };

  nextId += 1;
  expenses.push(expense);

  if (expenseTracker.currentIndex < 0) {
    expenseTracker.currentIndex = 0;
  }

  console.log(`Добавлен расход: ${formatExpense(expense)}`);
  return expense;
}

function printAllExpenses() {
  console.log("========== СПИСОК РАСХОДОВ ==========");

  if (expenses.length === 0) {
    console.log("Расходов пока нет.");
    console.log("=====================================");
    return;
  }

  expenses.forEach((expense, index) => {
    const marker = index === expenseTracker.currentIndex ? " ← текущий" : "";
    console.log(`${index + 1}. ${formatExpense(expense)}${marker}`);
  });

  console.log(`Всего записей: ${expenses.length}`);
  console.log("=====================================");
}

function getTotalAmount() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  console.log("========== ЧЕК ==========");

  if (expenses.length === 0) {
    console.log("Позиций нет.");
  } else {
    expenses.forEach((expense, index) => {
      console.log(
        `${index + 1}. ${expense.title} — ${formatMoney(expense.amount)} (${expense.category})`
      );
    });
  }

  console.log("-------------------------");
  console.log(`ИТОГО: ${formatMoney(total)}`);
  console.log("=========================");

  return total;
}

function getExpensesByCategory(category) {
  if (typeof category !== "string" || category.trim() === "") {
    console.log("Ошибка: категория не может быть пустой.");
    return [];
  }

  const normalizedCategory = category.trim().toLowerCase();
  const filtered = expenses.filter(
    (expense) => expense.category.toLowerCase() === normalizedCategory
  );
  const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);

  console.log(`Категория «${category.trim()}»`);
  console.log(`Операций: ${filtered.length}`);
  console.log(`Потрачено: ${formatMoney(total)}`);

  filtered.forEach((expense) => {
    console.log(`- ${formatExpense(expense)}`);
  });

  return filtered;
}

function findExpenseByTitle(query, extraNote) {
  if (typeof query !== "string" || query.trim() === "") {
    console.log("Ошибка: строка поиска не может быть пустой.");
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const found = expenses.find((expense) =>
    expense.title.toLowerCase().includes(normalizedQuery)
  );

  if (!found) {
    console.log(`Расход с названием, содержащим «${query.trim()}», не найден.`);
    return null;
  }

  if (typeof extraNote === "string" && extraNote.trim() !== "") {
    const note = extraNote.trim();
    found.note = found.note ? `${found.note}; ${note}` : note;
    console.log("К расходу добавлена дополнительная строка.");
  }

  console.log(`Найден расход: ${formatExpense(found)}`);
  return found;
}

function deleteExpense(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    console.log("Ошибка: id должен быть положительным целым числом.");
    return false;
  }

  const index = expenses.findIndex((expense) => expense.id === numericId);

  if (index === -1) {
    console.log(`Ошибка: расход с id ${numericId} не найден.`);
    return false;
  }

  const removed = expenses.splice(index, 1)[0];

  if (expenses.length === 0) {
    expenseTracker.currentIndex = -1;
  } else if (index < expenseTracker.currentIndex) {
    expenseTracker.currentIndex -= 1;
  } else if (expenseTracker.currentIndex >= expenses.length) {
    expenseTracker.currentIndex = expenses.length - 1;
  }

  console.log(`Удалён расход: ${formatExpense(removed)}`);
  return true;
}

function getCategoryStatistics() {
  const statistics = expenses.reduce((groups, expense) => {
    const key = expense.category.toLowerCase();
    const current = groups[key] || {
      title: expense.category,
      count: 0,
      total: 0,
    };

    return {
      ...groups,
      [key]: {
        title: current.title,
        count: current.count + 1,
        total: current.total + expense.amount,
      },
    };
  }, {});

  console.log("===== СТАТИСТИКА ПО КАТЕГОРИЯМ =====");

  const categories = Object.keys(statistics);

  if (categories.length === 0) {
    console.log("Недостаточно данных: список расходов пуст.");
  } else {
    categories.forEach((category) => {
      const item = statistics[category];
      console.log(
        `${item.title}: ${item.count} шт., потрачено ${formatMoney(item.total)}`
      );
    });
  }

  console.log("====================================");
  return statistics;
}

const expenseTracker = {
  expenses,
  currentIndex: -1,

  addExpense(title, amount, category) {
    return addExpense(title, amount, category);
  },

  printAllExpenses() {
    return printAllExpenses();
  },

  getTotalAmount() {
    return getTotalAmount();
  },

  getExpensesByCategory(category) {
    return getExpensesByCategory(category);
  },

  findExpenseByTitle(query, extraNote) {
    return findExpenseByTitle(query, extraNote);
  },

  deleteExpense(id) {
    return deleteExpense(id);
  },

  getCategoryStatistics() {
    return getCategoryStatistics();
  },

  getCurrentExpense() {
    if (this.currentIndex < 0 || this.currentIndex >= this.expenses.length) {
      return null;
    }

    return this.expenses[this.currentIndex];
  },

  switchExpense(step) {
    if (this.expenses.length === 0) {
      console.log("Переключать нечего: список расходов пуст.");
      return null;
    }

    const direction = Number(step) >= 0 ? 1 : -1;
    const nextIndex =
      this.currentIndex < 0
        ? 0
        : (this.currentIndex + direction + this.expenses.length) % this.expenses.length;

    this.currentIndex = nextIndex;
    const current = this.expenses[nextIndex];
    console.log(`Текущий расход: ${formatExpense(current)}`);
    return current;
  },
};

module.exports = {
  expenses,
  expenseTracker,
  addExpense,
  printAllExpenses,
  getTotalAmount,
  getExpensesByCategory,
  findExpenseByTitle,
  deleteExpense,
  getCategoryStatistics,
};
