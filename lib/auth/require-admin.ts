import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { RowDataPacket } from "mysql2";
import { srrAdminDb } from "../db/srr-admin-db";


const SESSION_COOKIE = "srr_session";


export type AdminAuthCode =
  | "UNAUTHORIZED"
  | "ACCOUNT_DISABLED"
  | "FORBIDDEN";


export class AdminAuthError extends Error {
  readonly code: AdminAuthCode;
  readonly status: number;
  readonly statusCode: number;
  readonly publicMessage: string;


  constructor(
    code: AdminAuthCode,
    status: number,
    publicMessage: string
  ) {
    // Keep message as the auth code for compatibility with the
    // newer product-admin routes that inspect error.message.
    super(code);


    this.name = "AdminAuthError";
    this.code = code;
    this.status = status;
    this.statusCode = status;
    this.publicMessage = publicMessage;
  }
}


type AdminRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "MEMBER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
};


export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "ADMIN";
  status: "ACTIVE";
};


function unauthorized(): never {
  throw new AdminAuthError(
    "UNAUTHORIZED",
    401,
    "กรุณาเข้าสู่ระบบ"
  );
}


function disabled(): never {
  throw new AdminAuthError(
    "ACCOUNT_DISABLED",
    403,
    "บัญชีนี้ถูกปิดการใช้งาน"
  );
}


function forbidden(): never {
  throw new AdminAuthError(
    "FORBIDDEN",
    403,
    "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ"
  );
}


export async function requireAdmin(): Promise<AdminUser> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;


  if (!token) {
    return unauthorized();
  }


  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");


  const [rows] = await srrAdminDb.query<AdminRow[]>(
    `
      SELECT
        u.id,
        u.fullName,
        u.email,
        u.phone,
        u.role,
        u.status
      FROM AuthSession s
      INNER JOIN User u
        ON u.id = s.userId
      WHERE s.tokenHash = ?
        AND s.expiresAt > CURRENT_TIMESTAMP(3)
      LIMIT 1
    `,
    [tokenHash]
  );


  const user = rows[0];


  if (!user) {
    return unauthorized();
  }


  if (user.status !== "ACTIVE") {
    return disabled();
  }


  if (user.role !== "ADMIN") {
    return forbidden();
  }


  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: "ADMIN",
    status: "ACTIVE",
  };
}


// Compatibility export for the FlowAccount routes created earlier.
// Both names now use exactly the same ADMIN/session validation.
export async function requireAdminUser(): Promise<AdminUser> {
  return requireAdmin();
}