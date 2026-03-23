import { NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/dal/notifications";

export async function GET() {
  try {
    const total = await getUnreadCount();
    return NextResponse.json({ data: { total } });
  } catch {
    return NextResponse.json({ data: { total: 0 } });
  }
}
