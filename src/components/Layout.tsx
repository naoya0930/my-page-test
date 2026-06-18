import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">The Artist&apos;s Way Support</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">日々のモーニングページと週次アーティストデート</h1>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
          <p>開発中のローカル環境です。Cloudflare Workers と D1 を Docker で検証します。</p>
        </footer>
      </div>
    </div>
  )
}

export default Layout
