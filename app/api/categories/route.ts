import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { getCategories, addCategory, updateCategory, deleteCategory, initializeSheets } from "@/lib/sheets";
import type { Category } from "@/lib/types";

// GET /api/categories
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const all = await getCategories();

    const type = req.nextUrl.searchParams.get("type");
    const parent = req.nextUrl.searchParams.get("parent");

    let filtered = all;
    if (type) filtered = filtered.filter((c) => c.type === type);
    if (parent !== null) filtered = filtered.filter((c) => c.parent === parent);

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const cat: Category = {
      id: uuidv4(),
      name: body.name || "",
      parent: body.parent || "",
      icon: body.icon || "MoreHorizontal",
      color: body.color || "#9CA3AF",
      type: body.type || "expense",
      isActive: true,
    };
    await addCategory(cat);
    return NextResponse.json({ data: cat }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to add category" }, { status: 500 });
  }
}

// PUT /api/categories
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await updateCategory(body as Category);
    return NextResponse.json({ data: body });
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/categories?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteCategory(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
