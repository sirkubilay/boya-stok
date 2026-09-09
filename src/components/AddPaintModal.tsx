'use client'

import { useMemo, useState } from 'react'
import type { NewPaint, Paint, PaintType } from '@/lib/types'
import { groupTypesByBrand } from '@/lib/brands'

interface Props {
  types: PaintType[]
  existingPaints: Paint[]
  onClose: () => void
  onAdd: (paint: NewPaint) => Promise<boolean>
  onManageCatalog: () => void
}

const UNITS = ['litre', 'kg', 'adet', 'kutu', 'varil', 'takım']

export default function AddPaintModal({ types, existingPaints, onClose, onAdd, onManageCatalog }: Props) {
  const [typeId, setTypeId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('litre')
  const [expiry, setExpiry] = useState('')
  const [project, setProject] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const groups = useMemo(() => groupTypesByBrand(types), [types])
  const selected = types.find(t => t.id === typeId) || null

  const existingProjects = useMemo(
    () => [...new Set(existingPaints.map(p => p.project?.trim()).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'tr')),
    [existingPaints]
  )

  // Seçili boya + aynı SKT + aynı birim + aynı proje adında mevcut stok
  const matching = existingPaints.find(
    p => p.type_id === typeId && (p.expiry_date ?? '') === (expiry || '') && p.unit === unit &&
      (p.project?.trim().toLocaleLowerCase('tr') || '') === project.trim().toLocaleLowerCase('tr')
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return setError('Bir boya seçin.')
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) return setError('Geçerli bir miktar girin.')

    setLoading(true)
    const ok = await onAdd({
      type_id: selected.id,
      brand: selected.brand || '',
      name: selected.name,
      quantity: qty,
      unit,
      expiry_date: expiry || null,
      color_code: selected.color_code,
      project: project.trim() || null,
      notes: notes.trim() || null,
    })
    setLoading(false)
    if (ok) onClose()
    else setError('Kaydedilemedi — internet bağlantısını kontrol edip tekrar dene.')
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Stok Girişi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        {types.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-4">
              Önce sisteme boya tanımlamanız gerekiyor.
            </p>
            <button onClick={onManageCatalog} className="btn-primary">Boya Tanımla</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="form-label">Boya *</label>
                <button type="button" onClick={onManageCatalog} className="text-xs text-red-600 hover:underline cursor-pointer mb-1">
                  + Yeni tanımla
                </button>
              </div>
              <select
                className="form-input"
                value={typeId}
                onChange={e => { setTypeId(e.target.value); setError('') }}
                autoFocus
              >
                <option value="">Seçin…</option>
                {groups.map(({ brand, items }) => (
                  <optgroup key={brand || '—'} label={brand?.trim() || 'Markasız'}>
                    {items.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.color_code ? ` · ${t.color_code}` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="form-label">Miktar *</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={quantity}
                  onChange={e => { setQuantity(e.target.value); setError('') }}
                />
              </div>
              <div className="w-28">
                <label className="form-label">Birim</label>
                <select className="form-input" value={unit} onChange={e => setUnit(e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Son Kullanma Tarihi</label>
              <input
                className="form-input"
                type="date"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Proje Adı (opsiyonel)</label>
              <input
                className="form-input"
                placeholder="Örn: Ada 3 Blok İnşaatı"
                list="add-paint-project-list"
                value={project}
                onChange={e => setProject(e.target.value)}
              />
              <datalist id="add-paint-project-list">
                {existingProjects.map(p => <option key={p} value={p!} />)}
              </datalist>
            </div>

            <div>
              <label className="form-label">Not (opsiyonel)</label>
              <input
                className="form-input"
                placeholder="Ek bilgi..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {selected && (
              <p className="text-xs text-gray-400">
                {matching
                  ? `Aynı tarih ve birimde ${matching.quantity} ${matching.unit} stok var — üstüne eklenecek.`
                  : 'Bu tarih/birim için yeni stok kaydı açılacak.'}
              </p>
            )}

            {matching && quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-blue-700">Yeni toplam</span>
                <span className="font-bold text-blue-800 text-lg">
                  {matching.quantity + parseFloat(quantity)} <span className="text-sm font-normal">{unit}</span>
                </span>
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                {loading ? 'Kaydediliyor...' : 'Stok Ekle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
