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

function expiryInfo(expiry_date: string | null): { text: string; className: string } | null {
  if (!expiry_date) return null
  const days = daysUntilExpiry(expiry_date)
  const dateStr = new Date(expiry_date).toLocaleDateString('tr-TR')
  if (days < 0) return { text: `${Math.abs(days)} gün önce geçti · ${dateStr}`, className: 'text-red-600 font-medium' }
  if (days <= 30) return { text: `${days} gün kaldı · ${dateStr}`, className: 'text-yellow-700 font-medium' }
  return { text: dateStr, className: 'text-gray-400' }
}

export default function PaintCard({ paint, onAdjust, onDelete, expired }: Props) {
  const expiry = expiryInfo(paint.expiry_date)
  const metaParts: React.ReactNode[] = []
  if (expiry) metaParts.push(<span key="expiry" className={expiry.className}>{expiry.text}</span>)
  if (paint.color_code && !paint.color_code.startsWith('#')) metaParts.push(<span key="color">{paint.color_code}</span>)
  if (paint.project) metaParts.push(<span key="project">📁 {paint.project}</span>)
  if (paint.notes) metaParts.push(<span key="notes">{paint.notes}</span>)

  return (
    <li className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white transition-colors ${expired ? 'bg-red-50/40' : ''}`}>
      {paint.color_code && paint.color_code.startsWith('#') && (
        <span
          className="w-4 h-4 rounded-full shrink-0 border border-gray-300"
          style={{ backgroundColor: paint.color_code }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {paint.name}
          {paint.brand && <span className="text-gray-400 font-normal"> · {paint.brand}</span>}
        </p>
        {metaParts.length > 0 && (
          <p className="text-[11px] text-gray-400 truncate">
            {metaParts.map((part, i) => (
              <span key={i}>{i > 0 && ' · '}{part}</span>
            ))}
          </p>
        )}
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${paint.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {paint.quantity % 1 === 0 ? paint.quantity : paint.quantity.toFixed(1)}
        <span className="text-xs font-normal text-gray-500 ml-1">{paint.unit}</span>
      </span>
      <button
        onClick={onAdjust}
        className="btn-primary text-xs h-8 px-3 shrink-0"
      >
        Güncelle
      </button>
      <button
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 active:text-red-600 transition-colors rounded-lg hover:bg-red-50 shrink-0 cursor-pointer"
        aria-label="Sil"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
        </svg>
      </button>
    </li>
  )
}
