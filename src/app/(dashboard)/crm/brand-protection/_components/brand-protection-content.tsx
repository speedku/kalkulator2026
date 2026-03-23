"use client";

import * as React from "react";
import { PageHeader } from "@/components/aether/page-header";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { BrandWatchTable } from "./brand-watch-table";
import { BrandWatchForm } from "./brand-watch-form";
import type { BrandWatchRow } from "@/lib/dal/crm";

interface BrandProtectionContentProps {
  items: BrandWatchRow[];
}

export function BrandProtectionContent({ items }: BrandProtectionContentProps) {
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Create modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl">
            <BrandWatchForm
              mode="create"
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      <PageHeader
        title="Ochrona marki"
        description={`${items.length} pozycji w monitoringu`}
        actions={
          <GlowButton variant="primary" onClick={() => setShowCreateForm(true)}>
            + Dodaj pozycję
          </GlowButton>
        }
      />
      <GlassCard className="px-6 py-6">
        <BrandWatchTable items={items} />
      </GlassCard>
    </div>
  );
}
