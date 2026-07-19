"use client";

import { usePathname } from "next/navigation";
import { PillNavbar } from "./dashboard/PillNavbar";
import { useAuth } from "@/contexts/AuthContext";

export function GlobalNavbar({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  // Hide the floating command dock on auth routes, admin routes, and immersive pages
  const hiddenRoutes = ['/auth', '/banned', '/maintenance', '/admin', '/subadmin', '/exam', '/interview', '/code', '/debate', '/concept-graph'];
  const isHiddenRoute = !pathname || hiddenRoutes.some(route => pathname.startsWith(route));

  return (
    <>
      {!isHiddenRoute && (
        <PillNavbar 
          variant={profile?.role === 'mentor' ? 'mentor' : 'student'} 
          avatarUrl={profile?.photo_url || ""} 
          avatarFallback={user?.email?.[0]?.toUpperCase() || "U"} 
        />
      )}
      {children}
    </>
  );
}
