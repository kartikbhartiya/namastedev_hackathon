"use client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <Button variant="ghost" size="icon" className="rounded-full relative">
      <Bell className="h-5 w-5 text-foreground/70" />
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
    </Button>
  );
}
