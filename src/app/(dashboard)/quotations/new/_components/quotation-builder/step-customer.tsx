"use client";

import { useState } from "react";
import type { PriceListRow } from "@/types/price-lists";

interface Props {
  priceLists: PriceListRow[];
  userPriceListId: number | null;
  onNext: (name: string, email: string, priceListId: number | null) => void;
}

export function StepCustomer({ priceLists, userPriceListId, onNext }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [priceListId, setPriceListId] = useState<number | null>(userPriceListId);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!name.trim()) {
      setError("Nazwa klienta jest wymagana");
      return;
    }
    setError("");
    onNext(name.trim(), email.trim(), priceListId);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h3 className="text-base font-semibold text-white/90">Dane klienta</h3>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Nazwa klienta <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-aether-blue/50 focus:outline-none"
            placeholder="Nazwa firmy lub imię klienta"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email klienta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-aether-blue/50 focus:outline-none"
            placeholder="klient@firma.pl"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cennik</label>
          <select
            value={priceListId ?? ""}
            onChange={(e) =>
              setPriceListId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-aether-blue/50 focus:outline-none"
          >
            <option value="">Bez cennika</option>
            {priceLists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-lg bg-aether-blue hover:bg-aether-blue/90 text-white text-sm font-medium transition-colors"
        >
          Dalej →
        </button>
      </div>
    </div>
  );
}
