'use client'

import type { Paint } from '@/lib/types'

interface Props {
  paint: Paint
  onAdjust: () => void
  onDelete: () => void
  expired?: boolean
}

function daysUntilExpiry(expiry_date: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expiry_date)
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ expiry_date }: { expiry_date: string | null }) {
  if (!expiry_date) return <span className="text-xs text-gray-400">Son kullanma tarihi yok</span>

  const days = daysUntilExpiry(expiry_date)
  const dateStr = new Date(expiry_date).toLocaleDateString('tr-TR')

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
        {Math.abs(days)} gün önce geçti · {dateStr}
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block shrink-0" />
        {days} gün kaldı · {dateStr}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
      {dateStr}
    </span>
  )
}

export default function PaintCard({ paint, onAdjust, onDelete, expired }: Props) {
  return (
    <div className={`card p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform ${expired ? 'opacity-80 border-red-200 bg-red-50/20' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {paint.color_code && (
            <div
              className="w-6 h-6 rounded-full shrink-0 border-2 border-white shadow"
              style={{ backgroundColor: paint.color_code }}
            />
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{paint.name}</h3>
        </div>
        {/* Delete — minimum 44x44 touch target */}
        <button
          onClick={onDelete}
          className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 active:text-red-600 transition-colors rounded-lg hover:bg-red-50 shrink-0 cursor-pointer"
          aria-label="Sil"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>

      {/* Quantity row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className={`text-3xl font-bold tabular-nums ${paint.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {paint.quantity % 1 === 0 ? paint.quantity : paint.quantity.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 ml-1.5">{paint.unit}</span>
          {paint.quantity === 0 && (
            <p className="text-xs text-red-500 font-semibold mt-0.5">Stok tükendi</p>
          )}
        </div>
        {/* Update button — big touch target */}
        <button
          onClick={onAdjust}
          className="btn-primary text-sm min-w-[90px] h-11"
        >
          Güncelle
        </button>
      </div>

      {paint.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 line-clamp-1">{paint.notes}</p>
      )}

      <ExpiryBadge expiry_date={paint.expiry_date} />
    </div>
  )
}
