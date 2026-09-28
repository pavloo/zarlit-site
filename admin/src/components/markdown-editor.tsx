import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react'
import { useState } from 'react'
import { Markdown } from 'tiptap-markdown'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (markdown: string) => void
}

/*
  tiptap-markdown adds `markdown` to the editor's storage at runtime, but its
  type augmentation does not reach TipTap 3's `Storage` interface, so the
  accessor is typed here instead of asserting at each call site.
*/
interface MarkdownStorage {
  getMarkdown: () => string
}

const getMarkdown = (instance: Editor): string =>
  (instance.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown()

/*
  Lesson bodies are stored as Markdown, so the editor's job is to hide that,
  not to replace it. Everything here round-trips through tiptap-markdown: what
  is typed becomes Markdown on every keystroke, and the raw view below shows
  exactly what will be written to the file.
*/

const extensions = [
  StarterKit.configure({
    // The lesson title is the page's h1, so a body heading starts at h2.
    heading: { levels: [2, 3] },
    // Not worth the toolbar space for lesson material, and both round-trip
    // poorly into the site's own typography.
    codeBlock: false,
    horizontalRule: false,
  }),
  Markdown.configure({
    // The site renders Markdown with html:false, which escapes raw HTML rather
    // than passing it through. Emitting HTML here would surface as visible
    // tags on the page, so the editor must not produce any.
    html: false,
    linkify: false,
    breaks: false,
    transformPastedText: true,
  }),
]

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'hover:bg-accent rounded p-1.5 disabled:opacity-40',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkValue, setLinkValue] = useState<string | null>(null)

  const applyLink = () => {
    const url = linkValue?.trim()
    setLinkValue(null)
    if (!url) return

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
  }

  return (
    <div className="bg-muted/40 space-y-2 border-b p-1.5">
      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarButton
          label="Жирний"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Курсив"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>

        <span className="bg-border mx-1 h-5 w-px" />

        <ToolbarButton
          label="Заголовок"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <span className="px-1 text-sm font-semibold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          label="Підзаголовок"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <span className="px-1 text-sm font-semibold">H3</span>
        </ToolbarButton>

        <span className="bg-border mx-1 h-5 w-px" />

        <ToolbarButton
          label="Маркований список"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Нумерований список"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Цитата"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>

        <span className="bg-border mx-1 h-5 w-px" />

        <ToolbarButton
          label="Посилання"
          active={editor.isActive('link')}
          onClick={() =>
            setLinkValue(
              linkValue === null
                ? ((editor.getAttributes('link').href as string) ?? '')
                : null,
            )
          }
        >
          <Link2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Прибрати посилання"
          disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="size-4" />
        </ToolbarButton>

        <span className="ml-auto" />

        <ToolbarButton
          label="Скасувати"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Повторити"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      {linkValue !== null && (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={linkValue}
            placeholder="https://…"
            className="h-8"
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
              if (event.key === 'Escape') setLinkValue(null)
            }}
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Додати
          </Button>
        </div>
      )}
    </div>
  )
}

export function MarkdownEditor({ value, onChange }: Props) {
  const [raw, setRaw] = useState(false)

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor: instance }) => {
      onChange(getMarkdown(instance))
    },
    editorProps: {
      attributes: {
        class: cn(
          'min-h-48 max-w-none px-3 py-2 focus:outline-none',
          // Mirrors the lesson page's own typography, so what is written here
          // looks like what a teacher will see.
          '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold',
          '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-semibold',
          '[&_p]:my-3 [&_li]:my-1 [&_ul]:list-disc [&_ol]:list-decimal',
          '[&_ul]:pl-6 [&_ol]:pl-6',
          '[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic',
          '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        ),
      },
    },
  })

  /*
    Switching back from the raw view replaces the document wholesale. During
    normal typing the editor is the source of truth, so `value` is never
    pushed back into it — that would move the cursor on every keystroke.
  */
  const showRich = () => {
    editor?.commands.setContent(value)
    setRaw(false)
  }

  return (
    <div className="overflow-hidden rounded-md border">
      {raw ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-48 rounded-none border-0 font-mono text-xs focus-visible:ring-0"
        />
      ) : (
        <>
          {editor && <Toolbar editor={editor} />}
          <EditorContent editor={editor} />
        </>
      )}

      <div className="bg-muted/40 text-muted-foreground flex items-center justify-between border-t px-3 py-1.5 text-xs">
        <span>Зберігається як Markdown</span>
        <button
          type="button"
          className="hover:text-foreground underline underline-offset-2"
          onClick={() => (raw ? showRich() : setRaw(true))}
        >
          {raw ? 'Візуальний редактор' : 'Показати Markdown'}
        </button>
      </div>
    </div>
  )
}
