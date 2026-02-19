"use client";

import CompanySettings from "@/components/settings/CompanySettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-slate-500">
          Manage your company profile and AI preferences
        </p>
      </div>
      <CompanySettings />
    </div>
  );
}
