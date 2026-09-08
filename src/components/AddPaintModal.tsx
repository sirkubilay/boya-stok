'use client'

import { useMemo, useState } from 'react'
import type { NewPaint, Paint } from '@/lib/types'

interface Props {
  existingPaints: Paint[]
  onClose: () => void
  onAdd: (paint: NewPaint) => Promise<void>
}

const UNITS = ['litre', 'kg', 'adet', 'kutu', 'varil']

export default function AddPaintModal({ existingPaints, onClose, onAdd }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>(
    existingPaints.length > 0 ? 'existing' : 'new'
  )

  // --- Mevcut boyaya stok girişi ---
  const [selectedId, setSelectedId] = useState('')
  const [addQty, setAddQty] = useState('')

  // --- Yeni boya tanımı ---
  const [form, setForm] = useState({
    brand: '',
    name: '',
    quantity: '',
    unit: 'litre',
    expiry_date: '',
    color_code: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const brandOptions = useMemo(
    () => [...new Set(existingPaints.map(p => p.brand?.trim()).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, 'tr')),
    [existingPaints]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Paint[]>()
    for (const p of [...existingPaints].sort((a, b) => a.name.localeCompare(b.name, 'tr'))) {
      const key = p.brand?.trim() || 'Markasız'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return [...map.entries()]
  }, [existingPaints])

  const selected = existingPaints.find(p => p.id === selectedId) || null

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'existing') {
      if (!selected) return setError('Bir boya seçin.')
      const qty = parseFloat(addQty)
      if (isNaN(qty) || qty <= 0) return setError('Eklenecek miktarı girin.')
      setLoading(true)
      await onAdd({
        brand: selected.brand || '',
        name: selected.name,
        quantity: qty,
        unit: selected.unit,
        expiry_date: selected.expiry_date,
        color_code: selected.color_code,
        notes: null,
      })
      setLoading(false)
      onClose()
      return
    }

    // mode === 'new'
    if (!form.name.trim()) return setError('Boya adı zorunludur.')
    const qty = parseFloat(form.quantity)
    if (isNaN(qty) || qty < 0) return setError('Geçerli bir adet/miktar girin.')

    setLoading(true)
    await onAdd({
      brand: form.brand.trim(),
      name: form.name.trim(),
      quantity: qty,
      unit: form.unit,
      expiry_date: form.expiry_date || null,
      color_code: form.color_code.trim() || null,
      notes: form.notes.trim() || null,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Boya Ekle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        {existingPaints.length > 0 && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => { setMode('existing'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === 'existing' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Mevcut boyaya ekle
            </button>
            <button
              type="button"
              onClick={() => { setMode('new'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === 'new' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Yeni boya tanıt
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'existing' ? (
            <>
              <div>
                <label className="form-label">Boya</label>
                <select
                  className="form-input"
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setError('') }}
                  autoFocus
                >
                  <option value="">Seçin…</option>
                  {grouped.map(([brand, items]) => (
                    <optgroup key={brand} label={brand}>
                      {items.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.color_code ? ` · ${p.color_code}` : ''}
                          {p.expiry_date ? ` · SKT ${new Date(p.expiry_date).toLocaleDateString('tr-TR')}` : ''}
                          {` — ${p.quantity} ${p.unit}`}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {selected && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 flex items-center justify-between">
                  <span>Mevcut stok</span>
                  <span className="font-bold text-gray-900">{selected.quantity} {selected.unit}</span>
                </div>
              )}

              <div>
                <label className="form-label">Eklenecek miktar {selected ? `(${selected.unit})` : ''}</label>
                <input
                  className="form-input text-lg font-bold"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={addQty}
                  onChange={e => { setAddQty(e.target.value); setError('') }}
                />
              </div>

              {selected && addQty && !isNaN(parseFloat(addQty)) && parseFloat(addQty) > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700">Yeni toplam</span>
                  <span className="font-bold text-blue-800 text-lg">
                    {selected.quantity + parseFloat(addQty)} <span className="text-sm font-normal">{selected.unit}</span>
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="form-label">Marka</label>
                <input
                  className="form-input"
                  placeholder="Örn: Hempel, Jotun"
                  list="brand-list"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                />
                <datalist id="brand-list">
                  {brandOptions.map(b => <option key={b} value={b!} />)}
                </datalist>
              </div>

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
                <label className="form-label">Renk Kodu / RAL (opsiyonel)</label>
                <div className="flex gap-2 items-center">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="#FFFFFF veya RAL 9010"
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
                <p className="text-xs text-gray-400 mt-1">
                  Aynı ad, aynı SKT ve aynı renk = stoklar toplanır. Farklıysa ayrı gösterilir.
                </p>
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
            </>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Kaydediliyor...' : mode === 'existing' ? 'Stok Ekle' : 'Boya Tanıt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
