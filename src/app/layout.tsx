import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalNavbar } from "@/components/GlobalNavbar";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#040404",
};

export const metadata: Metadata = {
  title: "Orbit — AI Tutor & Assessments",
  description: "Dynamic AI Learning & Adaptive Assessments Dashboard built for the Hackathon.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${font.className} bg-background text-foreground antialiased selection:bg-primary/20`}>
        <Providers>
          <GlobalNavbar>{children}</GlobalNavbar>
        </Providers>
      </body>
    </html>
  );
}
