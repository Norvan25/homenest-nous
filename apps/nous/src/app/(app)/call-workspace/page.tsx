'use client';

import { CallWorkspace } from '@/components/call-workspace';

export default function CallWorkspacePage() {
  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Call Workspace</h1>
        <p className="text-white/60">Manage and execute AI calling campaigns</p>
      </div>
      <CallWorkspace />
    </div>
  );
}
