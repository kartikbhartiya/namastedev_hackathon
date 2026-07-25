import type { Metadata } from "next";
import Auth from "@/screens/Auth";

export const metadata: Metadata = {
  title: "Sign In — Orbit",
  description: "Sign in or create your Orbit account to access AI tutoring, proctored exams, and more.",
};

export default function Page() {
  return (
      <Auth />
  );
}
