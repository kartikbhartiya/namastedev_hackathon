import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/index.css";
import { Providers } from "./providers";
import { GlobalNavbar } from "@/components/GlobalNavbar";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orbit — AI Tutor & Assessments",
  description: "Dynamic AI Learning & Adaptive Assessments Dashboard built for the Hackathon.",
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
