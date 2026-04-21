import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
  roleId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30m" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: { include: { moduleAccess: { include: { module: true } } } }, businessLine: true, department: true },
  });

  return user;
}

export function checkPermission(
  user: Awaited<ReturnType<typeof getAuthUser>>,
  moduleName: string,
  action: "canCreate" | "canRead" | "canUpdate" | "canDelete" | "canExport" | "canImport" | "canTransfer"
): boolean {
  if (!user) return false;
  if (user.userType === "SuperAdmin") return true;

  const moduleAccess = user.role?.moduleAccess?.find(
    (ma) => ma.module?.moduleName?.toLowerCase() === moduleName.toLowerCase()
  );

  if (!moduleAccess) return false;
  return moduleAccess[action] === true;
}
