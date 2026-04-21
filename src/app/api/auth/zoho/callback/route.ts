import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeZohoCode } from "@/lib/zoho";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/profile?zoho=error&reason=" + error, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/profile?zoho=error&reason=missing_params", request.url));
    }

    const tokens = await exchangeZohoCode(code);

    await prisma.user.update({
      where: { id: state },
      data: {
        zohoAccessToken: tokens.access_token,
        zohoRefreshToken: tokens.refresh_token,
        zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return NextResponse.redirect(new URL("/profile?zoho=connected", request.url));
  } catch (error) {
    console.error("Zoho OAuth callback error:", error);
    return NextResponse.redirect(new URL("/profile?zoho=error&reason=token_exchange", request.url));
  }
}
