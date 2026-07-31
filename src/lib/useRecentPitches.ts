"use client";

import { useState, useEffect } from "react";
import type {
  SIHUserInput,
  SIHSlideContent,
  SIHRubricGrade,
} from "./sihPptGenerator";

export interface SavedSIHPitch {
  id: string;
  updatedAt: number;
  formData: SIHUserInput;
  generatedContent: SIHSlideContent | null;
  gradeResult: SIHRubricGrade | null;
}

const STORAGE_KEY = "sih_recent_pitches";
const MAX_PITCHES = 15;

export function useRecentPitches() {
  const [pitches, setPitches] = useState<SavedSIHPitch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPitches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent pitches", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePitch = (
    pitchData: Omit<SavedSIHPitch, "id" | "updatedAt"> & { id?: string }
  ): string => {
    const id = pitchData.id || crypto.randomUUID();
    const newPitch: SavedSIHPitch = {
      ...pitchData,
      id,
      updatedAt: Date.now(),
    };

    setPitches((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === id);
      let nextPitches;
      
      if (existingIndex >= 0) {
        nextPitches = [...prev];
        nextPitches[existingIndex] = newPitch;
      } else {
        nextPitches = [newPitch, ...prev];
      }

      // Sort by newest first and truncate
      nextPitches.sort((a, b) => b.updatedAt - a.updatedAt);
      if (nextPitches.length > MAX_PITCHES) {
        nextPitches = nextPitches.slice(0, MAX_PITCHES);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPitches));
      } catch (e) {
        console.error("Failed to save pitches to localStorage", e);
      }

      return nextPitches;
    });

    return id;
  };

  const deletePitch = (id: string) => {
    setPitches((prev) => {
      const nextPitches = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPitches));
      } catch (e) {
        console.error("Failed to save pitches after deletion", e);
      }
      return nextPitches;
    });
  };

  return { pitches, isLoaded, savePitch, deletePitch };
}
