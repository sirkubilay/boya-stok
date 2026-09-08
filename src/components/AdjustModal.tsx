'use client'

import { useState } from 'react'
import type { Paint, PaintMeta } from '@/lib/types'

interface Props {
  paint: Paint
  onClose: () => void
  onAdjust: (id: string, delta: number) => Promise<boolean>
  onEdit: (id: string, fields: PaintMeta) => Promise<boolean>
}

export default function AdjustModal({ paint, onClose, onAdjust, onEdit }: Props) {
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState(paint.name)
  const [brand, setBrand] = useState(paint.brand || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const parsed = parseFloat(amount)
  const previewQty = !isNaN(parsed)
    ? Math.max(0, paint.quantity + (mode === 'add' ? parsed : -parsed))
    : paint.quantity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Boya adı boş olamaz.')
    if (isNaN(parsed) || parsed <= 0) return setError('Geçerli bir miktar girin.')
    if (mode === 'remove' && parsed > paint.quantity) return setError(`Maksimum ${paint.quantity} ${paint.unit} çıkarabilirsiniz.`)

    setLoading(true)
    const meta: PaintMeta = {}
    if (name.trim() !== paint.name) meta.name = name.trim()
    if (brand.trim() !== (paint.brand || '')) meta.brand = brand.trim()
    let ok = true
    if (Object.keys(meta).length > 0) ok = await onEdit(paint.id, meta)
    const delta = mode === 'add' ? parsed : -parsed
    if (ok) ok = await onAdjust(paint.id, delta)
    setLoading(false)
    if (ok) onClose()
    else setError('Kaydedilemedi — internet bağlantısını kontrol edip tekrar dene.')
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Stok Güncelle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="w-32">
            <label className="form-label">Marka</label>
            <input
              className="form-input"
              value={brand}
              onChange={e => { setBrand(e.target.value); setError('') }}
            />
          </div>
          <div className="flex-1">
            <label className="form-label">Boya Adı</label>
            <input
              className="form-input"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
            />
          </div>
        </div>

        {(paint.color_code || paint.expiry_date) && (
          <p className="text-xs text-gray-400 mb-3">
            {paint.color_code && <>Renk: {paint.color_code}</>}
            {paint.color_code && paint.expiry_date && ' · '}
            {paint.expiry_date && <>SKT: {new Date(paint.expiry_date).toLocaleDateString('tr-TR')}</>}
          </p>
        )}

        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Mevcut stok</span>
          <span className="font-bold text-lg">{paint.quantity} <span className="text-sm font-normal text-gray-500">{paint.unit}</span></span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode('add'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === 'add' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              + Giriş (Ekle)
            </button>
            <button
              type="button"
              onClick={() => { setMode('remove'); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === 'remove' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              − Çıkış (Çıkar)
            </button>
          </div>

          <div>
            <label className="form-label">
              {mode === 'add' ? 'Eklenecek miktar' : 'Çıkarılacak miktar'} ({paint.unit})
            </label>
            <input
              className="form-input text-lg font-bold"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          {amount && !isNaN(parsed) && parsed > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Yeni stok</span>
              <span className="font-bold text-blue-800 text-lg">
                {previewQty} <span className="text-sm font-normal">{paint.unit}</span>
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 font-semibold text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-60 ${
                mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Kaydediliyor...' : mode === 'add' ? 'Ekle' : 'Çıkar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
