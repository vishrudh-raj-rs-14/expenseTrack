import { google } from "googleapis";
import type { Transaction, Lend, Category, Config } from "./types";
import { seedCategories } from "./categories";

// ─── Init lock (prevents concurrent duplicate seeding) ────────
let _initPromise: Promise<void> | null = null;
let _initialized = false;

// ─── Auth ─────────────────────────────────────────────────────

function getAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
  };
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

// ─── Sheet names ──────────────────────────────────────────────
const SHEETS = {
  TRANSACTIONS: "transactions",
  LENDS: "lends",
  CATEGORIES: "categories",
  CONFIG: "config",
} as const;

// ─── Headers ──────────────────────────────────────────────────
const HEADERS = {
  transactions: ["id", "date", "amount", "type", "category", "subcategory", "description", "paymentMethod", "createdAt"],
  lends: ["id", "date", "person", "amount", "type", "reason", "status", "settledAmount", "settledDate", "createdAt"],
  categories: ["id", "name", "parent", "icon", "color", "type", "isActive"],
  config: ["key", "value"],
};

// ─── Initialize Sheet ─────────────────────────────────────────

export async function initializeSheets(): Promise<void> {
  // Return immediately if already done
  if (_initialized) return;
  // If already in progress, wait for it to finish instead of running again
  if (_initPromise) return _initPromise;

  _initPromise = _doInitialize().finally(() => {
    _initialized = true;
    _initPromise = null;
  });
  return _initPromise;
}

async function _doInitialize(): Promise<void> {
  const sheets = getSheetsClient();

  // Get existing sheets
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = meta.data.sheets?.map((s) => s.properties?.title) ?? [];

  const requests: any[] = [];

  for (const [key, name] of Object.entries(SHEETS)) {
    if (!existingSheets.includes(name)) {
      requests.push({
        addSheet: { properties: { title: name } },
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests },
    });
  }

  // Write headers if sheets are empty
  for (const [key, name] of Object.entries(SHEETS)) {
    const headerKey = key.toLowerCase() as keyof typeof HEADERS;
    const headerRow = HEADERS[headerKey as keyof typeof HEADERS];
    if (!headerRow) continue;

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${name}!A1:Z1`,
    });

    if (!resp.data.values || resp.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${name}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headerRow] },
      });

      // Seed categories if just created
      if (name === SHEETS.CATEGORIES) {
        const cats = seedCategories();
        const rows = cats.map((c) => [
          c.id, c.name, c.parent, c.icon, c.color, c.type, String(c.isActive),
        ]);
        if (rows.length > 0) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${name}!A2`,
            valueInputOption: "RAW",
            requestBody: { values: rows },
          });
        }
      }

      // Seed default config
      if (name === SHEETS.CONFIG) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${name}!A2`,
          valueInputOption: "RAW",
          requestBody: {
            values: [
              ["monthlyBudget", "0"],
              ["defaultPaymentMethod", "UPI"],
              ["theme", "system"],
              ["sheetUrl", `https://docs.google.com/spreadsheets/d/${SHEET_ID}`],
            ],
          },
        });
      }
    }
  }
}

// ─── Generic Row Helpers ──────────────────────────────────────

