"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { toast } from "sonner";
import type { CartItem } from "@/types/quotations";
import type { PriceListRow, PriceListWithMargins } from "@/types/price-lists";
import type { BuilderProduct } from "@/lib/dal/products";
import { createQuotationAction } from "@/lib/actions/quotations";
import { GlassCard } from "@/components/aether/glass-card";
import { PageHeader } from "@/components/aether/page-header";
import { StepCustomer } from "./step-customer";
import { StepProducts } from "./step-products";
import { StepSummary } from "./step-summary";

// ─── Store ────────────────────────────────────────────────────────────────────

interface BuilderStore {
  step: number;
  customerName: string;
  customerEmail: string;
  selectedPriceListId: number | null;
  notes: string;
  cart: CartItem[];
  setStep: (s: number) => void;
  setCustomer: (name: string, email: string, priceListId: number | null) => void;
  setNotes: (n: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
}

// Page-scoped store — prevents state leaking between navigations (Phase 3 pattern)
function createBuilderStore() {
  return create<BuilderStore>((set) => ({
    step: 1,
    customerName: "",
    customerEmail: "",
    selectedPriceListId: null,
    notes: "",
    cart: [],
    setStep: (step) => set({ step }),
    setCustomer: (customerName, customerEmail, selectedPriceListId) =>
      set({ customerName, customerEmail, selectedPriceListId }),
    setNotes: (notes) => set({ notes }),
    addItem: (item) =>
      set((s) => ({
        cart: s.cart.some((c) => c.productId === item.productId)
          ? s.cart.map((c) =>
              c.productId === item.productId
                ? {
                    ...c,
                    quantity: c.quantity + 1,
                    totalPrice: (c.quantity + 1) * c.unitPrice,
                  }
                : c
            )
          : [...s.cart, item],
      })),
    removeItem: (productId) =>
      set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
    updateQuantity: (productId, qty) =>
      set((s) => ({
        cart: s.cart.map((c) =>
          c.productId === productId
            ? { ...c, quantity: qty, totalPrice: qty * c.unitPrice }
            : c
        ),
      })),
    clearCart: () =>
      set({
        cart: [],
        step: 1,
        customerName: "",
        customerEmail: "",
        selectedPriceListId: null,
        notes: "",
      }),
  }));
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  priceLists: PriceListRow[];
  products: BuilderProduct[];
  userPriceList: PriceListWithMargins | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuotationBuilder({ priceLists, products, userPriceList }: Props) {
  // Page-scoped Zustand store via useRef guard (same pattern as MarginMatrixEditor)
  const storeRef = useRef<ReturnType<typeof createBuilderStore> | null>(null);
  if (storeRef.current === null) storeRef.current = createBuilderStore();
  const store = storeRef.current;

  const step = store((s) => s.step);
  const cart = store((s) => s.cart);
  const customerName = store((s) => s.customerName);
  const customerEmail = store((s) => s.customerEmail);
  const selectedPriceListId = store((s) => s.selectedPriceListId);
  const notes = store((s) => s.notes);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("customerName", customerName);
      formData.set("customerEmail", customerEmail);
      if (selectedPriceListId) formData.set("priceListId", String(selectedPriceListId));
      formData.set("notes", notes);
      formData.set(
        "items",
        JSON.stringify(
          cart.map((c) => ({
            productId: c.productId,
            productName: c.productName,
            sku: c.sku,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            totalPrice: c.totalPrice,
          }))
        )
      );

      const result = await createQuotationAction({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Wycena utworzona");
        store.getState().clearCart();
        router.push(`/quotations/${result.quotationId}`);
      }
    });
  };

  const STEPS = [
    { label: "1. Klient", num: 1 },
    { label: "2. Produkty", num: 2 },
    { label: "3. Podsumowanie", num: 3 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Nowa wycena" description="Kreator wyceny krok po kroku" />

      {/* Step indicator */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              s.num === step
                ? "bg-aether-blue/20 text-aether-blue border border-aether-blue/40"
                : s.num < step
                ? "bg-white/5 text-green-400 border border-green-500/30"
                : "bg-white/5 text-gray-500 border border-white/10"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      <GlassCard>
        <div className="px-6 py-6">
          {step === 1 && (
            <StepCustomer
              priceLists={priceLists}
              userPriceListId={userPriceList?.id ?? null}
              onNext={(name, email, plId) => {
                store.getState().setCustomer(name, email, plId);
                store.getState().setStep(2);
              }}
            />
          )}
          {step === 2 && (
            <StepProducts
              products={products}
              userPriceList={userPriceList}
              selectedPriceListId={selectedPriceListId}
              cart={cart}
              onAdd={store.getState().addItem}
              onRemove={store.getState().removeItem}
              onUpdateQty={store.getState().updateQuantity}
              onBack={() => store.getState().setStep(1)}
              onNext={() => store.getState().setStep(3)}
            />
          )}
          {step === 3 && (
            <StepSummary
              customerName={customerName}
              customerEmail={customerEmail}
              cart={cart}
              notes={notes}
              onNotesChange={store.getState().setNotes}
              onBack={() => store.getState().setStep(2)}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
            />
          )}
        </div>
      </GlassCard>
    </div>
  );
}
