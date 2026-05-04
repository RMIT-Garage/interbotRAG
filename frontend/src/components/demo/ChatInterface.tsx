'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { ChatInputArea } from './ChatInputArea'
import { AssistantMessage, type StructuredChatData, type RagSource } from './AssistantMessage'
import { toast } from 'sonner'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  fileAttached?: boolean
  structuredData?: StructuredChatData
  sources?: RagSource[]
}

interface ChatInterfaceProps {
  feature: string
}

export function ChatInterface({ feature }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-lite-latest')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    setMessages([])
  }, [feature])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('chatModel') : null
    if (saved) {
      setSelectedModel(saved)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await fetch('/api/backend/chat/models', {
          headers: { Authorization: 'Bearer no-token' },
        })
        if (!response.ok) return
        const data = (await response.json()) as { models?: string[] }
        const models = Array.isArray(data.models) ? data.models : []
        if (!active || models.length === 0) return
        setAvailableModels(models)
        if (!models.includes(selectedModel)) {
          const fallback = models.includes('gemini-flash-lite-latest')
            ? 'gemini-flash-lite-latest'
            : models[0]!
          setSelectedModel(fallback)
          if (typeof window !== 'undefined') window.localStorage.setItem('chatModel', fallback)
        }
      } catch {
        // Keep current model and continue.
      }
    })()

    return () => {
      active = false
    }
  }, [selectedModel])

  const handleSend = async (messageText: string, fileContext?: string) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText || '(Sent a file)',
      fileAttached: !!fileContext,
    }
    
    setMessages((prev) => [...prev, newMsg])
    setIsTyping(true)

    try {
      // Route through the Next.js server-side proxy to avoid CORS issues with
      // the Firebase Emulator (emulator doesn't add CORS headers to preflight responses).
      const response = await fetch(`/api/backend/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer no-token',
        },
        body: JSON.stringify({
          feature,
          userInput: messageText || '[File uploaded]',
          fileContext,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        let detail = `Request failed (${response.status})`
        try {
          const err = (await response.json()) as { detail?: string }
          if (err?.detail) detail = err.detail
        } catch {
          // Keep fallback detail if response is not JSON.
        }
        throw new Error(detail)
      }

      const data = await response.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || '(No response text)',
        structuredData: data.structuredData ?? undefined,
        sources: Array.isArray(data.sources) ? data.sources : undefined,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'The server encountered an error fulfilling the chat request.'
      toast.error(message)
    } finally {
      setIsTyping(false)
    }
  }

  // Feature specific colors and copy
  let emptyTitle = ''
  if (feature === 'contract-checker') emptyTitle = 'Contract Checker'
  else if (feature === 'job-checker') emptyTitle = 'Job Checker'
  else if (feature === 'faq-rag') emptyTitle = 'FAQ Chatbot'
  else emptyTitle = 'Demo Bot'

  const quickPrompts: Record<string, string[]> = {
    'faq-rag': [
      'Summarize internship attendance requirements.',
      'What documents are mandatory before placement starts?',
      'List key escalation points for coordinators.',
    ],
    'contract-checker': [
      'Check this contract for unpaid overtime risk.',
      'Highlight clauses that conflict with policy.',
      'What should a coordinator verify first?',
    ],
    'job-checker': [
      'Does this role meet placement eligibility?',
      'Which responsibilities raise compliance concerns?',
      'Provide a quick pass/fail checklist.',
    ],
  }
  const promptSuggestions = quickPrompts[feature] ?? quickPrompts['faq-rag'] ?? []

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5" ref={scrollRef}>
        <div className="mx-auto mb-3 flex w-full max-w-4xl justify-end">
          <div className="inline-flex items-center gap-2 rounded-xl border bg-surface px-2.5 py-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-900">
              <Sparkles className="size-3" />
              Model
            </div>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => {
                  const nextModel = e.target.value
                  setSelectedModel(nextModel)
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('chatModel', nextModel)
                  }
                }}
                className="min-w-52 appearance-none rounded-lg border bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                aria-label="Select chat model"
              >
                {(availableModels.length > 0 ? availableModels : [selectedModel]).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400">▾</span>
            </div>
          </div>
        </div>
        {messages.length === 0 ? (
          <div className="mx-auto w-full max-w-4xl rounded-2xl border bg-surface p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-900">AI</div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{emptyTitle}</h2>
                <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Ask a question, upload context, or test a checker flow. Responses prioritize grounded, policy-aware guidance.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-xl border bg-background px-3 py-2 text-left text-xs text-zinc-600 hover:border-brand-100 hover:bg-brand-50/40 hover:text-zinc-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-brand-100 bg-brand-50 px-4 py-3 shadow-sm text-brand-900 dark:border-brand-100 dark:bg-brand-50/35 dark:text-brand-900">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    {msg.fileAttached && (
                      <div className="mt-2 w-fit rounded-md bg-white/70 px-2 py-1 text-xs text-brand-900 dark:bg-zinc-950">
                        📎 Document attached
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-[92%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-surface px-4 py-3 shadow-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    <AssistantMessage
                      messageId={msg.id}
                      content={msg.content}
                      structuredData={msg.structuredData}
                      sources={msg.sources}
                    />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border bg-surface px-5 py-4 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500"></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <ChatInputArea onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}
