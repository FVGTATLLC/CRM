import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [account, lead] = await Promise.all([
      prisma.account.findUnique({
        where: { id },
        include: {
          contacts: { orderBy: { createdAt: "desc" } },
          proposals: { include: { owner: true }, orderBy: { createdAt: "desc" } },
          contracts: { include: { owner: true, proposal: true }, orderBy: { createdAt: "desc" } },
          kybChecklist: { orderBy: { createdAt: "desc" } },
          owner: true,
        },
      }),
      prisma.lead.findFirst({ where: { convertedToAccountId: id } }),
    ]);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const kybItems = account.kybChecklist || [];
    const kybStatus = kybItems.length === 0 ? "NotStarted" : kybItems.every((k: any) => k.isVerified) ? "Complete" : "InProgress";

    const journeyStatus = {
      hasLead: !!lead,
      leadId: lead?.id || null,
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : null,
      contactCount: account.contacts.length,
      proposalCount: account.proposals.length,
      contractCount: account.contracts.length,
      kybTotal: kybItems.length,
      kybVerified: kybItems.filter((k: any) => k.isVerified).length,
      kybStatus,
      isOnboarded: (account.accountStatus === "Onboarded" || account.accountStatus === "Active") && kybStatus === "Complete",
    };

    return NextResponse.json({
      success: true,
      data: {
        account,
        lead,
        contacts: account.contacts,
        proposals: account.proposals,
        contracts: account.contracts,
        kybChecklist: account.kybChecklist,
        journeyStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching account related data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
