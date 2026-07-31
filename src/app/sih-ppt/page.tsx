"use client";

import { useState } from "react";
import { SIHWorkspace } from "@/components/sih-ppt/SIHWorkspace";
import { SIHPptMaker } from "@/screens/SIHPptMaker";
import type { SavedSIHPitch } from "@/lib/useRecentPitches";

export default function SIHPptPage() {
  const [view, setView] = useState<"workspace" | "maker">("workspace");
  const [selectedPitch, setSelectedPitch] = useState<SavedSIHPitch | null>(null);

  const handleCreateNew = () => {
    setSelectedPitch(null);
    setView("maker");
  };

  const handleOpenPitch = (pitch: SavedSIHPitch) => {
    setSelectedPitch(pitch);
    setView("maker");
  };

  const handleBackToWorkspace = () => {
    setSelectedPitch(null);
    setView("workspace");
  };

  if (view === "workspace") {
    return (
      <SIHWorkspace
        onCreateNew={handleCreateNew}
        onOpenPitch={handleOpenPitch}
      />
    );
  }

  return (
    <SIHPptMaker 
      key={selectedPitch?.id || "new"} 
      initialData={selectedPitch} 
      onBackToWorkspace={handleBackToWorkspace} 
    />
  );
}
