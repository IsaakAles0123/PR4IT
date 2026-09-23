const { Pool } = require("pg");
const { repository: seedRepository, weekdays } = require("./seed");

function formatTime(value) {
  return String(value).slice(0, 5);
}

async function createRepository() {
  const pool = new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "masterskaya",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    connectionTimeoutMillis: 1500,
  });

  try {
    await pool.query("SELECT id FROM workshops LIMIT 1");

    return {
      source: "postgresql",
      async workshops() {
        const { rows } = await pool.query(`
          SELECT
            w.id,
            w.title,
            w.description,
            w.user_id,
            u.full_name AS author_name
          FROM workshops AS w
          JOIN users AS u ON u.id = w.user_id
          ORDER BY w.id
        `);
        return rows;
      },
      async schedule() {
        const { rows } = await pool.query(`
          SELECT
            w.title,
            teacher.full_name AS teacher_name,
            author.full_name AS author_name,
            r.title AS room_title,
            s.weekday,
            to_char(s.starts_at, 'HH24:MI') AS starts_at,
            to_char(s.ends_at, 'HH24:MI') AS ends_at
          FROM schedule AS s
          JOIN workshops AS w ON w.id = s.workshop_id
          JOIN users AS teacher ON teacher.id = s.teacher_id
          JOIN users AS author ON author.id = w.user_id
          JOIN rooms AS r ON r.id = s.room_id
          ORDER BY s.weekday, s.starts_at
        `);

        return rows.map((row) => ({
          ...row,
          day: weekdays[row.weekday],
          starts_at: formatTime(row.starts_at),
          ends_at: formatTime(row.ends_at),
        }));
      },
      async users() {
        const { rows } = await pool.query(`
          SELECT id, full_name, email, login, role, created_at
          FROM users
          ORDER BY id
        `);
        return rows;
      },
    };
  } catch (error) {
    await pool.end().catch(() => {});
    console.error(`PostgreSQL недоступен (${error.message}). Используются данные schema.sql.`);
    return seedRepository();
  }
}

module.exports = {
  createRepository,
};
