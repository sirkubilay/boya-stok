export interface PaintType {
  id: string
  brand: string
  name: string
  color_code: string | null
  created_at: string
}

export type NewPaintType = Omit<PaintType, 'id' | 'created_at'>

export interface Paint {
  id: string
  type_id: string | null
  brand: string
  name: string
  quantity: number
  unit: string
  expiry_date: string | null
  color_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type NewPaint = Omit<Paint, 'id' | 'created_at' | 'updated_at'>

export type PaintMeta = Partial<Pick<Paint, 'name' | 'brand' | 'color_code' | 'expiry_date'>>

export interface ProjectUsage {
  id: string
  project: string
  paint_id: string
  paint_name: string
  brand: string
  unit: string
  quantity: number
  date: string
  created_at: string
}

export type NewProjectUsage = Omit<ProjectUsage, 'id' | 'created_at'>

const norm = (s: string | null | undefined) => (s ?? '').trim().toLocaleLowerCase('tr')

/**
 * İki stok kaydı birleştirilebilir mi? Aynı tanımlı boya (type_id) +
 * aynı son kullanma tarihi + aynı birim ise stoklar toplanır.
 * type_id yoksa (eski kayıt) marka+ad+renk üzerinden kıyaslanır.
 */
export function isSameStock(
  a: Pick<Paint, 'type_id' | 'brand' | 'name' | 'expiry_date' | 'color_code' | 'unit'>,
  b: Pick<Paint, 'type_id' | 'brand' | 'name' | 'expiry_date' | 'color_code' | 'unit'>,
): boolean {
  if ((a.expiry_date ?? '') !== (b.expiry_date ?? '')) return false
  if (norm(a.unit) !== norm(b.unit)) return false
  if (a.type_id && b.type_id) return a.type_id === b.type_id
  return (
    norm(a.brand) === norm(b.brand) &&
    norm(a.name) === norm(b.name) &&
    norm(a.color_code) === norm(b.color_code)
  )
}
