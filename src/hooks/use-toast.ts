"use client";

import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === "destructive") {
        sonnerToast.error(title || description, {
          description: title && description ? description : undefined,
        });
      } else {
        sonnerToast.success(title || description, {
          description: title && description ? description : undefined,
        });
      }
    },
  };
};
