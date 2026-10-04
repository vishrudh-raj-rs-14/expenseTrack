import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  initializeSheets,
} from "@/lib/sheets";
import { todayISO } from "@/lib/utils";
import type { Transaction, TransactionFilters } from "@/lib/types";

// GET /api/transactions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const all = await getTransactions();

    // Apply filters
    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.toLowerCase();
    const category = params.get("category");
    const subcategory = params.get("subcategory");
    const type = params.get("type");
    const paymentMethod = params.get("paymentMethod");
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");
    const minAmount = params.get("minAmount");
    const maxAmount = params.get("maxAmount");
    const limit = params.get("limit");

    let filtered = all;

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search) ||
          t.subcategory.toLowerCase().includes(search)
      );
    }
    if (category) filtered = filtered.filter((t) => t.category === category);
    if (subcategory) filtered = filtered.filter((t) => t.subcategory === subcategory);
    if (type) filtered = filtered.filter((t) => t.type === type);
    if (paymentMethod) filtered = filtered.filter((t) => t.paymentMethod === paymentMethod);
    if (startDate) filtered = filtered.filter((t) => t.date >= startDate);
    if (endDate) filtered = filtered.filter((t) => t.date <= endDate);
    if (minAmount) filtered = filtered.filter((t) => t.amount >= parseFloat(minAmount));
    if (maxAmount) filtered = filtered.filter((t) => t.amount <= parseFloat(maxAmount));
    if (limit) filtered = filtered.slice(0, parseInt(limit));

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const body = await req.json();

    const txn: Transaction = {
      id: uuidv4(),
      date: body.date || todayISO(),
      amount: parseFloat(body.amount) || 0,
      type: body.type || "expense",
      category: body.category || "",
      subcategory: body.subcategory || "",
      description: body.description || "",
      paymentMethod: body.paymentMethod || "UPI",
      createdAt: new Date().toISOString(),
    };

    await addTransaction(txn);
    return NextResponse.json({ data: txn }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to add transaction" }, { status: 500 });
  }
}

// PUT /api/transactions
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await updateTransaction(body as Transaction);
    return NextResponse.json({ data: body });
  } catch (error) {
    console.error("PUT /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// DELETE /api/transactions?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await deleteTransaction(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
