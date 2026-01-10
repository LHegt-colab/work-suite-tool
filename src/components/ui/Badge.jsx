const variants = {
  // Priority badges
  'zeer-laag': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'laag': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'normaal': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'hoog': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'kritiek': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',

  // Status badges
  'nieuw': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'gepland': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'on-hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'afgerond': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'geannuleerd': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',

  // General
  'default': 'bg-kingfisher-100 text-kingfisher-700 dark:bg-kingfisher-700 dark:text-kingfisher-300',
  'info': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'success': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'warning': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'danger': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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
        bg-kingfisher-500 text-white
        rounded-full
        ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-kingfisher-600 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
