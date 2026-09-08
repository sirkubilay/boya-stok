import type { Paint, NewPaint } from './types'

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
  return [...paints].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

export function subscribePaints(callback: (paints: Paint[]) => void): () => void {
  const handler = () => callback(sorted(getAll()))
  window.addEventListener(EVENT, handler)
  handler()
  return () => window.removeEventListener(EVENT, handler)
}

export function localAdd(paint: NewPaint): void {
  const paints = getAll()
  paints.push({
    ...paint,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

export function localRename(id: string, name: string): void {
  saveAll(getAll().map(p =>
    p.id === id ? { ...p, name, updated_at: new Date().toISOString() } : p
  ))
}
