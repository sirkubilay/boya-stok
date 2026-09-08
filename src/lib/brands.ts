import type { Paint, PaintType } from './types'

/** Sık kullanılan markalar listenin başında gösterilir. */
export const PINNED_BRANDS = ['Hempel', 'Jotun']

export function brandRank(b: string): number {
  const i = PINNED_BRANDS.findIndex(x => x.toLocaleLowerCase('tr') === b.toLocaleLowerCase('tr'))
  if (i !== -1) return i
  if (!b) return 999
  return 100
}

export function brandLabel(b: string): string {
  return b?.trim() || 'Markasız'
}

export function isPinnedBrand(b: string): boolean {
  return PINNED_BRANDS.some(x => x.toLocaleLowerCase('tr') === (b || '').trim().toLocaleLowerCase('tr'))
}

function fmtQty(n: number): string {
  return n % 1 === 0 ? n.toLocaleString('tr-TR') : n.toFixed(1)
}

/** Birim bazında toplam metni: "120 litre · 5 kg" */
export function totalsByUnit(items: Paint[]): string {
  const map = new Map<string, number>()
  for (const p of items) map.set(p.unit, (map.get(p.unit) || 0) + p.quantity)
  return [...map.entries()].map(([u, q]) => `${fmtQty(q)} ${u}`).join(' · ')
}

export function sortBrands(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const r = brandRank(a) - brandRank(b)
    return r !== 0 ? r : a.localeCompare(b, 'tr')
  })
}

function groupByBrandGeneric<T extends { brand: string; name: string }>(
  list: T[],
): { brand: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const p of list) {
    const key = p.brand?.trim() || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.entries()]
    .map(([brand, items]) => ({
      brand,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    }))
    .sort((a, b) => {
      const r = brandRank(a.brand) - brandRank(b.brand)
      return r !== 0 ? r : a.brand.localeCompare(b.brand, 'tr')
    })
}

export const groupByBrand = (list: Paint[]) => groupByBrandGeneric(list)
export const groupTypesByBrand = (list: PaintType[]) => groupByBrandGeneric(list)
