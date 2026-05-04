'use client'

import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/components/demo/ChatInterface'

const ALLOWED_FEATURES = new Set(['faq-rag', 'contract-checker', 'job-checker'])

export default function DemoPage() {
  const searchParams = useSearchParams()
  // Default to faq-rag if feature is not provided or malformed
  const rawFeature = searchParams.get('feature')
  const feature = rawFeature && ALLOWED_FEATURES.has(rawFeature) ? rawFeature : 'faq-rag'

  return (
    <div className="h-full w-full">
      <ChatInterface feature={feature} />
    </div>
  )
}
