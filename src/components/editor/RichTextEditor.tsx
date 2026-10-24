import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useState } from "react";
import { MediaPicker } from "./MediaPicker";
import { sanitizeHtml, renderableContent } from "@/lib/html";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Link2, Table as TableIcon,
  ImagePlus, Undo2, Redo2, Rows3, Columns3, Trash2, Minus,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  dir?: "rtl" | "ltr";
  placeholder?: string;
};

function Btn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`h-8 min-w-8 px-2 rounded-md text-xs inline-flex items-center justify-center border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const inTable = editor.isActive("table");
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-muted/40 sticky top-0 z-10">
      {[2, 3, 4].map((l) => (
        <Btn key={l} title={`Heading ${l}`} active={editor.isActive("heading", { level: l })}
          onClick={() => editor.chain().focus().toggleHeading({ level: l as 2 | 3 | 4 }).run()}>H{l}</Btn>
      ))}
      <Btn title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>P</Btn>
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-3.5 w-3.5" /></Btn>
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></Btn>
      <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-3.5 w-3.5" /></Btn>
      <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-3.5 w-3.5" /></Btn>
      <Btn title="Insert image" onClick={onImage}><ImagePlus className="h-3.5 w-3.5" /></Btn>
      {inTable && (
        <>
          <span className="w-px bg-border mx-1" />
          <Btn title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 className="h-3.5 w-3.5" />+</Btn>
          <Btn title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}><Rows3 className="h-3.5 w-3.5" />−</Btn>
          <Btn title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 className="h-3.5 w-3.5" />+</Btn>
          <Btn title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}><Columns3 className="h-3.5 w-3.5" />−</Btn>
          <Btn title="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>TH</Btn>
          <Btn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 className="h-3.5 w-3.5" /></Btn>
        </>
      )}
      <span className="w-px bg-border mx-1" />
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-3.5 w-3.5" /></Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-3.5 w-3.5" /></Btn>
    </div>
  );
}

export function RichTextEditor({ value, onChange, dir = "ltr", placeholder }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // heading levels start at H2 — the post title is the single H1.
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http", "https", "mailto", "tel"] }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
    ],
    content: renderableContent(value),
    editorProps: {
      attributes: {
        dir,
        class: "article-content focus:outline-none min-h-[320px] px-4 py-4",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
      // Clean pasted Word / Google Docs / web HTML but keep the structure.
      transformPastedHTML: (html) => sanitizeHtml(html.replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")),
    },
    onUpdate: ({ editor: e }) => onChange(sanitizeHtml(e.getHTML())),
  });

  // Keep editor in sync when switching between posts / locales.
  useEffect(() => {
    if (!editor) return;
    const next = renderableContent(value);
    if (next !== editor.getHTML()) editor.commands.setContent(next, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, dir]);

  useEffect(() => {
    if (editor) editor.setOptions({ editorProps: { ...editor.options.editorProps, attributes: { ...(editor.options.editorProps.attributes as any), dir } } });
  }, [editor, dir]);

  if (!editor) return <div className="rounded-lg border border-border min-h-[380px] bg-muted/20" />;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-background">
      <Toolbar editor={editor} onImage={() => setPickerOpen(true)} />
      <div className="max-h-[60vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(m) => {
          const alt = dir === "rtl" ? (m.altAr || m.altEn) : (m.altEn || m.altAr);
          editor.chain().focus().setImage({ src: m.url, alt, title: m.caption || undefined }).run();
          if (m.caption) editor.chain().focus().createParagraphNear().insertContent(`<p><em>${m.caption}</em></p>`).run();
        }}
      />
      <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground flex justify-between">
        <span>H1 is reserved for the post title — use H2/H3/H4 inside the content.</span>
        <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} chars</span>
      </div>
    </div>
  );
}
