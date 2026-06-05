import Button from './Button'

export default function ConfirmModal({ state, onClose }) {
  if (!state) return null
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-ipb-900/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-lg overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="text-2xl mb-2">{state.icon || '⚠️'}</div>
          <h2 className="text-[15px] font-bold text-ipb-900 mb-1.5">{state.title}</h2>
          {state.msg && <p className="text-[12px] text-gray-600 leading-relaxed">{state.msg}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <Button variant="secondary" size="sm" onClick={onClose}>Batal</Button>
          <Button
            variant={state.danger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => { state.onOk(); onClose() }}
          >
            {state.okLabel || 'Ya, Lanjutkan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
