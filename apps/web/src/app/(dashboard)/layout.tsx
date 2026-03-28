'use client'

import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Footer } from '@/components/layout/footer'

export default function DashboardLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main aria-label="Main content" className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
