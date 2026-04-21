import { NextRequest, NextResponse } from "next/server";
import { verifyToken, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const newToken = generateToken({
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType,
      roleId: payload.roleId,
    });

    return NextResponse.json({ success: true, token: newToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
