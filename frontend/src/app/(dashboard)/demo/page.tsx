'use client'

import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/demo/ChatInterface'

export default function DemoPage() {
  const searchParams = useSearchParams()
  // Default to faq-rag if feature is not provided or malformed
  const feature = searchParams.get('feature') || 'faq-rag'

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-6 backdrop-blur-md dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm"></div>
          <h1 className="text-sm font-semibold tracking-wide text-zinc-800 dark:text-zinc-200 uppercase">
            {feature.replace('-', ' ')}
          </h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface feature={feature} />
      </div>
    </div>
  )
}
