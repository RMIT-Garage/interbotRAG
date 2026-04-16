'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  benchmarkFeatureSchema,
  benchmarkSingleCaseSchema,
  type BenchmarkSingleCaseInput,
} from '@/lib/validations/benchmark'

type BenchmarkExecution = {
  caseId: string
  name: string
  parseSuccess: boolean
  latencyMs: number
  expected: unknown
  parsedResponse: unknown
  rawResponse: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  estimatedCostUsd?: number
  error?: string
}

type BenchmarkResult = {
  runId: string
  feature: 'contract-checker' | 'job-checker' | 'faq-rag'
  mode: 'smoke' | 'full'
  pass: boolean
  metrics: Record<string, number>
  minThresholds: Record<string, number>
  maxThresholds: Record<string, number>
  metadata: {
    provider: string
    model: string
    promptVersion: string
    startedAtIso: string
    finishedAtIso: string
    usedFixtureResponses: boolean
  }
  execution: BenchmarkExecution
}

const DEFAULT_BACKEND_BASE_URL = 'http://127.0.0.1:5001/internbotrag/us-central1'

export default function BenchmarksPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [running, setRunning] = useState(false)

  const selectedFeature = useMemo(() => {
    const featureFromQuery = searchParams.get('feature')
    if (!featureFromQuery) {
      return 'contract-checker'
    }

    const parsedFeature = benchmarkFeatureSchema.safeParse(featureFromQuery)
    return parsedFeature.success ? parsedFeature.data : 'contract-checker'
  }, [searchParams])

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<BenchmarkSingleCaseInput>({
    resolver: zodResolver(benchmarkSingleCaseSchema),
    defaultValues: {
      feature: selectedFeature,
      mode: 'smoke',
      caseId: '',
      fixtures: true,
      delayMs: 1500,
    },
  })

  useEffect(() => {
    setValue('feature', selectedFeature)
  }, [selectedFeature, setValue])

  const fixturesEnabled = watch('fixtures')

  const onSubmit = async (input: BenchmarkSingleCaseInput) => {
    if (!user) {
      toast.error('You must be signed in to run benchmarks')
      return
    }

    setRunning(true)
    setResult(null)

    try {
      const token = await user.getIdToken()
      const backendBaseUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_BACKEND_BASE_URL

      const response = await fetch(`${backendBaseUrl}/api/benchmarks/single-case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      })

      const body = (await response.json()) as
        | BenchmarkResult
        | { detail?: string; title?: string; status?: number }

      if (!response.ok) {
        const detail = 'detail' in body && body.detail ? body.detail : 'Benchmark request failed'
        throw new Error(detail)
      }

      setResult(body as BenchmarkResult)
      toast.success('Single-case benchmark completed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      toast.error(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demo Runner</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Test chatbot, contract checker, and job checker one case at a time. Fixture mode is recommended to avoid Gemini quota limits.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="feature" className="text-sm font-medium">
                Feature
              </label>
              <select
                id="feature"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                {...register('feature')}
              >
                <option value="contract-checker">Contract Checker</option>
                <option value="job-checker">Job Checker</option>
                <option value="faq-rag">FAQ RAG</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="mode" className="text-sm font-medium">
                Mode
              </label>
              <select
                id="mode"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
                {...register('mode')}
              >
                <option value="smoke">Smoke</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="caseId" className="text-sm font-medium">
              Case ID
            </label>
            <input
              id="caseId"
              type="text"
              placeholder="e.g. CC-SMOKE-001"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              {...register('caseId')}
            />
            {errors.caseId && <p className="text-xs text-red-500">{errors.caseId.message}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="fixtures"
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300"
              {...register('fixtures')}
            />
            <label htmlFor="fixtures" className="text-sm font-medium">
              Use fixture response (recommended)
            </label>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="delayMs" className="text-sm font-medium">
              Delay (ms)
            </label>
            <input
              id="delayMs"
              type="number"
              min={0}
              step={100}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              {...register('delayMs', { valueAsNumber: true })}
            />
            {errors.delayMs && <p className="text-xs text-red-500">{errors.delayMs.message}</p>}
          </div>

          {!fixturesEnabled && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
              Live mode may return 429 quota errors. Keep delay at 1000ms+ and run one case only.
            </p>
          )}

          <button
            type="submit"
            disabled={running}
            className="rounded-md bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {running ? 'Running…' : 'Run single case'}
          </button>
        </form>
      </div>

      {result && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Run result</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                result.pass
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
              }`}
            >
              {result.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <dt className="text-zinc-500">Run ID</dt>
              <dd className="font-mono text-xs break-all">{result.runId}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Case ID</dt>
              <dd>{result.execution.caseId}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Parse success</dt>
              <dd>{String(result.execution.parseSuccess)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Latency</dt>
              <dd>{result.execution.latencyMs} ms</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Input tokens</dt>
              <dd>{result.execution.usage?.inputTokens ?? 0}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Output tokens</dt>
              <dd>{result.execution.usage?.outputTokens ?? 0}</dd>
            </div>
          </dl>

          {result.execution.error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
              {result.execution.error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Expected</h3>
              <pre className="max-h-64 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                {JSON.stringify(result.execution.expected, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Parsed response</h3>
              <pre className="max-h-64 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                {JSON.stringify(result.execution.parsedResponse, null, 2)}
              </pre>
            </div>
          </div>

          <details>
            <summary className="cursor-pointer text-sm font-medium">Raw model response</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
              {result.execution.rawResponse || '(empty)'}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
