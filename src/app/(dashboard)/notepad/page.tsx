import { requireAuth } from "@/lib/dal/auth";
import { getNote } from "@/lib/dal/notepad";
import { PageHeader } from "@/components/aether/page-header";
import { NotepadEditor } from "./_components/notepad-editor";

export const dynamic = "force-dynamic";

export default async function NotepadPage() {
  await requireAuth();

  const note = await getNote();

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <PageHeader
        title="Notatnik"
        description="Twój prywatny notatnik — zapisuje się automatycznie"
      />
      <NotepadEditor
        initialContent={note?.content ?? ""}
        initialWordCount={note?.wordCount ?? 0}
        initialCharCount={note?.characterCount ?? 0}
      />
    </div>
  );
}
