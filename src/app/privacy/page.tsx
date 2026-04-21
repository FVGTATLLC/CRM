export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including: name, email address, phone number, company name, job title, and business-related details when you fill out forms, create an account, or communicate with us through our CRM platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to: provide and maintain our CRM services, process and manage business relationships, send relevant communications about our services, comply with legal obligations, and improve our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">3. Data Storage & Security</h2>
            <p>Your data is stored on secure cloud infrastructure (Google Cloud Platform) with encrypted connections. We implement industry-standard security measures including JWT authentication, password hashing (bcrypt), role-based access controls, and comprehensive audit logging.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Data Retention</h2>
            <p>We retain your personal data for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws. You may request deletion of your data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Your Rights</h2>
            <p>You have the right to: access your personal data, request correction of inaccurate data, request deletion of your data, object to processing of your data, request data portability (export your data in a standard format), and withdraw consent at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with: service providers who assist in operating our platform, legal authorities when required by law, and business partners only with your explicit consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Cookies & Tracking</h2>
            <p>Our platform uses essential cookies for authentication and session management. We use localStorage for session persistence. No third-party tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Contact Us</h2>
            <p>For any privacy-related inquiries or to exercise your data rights, please contact your system administrator or email: privacy@gta-travel.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
