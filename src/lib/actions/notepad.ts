"use server";

import { revalidatePath } from "next/cache";
import { saveNote, getNoteVersions } from "@/lib/dal/notepad";

export type ActionState = {
  success?: boolean;
  error?: string;
};

export async function getNoteVersionsAction(page = 1, perPage = 20) {
  return getNoteVersions(page, perPage);
}

export async function saveNoteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const content = formData.get("content");
  const contentPlain = formData.get("contentPlain");

  if (!content || typeof content !== "string") {
    return { error: "Treść notatki jest wymagana" };
  }

  if (!contentPlain || typeof contentPlain !== "string") {
    return { error: "Zwykły tekst notatki jest wymagany" };
  }

  try {
    await saveNote(content, contentPlain);
    revalidatePath("/notepad");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd podczas zapisywania",
    };
  }
}
