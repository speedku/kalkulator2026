"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Minus,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { saveNoteAction, getNoteVersionsAction } from "@/lib/actions/notepad";
import { cn } from "@/lib/utils";

interface NotepadEditorProps {
  initialContent: string;
  initialWordCount: number;
  initialCharCount: number;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "idle";

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-aether-blue/20 text-aether-blue"
          : "text-aether-text-secondary hover:text-aether-text hover:bg-aether-elevated"
      )}
    >
      {children}
    </button>
  );
}

export function NotepadEditor({
  initialContent,
  initialWordCount,
  initialCharCount,
}: NotepadEditorProps) {
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [wordCount, setWordCount] = React.useState(initialWordCount);
  const [charCount, setCharCount] = React.useState(initialCharCount);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<
    Array<{
      id: number;
      versionNumber: number;
      contentPlain: string | null;
      wordCount: number;
      characterCount: number;
      createdAt: Date;
    }>
  >([]);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Zacznij pisać swoją notatkę... Użyj #tagi by kategoryzować",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] text-aether-text leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
      setWordCount(words.length);
      setCharCount(text.length);
      setSaveStatus("unsaved");

      // Debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        const content = editor.getHTML();
        const contentPlain = editor.getText();
        const fd = new FormData();
        fd.set("content", content);
        fd.set("contentPlain", contentPlain);
        const result = await saveNoteAction({}, fd);
        setSaveStatus(result.success ? "saved" : "unsaved");
      }, 2000);
    },
  });

  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  async function loadHistory() {
    const { versions: v } = await getNoteVersionsAction(1, 20);
    setVersions(v);
    setHistoryOpen(true);
  }

  function previewVersion(content: string | null) {
    if (!content || !editor) return;
    editor.commands.setContent(content);
  }

  const saveIndicatorClass = {
    idle: "text-aether-text-muted",
    saved: "text-aether-emerald",
    saving: "text-aether-cyan animate-pulse",
    unsaved: "text-amber-400",
  }[saveStatus];

  const saveIndicatorText = {
    idle: "",
    saved: "Zapisano",
    saving: "Zapisywanie...",
    unsaved: "Niezapisane zmiany",
  }[saveStatus];

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex-1 rounded-xl border border-aether-border bg-aether-surface backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-aether-border bg-aether-elevated/50">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
            title="Pogrubienie (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
            title="Kursywa (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-aether-border mx-1" />
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor?.isActive("heading", { level: 1 })}
            title="Nagłówek H1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor?.isActive("heading", { level: 2 })}
            title="Nagłówek H2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-aether-border mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList")}
            title="Lista punktowana"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList")}
            title="Lista numerowana"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-aether-border mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            active={editor?.isActive("code")}
            title="Inline kod"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Linia pozioma"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 overflow-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-aether-border bg-aether-elevated/30 text-xs">
          <div className="flex items-center gap-4 text-aether-text-muted">
            <span>{wordCount} słów</span>
            <span>{charCount} znaków</span>
          </div>
          <div className="flex items-center gap-3">
            {saveIndicatorText && (
              <span className={cn("text-xs", saveIndicatorClass)}>
                {saveIndicatorText}
              </span>
            )}
            <button
              onClick={historyOpen ? () => setHistoryOpen(false) : loadHistory}
              className="flex items-center gap-1 text-aether-text-muted hover:text-aether-text transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Historia
              {historyOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Version history panel */}
      {historyOpen && (
        <div className="rounded-xl border border-aether-border bg-aether-surface backdrop-blur-xl p-4">
          <h3 className="text-sm font-semibold text-aether-text mb-3">
            Historia wersji
          </h3>
          {versions.length === 0 ? (
            <p className="text-sm text-aether-text-muted">Brak zapisanych wersji</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-aether-elevated hover:bg-aether-elevated/80 transition-colors"
                >
                  <div>
                    <span className="text-xs font-mono text-aether-blue">
                      v{v.versionNumber}
                    </span>
                    <span className="text-xs text-aether-text-muted ml-2">
                      {new Date(v.createdAt).toLocaleString("pl-PL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="text-xs text-aether-text-muted ml-2">
                      {v.wordCount} słów
                    </span>
                  </div>
                  <button
                    onClick={() => previewVersion(v.contentPlain)}
                    className="text-xs text-aether-cyan hover:text-aether-text transition-colors"
                  >
                    Podgląd
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
