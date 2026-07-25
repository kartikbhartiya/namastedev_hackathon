"use client";

import { Mail, MessageSquare, MapPin } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <main className="w-full min-h-screen bg-[#040404] pt-32 pb-24 px-6 sm:px-12 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Left Column: Info */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Get in touch</h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-md">
              Have questions about Orbit, need technical support, or want to explore partnership opportunities? We're here to help.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#ff6c37]/10 rounded-xl border border-[#ff6c37]/20 shrink-0">
                <Mail className="h-6 w-6 text-[#ff6c37]" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Email Us</h3>
                <p className="text-neutral-400 text-sm mb-2">Our team usually responds within 24 hours.</p>
                <a href="mailto:support@orbit.study" className="text-[#ff6c37] hover:text-[#ff8454] text-sm font-semibold transition-colors">
                  support@orbit.study
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Community Support</h3>
                <p className="text-neutral-400 text-sm mb-2">Join our developer discord for quick community help.</p>
                <a href="#" className="text-white hover:text-neutral-300 text-sm font-semibold transition-colors">
                  Join Discord Server &rarr;
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Office</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  123 Innovation Drive<br />
                  Tech District, CA 94103<br />
                  United States
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-neutral-900/40 border border-white/10 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff6c37]/5 rounded-full blur-[80px] pointer-events-none" />

          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Message Sent</h3>
              <p className="text-neutral-400 max-w-xs">
                Thanks for reaching out! We'll get back to you as soon as possible.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">First Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#040404] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/50 transition-all"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Last Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#040404] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/50 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#040404] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/50 transition-all"
                  placeholder="jane@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full bg-[#040404] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/50 transition-all resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#ff6c37] hover:bg-[#ff8454] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
