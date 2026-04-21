import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
        steps: { include: { approver: true }, orderBy: { stepNumber: "asc" } },
      },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: approval });
  } catch (error) {
    console.error("Error fetching approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, remarks, stepId } = body;

    if (!action || !stepId) {
      return NextResponse.json({ error: "Action and step ID are required" }, { status: 400 });
    }

    // Update the step
    await prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: action === "approve" ? "Approved" : "Rejected",
        remarks,
        actionAt: new Date(),
        approverId: user.id,
      },
    });

    if (action === "reject") {
      // Reject the entire request
      await prisma.approvalRequest.update({
        where: { id },
        data: { status: "Rejected" },
      });
    } else {
      // Check if all steps are approved
      const allSteps = await prisma.approvalStep.findMany({
        where: { approvalRequestId: id },
        orderBy: { stepNumber: "asc" },
      });

      const allApproved = allSteps.every((s) => s.status === "Approved");

      if (allApproved) {
        await prisma.approvalRequest.update({
          where: { id },
          data: { status: "Approved", currentStep: allSteps.length },
        });
      } else {
        // Move to next step
        const nextPending = allSteps.find((s) => s.status === "Waiting");
        if (nextPending) {
          await prisma.approvalStep.update({
            where: { id: nextPending.id },
            data: { status: "Pending" },
          });
          await prisma.approvalRequest.update({
            where: { id },
            data: { currentStep: nextPending.stepNumber },
          });
        }
      }
    }

    const updated = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
        steps: { include: { approver: true }, orderBy: { stepNumber: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
