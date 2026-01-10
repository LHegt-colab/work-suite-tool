export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`
        bg-white dark:bg-kingfisher-800
        border border-kingfisher-100 dark:border-kingfisher-700
        rounded-2xl
        shadow-sm hover:shadow-md
        transition-shadow duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-kingfisher-100 dark:border-kingfisher-700 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-kingfisher-800 dark:text-kingfisher-100 ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-kingfisher-100 dark:border-kingfisher-700 ${className}`}>
      {children}
    </div>
  )
}
