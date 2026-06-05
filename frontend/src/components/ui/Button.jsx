import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary:   'bg-ipb-500 hover:bg-ipb-600 text-white border-transparent',
  secondary: 'bg-ipb-50 hover:bg-ipb-100 text-ipb-600 border border-ipb-200',
  ghost:     'bg-transparent hover:bg-ipb-50 text-ipb-500 border-transparent',
  danger:    'bg-danger-100 hover:bg-danger-200 text-danger-700 border border-red-200',
  amber:     'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300',
  dark:      'bg-ipb-900 hover:bg-ipb-800 text-white border-transparent',
}

const SIZES = {
  xs:  'text-[10px] px-2 py-1 rounded',
  sm:  'text-[11px] px-[10px] py-[5px] rounded-md',
  md:  'text-[13px] px-4 py-[9px] rounded-md',
  lg:  'text-sm px-5 py-[11px] rounded-lg',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className = '',
  children,
  disabled,
  ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
  return (
    <button
      ref={ref}
      className={`${base} ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : icon && <span className="flex-shrink-0">{icon}</span>
      }
      {children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
