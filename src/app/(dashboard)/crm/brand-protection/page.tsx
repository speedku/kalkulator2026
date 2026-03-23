import { requireAdmin } from "@/lib/dal/auth";
import { getBrandWatchItems } from "@/lib/dal/crm";
import { BrandProtectionContent } from "./_components/brand-protection-content";

export default async function BrandProtectionPage() {
  await requireAdmin();
  const items = await getBrandWatchItems();

  return <BrandProtectionContent items={items} />;
}
