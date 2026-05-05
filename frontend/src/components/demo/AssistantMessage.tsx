'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, BookOpen, Lightbulb, Globe } from 'lucide-react'

// ---------------------------------------------------------------------------
// Shared types (mirror of backend StructuredChatData)
// ---------------------------------------------------------------------------

export interface CheckerModelOutput {
  scratchpad: string
  decision: 'Yes' | 'No'
  confidence: number
  concerns: string[]
  summary: string
}

export interface FaqModelOutput {
  answer: string
  sources: Array<{ title: string; section: string }>
  confidence: number
  answered_from_context: boolean
}

export type StructuredChatData =
  | { type: 'checker'; data: CheckerModelOutput }
  | { type: 'faq'; data: FaqModelOutput }

export interface RagSource {
  title: string
  section: string
  sourceUrl?: string
}

export interface WebSource {
  title: string
  uri: string
}

interface AssistantMessageProps {
  content: string
  structuredData?: StructuredChatData
  sources?: RagSource[]
  webSources?: WebSource[]
  messageId: string
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-zinc-500">{pct}%</span>
    </div>
  )
}

function Collapsible({
  label,
  icon,
  defaultOpen = false,
  children,
}: {
  label: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        {icon}
        {label}
      </button>
      {open && <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checker card (contract-checker / job-checker)
// ---------------------------------------------------------------------------

function CheckerCard({ data, messageId }: { data: CheckerModelOutput; messageId: string }) {
  const isCompliant = data.decision === 'Yes'

  return (
    <div className="space-y-3">
      {/* Decision banner */}
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
          isCompliant
            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
        }`}
      >
        {isCompliant ? (
          <CheckCircle2 className="size-6 shrink-0" />
        ) : (
          <XCircle className="size-6 shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-base font-bold">{isCompliant ? 'Compliant' : 'Non-Compliant'}</p>
          <p className="mt-0.5 text-xs opacity-75">{data.summary}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
            isCompliant
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400'
          }`}
        >
          {data.decision === 'Yes' ? 'YES' : 'NO'}
        </span>
      </div>

      {/* Confidence */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Confidence</p>
        <ConfidenceBar value={data.confidence} />
      </div>

      {/* Concerns */}
      {data.concerns.length > 0 && (
        <Collapsible
          label={`Concerns (${data.concerns.length})`}
          icon={<AlertTriangle className="size-3.5" />}
          defaultOpen={true}
        >
          <ul className="space-y-1.5">
            {data.concerns.map((concern, i) => {
              const [ruleId, ...rest] = concern.split(':')
              const description = rest.join(':').trim()
              return (
                <li key={`${messageId}-concern-${i}`} className="flex items-start gap-2 text-xs">
                  {ruleId && description ? (
                    <>
                      <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 font-mono font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        {ruleId.trim()}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-300">{description}</span>
                    </>
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-300">{concern}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </Collapsible>
      )}

      {/* Scratchpad (AI reasoning) */}
      {data.scratchpad && (
        <Collapsible
          label="AI Reasoning"
          icon={<Lightbulb className="size-3.5" />}
          defaultOpen={false}
        >
          <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {data.scratchpad}
          </pre>
        </Collapsible>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FAQ card
// ---------------------------------------------------------------------------

function FaqCard({ data, messageId }: { data: FaqModelOutput; messageId: string }) {
  return (
    <div className="space-y-3">
      {/* Answer */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-100">
        {data.answer}
      </p>

      {/* Confidence + context flag */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Confidence</p>
          <ConfidenceBar value={data.confidence} />
        </div>
        {!data.answered_from_context && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            Outside knowledge base
          </span>
        )}
      </div>

      {/* Model-provided sources */}
      {data.sources.length > 0 && (
        <Collapsible
          label={`Sources (${data.sources.length})`}
          icon={<BookOpen className="size-3.5" />}
          defaultOpen={true}
        >
          <ul className="space-y-1.5">
            {data.sources.map((src, i) => (
              <li
                key={`${messageId}-src-${i}`}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-700 dark:text-zinc-200">{src.title}</p>
                <p className="text-zinc-400">{src.section}</p>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RAG source list (from knowledge retrieval, shown for all features)
// ---------------------------------------------------------------------------

function RagSourceList({ sources, messageId }: { sources: RagSource[]; messageId: string }) {
  return (
    <Collapsible
      label={`Retrieved Context (${sources.length})`}
      icon={<BookOpen className="size-3.5" />}
      defaultOpen={false}
    >
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li
            key={`${messageId}-rag-${index}`}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{source.title}</p>
            <p className="text-zinc-400">{source.section}</p>
            {source.sourceUrl ? (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-brand-600 underline dark:text-brand-400"
              >
                {source.sourceUrl}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </Collapsible>
  )
}

function WebSourceList({ sources, messageId }: { sources: WebSource[]; messageId: string }) {
  return (
    <Collapsible
      label={`Web Sources (${sources.length})`}
      icon={<Globe className="size-3.5" />}
      defaultOpen={false}
    >
      <ul className="space-y-1.5">
        {sources.map((source, index) => (
          <li
            key={`${messageId}-web-${index}`}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{source.title}</p>
            <a
              href={source.uri}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-brand-600 underline dark:text-brand-400"
            >
              {source.uri}
            </a>
          </li>
        ))}
      </ul>
    </Collapsible>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AssistantMessage({ content, structuredData, sources, webSources, messageId }: AssistantMessageProps) {
  const hasSources = sources && sources.length > 0
  const hasWebSources = webSources && webSources.length > 0

  // If we have structured data, render the rich UI
  if (structuredData) {
    return (
      <div className="space-y-3">
        {structuredData.type === 'checker' && (
          <CheckerCard data={structuredData.data} messageId={messageId} />
        )}
        {structuredData.type === 'faq' && (
          <FaqCard data={structuredData.data} messageId={messageId} />
        )}
        {hasSources && (
          <RagSourceList sources={sources} messageId={messageId} />
        )}
        {hasWebSources && <WebSourceList sources={webSources} messageId={messageId} />}
      </div>
    )
  }

  // Fallback: plain text + sources
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      {hasSources && (
        <RagSourceList sources={sources} messageId={messageId} />
      )}
      {hasWebSources && <WebSourceList sources={webSources} messageId={messageId} />}
    </div>
  )
}
