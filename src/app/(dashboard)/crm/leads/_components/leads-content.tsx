"use client";

import * as React from "react";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { LeadTable } from "./lead-table";
import { LeadForm } from "./lead-form";
import type { LeadRow } from "@/lib/dal/crm";

interface LeadsContentProps {
  leads: LeadRow[];
}

export function LeadsContent({ leads }: LeadsContentProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  return (
    <>
      {/* Create modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl">
            <LeadForm
              mode="create"
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      <PageHeader
        title="Leady"
        description={`${leads.length} leadów`}
        actions={
          <GlowButton variant="primary" onClick={() => setShowCreateForm(true)}>
            + Nowy lead
          </GlowButton>
        }
      />
      <GlassCard className="px-6 py-6">
        <LeadTable leads={leads} />
      </GlassCard>
    </>
  );
}
