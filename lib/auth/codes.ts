import "server-only";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

export type CodeLength = 4 | 6;

const BCRYPT_ROUNDS = 10;

export function generateCode(length: CodeLength): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

export function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function codeLengthForRoles(roles: string[]): CodeLength {
  return roles.includes("admin") || roles.includes("entraineur") ? 6 : 4;
}
