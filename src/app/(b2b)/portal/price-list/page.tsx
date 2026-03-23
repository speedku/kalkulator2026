import { requireAuth } from "@/lib/dal/auth";
import { getUserPriceList, calculateSalePrice } from "@/lib/dal/price-lists";
import { getProductsForBuilder } from "@/lib/dal/products";

function formatPLN(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function B2BPriceListPage() {
  const user = await requireAuth();

  const priceList = await getUserPriceList(user.id);

  if (!priceList) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center">
        <p className="text-lg text-gray-300">
          Nie masz przypisanego cennika.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Skontaktuj się z administratorem w celu przypisania cennika do Twojego konta.
        </p>
      </div>
    );
  }

  // Build margin lookup: productGroupId → marginPercent
  const marginMap = new Map<number, number>(
    priceList.margins.map((m) => [m.productGroupId, m.marginPercent])
  );

  // Get all active products with group info
  const allProducts = await getProductsForBuilder();

  // Filter products that have a group with a margin in this price list
  // and have a non-null purchase price > 0
  const priceListProducts = allProducts
    .filter((p) => {
      if (!p.productGroupId) return false;
      if (!marginMap.has(p.productGroupId)) return false;
      if (!p.purchasePrice || p.purchasePrice <= 0) return false;
      return true;
    })
    .map((p) => {
      const marginPercent = marginMap.get(p.productGroupId!)!;
      let salePrice: number | null = null;
      try {
        salePrice = calculateSalePrice(p.purchasePrice!, marginPercent);
      } catch {
        salePrice = null;
      }
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        productGroupId: p.productGroupId,
        salePrice,
      };
    })
    .filter((p) => p.salePrice !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Twój cennik</h1>
        <p className="mt-1 text-sm text-gray-400">
          {priceList.name}
          {priceList.description && ` — ${priceList.description}`}
        </p>
      </div>

      {priceListProducts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center">
          <p className="text-gray-400">Cennik jest pusty.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Nazwa produktu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                    Cena sprzedaży
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceListProducts.map((product, i) => (
                  <tr
                    key={product.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                      i % 2 === 0 ? "" : "bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3 text-white">{product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {product.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {product.salePrice !== null
                        ? formatPLN(product.salePrice)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-gray-500 border-t border-white/10">
            {priceListProducts.length} produktów w cenniku
          </div>
        </div>
      )}
    </div>
  );
}
