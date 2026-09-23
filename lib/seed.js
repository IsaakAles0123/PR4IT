const weekdays = [
  "",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
];

const users = [
  {
    id: 1,
    full_name: "Соколова Анна Викторовна",
    email: "anna.sokolova@masterskaya.example",
    login: "asokolova",
    role: "администратор",
    created_at: "2026-04-16T10:00:00",
  },
  {
    id: 2,
    full_name: "Лебедев Игорь Павлович",
    email: "igor.lebedev@masterskaya.example",
    login: "ilebedev",
    role: "преподаватель",
    created_at: "2026-04-16T10:05:00",
  },
  {
    id: 3,
    full_name: "Орлова Мария Сергеевна",
    email: "maria.orlova@masterskaya.example",
    login: "morlova",
    role: "преподаватель",
    created_at: "2026-04-16T10:10:00",
  },
  {
    id: 4,
    full_name: "Иванов Пётр Алексеевич",
    email: "petr.ivanov@masterskaya.example",
    login: "pivanov",
    role: "участник",
    created_at: "2026-04-16T10:15:00",
  },
  {
    id: 5,
    full_name: "Кузнецова Елена Игоревна",
    email: "elena.kuznetsova@masterskaya.example",
    login: "ekuznetsova",
    role: "участник",
    created_at: "2026-04-16T10:20:00",
  },
];

const workshops = [
  {
    id: 1,
    title: "Шахматы для начинающих",
    description:
      "Спокойный кружок для детей и взрослых: правила, первые партии и разбор коротких задач.",
    user_id: 2,
    author_name: "Лебедев Игорь Павлович",
  },
  {
    id: 2,
    title: "Акварель без страха",
    description:
      "Семейные занятия, где учатся смешивать цвет и рисовать простые городские зарисовки.",
    user_id: 3,
    author_name: "Орлова Мария Сергеевна",
  },
  {
    id: 3,
    title: "Читаем вслух",
    description:
      "Общий час чтения: короткие рассказы, обсуждение и выбор следующей книги.",
    user_id: 1,
    author_name: "Соколова Анна Викторовна",
  },
];

const schedule = [
  {
    workshop_id: 1,
    title: "Шахматы для начинающих",
    teacher_name: "Лебедев Игорь Павлович",
    author_name: "Лебедев Игорь Павлович",
    room_title: "Кабинет 101",
    weekday: 1,
    day: weekdays[1],
    starts_at: "16:00",
    ends_at: "17:30",
  },
  {
    workshop_id: 1,
    title: "Шахматы для начинающих",
    teacher_name: "Лебедев Игорь Павлович",
    author_name: "Лебедев Игорь Павлович",
    room_title: "Кабинет 101",
    weekday: 3,
    day: weekdays[3],
    starts_at: "16:00",
    ends_at: "17:30",
  },
  {
    workshop_id: 2,
    title: "Акварель без страха",
    teacher_name: "Орлова Мария Сергеевна",
    author_name: "Орлова Мария Сергеевна",
    room_title: "Мастерская 2",
    weekday: 2,
    day: weekdays[2],
    starts_at: "17:00",
    ends_at: "18:30",
  },
  {
    workshop_id: 3,
    title: "Читаем вслух",
    teacher_name: "Орлова Мария Сергеевна",
    author_name: "Соколова Анна Викторовна",
    room_title: "Читальный зал",
    weekday: 6,
    day: weekdays[6],
    starts_at: "11:00",
    ends_at: "12:00",
  },
];

function repository() {
  return {
    source: "schema.sql",
    workshops: async () => workshops,
    schedule: async () => schedule,
    users: async () => users,
  };
}

module.exports = {
  weekdays,
  repository,
};
