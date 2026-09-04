import mysql from "mysql2/promise";

const globalForMysql = globalThis as unknown as {
  srrMysqlPool?: mysql.Pool;
};

function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "srr_auth_local",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
}

export const db =
  globalForMysql.srrMysqlPool ||
  createPool();

if (process.env.NODE_ENV !== "production") {
  globalForMysql.srrMysqlPool = db;
}
