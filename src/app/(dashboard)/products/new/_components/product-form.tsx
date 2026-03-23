"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createProductSchema, type CreateProductFormInput } from "@/lib/validations/products";
import { createProductAction } from "@/lib/actions/products";
import { GlassCard } from "@/components/aether/glass-card";
import { SubmitButton } from "@/components/aether/glow-button";
import type { ProductCategory, ProductGroup } from "@/types/products";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  categories: ProductCategory[];
  groups: ProductGroup[];
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass = cn(
  "w-full h-9 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function ProductForm({ categories, groups }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateProductFormInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      isActive: true,
      displayOrder: 0,
    },
  });

  async function onSubmit(data: CreateProductFormInput) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    });
    const result = await createProductAction({}, formData);
    setIsSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? "Produkt został utworzony");
      router.push("/products");
    }
  }

  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    const slug = getValues("slug");
    if (!slug) {
      setValue("slug", toSlug(e.target.value), { shouldValidate: false });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informacje podstawowe */}
      <GlassCard title="Informacje podstawowe">
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Nazwa *</label>
            <input
              {...register("name")}
              onBlur={handleNameBlur}
              type="text"
              placeholder="Nazwa produktu"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input
              {...register("slug")}
              type="text"
              placeholder="slug-produktu"
              className={inputClass}
            />
            {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
          </div>
          <div>
            <label className={labelClass}>SKU</label>
            <input
              {...register("sku")}
              type="text"
              placeholder="ABC-001"
              className={inputClass}
            />
            {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
          </div>
        </div>
      </GlassCard>

      {/* Opis */}
      <GlassCard title="Opis">
        <div className="px-6 pb-6">
          <label className={labelClass}>Opis produktu</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Opis produktu..."
            className={cn(inputClass, "h-auto resize-none py-2")}
          />
          {errors.description && <p className={errorClass}>{errors.description.message}</p>}
        </div>
      </GlassCard>

      {/* Klasyfikacja */}
      <GlassCard title="Klasyfikacja">
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Kategoria</label>
            <select
              {...register("categoryId", { setValueAs: (v) => v ? Number(v) : undefined })}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className={errorClass}>{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Grupa produktów</label>
            <select
              {...register("productGroupId", { setValueAs: (v) => v ? Number(v) : undefined })}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Wybierz grupę</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
            {errors.productGroupId && <p className={errorClass}>{errors.productGroupId.message}</p>}
          </div>
        </div>
      </GlassCard>

      {/* Cennik i parametry */}
      <GlassCard title="Cennik i parametry">
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cena zakupu (PLN)</label>
            <input
              {...register("price", { setValueAs: (v) => v ? Number(v) : undefined })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={inputClass}
            />
            {errors.price && <p className={errorClass}>{errors.price.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Rodzaj papieru</label>
            <input
              {...register("paperType")}
              type="text"
              placeholder="Kraft, Art, Offset..."
              className={inputClass}
            />
            {errors.paperType && <p className={errorClass}>{errors.paperType.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Gramatura (g/m²)</label>
            <input
              {...register("grammage", { setValueAs: (v) => v ? Number(v) : undefined })}
              type="number"
              min="0"
              placeholder="80"
              className={inputClass}
            />
            {errors.grammage && <p className={errorClass}>{errors.grammage.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Ilość w kartonie (szt.)</label>
            <input
              {...register("boxQuantity", { setValueAs: (v) => v ? Number(v) : undefined })}
              type="number"
              min="0"
              placeholder="100"
              className={inputClass}
            />
            {errors.boxQuantity && <p className={errorClass}>{errors.boxQuantity.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Ilość na palecie (szt.)</label>
            <input
              {...register("palletQuantity", { setValueAs: (v) => v ? Number(v) : undefined })}
              type="number"
              min="0"
              placeholder="1000"
              className={inputClass}
            />
            {errors.palletQuantity && <p className={errorClass}>{errors.palletQuantity.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Wymiary kartonu</label>
            <input
              {...register("boxDimensions")}
              type="text"
              placeholder="60x40x30 cm"
              className={inputClass}
            />
            {errors.boxDimensions && <p className={errorClass}>{errors.boxDimensions.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Waga kartonu (kg)</label>
            <input
              {...register("boxWeight", { setValueAs: (v) => v ? Number(v) : undefined })}
              type="number"
              step="0.01"
              min="0"
              placeholder="5.0"
              className={inputClass}
            />
            {errors.boxWeight && <p className={errorClass}>{errors.boxWeight.message}</p>}
          </div>
        </div>
      </GlassCard>

      {/* Ustawienia */}
      <GlassCard title="Ustawienia">
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              {...register("isActive")}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded border-aether-border bg-aether-elevated accent-aether-blue"
            />
            <label htmlFor="isActive" className="text-sm text-aether-text cursor-pointer">
              Produkt aktywny
            </label>
          </div>
          <div>
            <label className={labelClass}>Kolejność wyświetlania</label>
            <input
              {...register("displayOrder", { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
              className={inputClass}
            />
            {errors.displayOrder && <p className={errorClass}>{errors.displayOrder.message}</p>}
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <SubmitButton loading={isSubmitting}>
          Utwórz produkt
        </SubmitButton>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-4 text-sm bg-transparent text-aether-text border border-aether-border hover:border-aether-border-glow hover:shadow-glow-sm"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}
