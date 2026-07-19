import type { Metadata } from "next";
import Auth from "@/screens/Auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create your free Eclix account to start studying smarter.",
};

export default function Page() {
  return (
      <Auth />
  );
}
