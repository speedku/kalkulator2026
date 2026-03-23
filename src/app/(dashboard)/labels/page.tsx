import { requireAdmin } from "@/lib/dal/auth";
import { LabelsClient } from "./_components/labels-client";

export default async function LabelsPage() {
  await requireAdmin();
  return <LabelsClient />;
}
