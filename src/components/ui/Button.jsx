import { forwardRef } from 'react'

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-dark shadow-md',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-md',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-md',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
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
