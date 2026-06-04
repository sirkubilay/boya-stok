export interface Paint {
  id: string
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
