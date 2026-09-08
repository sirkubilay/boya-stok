import type { Paint } from './types'

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

export function sortBrands(list: string[]): string[] {
  return [...list].sort((a, b) => {
    const r = brandRank(a) - brandRank(b)
    return r !== 0 ? r : a.localeCompare(b, 'tr')
  })
}

export function groupByBrand(list: Paint[]): { brand: string; items: Paint[] }[] {
  const map = new Map<string, Paint[]>()
  for (const p of list) {
    const key = p.brand?.trim() || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.entries()]
    .map(([brand, items]) => ({ brand, items }))
    .sort((a, b) => {
      const r = brandRank(a.brand) - brandRank(b.brand)
      return r !== 0 ? r : a.brand.localeCompare(b.brand, 'tr')
    })
}
