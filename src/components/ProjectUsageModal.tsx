'use client'

import { useState } from 'react'
import type { Paint, NewProjectUsage } from '@/lib/types'

interface Props {
  paints: Paint[]
  existingProjects: string[]
  onClose: () => void
  onAdd: (usage: NewProjectUsage) => Promise<boolean>
}

const TODAY = new Date().toISOString().split('T')[0]

export default function ProjectUsageModal({ paints, existingProjects, onClose, onAdd }: Props) {
  const [project, setProject] = useState('')
  const [paintId, setPaintId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(TODAY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const usable = paints.filter(p => p.quantity > 0).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  const selected = usable.find(p => p.id === paintId)
  const parsed = parseFloat(amount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project.trim()) return setError('Proje adı boş olamaz.')
    if (!selected) return setError('Bir boya seçin.')
    if (isNaN(parsed) || parsed <= 0) return setError('Geçerli bir miktar girin.')
    if (parsed > selected.quantity) return setError(`Stokta sadece ${selected.quantity} ${selected.unit} var.`)
    if (!date) return setError('Tarih seçin.')

    setLoading(true)
    const ok = await onAdd({
      project: project.trim(),
      paint_id: selected.id,
      paint_name: selected.name,
      brand: selected.brand || '',
      unit: selected.unit,
      quantity: parsed,
      date,
    })
    setLoading(false)
    if (ok) onClose()
    else setError('Kaydedilemedi — internet bağlantısını kontrol edip tekrar dene.')
  }

  return (
    <div className="modal-overlay items-end sm:items-center" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box w-full rounded-b-none sm:rounded-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Proje Kullanımı Ekle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Proje Adı</label>
            <input
              className="form-input"
              placeholder="Örn: Ada 3 Blok İnşaatı"
              list="project-name-list"
              value={project}
              onChange={e => { setProject(e.target.value); setError('') }}
              autoFocus
            />
            <datalist id="project-name-list">
              {existingProjects.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div>
            <label className="form-label">Boya</label>
            <select
              className="form-input"
              value={paintId}
              onChange={e => { setPaintId(e.target.value); setError('') }}
            >
              <option value="">Boya seçin...</option>
              {usable.map(p => (
                <option key={p.id} value={p.id}>
                  {p.brand ? `${p.brand} — ${p.name}` : p.name} ({p.quantity} {p.unit})
                </option>
              ))}
            </select>
            {paints.length > 0 && usable.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Stokta boya kalmadı.</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="form-label">
                Çıkarılacak miktar {selected ? `(${selected.unit})` : ''}
              </label>
              <input
                className="form-input text-lg font-bold"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="0"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError('') }}
              />
            </div>
            <div className="flex-1">
              <label className="form-label">Tarih</label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setError('') }}
              />
            </div>
          </div>

          {selected && amount && !isNaN(parsed) && parsed > 0 && parsed <= selected.quantity && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Kalan stok</span>
              <span className="font-bold text-blue-800 text-lg">
                {Math.max(0, selected.quantity - parsed)} <span className="text-sm font-normal">{selected.unit}</span>
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">İptal</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
