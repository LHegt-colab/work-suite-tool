const variants = {
  // Priority badges
  'zeer-laag': 'bg-gray-100 text-gray-700',
  'laag': 'bg-blue-100 text-blue-700',
  'normaal': 'bg-cyan-100 text-cyan-700',
  'hoog': 'bg-yellow-100 text-yellow-700',
  'kritiek': 'bg-red-100 text-red-700',

  // Status badges
  'nieuw': 'bg-gray-100 text-gray-700',
  'gepland': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  'on-hold': 'bg-orange-100 text-orange-700',
  'afgerond': 'bg-green-100 text-green-700',
  'geannuleerd': 'bg-red-100 text-red-700',

  // General
  'default': 'bg-gray-100 text-gray-700',
  'info': 'bg-cyan-100 text-cyan-700',
  'success': 'bg-green-100 text-green-700',
  'warning': 'bg-yellow-100 text-yellow-700',
  'danger': 'bg-red-100 text-red-700',
  'primary': 'bg-primary text-white',
  'accent': 'bg-accent text-white',
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-semibold
        rounded-full
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

export function Tag({ children, onRemove, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2.5 py-0.5
        text-xs font-medium
        bg-primary text-white
        rounded-full
        ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-primary-dark rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
