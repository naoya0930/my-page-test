import { useMemo } from 'react'

interface CompletionModalProps {
  /** Closes the modal and returns to the home screen. */
  onClose: () => void
}

const CONFETTI_COLORS = ['#4F46E5', '#14B8A6', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6']

/**
 * Celebration modal shown when the user completes the 12-week program
 * (reaches Day 84). Includes a lightweight, dependency-free CSS confetti
 * effect that is suppressed when the user prefers reduced motion.
 */
const CompletionModal = ({ onClose }: CompletionModalProps) => {
  // Pre-compute confetti pieces once so they don't reshuffle on re-render.
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 2.5,
        duration: 2.5 + Math.random() * 2,
        size: 6 + Math.random() * 6,
      })),
    []
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      {/* Confetti layer */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { animation: none !important; display: none; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="confetti-piece absolute top-0 block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="text-5xl">🎉</div>
        <h2 id="completion-title" className="mt-4 text-2xl font-bold text-slate-900">
          12週間のプログラム完遂、<br />おめでとうございます！
        </h2>
        <p className="mt-4 text-slate-600">
          毎日のモーニングページと毎週のアーティストデート、本当におつかれさまでした。
          あなたが積み重ねた84日間の軌跡は、かけがえのないものです。
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

export default CompletionModal
