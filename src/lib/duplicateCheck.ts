import { prisma } from "@/lib/db";

export interface DuplicateWarning {
  field: string;
  value: string;
  existingRecordId: string;
  existingRecordName: string;
  module: string;
}

export async function checkLeadDuplicates(email?: string, phone?: string, company?: string): Promise<DuplicateWarning[]> {
  const warnings: DuplicateWarning[] = [];

  if (email) {
    const existing = await prisma.lead.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (existing) {
      warnings.push({ field: "email", value: email, existingRecordId: existing.id, existingRecordName: `${existing.firstName} ${existing.lastName}`, module: "Lead" });
    }
  }

  if (phone) {
    const existing = await prisma.lead.findFirst({ where: { phone } });
    if (existing) {
      warnings.push({ field: "phone", value: phone, existingRecordId: existing.id, existingRecordName: `${existing.firstName} ${existing.lastName}`, module: "Lead" });
    }
  }

  if (company) {
    const existing = await prisma.lead.findFirst({ where: { company: { equals: company, mode: "insensitive" } } });
    if (existing) {
      warnings.push({ field: "company", value: company, existingRecordId: existing.id, existingRecordName: `${existing.firstName} ${existing.lastName}`, module: "Lead" });
    }
  }

  return warnings;
}

export async function checkContactDuplicates(email?: string, phone?: string): Promise<DuplicateWarning[]> {
  const warnings: DuplicateWarning[] = [];

  if (email) {
    const existing = await prisma.contact.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (existing) {
      warnings.push({ field: "email", value: email, existingRecordId: existing.id, existingRecordName: `${existing.firstName} ${existing.lastName}`, module: "Contact" });
    }
  }

  if (phone) {
    const existing = await prisma.contact.findFirst({ where: { phone } });
    if (existing) {
      warnings.push({ field: "phone", value: phone, existingRecordId: existing.id, existingRecordName: `${existing.firstName} ${existing.lastName}`, module: "Contact" });
    }
  }

  return warnings;
}

export async function checkAccountDuplicates(accountName?: string, email?: string): Promise<DuplicateWarning[]> {
  const warnings: DuplicateWarning[] = [];

  if (accountName) {
    const existing = await prisma.account.findFirst({ where: { accountName: { equals: accountName, mode: "insensitive" } } });
    if (existing) {
      warnings.push({ field: "accountName", value: accountName, existingRecordId: existing.id, existingRecordName: existing.accountName, module: "Account" });
    }
  }

  if (email) {
    const existing = await prisma.account.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (existing) {
      warnings.push({ field: "email", value: email, existingRecordId: existing.id, existingRecordName: existing.accountName, module: "Account" });
    }
  }

  return warnings;
}
