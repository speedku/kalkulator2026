import { requireAdmin } from "@/lib/dal/auth";
import { getAccessCodes } from "@/lib/dal/access-codes";
import { PageHeader } from "@/components/aether/page-header";
import { AccessCodesTable } from "./_components/access-codes-table";
import { CreateAccessCodeDialog } from "./_components/create-access-code-dialog";

export const dynamic = "force-dynamic";

interface AccessCodesPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AccessCodesPage({
  searchParams,
}: AccessCodesPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const search = params.search ?? "";

  const { codes, total, perPage } = await getAccessCodes({
    page,
    perPage: 20,
    search: search || undefined,
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Kody dostępu"
        description="Zarządzaj kodami rejestracyjnymi dla nowych użytkowników"
        actions={<CreateAccessCodeDialog />}
      />

      <AccessCodesTable
        codes={codes}
        total={total}
        page={page}
        perPage={perPage}
        search={search}
      />
    </div>
  );
}