async function getRows(sheetName: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1:Z`,
  });
  return resp.data.values ?? [];
}

function rowsToObjects<T>(rows: string[][]): T[] {
  if (rows.length < 2) return [];
  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj as unknown as T;
  });
}

async function appendRow(sheetName: string, values: (string | number | boolean)[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values.map(String)] },
  });
}

async function findRowIndex(sheetName: string, id: string): Promise<number> {
  const rows = await getRows(sheetName);
  // row index 0 = headers, find by id column (index 0)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1; // 1-indexed row number in Sheets
  }
  return -1;
}

async function updateRow(sheetName: string, rowNum: number, values: (string | number | boolean)[]): Promise<void> {
  const sheets = getSheetsClient();
  const colEnd = String.fromCharCode(65 + values.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowNum}:${colEnd}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [values.map(String)] },
  });
}

async function deleteRow(sheetName: string, rowNum: number): Promise<void> {
  const sheets = getSheetsClient();
  // Get sheet ID for the named sheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetMeta = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  const sheetNumericId = sheetMeta?.properties?.sheetId;
  if (sheetNumericId === undefined) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetNumericId,
            dimension: "ROWS",
            startIndex: rowNum - 1,
            endIndex: rowNum,
          },
        },
      }],
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────

function rowToTransaction(row: Record<string, string>): Transaction {
  return {
    id: row.id,
    date: row.date,
    amount: parseFloat(row.amount) || 0,
    type: row.type as Transaction["type"],
    category: row.category,
    subcategory: row.subcategory,
    description: row.description,
    paymentMethod: row.paymentMethod as Transaction["paymentMethod"],
    createdAt: row.createdAt,
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const rows = await getRows(SHEETS.TRANSACTIONS);
  const objects = rowsToObjects<Record<string, string>>(rows);
  return objects.map(rowToTransaction).sort((a, b) => b.date.localeCompare(a.date));
}

export async function addTransaction(txn: Omit<Transaction, "id" | "createdAt"> & { id: string; createdAt: string }): Promise<void> {
  await appendRow(SHEETS.TRANSACTIONS, [
    txn.id, txn.date, txn.amount, txn.type,
    txn.category, txn.subcategory, txn.description,
    txn.paymentMethod, txn.createdAt,
  ]);
}

export async function updateTransaction(txn: Transaction): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.TRANSACTIONS, txn.id);
  if (rowNum === -1) throw new Error("Transaction not found");
  await updateRow(SHEETS.TRANSACTIONS, rowNum, [
    txn.id, txn.date, txn.amount, txn.type,
    txn.category, txn.subcategory, txn.description,
    txn.paymentMethod, txn.createdAt,
  ]);
}

export async function deleteTransaction(id: string): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.TRANSACTIONS, id);
  if (rowNum === -1) throw new Error("Transaction not found");
  await deleteRow(SHEETS.TRANSACTIONS, rowNum);
}

// ─── Lends ────────────────────────────────────────────────────

function rowToLend(row: Record<string, string>): Lend {
  return {
    id: row.id,
    date: row.date,
    person: row.person,
    amount: parseFloat(row.amount) || 0,
    type: row.type as Lend["type"],
    reason: row.reason,
    status: row.status as Lend["status"],
    settledAmount: parseFloat(row.settledAmount) || 0,
    settledDate: row.settledDate,
    createdAt: row.createdAt,
  };
}

export async function getLends(): Promise<Lend[]> {
  const rows = await getRows(SHEETS.LENDS);
  const objects = rowsToObjects<Record<string, string>>(rows);
  return objects.map(rowToLend).sort((a, b) => b.date.localeCompare(a.date));
}

export async function addLend(lend: Lend): Promise<void> {
  await appendRow(SHEETS.LENDS, [
    lend.id, lend.date, lend.person, lend.amount, lend.type,
    lend.reason, lend.status, lend.settledAmount, lend.settledDate, lend.createdAt,
  ]);
}

export async function updateLend(lend: Lend): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.LENDS, lend.id);
  if (rowNum === -1) throw new Error("Lend not found");
  await updateRow(SHEETS.LENDS, rowNum, [
    lend.id, lend.date, lend.person, lend.amount, lend.type,
    lend.reason, lend.status, lend.settledAmount, lend.settledDate, lend.createdAt,
  ]);
}

export async function deleteLend(id: string): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.LENDS, id);
  if (rowNum === -1) throw new Error("Lend not found");
  await deleteRow(SHEETS.LENDS, rowNum);
}

// ─── Categories ───────────────────────────────────────────────

function rowToCategory(row: Record<string, string>): Category {
  return {
    id: row.id,
    name: row.name,
    parent: row.parent,
    icon: row.icon,
    color: row.color,
    type: row.type as Category["type"],
    isActive: row.isActive === "true",
  };
}

export async function getCategories(): Promise<Category[]> {
  const rows = await getRows(SHEETS.CATEGORIES);
  const objects = rowsToObjects<Record<string, string>>(rows);
  const all = objects.map(rowToCategory);

  // Deduplicate by name — keep first occurrence of each (name, parent) combo
  const seen = new Set<string>();
  return all.filter((c) => {
    const key = `${c.name}::${c.parent}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function addCategory(cat: Category): Promise<void> {
  await appendRow(SHEETS.CATEGORIES, [
    cat.id, cat.name, cat.parent, cat.icon, cat.color, cat.type, String(cat.isActive),
  ]);
}

export async function updateCategory(cat: Category): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.CATEGORIES, cat.id);
  if (rowNum === -1) throw new Error("Category not found");
  await updateRow(SHEETS.CATEGORIES, rowNum, [
    cat.id, cat.name, cat.parent, cat.icon, cat.color, cat.type, String(cat.isActive),
  ]);
}

export async function deleteCategory(id: string): Promise<void> {
  const rowNum = await findRowIndex(SHEETS.CATEGORIES, id);
  if (rowNum === -1) throw new Error("Category not found");
  await deleteRow(SHEETS.CATEGORIES, rowNum);
}

// ─── Config ───────────────────────────────────────────────────

export async function getConfig(): Promise<Record<string, string>> {
  const rows = await getRows(SHEETS.CONFIG);
  const objects = rowsToObjects<Record<string, string>>(rows);
  const config: Record<string, string> = {};
  for (const obj of objects) {
    config[obj.key] = obj.value;
  }
  return config;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const rows = await getRows(SHEETS.CONFIG);
  const headers = rows[0] ?? ["key", "value"];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      await updateRow(SHEETS.CONFIG, i + 1, [key, value]);
      return;
    }
  }
  // Not found, append
  await appendRow(SHEETS.CONFIG, [key, value]);
}

// ─── Stats helpers ─────────────────────────────────────────────

export async function getTransactionsInRange(start: string, end: string): Promise<Transaction[]> {
  const all = await getTransactions();
  return all.filter((t) => t.date >= start && t.date <= end);
}
