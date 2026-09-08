'use client'

import { useMemo, useState } from 'react'
import type { PaintType, NewPaintType } from '@/lib/types'
import { groupTypesByBrand } from '@/lib/brands'

interface Props {
  types: PaintType[]
  onClose: () => void
  onAdd: (type: NewPaintType) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function CatalogModal({ types, onClose, onAdd, onDelete }: Props) {
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const brandOptions = useMemo(
    () => [...new Set(types.map(t => t.brand?.trim()).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'tr')),
    [types]
  )
  const groups = useMemo(() => groupTypesByBrand(types), [types])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Boya adı zorunludur.')
    const dup = types.some(
      t => t.name.trim().toLocaleLowerCase('tr') === name.trim().toLocaleLowerCase('tr') &&
        (t.brand || '').trim().toLocaleLowerCase('tr') === brand.trim().toLocaleLowerCase('tr')
    )
    if (dup) return setError('Bu boya zaten tanımlı.')

    setLoading(true)
    await onAdd({
      brand: brand.trim(),
      name: name.trim(),
      color_code: color.trim() || null,
    })
    setLoading(false)
    setName('')
    setColor('')
    setError('')
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full max-w-lg rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Boya Tanımları</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Stok girişinde yalnızca burada tanımlı boyalar seçilebilir.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 bg-gray-50 rounded-xl p-3 mb-5">
          <div className="flex gap-2">
            <div className="w-36">
              <label className="form-label">Marka</label>
              <input
                className="form-input"
                placeholder="Hempel"
                list="catalog-brand-list"
                value={brand}
                onChange={e => { setBrand(e.target.value); setError('') }}
              />
              <datalist id="catalog-brand-list">
                {brandOptions.map(b => <option key={b} value={b!} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="form-label">Boya Adı *</label>
              <input
                className="form-input"
                placeholder="Örn: Olympic 76280"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Renk Kodu / RAL (opsiyonel)</label>
            <input
              className="form-input"
              placeholder="#FFFFFF veya RAL 9010"
              value={color}
              onChange={e => { setColor(e.target.value); setError('') }}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? 'Ekleniyor...' : '+ Tanımla'}
          </button>
        </form>

        {types.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Henüz boya tanımlanmadı.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(({ brand: b, items }) => (
              <div key={b || '—'}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{b?.trim() || 'Markasız'}</h3>
                <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-lg">
                  {items.map(t => (
                    <li key={t.id} className="flex items-center gap-2 px-3 py-2">
                      {t.color_code && t.color_code.startsWith('#') && (
                        <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: t.color_code }} />
                      )}
                      <span className="text-sm text-gray-900 flex-1 min-w-0 truncate">
                        {t.name}
                        {t.color_code && <span className="text-gray-400"> · {t.color_code}</span>}
                      </span>
                      <button
                        onClick={async () => {
                          if (confirm(`"${t.name}" tanımını silmek istiyor musunuz? Mevcut stok kayıtları kalır.`)) await onDelete(t.id)
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 shrink-0 cursor-pointer"
                        aria-label="Sil"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="btn-secondary w-full mt-5">Kapat</button>
      </div>
    </div>
  )
}
