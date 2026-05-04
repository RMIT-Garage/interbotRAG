import { ChatInterface } from '@/components/demo/ChatInterface'

const ALLOWED_FEATURES = new Set(['faq-rag', 'contract-checker', 'job-checker'])

type DemoPageProps = {
  searchParams?: Promise<{
    feature?: string
  }>
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const resolvedSearchParams = await searchParams
  // Default to faq-rag if feature is not provided or malformed
  const rawFeature = resolvedSearchParams?.feature
  const feature = rawFeature && ALLOWED_FEATURES.has(rawFeature) ? rawFeature : 'faq-rag'

  return (
    <div className="h-full w-full">
      <ChatInterface feature={feature} />
    </div>
  )
}
