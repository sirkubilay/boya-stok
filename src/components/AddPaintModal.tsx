'use client'

import { useState } from 'react'
import type { NewPaint } from '@/lib/types'

interface Props {
  onClose: () => void
  onAdd: (paint: NewPaint) => Promise<void>
}

const UNITS = ['litre', 'kg', 'adet', 'kutu', 'varil']

export default function AddPaintModal({ onClose, onAdd }: Props) {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: 'litre',
    expiry_date: '',
    color_code: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Boya adı zorunludur.')
    const qty = parseFloat(form.quantity)
    if (isNaN(qty) || qty < 0) return setError('Geçerli bir adet/miktar girin.')

    setLoading(true)
    await onAdd({
      name: form.name.trim(),
      quantity: qty,
      unit: form.unit,
      expiry_date: form.expiry_date || null,
      color_code: form.color_code || null,
      notes: form.notes.trim() || null,
    })
    setLoading(false)
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Yeni Boya Ekle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Boya Adı *</label>
            <input
              className="form-input"
              placeholder="Örn: Beyaz Mat Boya"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
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
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
              />
            </div>
            <div className="w-28">
              <label className="form-label">Birim</label>
              <select
                className="form-input"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Son Kullanma Tarihi</label>
            <input
              className="form-input"
              type="date"
              value={form.expiry_date}
              onChange={e => set('expiry_date', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Renk Kodu (opsiyonel)</label>
            <div className="flex gap-2 items-center">
              <input
                className="form-input"
                type="text"
                placeholder="#FFFFFF veya ral:9010"
                value={form.color_code}
                onChange={e => set('color_code', e.target.value)}
              />
              {form.color_code && form.color_code.startsWith('#') && (
                <div
                  className="w-9 h-9 rounded-lg border border-gray-300 shrink-0"
                  style={{ backgroundColor: form.color_code }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Not (opsiyonel)</label>
            <input
              className="form-input"
              placeholder="Ek bilgi..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
