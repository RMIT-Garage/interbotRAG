'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatInputArea } from './ChatInputArea'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  fileAttached?: boolean
  sources?: Array<{
    title: string
    section: string
    sourceUrl?: string
  }>
}

interface ChatInterfaceProps {
  feature: string
}

export function ChatInterface({ feature }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    setMessages([])
  }, [feature])

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
      let token = 'no-token'
      if (user) {
        token = await user.getIdToken()
      }

      // Route through the Next.js server-side proxy to avoid CORS issues with
      // the Firebase Emulator (emulator doesn't add CORS headers to preflight responses).
      const response = await fetch(`/api/backend/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature,
          userInput: messageText || '[File uploaded]',
          fileContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const data = await response.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || '(No response text)',
        sources: Array.isArray(data.sources) ? data.sources : undefined,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      toast.error('The server encountered an error fulfilling the chat request.')
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

  return (
    <div className="flex h-full flex-col bg-zinc-50/50 dark:bg-zinc-950/50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <div className="bg-gradient-to-br from-red-100 to-blue-200 p-4 rounded-full shadow-sm">
              <div className="bg-white rounded-full p-4 h-16 w-16 flex items-center justify-center dark:bg-zinc-900 shadow-sm border border-red-50">
                ✨
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 to-blue-500 bg-clip-text text-transparent">
              {emptyTitle}
            </h2>
            <p className="text-sm text-zinc-500 text-center max-w-sm">
              I am ready to help. Upload a file or start typing to test this feature!
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-100/90 text-blue-900 rounded-tr-sm dark:bg-blue-900/40 dark:text-blue-100 backdrop-blur-sm border border-blue-200 dark:border-blue-800'
                      : 'bg-red-50 text-red-900 rounded-tl-sm dark:bg-red-950/40 dark:text-red-100 backdrop-blur-sm border border-red-100 dark:border-red-900'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.fileAttached && (
                    <div className="mt-2 flex items-center justify-start rounded-md bg-white/50 px-2 py-1 text-xs text-blue-800 dark:bg-black/20 dark:text-blue-300 w-fit">
                      📎 Document attached
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-current/10 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Sources</p>
                      {msg.sources.map((source, index) => (
                        <div key={`${msg.id}-${index}`} className="rounded-lg bg-white/50 px-3 py-2 text-xs dark:bg-black/20">
                          <p className="font-medium">{source.title}</p>
                          <p className="opacity-75">{source.section}</p>
                          {source.sourceUrl ? (
                            <a
                              href={source.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block underline"
                            >
                              {source.sourceUrl}
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm px-5 py-4 bg-red-50 border border-red-100 dark:bg-red-950/40 dark:border-red-900 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-red-400"></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <ChatInputArea onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}
