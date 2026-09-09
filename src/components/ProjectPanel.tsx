'use client'

import { useState } from 'react'
import type { Paint, ProjectUsage } from '@/lib/types'
import { usageTotalsByUnit, fmtQty } from '@/lib/projects'
import { totalsByUnit } from '@/lib/brands'

interface Props {
  paints: Paint[]
  usages: ProjectUsage[]
  onAdjust: (paint: Paint) => void
  onDeleteUsage: (usage: ProjectUsage) => void
}

interface ProjectGroup {
  project: string
  paints: Paint[]
  usages: ProjectUsage[]
}

function groupByProject(paints: Paint[], usages: ProjectUsage[]): ProjectGroup[] {
  const names = new Set<string>()
  for (const p of paints) if (p.project?.trim()) names.add(p.project.trim())
  for (const u of usages) if (u.project?.trim()) names.add(u.project.trim())

  return [...names]
    .sort((a, b) => a.localeCompare(b, 'tr'))
    .map(project => ({
      project,
      paints: paints
        .filter(p => (p.project || '').trim() === project)
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
      usages: usages
        .filter(u => u.project.trim() === project)
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    }))
}

export default function ProjectPanel({ paints, usages, onAdjust, onDeleteUsage }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const groups = groupByProject(paints, usages)

  function toggle(project: string) {
    setExpanded(prev => {
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
        <p>Henüz proje adıyla boya eklenmedi.</p>
        <p className="text-xs mt-1">&quot;+ Boya Ekle&quot;de proje adı girerek başlayabilirsin.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ project, paints: projectPaints, usages: projectUsages }) => {
        const isCollapsed = !expanded.has(project)
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
                <span className="text-[11px] text-white/60 shrink-0">{projectPaints.length} boya</span>
              </div>
              <span className="text-xs font-semibold text-white/90 shrink-0">
                {projectUsages.length > 0 && <>Çıkarılan: {usageTotalsByUnit(projectUsages)}</>}
              </span>
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-gray-50">
                {/* Sol: Eklenen boyalar */}
                <div>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Eklenen{projectPaints.length > 0 && <span className="font-normal normal-case"> · {totalsByUnit(projectPaints)}</span>}
                  </p>
                  {projectPaints.length === 0 ? (
                    <p className="px-4 pb-3 text-xs text-gray-400">Bu projeye eklenmiş boya yok.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {projectPaints.map(p => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => onAdjust(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {p.name}
                                {p.brand && <span className="text-gray-400 font-normal"> · {p.brand}</span>}
                              </p>
                              <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums shrink-0 ${p.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {fmtQty(p.quantity)} <span className="text-xs font-normal text-gray-500">{p.unit}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Sağ: Çıkarımlar */}
                <div>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Çıkarılan{projectUsages.length > 0 && <span className="font-normal normal-case"> · {usageTotalsByUnit(projectUsages)}</span>}
                  </p>
                  {projectUsages.length === 0 ? (
                    <p className="px-4 pb-3 text-xs text-gray-400">Henüz çıkarım yapılmadı.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {projectUsages.map(u => (
                        <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {u.paint_name}
                              {u.brand && <span className="text-gray-400 font-normal"> · {u.brand}</span>}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(u.date).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <span className="text-sm font-bold text-red-600 tabular-nums shrink-0">
                            −{fmtQty(u.quantity)} <span className="text-xs font-normal text-gray-500">{u.unit}</span>
                          </span>
                          <button
                            onClick={() => onDeleteUsage(u)}
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
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
