import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-3 py-2
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600 rounded-lg
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
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
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-3 py-2
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600 rounded-lg
          text-gray-900 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors resize-y
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
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
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-3 py-2
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600 rounded-lg
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
