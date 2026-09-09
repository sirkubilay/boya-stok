import type { ProjectUsage } from './types'

export function fmtQty(n: number): string {
  return n % 1 === 0 ? n.toLocaleString('tr-TR') : n.toFixed(1)
}

/** Kullanım kayıtlarını proje adına göre grupla, her grup içinde tarihe göre (en yeni önce) sırala. */
export function groupByProject(list: ProjectUsage[]): { project: string; items: ProjectUsage[] }[] {
  const map = new Map<string, ProjectUsage[]>()
  for (const u of list) {
    const key = u.project.trim()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(u)
  }
  return [...map.entries()]
    .map(([project, items]) => ({
      project,
      items: [...items].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    }))
    .sort((a, b) => a.project.localeCompare(b.project, 'tr'))
}

/** Birim bazında toplam harcanan miktar metni: "120 litre · 5 kg" */
export function usageTotalsByUnit(items: ProjectUsage[]): string {
  const map = new Map<string, number>()
  for (const u of items) map.set(u.unit, (map.get(u.unit) || 0) + u.quantity)
  return [...map.entries()].map(([u, q]) => `${fmtQty(q)} ${u}`).join(' · ')
}
