'use client'

import { useMemo, useState } from 'react'
import type { PaintType, NewPaintType } from '@/lib/types'
import { groupTypesByBrand } from '@/lib/brands'

interface Props {
  types: PaintType[]
  onClose: () => void
  onAdd: (type: NewPaintType) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

export default function CatalogModal({ types, onClose, onAdd, onDelete }: Props) {
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(types.length === 0)

  const brandOptions = useMemo(
    () => [...new Set(types.map(t => t.brand?.trim()).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'tr')),
    [types]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr')
    if (!q) return types
    return types.filter(t =>
      t.name.toLocaleLowerCase('tr').includes(q) || (t.brand || '').toLocaleLowerCase('tr').includes(q)
    )
  }, [types, search])

  const groups = useMemo(() => groupTypesByBrand(filtered), [filtered])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Boya adı zorunludur.')
    const dup = types.some(
      t => t.name.trim().toLocaleLowerCase('tr') === name.trim().toLocaleLowerCase('tr') &&
        (t.brand || '').trim().toLocaleLowerCase('tr') === brand.trim().toLocaleLowerCase('tr')
    )
    if (dup) return setError('Bu boya zaten tanımlı.')

    setLoading(true)
    const ok = await onAdd({ brand: brand.trim(), name: name.trim(), color_code: color.trim() || null })
    setLoading(false)
    if (ok) {
      setName('')
      setColor('')
      setError('')
    } else {
      setError('Kaydedilemedi — bağlantıyı kontrol et.')
    }
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full max-w-lg rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto p-0">
        {/* Başlık */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Boya Tanımları</h2>
            <p className="text-xs text-gray-500">{types.length} boya tanımlı</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Yeni tanım */}
          {showForm ? (
            <form onSubmit={handleAdd} className="flex flex-col gap-3 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Yeni boya tanımla</span>
                {types.length > 0 && (
                  <button type="button" onClick={() => { setShowForm(false); setError('') }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Kapat</button>
                )}
              </div>
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
                  <label className="form-label">Boya Adı</label>
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
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary w-full">+ Yeni Boya Tanımla</button>
          )}

          {/* Arama */}
          {types.length > 4 && (
            <input
              className="form-input"
              placeholder="Tanımlı boyalarda ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          )}

          {/* Liste */}
          {types.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Henüz boya tanımlanmadı.</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Eşleşen boya yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map(({ brand: b, items }) => (
                <div key={b || '—'} className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-900 text-white">
                    <span className="text-xs font-bold uppercase tracking-wider">{b?.trim() || 'Markasız'}</span>
                    <span className="text-[11px] text-gray-300">{items.length} boya</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {items.map(t => (
                      <li key={t.id} className="flex items-center gap-2 px-3 py-2.5">
                        {t.color_code && t.color_code.startsWith('#') ? (
                          <span className="w-5 h-5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: t.color_code }} />
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-gray-200 bg-gray-50 shrink-0" />
                        )}
                        <span className="text-sm text-gray-900 flex-1 min-w-0">
                          <span className="font-medium">{t.name}</span>
                          {t.color_code && <span className="block text-[11px] text-gray-400">{t.color_code}</span>}
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

          <button onClick={onClose} className="btn-secondary w-full">Kapat</button>
        </div>
      </div>
    </div>
  )
}
