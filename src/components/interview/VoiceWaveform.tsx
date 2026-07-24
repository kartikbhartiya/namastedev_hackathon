"use client";

import { useRef, useEffect, useCallback } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  className?: string;
}

/**
 * Canvas-based real-time audio waveform visualizer.
 * Shows animated bars when `isActive` is true. Uses the
 * Web Audio API AnalyserNode for real frequency data when
 * microphone access is available, falls back to procedural
 * animation otherwise.
 */
export function VoiceWaveform({
  isActive,
  color = "#10b981",
  barCount = 24,
  className = "",
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch {
      // Fallback to procedural animation
      analyserRef.current = null;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = Math.max(2, (width / barCount) * 0.6);
    const gap = (width - barWidth * barCount) / (barCount - 1);

    if (isActive && analyserRef.current) {
      // Real audio data
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor(i * (data.length / barCount));
        const value = data[dataIdx] / 255;
        const barHeight = Math.max(3, value * height * 0.9);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + value * 0.4;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
      }
    } else if (isActive) {
      // Procedural animation fallback
      const time = Date.now() / 100;
      for (let i = 0; i < barCount; i++) {
        const value = 0.3 + Math.sin(time + i * 0.5) * 0.3 + Math.sin(time * 1.5 + i) * 0.2;
        const barHeight = Math.max(3, value * height * 0.8);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5 + value * 0.5;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
      }
    } else {
      // Idle — flat lines
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const y = (height - 3) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, 3, 1);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, color, barCount]);

  useEffect(() => {
    if (isActive) {
      startAnalyser().then(() => {
        animationRef.current = requestAnimationFrame(draw);
      });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
      // Draw idle state once
      draw();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, startAnalyser, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={32}
      className={`${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
