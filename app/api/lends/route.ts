import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { getLends, addLend, updateLend, deleteLend, initializeSheets } from "@/lib/sheets";
import { todayISO } from "@/lib/utils";
import type { Lend } from "@/lib/types";

// GET /api/lends
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const all = await getLends();

    const status = req.nextUrl.searchParams.get("status");
    const type = req.nextUrl.searchParams.get("type");

    let filtered = all;
    if (status) filtered = filtered.filter((l) => l.status === status);
    if (type) filtered = filtered.filter((l) => l.type === type);

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("GET /api/lends error:", error);
    return NextResponse.json({ error: "Failed to fetch lends" }, { status: 500 });
  }
}

// POST /api/lends
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const body = await req.json();

    const lend: Lend = {
      id: uuidv4(),
      date: body.date || todayISO(),
      person: body.person || "",
      amount: parseFloat(body.amount) || 0,
      type: body.type || "lent",
      reason: body.reason || "",
      status: "pending",
      settledAmount: 0,
      settledDate: "",
      createdAt: new Date().toISOString(),
    };

    await addLend(lend);
    return NextResponse.json({ data: lend }, { status: 201 });
  } catch (error) {
    console.error("POST /api/lends error:", error);
    return NextResponse.json({ error: "Failed to add lend" }, { status: 500 });
  }
}

// PUT /api/lends — for updating or settling
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Handle settle action
    if (body.action === "settle") {
      const all = await getLends();
      const existing = all.find((l) => l.id === body.id);
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const settleAmount = parseFloat(body.settleAmount) || existing.amount;
      const newSettled = (existing.settledAmount || 0) + settleAmount;
      const isFullySettled = newSettled >= existing.amount;

      const updated: Lend = {
        ...existing,
        settledAmount: newSettled,
        status: isFullySettled ? "settled" : "partially_settled",
        settledDate: isFullySettled ? (body.settleDate || todayISO()) : "",
      };

      await updateLend(updated);
      return NextResponse.json({ data: updated });
    }

    await updateLend(body as Lend);
    return NextResponse.json({ data: body });
  } catch (error) {
    console.error("PUT /api/lends error:", error);
    return NextResponse.json({ error: "Failed to update lend" }, { status: 500 });
  }
}

// DELETE /api/lends?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await deleteLend(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/lends error:", error);
    return NextResponse.json({ error: "Failed to delete lend" }, { status: 500 });
  }
}
