import { forwardRef } from 'react'

const variants = {
  primary: 'bg-kingfisher-500 hover:bg-kingfisher-600 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-kingfisher-100 hover:bg-kingfisher-200 text-kingfisher-700 dark:bg-kingfisher-800 dark:hover:bg-kingfisher-700 dark:text-kingfisher-100',
  success: 'bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg',
  ghost: 'bg-transparent hover:bg-kingfisher-100 text-kingfisher-600 dark:hover:bg-kingfisher-800 dark:text-kingfisher-300',
  outline: 'border-2 border-kingfisher-500 text-kingfisher-500 hover:bg-kingfisher-500 hover:text-white dark:border-kingfisher-400 dark:text-kingfisher-400',
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
        font-medium rounded-xl
        transition-all duration-200 ease-out
        transform hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
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
