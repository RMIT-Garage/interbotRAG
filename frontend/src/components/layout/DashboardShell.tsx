import { Suspense, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Suspense fallback={<aside className="hidden w-72 border-r bg-surface lg:flex" />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">{children}</main>
      </div>
    </div>
  )
}
