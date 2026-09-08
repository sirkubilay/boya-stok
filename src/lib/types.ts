export interface Paint {
  id: string
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

/**
 * İki kayıt "aynı boya" mı? Marka + ad + son kullanma tarihi + renk (RAL)
 * hepsi eşitse aynı sayılır ve stok girişleri toplanır.
 */
export function isSamePaint(
  a: Pick<Paint, 'brand' | 'name' | 'expiry_date' | 'color_code'>,
  b: Pick<Paint, 'brand' | 'name' | 'expiry_date' | 'color_code'>,
): boolean {
  const norm = (s: string | null | undefined) => (s ?? '').trim().toLocaleLowerCase('tr')
  return (
    norm(a.brand) === norm(b.brand) &&
    norm(a.name) === norm(b.name) &&
    (a.expiry_date ?? '') === (b.expiry_date ?? '') &&
    norm(a.color_code) === norm(b.color_code)
  )
}
