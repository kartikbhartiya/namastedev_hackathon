import Link from "next/link";
import { EclixLogo } from "./EclixLogo";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";

export function GlobalFooter() {
  return (
    <footer className="w-full bg-[#040404] border-t border-white/5 pt-16 pb-8 px-6 sm:px-12 mt-auto select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 md:gap-8">
        
        {/* Brand & Description */}
        <div className="flex-1 max-w-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <EclixLogo className="h-7 w-7 text-white" />
            <span className="text-xl font-extrabold tracking-tight text-white">Orbit</span>
          </div>
          <p className="text-sm text-neutral-500 leading-relaxed">
            The intelligent study companion. AI-powered tutoring, proctored assessments, concept mapping, and code tracing built for computer science students.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-white transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-12 md:gap-24">
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Legal</h4>
            <ul className="space-y-3 text-sm text-neutral-500 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Support</h4>
            <ul className="space-y-3 text-sm text-neutral-500 font-medium">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <a href="mailto:support@orbit.study" className="hover:text-white transition-colors">support@orbit.study</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-neutral-600 font-medium">
          © {new Date().getFullYear()} Orbit Study OS. All rights reserved.
        </p>
        <p className="text-xs text-neutral-600 flex items-center gap-1.5">
          Crafted with <span className="text-[#ff6c37]">❤</span> for developers
        </p>
      </div>
    </footer>
  );
}
