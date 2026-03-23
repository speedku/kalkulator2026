import "server-only";
import { prisma } from "@/lib/db";
import { requireAuth } from "./auth";
import { logActivity } from "./activity-log";

export async function getNote() {
  const user = await requireAuth();

  return prisma.userNote.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      content: true,
      contentPlain: true,
      tags: true,
      wordCount: true,
      characterCount: true,
      updatedAt: true,
    },
  });
}

export async function saveNote(content: string, contentPlain: string) {
  const user = await requireAuth();

  // Extract hashtags from content plain text
  const tagMatches = contentPlain.match(/#(\w+)/g) ?? [];
  const tags = [...new Set(tagMatches.map((t) => t.slice(1).toLowerCase()))];

  const wordCount = contentPlain
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const characterCount = contentPlain.length;

  // Get current version number
  const existing = await prisma.userNote.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      versions: {
        select: { versionNumber: true },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  const nextVersion = (existing?.versions[0]?.versionNumber ?? 0) + 1;

  // Upsert the note
  const note = await prisma.userNote.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      content,
      contentPlain,
      tags: JSON.stringify(tags),
      wordCount,
      characterCount,
    },
    update: {
      content,
      contentPlain,
      tags: JSON.stringify(tags),
      wordCount,
      characterCount,
    },
    select: {
      id: true,
      wordCount: true,
      characterCount: true,
      updatedAt: true,
    },
  });

  // Create version snapshot
  await prisma.userNoteVersion.create({
    data: {
      noteId: note.id,
      userId: user.id,
      content,
      contentPlain,
      tags: JSON.stringify(tags),
      wordCount,
      characterCount,
      versionNumber: nextVersion,
    },
  });

  // Upsert tags
  for (const tag of tags) {
    await prisma.userNoteTag.upsert({
      where: { idx_user_tag: { userId: user.id, tagName: tag } },
      create: { userId: user.id, tagName: tag, usageCount: 1 },
      update: { usageCount: { increment: 1 } },
    });
  }

  await logActivity({
    activityType: "system",
    action: "update",
    description: `Użytkownik ${user.email} zapisał notatnik (wersja ${nextVersion})`,
    entityType: "user_note",
    entityId: note.id,
  }).catch(() => {});

  return note;
}

export async function getNoteVersions(page = 1, perPage = 20) {
  const user = await requireAuth();

  const skip = (page - 1) * perPage;

  const [versions, total] = await Promise.all([
    prisma.userNoteVersion.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        versionNumber: true,
        contentPlain: true,
        wordCount: true,
        characterCount: true,
        createdAt: true,
      },
      orderBy: { versionNumber: "desc" },
      skip,
      take: perPage,
    }),
    prisma.userNoteVersion.count({ where: { userId: user.id } }),
  ]);

  return { versions, total, page, perPage };
}
