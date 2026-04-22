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
    <div className="relative border-t border-zinc-200 bg-white/70 backdrop-blur-md p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
      {fileName && (
        <div className="mb-2 flex items-center gap-2 rounded-t-md bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 w-fit">
          <Paperclip size={12} />
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
      <div className="flex items-end gap-3 rounded-2xl border border-zinc-300 bg-white shadow-sm ring-1 ring-transparent focus-within:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-zinc-600 transition-shadow">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 dark:hover:text-zinc-300"
        >
          <Paperclip size={20} />
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
          className="max-h-32 min-h-[44px] w-full resize-none bg-transparent py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />

        <button
          type="button"
          disabled={disabled || (!input.trim() && !fileContext)}
          onClick={handleSend}
          className="m-2 rounded-xl bg-black p-2 text-white hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
        </button>
      </div>
      <div className="mt-2 text-center text-[10px] text-zinc-400">
        Demo UI may take a few seconds to respond. Press Shift-Enter for new line.
      </div>
    </div>
  )
}
