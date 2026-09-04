import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";

import { db } from "../db/mysql";
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "./crypto.mjs";

export type CurrentAuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  customerId: string | null;
};

type CurrentAuthUserRow = RowDataPacket & CurrentAuthUser;

export async function getCurrentAuthUser(): Promise<CurrentAuthUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);

  const [rows] = await db.execute<CurrentAuthUserRow[]>(
    `SELECT
       u.id,
       u.fullName,
       u.email,
       u.phone,
       u.role,
       u.customerId
     FROM \`AuthSession\` s
     INNER JOIN \`User\` u ON u.id = s.userId
     WHERE s.tokenHash = ?
       AND s.expiresAt > NOW(3)
       AND u.status = 'ACTIVE'
     LIMIT 1`,
    [tokenHash]
  );

  return rows[0] ?? null;
}
