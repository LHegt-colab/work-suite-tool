import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-kingfisher-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizes[size]}
          mx-4 max-h-[85vh]
          bg-white dark:bg-kingfisher-800
          rounded-2xl shadow-2xl
          overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-kingfisher-100 dark:border-kingfisher-700">
          <h2 className="text-xl font-semibold text-kingfisher-800 dark:text-kingfisher-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-xl
              text-kingfisher-500 hover:text-kingfisher-700
              hover:bg-kingfisher-100 dark:hover:bg-kingfisher-700
              transition-colors duration-200
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
