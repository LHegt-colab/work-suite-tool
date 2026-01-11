const variants = {
  // Priority badges
  'zeer-laag': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  'laag': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  'normaal': 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
  'hoog': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  'kritiek': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',

  // Status badges
  'nieuw': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  'gepland': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  'in-progress': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  'on-hold': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  'afgerond': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  'geannuleerd': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',

  // General
  'default': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  'info': 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
  'success': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  'warning': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  'danger': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  'primary': 'bg-primary text-white',
  'accent': 'bg-accent text-white',
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        text-xs font-medium
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
        px-2 py-0.5
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
