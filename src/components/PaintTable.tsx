'use client'

import type { Paint } from '@/lib/types'

interface Props {
  groups: { brand: string; items: Paint[] }[]
  expired?: boolean
  onRowClick: (paint: Paint) => void
}

function fmtQty(n: number): string {
  return n % 1 === 0 ? n.toLocaleString('tr-TR') : n.toFixed(1)
}

/** Birim bazında toplam: "120 litre · 5 kg" */
function totalsByUnit(items: Paint[]): string {
  const map = new Map<string, number>()
  for (const p of items) map.set(p.unit, (map.get(p.unit) || 0) + p.quantity)
  return [...map.entries()].map(([u, q]) => `${fmtQty(q)} ${u}`).join(' · ')
}

export default function PaintTable({ groups, expired, onRowClick }: Props) {
  const allItems = groups.flatMap(g => g.items)

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
            <th className="px-4 py-3 font-medium">Boya</th>
            <th className="px-4 py-3 font-medium">Renk / RAL</th>
            <th className="px-4 py-3 font-medium">Son Kullanma</th>
            <th className="px-4 py-3 font-medium text-right">Miktar</th>
          </tr>
        </thead>
        {groups.map(({ brand, items }) => (
          <tbody key={brand || '—'} className="border-b border-gray-100 last:border-0">
            <tr className="bg-gray-50">
              <td colSpan={3} className="px-4 py-2 font-bold text-gray-900 uppercase text-xs tracking-wide">
                {brand?.trim() || 'Markasız'}
              </td>
              <td className="px-4 py-2 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">
                {totalsByUnit(items)}
              </td>
            </tr>
            {items.map(p => {
              const past = p.expiry_date && p.expiry_date < new Date().toISOString().split('T')[0]
              return (
                <tr
                  key={p.id}
                  onClick={() => onRowClick(p)}
                  className="border-t border-gray-100 hover:bg-red-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      {p.color_code && p.color_code.startsWith('#') && (
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shrink-0 inline-block"
                          style={{ backgroundColor: p.color_code }}
                        />
                      )}
                      {p.color_code || '—'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${past ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${p.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {fmtQty(p.quantity)} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        ))}
        {groups.length > 1 && (
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td colSpan={3} className="px-4 py-3 font-bold text-gray-900">Genel Toplam</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                {totalsByUnit(allItems)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      {expired && (
        <p className="px-4 py-2 text-xs text-red-500 bg-red-50/40">Süresi geçmiş boyalar gösteriliyor.</p>
      )}
    </div>
  )
}
