import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, businessLine: true, department: true, branch: true },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Check if account is locked
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        return NextResponse.json({ success: false, error: "Account is locked. Try again later." }, { status: 423 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        // Increment failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: Record<string, unknown> = { failedLoginAttempts: failedAttempts };

        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
      }

      if (user.userStatus !== "Active") {
        return NextResponse.json({ success: false, error: "Account is inactive" }, { status: 403 });
      }

      // Reset failed login attempts and update last login on successful login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        roleId: user.roleId || undefined,
      });

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            userType: user.userType,
            avatarUrl: user.avatarUrl,
            roleId: user.roleId,
            roleName: user.role?.roleName,
            businessLineName: user.businessLine?.businessLineName,
            departmentName: user.department?.departmentName,
            branchCode: user.branch?.branchCode,
          },
        },
      });
    }

    if (action === "register") {
      const { firstName, lastName, email, password, userType = "Standard" } = body;
      if (!firstName || !lastName || !email || !password) {
        return NextResponse.json({ success: false, error: "All fields required" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          username: email,
          passwordHash,
          userType,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
      });

      return NextResponse.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            userType: user.userType,
            avatarUrl: user.avatarUrl,
          },
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
