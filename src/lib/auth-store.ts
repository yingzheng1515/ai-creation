import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { isRecord } from "./history-schema";

const scrypt = promisify(scryptCallback);
const ACCESS_CODE_KEY_LENGTH = 64;

type AccountRecord = {
  id: string;
  accountName: string;
  displayName: string;
  salt: string;
  accessCodeHash: string;
  createdAt: string;
};

export type AuthenticatedUser = {
  id: string;
  label: string;
  accountName: string;
  isAuthenticated: true;
};

export type AccountLoginResult = {
  user: AuthenticatedUser;
  isNew: boolean;
};

export class AuthValidationError extends Error {}
export class InvalidAccessCodeError extends Error {}
export class AccountAlreadyExistsError extends Error {}
export class AccountNotFoundError extends Error {}

function dataBaseDir() {
  if (process.env.HISTORY_DATA_DIR) {
    return process.env.HISTORY_DATA_DIR;
  }

  if (process.env.HISTORY_FILE_PATH) {
    return dirname(process.env.HISTORY_FILE_PATH);
  }

  return join(process.cwd(), "data");
}

function accountsFilePath() {
  return join(dataBaseDir(), "auth", "accounts.json");
}

export function normalizeAccountName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function validateCredentials(accountName: string, accessCode: string) {
  const normalized = normalizeAccountName(accountName);

  if (normalized.length < 2 || normalized.length > 64 || /[\u0000-\u001f]/.test(normalized)) {
    throw new AuthValidationError("Invalid account name.");
  }

  if (accessCode.length < 6 || accessCode.length > 128 || /[\u0000-\u001f]/.test(accessCode)) {
    throw new AuthValidationError("Invalid access code.");
  }

  return normalized;
}

function accountIdForName(accountName: string) {
  const digest = createHash("sha256").update(accountName).digest("hex").slice(0, 24);
  return `acct_${digest}`;
}

function isAccountRecord(value: unknown): value is AccountRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.accountName === "string" &&
    typeof value.displayName === "string" &&
    typeof value.salt === "string" &&
    typeof value.accessCodeHash === "string" &&
    typeof value.createdAt === "string"
  );
}

async function readAccounts(): Promise<AccountRecord[]> {
  try {
    const raw = await readFile(accountsFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAccountRecord) : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    if (error instanceof SyntaxError) {
      return [];
    }

    throw error;
  }
}

async function writeAccounts(accounts: AccountRecord[]) {
  const filePath = accountsFilePath();
  const tempPath = `${filePath}.tmp`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(accounts, null, 2), "utf8");
  await rename(tempPath, filePath);
}

async function hashAccessCode(accessCode: string, salt: string) {
  const derivedKey = (await scrypt(accessCode, salt, ACCESS_CODE_KEY_LENGTH)) as Buffer;
  return derivedKey.toString("hex");
}

async function verifyAccessCode(accessCode: string, account: AccountRecord) {
  const expected = Buffer.from(account.accessCodeHash, "hex");
  const actual = Buffer.from(await hashAccessCode(accessCode, account.salt), "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function toUser(account: AccountRecord): AuthenticatedUser {
  return {
    id: account.id,
    label: account.displayName,
    accountName: account.accountName,
    isAuthenticated: true,
  };
}

async function createAccountRecord(normalized: string, displayName: string, accessCode: string): Promise<AccountRecord> {
  const salt = randomBytes(16).toString("hex");
  const now = new Date().toISOString();

  return {
    id: accountIdForName(normalized),
    accountName: normalized,
    displayName,
    salt,
    accessCodeHash: await hashAccessCode(accessCode, salt),
    createdAt: now,
  };
}

export async function registerAccount(accountName: string, accessCode: string): Promise<AccountLoginResult> {
  const normalized = validateCredentials(accountName, accessCode);
  const displayName = accountName.trim().replace(/\s+/g, " ");
  const accounts = await readAccounts();
  const existing = accounts.find((account) => account.accountName === normalized);

  if (existing) {
    throw new AccountAlreadyExistsError("Account already exists.");
  }

  const account = await createAccountRecord(normalized, displayName, accessCode);

  await writeAccounts([...accounts, account]);

  return { user: toUser(account), isNew: true };
}

export async function loginAccount(accountName: string, accessCode: string): Promise<AccountLoginResult> {
  const normalized = validateCredentials(accountName, accessCode);
  const accounts = await readAccounts();
  const existing = accounts.find((account) => account.accountName === normalized);

  if (!existing) {
    throw new AccountNotFoundError("Account not found.");
  }

  if (!(await verifyAccessCode(accessCode, existing))) {
    throw new InvalidAccessCodeError("Invalid access code.");
  }

  return { user: toUser(existing), isNew: false };
}

export async function createOrLoginAccount(accountName: string, accessCode: string): Promise<AccountLoginResult> {
  const normalized = validateCredentials(accountName, accessCode);
  const displayName = accountName.trim().replace(/\s+/g, " ");
  const accounts = await readAccounts();
  const existing = accounts.find((account) => account.accountName === normalized);

  if (existing) {
    if (!(await verifyAccessCode(accessCode, existing))) {
      throw new InvalidAccessCodeError("Invalid access code.");
    }

    return { user: toUser(existing), isNew: false };
  }

  const account = await createAccountRecord(normalized, displayName, accessCode);

  await writeAccounts([...accounts, account]);

  return { user: toUser(account), isNew: true };
}

export async function getAccountById(accountId: string): Promise<AuthenticatedUser | null> {
  const accounts = await readAccounts();
  const account = accounts.find((candidate) => candidate.id === accountId);

  return account ? toUser(account) : null;
}
