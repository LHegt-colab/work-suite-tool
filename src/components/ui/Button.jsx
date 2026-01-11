import { forwardRef } from 'react'

const variants = {
  primary: 'bg-accent hover:bg-accent-dark text-white shadow-sm',
  secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm',
  ghost: 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
  outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'
