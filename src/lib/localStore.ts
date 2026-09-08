import type { Paint, NewPaint, PaintMeta, PaintType, NewPaintType } from './types'
import { isSameStock } from './types'

const KEY = 'boya-stok-paints'
const TYPES_KEY = 'boya-stok-types'
const EVENT = 'boya-stok-update'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(EVENT))
}

const getAll = () => read<Paint>(KEY)
const saveAll = (p: Paint[]) => write(KEY, p)
const getTypes = () => read<PaintType>(TYPES_KEY)
const saveTypes = (t: PaintType[]) => write(TYPES_KEY, t)

function sortPaints(paints: Paint[]): Paint[] {
  return [...paints].sort((a, b) => {
    const brand = (a.brand || '').localeCompare(b.brand || '', 'tr')
    return brand !== 0 ? brand : a.name.localeCompare(b.name, 'tr')
  })
}

function sortTypes(types: PaintType[]): PaintType[] {
  return [...types].sort((a, b) => {
    const brand = (a.brand || '').localeCompare(b.brand || '', 'tr')
    return brand !== 0 ? brand : a.name.localeCompare(b.name, 'tr')
  })
}

export function subscribePaints(callback: (paints: Paint[]) => void): () => void {
  const handler = () => callback(sortPaints(getAll()))
  window.addEventListener(EVENT, handler)
  handler()
  return () => window.removeEventListener(EVENT, handler)
}

export function subscribePaintTypes(callback: (types: PaintType[]) => void): () => void {
  const handler = () => callback(sortTypes(getTypes()))
  window.addEventListener(EVENT, handler)
  handler()
  return () => window.removeEventListener(EVENT, handler)
}

/**
 * Stok girişi: birleştirilebilir kayıt varsa miktarı üstüne ekler,
 * yoksa yeni kayıt açar.
 */
export function localAdd(paint: NewPaint): void {
  const paints = getAll()
  const match = paints.find(p => isSameStock(p, paint))
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

export function localAddType(type: NewPaintType): void {
  const types = getTypes()
  types.push({ ...type, id: crypto.randomUUID(), created_at: new Date().toISOString() })
  saveTypes(types)
}

export function localEditType(id: string, fields: Partial<NewPaintType>): void {
  saveTypes(getTypes().map(t => (t.id === id ? { ...t, ...fields } : t)))
}

export function localDeleteType(id: string): void {
  saveTypes(getTypes().filter(t => t.id !== id))
}
