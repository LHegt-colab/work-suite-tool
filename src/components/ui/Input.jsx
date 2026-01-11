import { forwardRef } from 'react'

export const Input = forwardRef(({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-2
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100
          ${error ? 'border-red-500' : ''}
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
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-2
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors resize-y
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100
          ${error ? 'border-red-500' : ''}
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
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full px-4 py-2
          border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-accent focus:border-transparent
          transition-colors bg-white
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100
          ${error ? 'border-red-500' : ''}
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
