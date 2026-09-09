'use client'

import { useState } from 'react'
import type { ProjectUsage } from '@/lib/types'
import { groupByProject, usageTotalsByUnit, fmtQty } from '@/lib/projects'

interface Props {
  usages: ProjectUsage[]
  onDelete: (usage: ProjectUsage) => void
}

export default function ProjectPanel({ usages, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const groups = groupByProject(usages)

  function toggle(project: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(project)) next.delete(project)
      else next.add(project)
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-3">📋</div>
        <p>Henüz proje kullanımı kaydedilmedi.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ project, items }) => {
        const isCollapsed = collapsed.has(project)
        return (
          <section key={project} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggle(project)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-white bg-gray-900 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-white/70 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span className="text-sm font-bold uppercase tracking-wider truncate">{project}</span>
                <span className="text-[11px] text-white/60 shrink-0">{items.length} kayıt</span>
              </div>
              <span className="text-xs font-semibold text-white/90 shrink-0">Toplam: {usageTotalsByUnit(items)}</span>
            </button>
            {!isCollapsed && (
              <ul className="divide-y divide-gray-100 bg-gray-50">
                {items.map(u => (
                  <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {u.paint_name}
                        {u.brand && <span className="text-gray-400 font-normal"> · {u.brand}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(u.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">
                      {fmtQty(u.quantity)} <span className="text-xs font-normal text-gray-500">{u.unit}</span>
                    </span>
                    <button
                      onClick={() => onDelete(u)}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 shrink-0 cursor-pointer"
                      aria-label="Kaydı sil"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
