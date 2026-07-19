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
  { id: "concept-graph", label: "Concept Graph", icon: Network, href: "/concept-graph" },
  { id: "debate", label: "Debate Arena", icon: Swords, href: "/debate" },
  { id: "code", label: "Code Tracer", icon: Code2, href: "/code" },
  { id: "exam", label: "Exam Hall", icon: ShieldCheck, href: "/exam" },
  { id: "interview", label: "AI Interview", icon: ShieldAlert, href: "/interview" },
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
    <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <div className="mac-command-dock pointer-events-auto flex items-center gap-4 rounded-full px-5 py-2.5 transition-all duration-300">
        
        {/* Core Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors group relative shrink-0"
        >
          <EclixLogo className="h-5 w-5 text-white transition-transform duration-200 group-hover:scale-105" />
          
          {/* macOS Dock Tooltip */}
          <span className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 bg-neutral-950 border border-white/5 text-[10px] font-bold text-white px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-2xl tracking-wider">
            ORBIT
          </span>
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-white/10 shrink-0" />

        {/* Middle Navigation Group */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="relative p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-150 group flex flex-col items-center hover:scale-105 shrink-0 focus:outline-none"
              >
                <Icon className={cn("h-[20px] w-[20px] transition-transform duration-150", isActive && "text-[#ff6c37]")} />
                
                {/* Active Indicator underneath */}
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#ff6c37] shadow-[0_0_10px_#ff6c37]" />
                )}

                {/* Tooltip Label */}
                <span className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 bg-neutral-950 border border-white/5 text-[10px] font-bold text-white px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-2xl tracking-wider">
                  {item.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-white/10 shrink-0" />

        {/* Profile Avatar */}
        <div className="relative group shrink-0">
          <Avatar
            onClick={() => router.push("/profile")}
            className="cursor-pointer h-8 w-8 border border-white/10 hover:border-white/20 transition-all hover:scale-105"
          >
            <AvatarImage src={avatarUrl || ""} className="object-cover" referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-neutral-950 text-white font-bold text-xs">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          
          <span className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 bg-neutral-950 border border-white/5 text-[10px] font-bold text-white px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-2xl tracking-wider">
            SETTINGS
          </span>
        </div>

      </div>
    </nav>
  );
}
