import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { srrAdminDb } from "../db/srr-admin-db";


const SESSION_COOKIE = "srr_session";


type AdminRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
};


export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("UNAUTHORIZED");


  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [rows] = await srrAdminDb.query<AdminRow[]>(`
    SELECT u.id, u.fullName, u.email, u.phone, u.role, u.status
    FROM AuthSession s
    INNER JOIN User u ON u.id = s.userId
    WHERE s.tokenHash = ?
      AND s.expiresAt > CURRENT_TIMESTAMP(3)
    LIMIT 1
  `, [tokenHash]);


  const user = rows[0];
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.status !== "ACTIVE") throw new Error("ACCOUNT_DISABLED");
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}