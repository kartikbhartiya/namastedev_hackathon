"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PillNavbar } from "./dashboard/PillNavbar";
import { useAuth } from "@/contexts/AuthContext";

export function GlobalNavbar({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Route guard: Redirect unauthenticated users away from features
  useEffect(() => {
    if (!loading && !user && pathname) {
      const publicPaths = ['/', '/auth', '/maintenance', '/banned'];
      // If path is not exactly a public path, and it doesn't start with a public path (like /auth/login), lock it down.
      if (!publicPaths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p))) {
        router.push('/auth');
      }
    }
  }, [user, loading, pathname, router]);

  // Hide floating dock only on auth, admin, banned, and maintenance pages
  const hiddenRoutes = ['/auth', '/banned', '/maintenance', '/admin', '/subadmin', '/ai-tutor', '/interview'];
  const isHiddenRoute = !pathname || hiddenRoutes.some(route => pathname.startsWith(route));

  return (
    <div className="flex flex-col min-h-screen">
      {!isHiddenRoute && (
        <PillNavbar 
          variant={profile?.role === 'mentor' ? 'mentor' : 'student'} 
          avatarUrl={profile?.photo_url || ""} 
          avatarFallback={user?.email?.[0]?.toUpperCase() || "U"} 
          isAuthenticated={!!user}
        />
      )}
      <div className={!isHiddenRoute ? "pt-[72px] md:pt-[88px] flex-1 flex flex-col" : "flex-1 flex flex-col"}>
        {children}
      </div>
    </div>
  );
}
