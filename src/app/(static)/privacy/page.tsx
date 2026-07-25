export default function PrivacyPolicyPage() {
  return (
    <main className="w-full min-h-screen bg-[#040404] pt-32 pb-24 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
          <p className="text-neutral-400 text-lg">Last updated: July 25, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-neutral max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-[#ff6c37]">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Orbit Study OS ("Orbit", "we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at support@orbit.study.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
          </p>
          <ul>
            <li><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following: email addresses, usernames, contact preferences, and course/major details.</li>
            <li><strong>Assessment Data.</strong> We collect and process data related to your performance on proctored assessments, mock interviews, and AI tutor interactions to provide personalized learning insights.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To provide and manage the AI tutoring services and features.</li>
            <li>To send administrative information to you.</li>
            <li>To protect our Services from cheating and abuse during assessments.</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us at support@orbit.study.
          </p>
        </div>
      </div>
    </main>
  );
}
