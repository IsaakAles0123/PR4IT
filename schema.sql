-- Дом творчества «Мастерская»
-- Выполнять в pgAdmin в Query Tool базы masterskaya (кодировка UTF8).
-- Скрипт заново создаёт таблицы и заполняет их учебными данными.

BEGIN;

DROP TABLE IF EXISTS schedule;
DROP TABLE IF EXISTS workshops;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

-- 1. Пользователи: ФИО, email, login, password, role, created_at
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    login       VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(30)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (
        role IN ('администратор', 'преподаватель', 'участник')
    )
);

COMMENT ON TABLE users IS 'Пользователи дома творчества';
COMMENT ON COLUMN users.full_name IS 'ФИО';
COMMENT ON COLUMN users.role IS 'администратор, преподаватель или участник';
COMMENT ON COLUMN users.created_at IS 'Дата и время регистрации';

-- 2. Кружки: титул, описание и ID пользователя, который создал запись
CREATE TABLE workshops (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL,
    user_id     INTEGER      NOT NULL,
    CONSTRAINT workshops_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
);

COMMENT ON TABLE workshops IS 'Кружки: титул, описание и внешний пользователь';
COMMENT ON COLUMN workshops.title IS 'Титул';
COMMENT ON COLUMN workshops.description IS 'Описание';
COMMENT ON COLUMN workshops.user_id IS 'ID пользователя, который создал кружок';

-- Кабинеты нужны, чтобы расписание связывало больше двух таблиц
CREATE TABLE rooms (
    id        SERIAL PRIMARY KEY,
    title     VARCHAR(100) NOT NULL UNIQUE,
    capacity  INTEGER      NOT NULL,
    CONSTRAINT rooms_capacity_check CHECK (capacity > 0)
);

COMMENT ON TABLE rooms IS 'Кабинеты, в которых проходят занятия';

-- 3. Расписание соединяет кружок, преподавателя и кабинет
CREATE TABLE schedule (
    id           SERIAL PRIMARY KEY,
    workshop_id  INTEGER  NOT NULL,
    teacher_id   INTEGER  NOT NULL,
    room_id      INTEGER  NOT NULL,
    weekday      SMALLINT NOT NULL,
    starts_at    TIME     NOT NULL,
    ends_at      TIME     NOT NULL,
    CONSTRAINT schedule_weekday_check CHECK (weekday BETWEEN 1 AND 7),
    CONSTRAINT schedule_time_check CHECK (ends_at > starts_at),
    CONSTRAINT schedule_workshop_fk
        FOREIGN KEY (workshop_id) REFERENCES workshops (id),
    CONSTRAINT schedule_teacher_fk
        FOREIGN KEY (teacher_id) REFERENCES users (id),
    CONSTRAINT schedule_room_fk
        FOREIGN KEY (room_id) REFERENCES rooms (id),
    CONSTRAINT schedule_workshop_time_unique UNIQUE (workshop_id, weekday, starts_at),
    CONSTRAINT schedule_teacher_time_unique UNIQUE (teacher_id, weekday, starts_at),
    CONSTRAINT schedule_room_time_unique UNIQUE (room_id, weekday, starts_at)
);

COMMENT ON TABLE schedule IS 'Расписание: кружок, преподаватель и кабинет';
COMMENT ON COLUMN schedule.workshop_id IS 'Кружок из таблицы workshops';
COMMENT ON COLUMN schedule.teacher_id IS 'Преподаватель из таблицы users';
COMMENT ON COLUMN schedule.room_id IS 'Кабинет из таблицы rooms';
COMMENT ON COLUMN schedule.weekday IS '1 — понедельник, 7 — воскресенье';

CREATE INDEX schedule_workshop_idx ON schedule (workshop_id);
CREATE INDEX schedule_teacher_idx ON schedule (teacher_id);
CREATE INDEX schedule_room_idx ON schedule (room_id);

INSERT INTO users (full_name, email, login, password, role) VALUES
    ('Соколова Анна Викторовна', 'anna.sokolova@masterskaya.example', 'asokolova', 'demo-admin', 'администратор'),
    ('Лебедев Игорь Павлович', 'igor.lebedev@masterskaya.example', 'ilebedev', 'demo-teacher', 'преподаватель'),
    ('Орлова Мария Сергеевна', 'maria.orlova@masterskaya.example', 'morlova', 'demo-teacher', 'преподаватель'),
    ('Иванов Пётр Алексеевич', 'petr.ivanov@masterskaya.example', 'pivanov', 'demo-user', 'участник'),
    ('Кузнецова Елена Игоревна', 'elena.kuznetsova@masterskaya.example', 'ekuznetsova', 'demo-user', 'участник');

INSERT INTO workshops (title, description, user_id) VALUES
    (
        'Шахматы для начинающих',
        'Спокойный кружок для детей и взрослых: правила, первые партии и разбор коротких задач.',
        2
    ),
    (
        'Акварель без страха',
        'Семейные занятия, где учатся смешивать цвет и рисовать простые городские зарисовки.',
        3
    ),
    (
        'Читаем вслух',
        'Общий час чтения: короткие рассказы, обсуждение и выбор следующей книги.',
        1
    );

INSERT INTO rooms (title, capacity) VALUES
    ('Кабинет 101', 12),
    ('Мастерская 2', 16),
    ('Читальный зал', 30);

INSERT INTO schedule (workshop_id, teacher_id, room_id, weekday, starts_at, ends_at) VALUES
    (1, 2, 1, 1, '16:00', '17:30'),
    (1, 2, 1, 3, '16:00', '17:30'),
    (2, 3, 2, 2, '17:00', '18:30'),
    (3, 3, 3, 6, '11:00', '12:00');

COMMIT;

-- Проверка связи: кружок, преподаватель и кабинет
SELECT
    w.title AS кружок,
    teacher.full_name AS преподаватель,
    author.full_name AS кто_создал_кружок,
    r.title AS кабинет,
    CASE s.weekday
        WHEN 1 THEN 'понедельник'
        WHEN 2 THEN 'вторник'
        WHEN 3 THEN 'среда'
        WHEN 4 THEN 'четверг'
        WHEN 5 THEN 'пятница'
        WHEN 6 THEN 'суббота'
        WHEN 7 THEN 'воскресенье'
    END AS день,
    s.starts_at AS начало,
    s.ends_at AS конец
FROM schedule AS s
JOIN workshops AS w ON w.id = s.workshop_id
JOIN users AS teacher ON teacher.id = s.teacher_id
JOIN users AS author ON author.id = w.user_id
JOIN rooms AS r ON r.id = s.room_id
ORDER BY s.weekday, s.starts_at;
