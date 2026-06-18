import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-10 shadow-[0_35px_60px_-15px_rgba(15,23,42,0.2)]">
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900">
            The Artist&apos;s Way Support App
          </h1>
          <p className="mb-8 text-slate-600">
            React + Tailwind CSS で構築された Web アプリのサンドボックス環境です。
          </p>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <h2 className="text-xl font-medium text-slate-900">環境の準備</h2>
              <p className="mt-2 text-slate-600">
                Tailwind CSS を導入し、Docker で動作する Vite React 環境を構築します。
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-600 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.2em]">実行コマンド</p>
              <pre className="mt-3 rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">
                <code>docker-compose up --build</code>
              </pre>
            </div>
          </div>
          <button
            type="button"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            onClick={() => setCount((current) => current + 1)}
          >
            カウント: {count}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
