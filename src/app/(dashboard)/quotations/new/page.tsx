import { requireAuth } from "@/lib/dal/auth";
import { getPriceLists, getUserPriceList } from "@/lib/dal/price-lists";
import { getProductsForBuilder } from "@/lib/dal/products";
import { auth } from "@/auth";
import { QuotationBuilder } from "./_components/quotation-builder";

export default async function NewQuotationPage() {
  await requireAuth();
  const session = await auth();
  const [priceLists, products] = await Promise.all([
    getPriceLists(),
    getProductsForBuilder(),
  ]);
  const userPriceList = session?.user?.id
    ? await getUserPriceList(Number(session.user.id))
    : null;

  return (
    <QuotationBuilder
      priceLists={priceLists}
      products={products}
      userPriceList={userPriceList}
    />
  );
}
