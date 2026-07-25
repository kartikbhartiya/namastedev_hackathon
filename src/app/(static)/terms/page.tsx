export default function TermsOfServicePage() {
  return (
    <main className="w-full min-h-screen bg-[#040404] pt-32 pb-24 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Terms of Service</h1>
          <p className="text-neutral-400 text-lg">Last updated: July 25, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-neutral max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-[#ff6c37]">
          <h2>1. Agreement to Terms</h2>
          <p>
            By viewing or using Orbit Study OS, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the services.
          </p>

          <h2>2. Use of Services</h2>
          <p>
            Orbit provides an AI-powered study companion, proctored assessment environment, and related features. You agree to use the Services only for lawful purposes and in accordance with these Terms.
          </p>
          <ul>
            <li>You must not use the services to engage in academic dishonesty, plagiarism, or cheating.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials (if applicable).</li>
            <li>You agree not to attempt to bypass or disable any security or proctoring mechanisms implemented in the platform.</li>
          </ul>

          <h2>3. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
          </p>

          <h2>4. User Generated Content</h2>
          <p>
            Any code, notes, or concept graphs you create using Orbit remain your intellectual property. However, you grant us a license to store and process this data to provide the tutoring and assessment services back to you.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site.
          </p>

          <h2>6. Modifications to Terms</h2>
          <p>
            We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Service at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of these Terms of Service, and you waive any right to receive specific notice of each such change.
          </p>
        </div>
      </div>
    </main>
  );
}
