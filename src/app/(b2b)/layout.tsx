import { requireAuth } from "@/lib/dal/auth";

export default async function B2BLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // B2B portal uses requireAuth() (not requireAdmin) — B2B users are regular
  // users with priceListId assigned; admins can also access the portal.
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-wide">ALLBAG B2B Portal</span>
        </div>
        <span className="text-sm text-gray-400">
          {user.name ?? user.email}
        </span>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
