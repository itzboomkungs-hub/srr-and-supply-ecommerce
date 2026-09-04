import { createPool, type Pool } from "mysql2/promise";


type GlobalDb = typeof globalThis & { __srrAdminPool?: Pool };
const g = globalThis as GlobalDb;


function makePool() {
  return createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || "root",
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "srr_auth_local",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });
}


export const srrAdminDb = g.__srrAdminPool ?? makePool();
if (process.env.NODE_ENV !== "production") g.__srrAdminPool = srrAdminDb;