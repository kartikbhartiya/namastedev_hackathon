"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileSettingsPage() {
  const { user, profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10 select-none">
      {/* Page Header */}
      <div>
        <span className="text-[13px] font-semibold uppercase tracking-widest text-[#707070] mb-2 block">
          Settings
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Account Profile
        </h1>
        <p className="text-[#9B9B9B] text-[15px] mt-2">
          Manage your student profile preferences and auth credentials.
        </p>
      </div>

      <hr className="border-white/5" />

      {/* Profile Overview Card */}
      <div className="flex items-center gap-6 p-6 rounded-xl bg-[#101010] border border-white/5">
        <Avatar className="h-16 w-16 border border-white/15">
          <AvatarImage src={profile?.photo_url || ""} className="object-cover" referrerPolicy="no-referrer" />
          <AvatarFallback className="bg-neutral-800 text-white font-bold text-lg">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-[18px] font-semibold text-white">
            {profile?.name || "Student Scholar"}
          </h2>
          <span className="text-[13px] text-[#9B9B9B] block mt-0.5">
            {user?.email || "scholar@orbit.com"}
          </span>
          <span className="inline-block text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mt-2 capitalize">
            {profile?.role || "student"}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-6">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-[#707070]">
          Profile Analytics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-lg bg-[#101010] border border-white/5">
            <span className="text-[13px] text-[#9B9B9B] block">Current Streak</span>
            <span className="text-[24px] font-bold text-white block mt-1">
              {profile?.study_streak || 0} days
            </span>
          </div>

          <div className="p-5 rounded-lg bg-[#101010] border border-white/5">
            <span className="text-[13px] text-[#9B9B9B] block">Accumulated Experience</span>
            <span className="text-[24px] font-bold text-white block mt-1">
              {profile?.xp || 0} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
