import type { Paint, NewPaint, PaintMeta } from './types'
import { isSamePaint } from './types'

const KEY = 'boya-stok-paints'
const EVENT = 'boya-stok-update'

function getAll(): Paint[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(paints: Paint[]) {
  localStorage.setItem(KEY, JSON.stringify(paints))
  window.dispatchEvent(new Event(EVENT))
}

function sorted(paints: Paint[]): Paint[] {
  return [...paints].sort((a, b) => {
    const brand = (a.brand || '').localeCompare(b.brand || '', 'tr')
    return brand !== 0 ? brand : a.name.localeCompare(b.name, 'tr')
  })
}

export function subscribePaints(callback: (paints: Paint[]) => void): () => void {
  const handler = () => callback(sorted(getAll()))
  window.addEventListener(EVENT, handler)
  handler()
  return () => window.removeEventListener(EVENT, handler)
}

/**
 * Stok girişi: aynı boya (marka+ad+SKT+renk) varsa miktarı üstüne ekler,
 * yoksa yeni kayıt açar.
 */
export function localAdd(paint: NewPaint): void {
  const paints = getAll()
  const match = paints.find(p => isSamePaint(p, paint))
  const now = new Date().toISOString()
  if (match) {
    match.quantity += paint.quantity
    match.updated_at = now
    if (paint.notes) match.notes = paint.notes
    saveAll(paints)
    return
  }
  paints.push({
    ...paint,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  })
  saveAll(paints)
}

export function localUpdate(id: string, quantity: number): void {
  saveAll(getAll().map(p =>
    p.id === id ? { ...p, quantity, updated_at: new Date().toISOString() } : p
  ))
}

export function localDelete(id: string): void {
  saveAll(getAll().filter(p => p.id !== id))
}

export function localEdit(id: string, fields: PaintMeta): void {
  saveAll(getAll().map(p =>
    p.id === id ? { ...p, ...fields, updated_at: new Date().toISOString() } : p
  ))
}
