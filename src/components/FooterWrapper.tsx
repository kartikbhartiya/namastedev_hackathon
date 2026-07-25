"use client";

import { usePathname } from "next/navigation";
import { GlobalFooter } from "./GlobalFooter";

export function FooterWrapper() {
  const pathname = usePathname();

  // Hide footer on fullscreen/interactive apps
  const hideFooterRoutes = [
    "/ai-tutor",
    "/interview",
    "/concept-graph",
    "/auth", // Auth has its own layout
  ];

  const shouldHide = hideFooterRoutes.some(route => pathname?.startsWith(route));

  if (shouldHide) return null;

  return <GlobalFooter />;
}
