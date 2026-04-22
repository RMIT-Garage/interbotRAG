'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { signUpWithEmail, signInWithGoogle } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      await signUpWithEmail(data.email, data.password, data.displayName)
      router.push('/demo')
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('email-already-in-use')) {
        toast.error('An account with this email already exists')
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      router.push('/demo')
    } catch {
      toast.error('Google sign-in failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] my-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Create Account</h1>
        <p className="text-sm text-zinc-500">Begin your journey with interbot</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200/50 bg-white/80 px-4 py-3 text-sm font-medium shadow-sm hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 backdrop-blur-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200/50 dark:border-zinc-700/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-medium">
          <span className="bg-transparent px-2 text-zinc-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Full name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            className="w-full rounded-xl border border-zinc-200/60 bg-white/50 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all"
            placeholder="Jane Smith"
            {...register('displayName')}
          />
          {errors.displayName && <p className="text-xs text-red-500 font-medium">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-zinc-200/60 bg-white/50 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-zinc-200/60 bg-white/50 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all"
            placeholder="Min. 8 characters"
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-zinc-200/60 bg-white/50 px-4 py-3 text-sm shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:border-zinc-700/50 dark:bg-zinc-900/50 backdrop-blur-md transition-all"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-blue-500/25 mt-2"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-500 hover:text-blue-600 hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
