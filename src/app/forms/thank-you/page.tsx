"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const isHotel = type === "hotel";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
      <p className="text-gray-600 mb-2">
        {isHotel
          ? "We've received your hotel partnership inquiry."
          : "We've received your corporate travel inquiry."}
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Our team will review your information and get back to you within 24-48 hours.
      </p>
      <div className="space-y-3">
        <a href={isHotel ? "/forms/hotel" : "/forms/corporate"} className="block w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Submit Another Inquiry
        </a>
        <a href="/" className="block w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
