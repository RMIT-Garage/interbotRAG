'use client'

import { useRef, useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ChatInputAreaProps {
  onSend: (message: string, fileContext?: string) => void
  disabled?: boolean
}

export function ChatInputArea({ onSend, disabled }: ChatInputAreaProps) {
  const [input, setInput] = useState('')
  const [fileContext, setFileContext] = useState<string | undefined>()
  const [fileName, setFileName] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!input.trim() && !fileContext) return
    onSend(input, fileContext)
    setInput('')
    setFileContext(undefined)
    setFileName(undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled) handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setFileContext(text)
        toast.success(`Attached ${file.name}`)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file contents')
      setFileName(undefined)
    }
    reader.readAsText(file)
  }

  return (
    <div className="relative border-t bg-transparent p-3 sm:p-4">
      {fileName && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-brand-50 px-3 py-1 text-xs text-brand-900 dark:bg-brand-50/40">
          <Paperclip className="size-3" />
          <span>Attached: {fileName}</span>
          <button
            onClick={() => {
              setFileName(undefined)
              setFileContext(undefined)
            }}
            className="ml-2 hover:text-red-500"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl border bg-background p-1.5 shadow-sm ring-1 ring-transparent transition-shadow focus-within:ring-brand-500/30">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:text-zinc-300"
        >
          <Paperclip className="size-5" />
          <input
            type="file"
            accept=".txt,.md,.json,.csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled}
          className="min-h-[36px] w-full resize-none bg-transparent py-2 text-sm leading-5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />

        <button
          type="button"
          disabled={disabled || (!input.trim() && !fileContext)}
          onClick={handleSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </div>
      <div className="mt-1.5 text-center text-[10px] text-zinc-400">
        Demo UI may take a few seconds to respond. Press Shift-Enter for new line.
      </div>
    </div>
  )
}
