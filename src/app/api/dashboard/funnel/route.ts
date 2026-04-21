import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalLeads, convertedLeads, totalAccounts, accountsWithContacts, accountsWithProposals, accountsWithContracts] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { isConverted: true } }),
      prisma.account.count(),
      prisma.account.count({ where: { contacts: { some: {} } } }),
      prisma.account.count({ where: { proposals: { some: {} } } }),
      prisma.account.count({ where: { contracts: { some: {} } } }),
    ]);

    // For KYB verified, we need accounts where ALL kyb items are verified
    const allAccountsWithKyb = await prisma.account.findMany({
      where: { kybChecklist: { some: {} } },
      include: { kybChecklist: { select: { isVerified: true } } },
    });
    const accountsKybVerified = allAccountsWithKyb.filter(a => a.kybChecklist.length > 0 && a.kybChecklist.every(k => k.isVerified)).length;

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        convertedToAccounts: convertedLeads,
        totalAccounts,
        accountsWithContacts,
        accountsWithProposals,
        accountsWithContracts,
        accountsKybVerified,
      },
    });
  } catch (error) {
    console.error("Error fetching funnel data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
