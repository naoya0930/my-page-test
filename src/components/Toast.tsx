import { useEffect, useState } from 'react'

interface ToastProps {
  /** Message to display. */
  message: string
  /** Called after the toast has fully faded out, so the parent can clear it. */
  onClose: () => void
  /** How long the toast stays fully visible before fading out (ms). */
  duration?: number
}

/**
 * Reusable, auto-dismissing toast / snackbar.
 *
 * Shows a message near the bottom of the screen, then fades out after
 * `duration` ms and notifies the parent via `onClose`.
 */
const Toast = ({ message, onClose, duration = 3000 }: ToastProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger the fade-in on mount.
    const showTimer = setTimeout(() => setVisible(true), 10)
    // Start fading out after `duration`.
    const hideTimer = setTimeout(() => setVisible(false), duration)
    // Remove from the DOM once the fade-out transition has finished.
    const closeTimer = setTimeout(onClose, duration + 400)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <svg className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {message}
      </div>
    </div>
  )
}

export default Toast
