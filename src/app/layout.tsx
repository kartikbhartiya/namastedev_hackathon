import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/index.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eclix — AI Tutor & Assessments",
  description: "Dynamic AI Learning & Adaptive Assessments Dashboard built for the Hackathon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased selection:bg-neutral-500/20`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
