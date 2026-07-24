"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Network, Play, RotateCcw, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Packet {
  step: number;
  direction: "client-to-server" | "server-to-client";
  flag: string;
  seq: number;
  ack: number;
  label: string;
}

export function TcpHandshakeSim() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [clientSeq, setClientSeq] = useState<number>(100);
  const [serverSeq, setServerSeq] = useState<number>(300);

  const steps: Packet[] = [
    {
      step: 1,
      direction: "client-to-server",
      flag: "SYN",
      seq: clientSeq,
      ack: 0,
      label: `SYN (Synchronize Sequence Number: ${clientSeq})`,
    },
    {
      step: 2,
      direction: "server-to-client",
      flag: "SYN-ACK",
      seq: serverSeq,
      ack: clientSeq + 1,
      label: `SYN-ACK (Server Seq: ${serverSeq}, Ack: ${clientSeq + 1})`,
    },
    {
      step: 3,
      direction: "client-to-server",
      flag: "ACK",
      seq: clientSeq + 1,
      ack: serverSeq + 1,
      label: `ACK (Client Ack: ${serverSeq + 1}) — Connection Established!`,
    },
  ];

  const handleNextStep = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setClientSeq(Math.floor(100 + Math.random() * 800));
    setServerSeq(Math.floor(1000 + Math.random() * 8000));
  };

  return (
    <div className="p-5 bg-neutral-900/90 border border-white/10 rounded-2xl space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" /> TCP 3-Way Handshake Simulator
          </h3>
          <p className="text-xs text-neutral-400">Computer Networks — SYN, SYN-ACK, ACK connection establishment packet flow</p>
        </div>
        <Button onClick={handleReset} variant="outline" size="sm" className="h-8 border-white/10 text-xs text-neutral-300">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> New Handshake
        </Button>
      </div>

      {/* Control Stepper */}
      <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(stepNum => (
            <div
              key={stepNum}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                activeStep >= stepNum ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-neutral-600"
              )}
            >
              Step {stepNum}: {stepNum === 1 ? "SYN" : stepNum === 2 ? "SYN-ACK" : "ACK"}
            </div>
          ))}
        </div>

        <Button
          onClick={handleNextStep}
          disabled={activeStep >= 3}
          className="h-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs gap-1 rounded-lg"
        >
          <Play className="w-3.5 h-3.5" /> {activeStep === 0 ? "Send SYN" : activeStep === 1 ? "Send SYN-ACK" : activeStep === 2 ? "Send ACK" : "Established"}
        </Button>
      </div>

      {/* Network Topology Stage */}
      <div className="relative p-6 bg-neutral-950 rounded-xl border border-white/5 min-h-[220px] flex items-center justify-between">
        {/* Client Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-lg">
            💻
          </div>
          <span className="text-xs font-bold text-white">Client</span>
          <span className="text-[10px] font-mono text-neutral-500">ISN: {clientSeq}</span>
        </div>

        {/* Packet Transmission Line */}
        <div className="flex-1 mx-8 relative h-32 flex flex-col justify-center">
          <div className="w-full h-px border-b-2 border-dashed border-white/10" />

          {/* Animated Packets */}
          {steps.map((packet) => {
            if (activeStep < packet.step) return null;
            const isClientToServer = packet.direction === "client-to-server";

            return (
              <div
                key={packet.step}
                className={cn(
                  "absolute left-0 right-0 p-2.5 rounded-xl border text-xs font-mono font-bold transition-all duration-700 animate-in fade-in slide-in-from-left-4 flex items-center justify-between shadow-xl",
                  packet.step === 1 ? "top-2 bg-cyan-500/20 border-cyan-500/40 text-cyan-300" :
                  packet.step === 2 ? "top-12 bg-amber-500/20 border-amber-500/40 text-amber-300" :
                  "bottom-2 bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                )}
              >
                <span>{isClientToServer ? "Client ➔ Server" : "Server ➔ Client"}</span>
                <span className="bg-black/40 px-2 py-0.5 rounded text-[10px]">{packet.flag}</span>
                <span className="text-[10px] text-neutral-300">Seq={packet.seq} | Ack={packet.ack}</span>
              </div>
            );
          })}
        </div>

        {/* Server Node */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-lg">
            🖥️
          </div>
          <span className="text-xs font-bold text-white">Server</span>
          <span className="text-[10px] font-mono text-neutral-500">ISN: {serverSeq}</span>
        </div>
      </div>

      {/* Connection Status Banner */}
      {activeStep === 3 && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>TCP Connection ESTABLISHED! Reliable bi-directional stream open.</span>
        </div>
      )}
    </div>
  );
}
