const VARIANTS = {
  open:      'bg-amber-100 text-amber-700',
  progress:  'bg-ipb-50 text-ipb-600',
  resolved:  'bg-green-100 text-green-700',
  draft:     'bg-gray-50 text-gray-700',
  review:    'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
  rejected:  'bg-danger-100 text-danger-700',
  admin:     'bg-purple-100 text-purple-700',
  staff:     'bg-ipb-50 text-ipb-600',
  student:   'bg-green-100 text-green-700',
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-danger-100 text-danger-700',
  default:   'bg-gray-100 text-gray-600',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full leading-snug ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {children}
    </span>
  )
}
