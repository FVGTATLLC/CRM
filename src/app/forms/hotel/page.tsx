"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/forms/PhoneInput";

const SOURCES = ["Website", "Facebook Ads", "LinkedIn Ads", "Google Ads", "Referral", "Direct", "Trade Show", "Email Campaign", "Partner", "Other"];
const COUNTRIES = ["United Arab Emirates", "India", "Kenya", "Nigeria", "United Kingdom", "United States", "Thailand", "South Africa", "Saudi Arabia", "Qatar", "Oman", "Bahrain", "Egypt", "Tanzania", "Uganda", "Ghana", "France", "Germany", "Italy", "Spain", "Other"];

export default function HotelLeadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    hotelName: "", starRating: "", numberOfRooms: "", city: "", country: "",
    firstName: "", lastName: "", email: "", phone: "", jobTitle: "",
    hotelAmenities: "", commissionStructure: "", partnershipType: "",
    leadSource: "", description: "",
  });

  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.hotelName || !form.firstName || !form.lastName || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, leadType: "Hotel", company: form.hotelName, formSource: "WebForm" }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/forms/thank-you?type=hotel");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Hotel Partnership Inquiry</h2>
        <p className="text-sm text-gray-500 mt-1">Interested in partnering with Flyvento? Tell us about your property.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">Hotel Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.hotelName} onChange={(e) => set("hotelName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating <span className="text-red-500">*</span></label>
              <select value={form.starRating} onChange={(e) => set("starRating", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                <option value="">Select Rating</option>
                <option value="1">1 Star</option><option value="2">2 Stars</option><option value="3">3 Stars</option><option value="4">4 Stars</option><option value="5">5 Stars</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
              <input type="number" value={form.numberOfRooms} onChange={(e) => set("numberOfRooms", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
              <select value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">Contact Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label><input type="text" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label><input type="text" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
            <PhoneInput label="Phone" name="phone" value={form.phone} onChange={(_, v) => set("phone", v)} country={form.country} />
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label><input type="text" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
              <select value={form.leadSource} onChange={(e) => set("leadSource", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select Source</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b">Partnership Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Type</label>
              <select value={form.partnershipType} onChange={(e) => set("partnershipType", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select Type</option>
                <option value="Preferred">Preferred Partner</option><option value="Standard">Standard</option><option value="Premium">Premium</option><option value="Exclusive">Exclusive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Structure</label>
              <input type="text" value={form.commissionStructure} onChange={(e) => set("commissionStructure", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g., 15% net rate" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Amenities & Facilities</label>
              <textarea value={form.hotelAmenities} onChange={(e) => set("hotelAmenities", e.target.value)} rows={3} placeholder="Pool, Spa, Restaurant, Gym, Conference Rooms, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Submitting..." : "Submit Partnership Inquiry"}
        </button>
        <p className="text-xs text-gray-400 text-center">By submitting this form, you agree to our <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>.</p>
      </form>
    </div>
  );
}
