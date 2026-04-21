"use client";

interface JourneyStatus {
  hasLead: boolean;
  contactCount: number;
  proposalCount: number;
  contractCount: number;
  kybStatus: "NotStarted" | "InProgress" | "Complete";
  isOnboarded: boolean;
}

interface JourneyProgressBarProps {
  journeyStatus: JourneyStatus;
}

export default function JourneyProgressBar({ journeyStatus }: JourneyProgressBarProps) {
  const stages = [
    { label: "Lead", done: journeyStatus.hasLead, count: null },
    { label: "Account", done: true, count: null },
    { label: "Contacts", done: journeyStatus.contactCount > 0, count: journeyStatus.contactCount },
    { label: "Proposals", done: journeyStatus.proposalCount > 0, count: journeyStatus.proposalCount },
    { label: "Contracts", done: journeyStatus.contractCount > 0, count: journeyStatus.contractCount },
    { label: "KYB", done: journeyStatus.kybStatus === "Complete", inProgress: journeyStatus.kybStatus === "InProgress", count: null },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg mb-4">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              stage.done ? "bg-green-500 text-white" : stage.inProgress ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {stage.done ? "✓" : stage.inProgress ? "●" : (i + 1)}
            </div>
            <span className="text-[10px] text-gray-600 mt-1 font-medium">{stage.label}</span>
            {stage.count !== null && stage.count > 0 && (
              <span className="text-[9px] text-gray-400">({stage.count})</span>
            )}
          </div>
          {i < stages.length - 1 && (
            <div className={`w-8 sm:w-12 md:w-16 h-0.5 mx-1 ${stage.done ? "bg-green-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
