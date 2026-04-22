'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { knowledgeDocumentSchema, type KnowledgeDocumentInput } from '@/lib/validations/knowledge'
import { useAuth } from '@/hooks/useAuth'

interface KnowledgeDocument {
  id: string
  feature: string
  title: string
  section: string
  sourceUrl?: string
  status: string
  createdAt: string
}

export default function KnowledgePage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KnowledgeDocumentInput>({
    resolver: zodResolver(knowledgeDocumentSchema),
    defaultValues: {
      feature: 'faq-rag',
      sourceUrl: '',
    },
  })

  useEffect(() => {
    void loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    setIsLoading(true)

    try {
      const response = await fetchWithAuth('/api/backend/knowledge/documents')
      if (!response.ok) {
        throw new Error('Failed to load knowledge documents')
      }

      const data = await response.json()
      setDocuments(data.documents ?? [])
    } catch {
      toast.error('Failed to load knowledge documents')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (input: KnowledgeDocumentInput) => {
    try {
      const response = await fetchWithAuth('/api/backend/knowledge/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          sourceUrl: input.sourceUrl || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail ?? 'Failed to save knowledge document')
      }

      const data = await response.json()
      setDocuments((prev) => [data.document, ...prev])
      reset({ feature: 'faq-rag', title: '', section: '', sourceUrl: '', content: '' })
      toast.success('Knowledge document saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save knowledge document')
    }
  }

  const fetchWithAuth = async (url: string, init?: RequestInit) => {
    const token = user ? await user.getIdToken() : 'no-token'
    return fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Knowledge Base</h1>
          <p className="mt-1 text-sm text-zinc-500">Add FAQ content for the RAG chatbot MVP.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Feature" error={errors.feature?.message}>
              <select
                {...register('feature')}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="faq-rag">faq-rag</option>
                <option value="contract-checker">contract-checker</option>
                <option value="job-checker">job-checker</option>
              </select>
            </Field>
            <Field label="Section" error={errors.section?.message}>
              <input
                {...register('section')}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Internship eligibility"
              />
            </Field>
          </div>

          <Field label="Title" error={errors.title?.message}>
            <input
              {...register('title')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Internship FAQ"
            />
          </Field>

          <Field label="Source URL" error={errors.sourceUrl?.message}>
            <input
              {...register('sourceUrl')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="https://example.com/faq"
            />
          </Field>

          <Field label="Content" error={errors.content?.message}>
            <textarea
              {...register('content')}
              rows={10}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Paste the FAQ or policy content here"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSubmitting ? 'Saving…' : 'Save knowledge document'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Saved documents</h2>
          {isLoading && <LoadingSpinner size="sm" />}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState title="No knowledge documents yet" description="Add your first FAQ entry above." />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{document.title}</h3>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {document.feature}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {document.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{document.section}</p>
                <div className="mt-2 text-xs text-zinc-400">
                  {document.sourceUrl ? <a href={document.sourceUrl} target="_blank" rel="noreferrer" className="underline">{document.sourceUrl}</a> : 'No source URL'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  )
}
