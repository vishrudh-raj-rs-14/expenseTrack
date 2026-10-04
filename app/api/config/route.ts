import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConfig, setConfig, initializeSheets } from "@/lib/sheets";

// GET /api/config
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await initializeSheets();
    const config = await getConfig();
    return NextResponse.json({ data: config });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 });
  }
}

// POST /api/config
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
    await setConfig(key, String(value));
    return NextResponse.json({ message: "Saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to set config" }, { status: 500 });
  }
}
