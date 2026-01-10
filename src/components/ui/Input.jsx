import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-2.5
          bg-white dark:bg-kingfisher-800
          border border-kingfisher-200 dark:border-kingfisher-600
          rounded-xl
          text-kingfisher-800 dark:text-kingfisher-100
          placeholder-kingfisher-400 dark:placeholder-kingfisher-500
          transition-all duration-200
          focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const TextArea = forwardRef(({
  label,
  error,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-2.5
          bg-white dark:bg-kingfisher-800
          border border-kingfisher-200 dark:border-kingfisher-600
          rounded-xl
          text-kingfisher-800 dark:text-kingfisher-100
          placeholder-kingfisher-400 dark:placeholder-kingfisher-500
          transition-all duration-200
          resize-y min-h-[100px]
          focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

TextArea.displayName = 'TextArea'

export const Select = forwardRef(({
  label,
  error,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-kingfisher-600 dark:text-kingfisher-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-4 py-2.5
          bg-white dark:bg-kingfisher-800
          border border-kingfisher-200 dark:border-kingfisher-600
          rounded-xl
          text-kingfisher-800 dark:text-kingfisher-100
          transition-all duration-200
          focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
