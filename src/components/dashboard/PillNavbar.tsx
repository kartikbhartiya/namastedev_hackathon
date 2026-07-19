"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { EclixLogo } from "@/components/EclixLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  Network,
  Code2,
  ShieldCheck,
  Swords,
  ShieldAlert,
  Home,
  type LucideIcon
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Dashboard", icon: Home, href: "/" },
  { id: "ai-tutor", label: "AI Tutor", icon: Bot, href: "/ai-tutor" },
  { id: "concept-graph", label: "Concepts", icon: Network, href: "/concept-graph" },
  { id: "debate", label: "Debate", icon: Swords, href: "/debate" },
  { id: "code", label: "Code", icon: Code2, href: "/code" },
  { id: "exam", label: "Exam", icon: ShieldCheck, href: "/exam" },
  { id: "interview", label: "Interview", icon: ShieldAlert, href: "/interview" },
];

interface PillNavbarProps {
  variant: "student" | "mentor";
  avatarUrl?: string | null;
  avatarFallback?: string;
}

export function PillNavbar({ avatarUrl, avatarFallback }: PillNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed top-3 sm:top-6 inset-x-0 z-50 flex justify-center px-3 pointer-events-none select-none">
      <div className="mac-command-dock pointer-events-auto flex items-center gap-0.5 sm:gap-3 rounded-full px-2 sm:px-5 py-2 sm:py-2.5 transition-all duration-300" style={{ maxWidth: "calc(100vw - 24px)" }}>
        
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center p-1.5 sm:p-2 rounded-full hover:bg-white/5 transition-colors shrink-0"
        >
          <EclixLogo className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* Nav Items */}
        <div className="flex items-center gap-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                title={item.label}
                className="relative p-1.5 sm:p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-150 group flex flex-col items-center shrink-0 focus:outline-none"
              >
                <Icon className={cn("h-[16px] w-[16px] sm:h-[19px] sm:w-[19px]", isActive && "text-[#ff6c37]")} />
                {isActive && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#ff6c37]" />
                )}
                <span className="hidden sm:block absolute bottom-[-40px] left-1/2 -translate-x-1/2 bg-neutral-950 border border-white/5 text-[10px] font-bold text-white px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-5 bg-white/10 shrink-0" />

        {/* Avatar */}
        <Avatar
          onClick={() => router.push("/profile")}
          className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8 border border-white/10 hover:border-white/20 transition-all shrink-0"
        >
          <AvatarImage src={avatarUrl || ""} className="object-cover" referrerPolicy="no-referrer" />
          <AvatarFallback className="bg-neutral-950 text-white font-bold text-[10px] sm:text-xs">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </div>
    </nav>
  );
}
