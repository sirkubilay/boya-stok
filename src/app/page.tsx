'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, setDoc, serverTimestamp, query, orderBy, increment, writeBatch
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  subscribePaints, subscribePaintTypes, subscribeProjectUsages,
  localAdd, localUpdate, localDelete, localEdit, localAddType, localDeleteType,
  localAddUsage, localDeleteUsage,
} from '@/lib/localStore'
import { isSameStock } from '@/lib/types'
import type { Paint, NewPaint, PaintMeta, PaintType, NewPaintType, ProjectUsage, NewProjectUsage } from '@/lib/types'
import { brandLabel, groupByBrand, sortBrands, isPinnedBrand, totalsByUnit } from '@/lib/brands'
import Header from '@/components/Header'
import PaintCard from '@/components/PaintCard'
import PaintTable from '@/components/PaintTable'
import AddPaintModal from '@/components/AddPaintModal'
import AdjustModal from '@/components/AdjustModal'
import CatalogModal from '@/components/CatalogModal'
import ProjectPanel from '@/components/ProjectPanel'
import ProjectUsageModal from '@/components/ProjectUsageModal'

// .trim() BOM/görünmez karakterleri de temizler
const USE_LOCAL = process.env.NEXT_PUBLIC_USE_LOCAL?.trim() === 'true'
const TODAY = new Date().toISOString().split('T')[0]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  }
  return (
    <div className="card px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color ? colorMap[color] : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function Home() {
  const [paints, setPaints] = useState<Paint[]>([])
  const [types, setTypes] = useState<PaintType[]>([])
  const [usages, setUsages] = useState<ProjectUsage[]>([])
  const [firebaseError, setFirebaseError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
  const [view, setView] = useState<'card' | 'table' | 'project'>('card')
  const [brandFilter, setBrandFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Paint | null>(null)
  const [search, setSearch] = useState('')
  const [sync, setSync] = useState<{ fromCache: boolean; pending: boolean }>({ fromCache: true, pending: false })
  // Markalar başlangıçta kapalı gelir; açılanlar burada tutulur.
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())

  function toggleBrandCollapse(brand: string) {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
  }

  useEffect(() => {
    if (USE_LOCAL) {
      const saved = localStorage.getItem('boya-stok-last-op')
      if (saved) setLastUpdated(saved)
      const unsubP = subscribePaints(setPaints)
      const unsubT = subscribePaintTypes(setTypes)
      const unsubU = subscribeProjectUsages(setUsages)
      return () => { unsubP(); unsubT(); unsubU() }
    }

    const q = query(collection(getDb(), 'paints'), orderBy('name'))
    const unsubPaints = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        type_id: null,
        brand: '',
        ...d.data(),
        created_at: d.data().created_at?.toDate?.()?.toISOString() ?? '',
        updated_at: d.data().updated_at?.toDate?.()?.toISOString() ?? '',
      })) as Paint[]
      setPaints(data)
      setSync({ fromCache: snapshot.metadata.fromCache, pending: snapshot.metadata.hasPendingWrites })
      if (!snapshot.metadata.fromCache) setFirebaseError('')
    }, (err) => {
      setFirebaseError('Veriler okunamadı: ' + err.message)
    })

    const unsubTypes = onSnapshot(
      query(collection(getDb(), 'paint_types'), orderBy('name')),
      (snapshot) => {
        setTypes(snapshot.docs.map(d => ({
          id: d.id,
          color_code: null,
          ...d.data(),
          created_at: d.data().created_at?.toDate?.()?.toISOString() ?? '',
        })) as PaintType[])
      },
    )

    const unsubMeta = onSnapshot(doc(getDb(), 'meta', 'status'), (snap) => {
      if (snap.exists()) {
        const ts = snap.data().lastUpdated?.toDate?.()?.toISOString() ?? ''
        if (ts) setLastUpdated(ts)
      }
    })

    const unsubUsages = onSnapshot(
      query(collection(getDb(), 'project_usages'), orderBy('date', 'desc')),
      (snapshot) => {
        setUsages(snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          created_at: d.data().created_at?.toDate?.()?.toISOString() ?? '',
        })) as ProjectUsage[])
      },
    )

    return () => { unsubPaints(); unsubTypes(); unsubMeta(); unsubUsages() }
  }, [])

  async function recordUpdate() {
    if (USE_LOCAL) {
      const now = new Date().toISOString()
      localStorage.setItem('boya-stok-last-op', now)
      setLastUpdated(now)
    } else {
      await setDoc(doc(getDb(), 'meta', 'status'), {
        lastUpdated: serverTimestamp(),
      })
    }
  }

  const activePaints = paints.filter(p => !p.expiry_date || p.expiry_date >= TODAY)
  const expiredPaints = paints.filter(p => p.expiry_date && p.expiry_date < TODAY)
  const soonExpiring = activePaints.filter(p => {
    if (!p.expiry_date) return false
    const days = Math.ceil((new Date(p.expiry_date).getTime() - new Date(TODAY).getTime()) / 86400000)
    return days <= 30
  })

  const brands = sortBrands([...new Set(paints.map(p => p.brand?.trim() || '').filter(Boolean))])

  const displayList = (activeTab === 'active' ? activePaints : expiredPaints)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !brandFilter || (p.brand?.trim() || '') === brandFilter)

  const groups = groupByBrand(displayList)

  const projectNames = [...new Set(usages.map(u => u.project.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'))
  const displayUsages = usages.filter(u =>
    !search || u.project.toLowerCase().includes(search.toLowerCase()) || u.paint_name.toLowerCase().includes(search.toLowerCase())
  )

  // Firestore yazma işlemini sarar. Hata olursa görünür uyarı verir + false döner.
  // Çevrimdışıysa yazma cihazda kuyruğa alınır; 6 sn içinde ack gelmezse "kuyrukta" kabul edip devam ederiz.
  async function runWrite(label: string, fn: () => void | Promise<void>): Promise<boolean> {
    try {
      const QUEUED = Symbol('queued')
      const res = await Promise.race([
        Promise.resolve(fn()).then(() => 'ok' as const),
        new Promise<typeof QUEUED>(r => setTimeout(() => r(QUEUED), 6000)),
      ])
      if (res === QUEUED) {
        setFirebaseError('Bağlantı yavaş — kayıt cihaza alındı, internet gelince otomatik gönderilecek.')
      }
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const full = label + ': ' + msg
      setFirebaseError(full)
      if (typeof window !== 'undefined') window.alert(full)
      return false
    }
  }

  async function handleAddPaint(paint: NewPaint): Promise<boolean> {
    const match = paints.find(p => isSameStock(p, paint))
    const ok = await runWrite('Boya kaydedilemedi', async () => {
      if (USE_LOCAL) return localAdd(paint)
      if (match) {
        await updateDoc(doc(getDb(), 'paints', match.id), {
          quantity: increment(paint.quantity),
          ...(paint.notes ? { notes: paint.notes } : {}),
          updated_at: serverTimestamp(),
        })
      } else {
        await addDoc(collection(getDb(), 'paints'), {
          ...paint,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        })
      }
    })
    if (ok) await recordUpdate()
    return ok
  }

  async function handleAdjust(id: string, delta: number): Promise<boolean> {
    const paint = paints.find(p => p.id === id)
    if (!paint) return false
    const newQty = Math.max(0, paint.quantity + delta)
    const ok = await runWrite('Miktar güncellenemedi', async () => {
      if (USE_LOCAL) return localUpdate(id, newQty)
      await updateDoc(doc(getDb(), 'paints', id), { quantity: newQty, updated_at: serverTimestamp() })
    })
    if (ok) await recordUpdate()
    return ok
  }

  async function handleEditMeta(id: string, fields: PaintMeta): Promise<boolean> {
    const ok = await runWrite('Bilgiler güncellenemedi', async () => {
      if (USE_LOCAL) return localEdit(id, fields)
      await updateDoc(doc(getDb(), 'paints', id), { ...fields, updated_at: serverTimestamp() })
    })
    if (ok) await recordUpdate()
    return ok
  }

  async function handleAddType(type: NewPaintType): Promise<boolean> {
    return runWrite('Boya tanımlanamadı', async () => {
      if (USE_LOCAL) return localAddType(type)
      await addDoc(collection(getDb(), 'paint_types'), { ...type, created_at: serverTimestamp() })
    })
  }

  async function handleDeleteType(id: string): Promise<boolean> {
    return runWrite('Tanım silinemedi', async () => {
      if (USE_LOCAL) return localDeleteType(id)
      await deleteDoc(doc(getDb(), 'paint_types', id))
    })
  }

  async function handleAddUsage(usage: NewProjectUsage): Promise<boolean> {
    const paint = paints.find(p => p.id === usage.paint_id)
    if (!paint) return false
    const ok = await runWrite('Kullanım kaydedilemedi', async () => {
      if (USE_LOCAL) return localAddUsage(usage)
      const batch = writeBatch(getDb())
      batch.update(doc(getDb(), 'paints', usage.paint_id), {
        quantity: Math.max(0, paint.quantity - usage.quantity),
        updated_at: serverTimestamp(),
      })
      batch.set(doc(collection(getDb(), 'project_usages')), {
        ...usage,
        created_at: serverTimestamp(),
      })
      await batch.commit()
    })
    if (ok) await recordUpdate()
    return ok
  }

  async function handleDeleteUsage(usage: ProjectUsage) {
    if (!confirm(`"${usage.project}" projesindeki bu kullanım kaydı silinsin mi? ${usage.quantity} ${usage.unit} stoğa geri eklenecek.`)) return
    const paint = paints.find(p => p.id === usage.paint_id)
    const ok = await runWrite('Kullanım silinemedi', async () => {
      if (USE_LOCAL) return localDeleteUsage(usage.id)
      const batch = writeBatch(getDb())
      if (paint) {
        batch.update(doc(getDb(), 'paints', usage.paint_id), {
          quantity: paint.quantity + usage.quantity,
          updated_at: serverTimestamp(),
        })
      }
      batch.delete(doc(getDb(), 'project_usages', usage.id))
      await batch.commit()
    })
    if (ok) await recordUpdate()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu boyayı silmek istediğinizden emin misiniz?')) return
    const ok = await runWrite('Boya silinemedi', async () => {
      if (USE_LOCAL) return localDelete(id)
      await deleteDoc(doc(getDb(), 'paints', id))
    })
    if (ok) await recordUpdate()
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      <Header />

      {USE_LOCAL && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-xs text-blue-700">
          Demo modu — veriler bu tarayıcıda saklanıyor.
        </div>
      )}

      {firebaseError && (
        <div className="sticky top-0 z-50 bg-red-600 text-white px-4 py-2.5 flex items-start gap-2 text-sm shadow">
          <span className="font-bold shrink-0">Hata:</span>
          <span className="flex-1 break-words">{firebaseError}</span>
          <button onClick={() => setFirebaseError('')} className="shrink-0 text-white/80 hover:text-white text-lg leading-none cursor-pointer">×</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Son güncelleme */}
        {lastUpdated && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Son güncelleme: <strong className="text-gray-700">{formatDate(lastUpdated)}</strong></span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Toplam Çeşit" value={paints.length} />
          <StatCard label="Yakın Tarihli" value={soonExpiring.length} color="yellow" />
          <StatCard label="Süresi Geçmiş" value={expiredPaints.length} color="red" />
        </div>

        {soonExpiring.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <span className="text-yellow-500 text-lg leading-none mt-0.5">⚠</span>
            <p className="text-sm text-yellow-800">
              <strong>{soonExpiring.length} boya</strong> 30 gün içinde son kullanma tarihine ulaşıyor:{' '}
              {soonExpiring.map(p => p.name).join(', ')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <button
            onClick={() => setActiveTab('active')}
            className={`tab-btn ${activeTab === 'active' ? 'tab-active' : 'tab-inactive'}`}
          >
            Aktif Boyalar ({activePaints.length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`tab-btn ${activeTab === 'expired' ? 'tab-active' : 'tab-inactive'}`}
          >
            Süresi Geçmiş ({expiredPaints.length})
          </button>
          <input
            type="text"
            placeholder="Boya ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input max-w-44 text-sm"
          />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden ml-auto">
            <button
              onClick={() => setView('card')}
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${view === 'card' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="Kart görünümü"
            >
              Kart
            </button>
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${view === 'table' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="Tablo görünümü"
            >
              Tablo
            </button>
            <button
              onClick={() => setView('project')}
              className={`px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${view === 'project' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              aria-label="Proje görünümü"
            >
              Proje
            </button>
          </div>
          <button onClick={() => setShowCatalog(true)} className="btn-secondary text-sm">
            Boya Tanımları ({types.length})
          </button>
          {view === 'project' ? (
            <button onClick={() => setShowUsageModal(true)} className="btn-primary">
              + Kullanım Ekle
            </button>
          ) : (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Boya Ekle
            </button>
          )}
        </div>

        {/* Marka filtresi */}
        {view !== 'project' && brands.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setBrandFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${brandFilter === '' ? 'bg-red-700 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            >
              Tüm markalar
            </button>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setBrandFilter(b)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${brandFilter === b ? 'bg-red-700 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {view === 'project' ? (
          <ProjectPanel usages={displayUsages} onDelete={handleDeleteUsage} />
        ) : displayList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🎨</div>
            {search || brandFilter ? (
              <p>Sonuç bulunamadı.</p>
            ) : activeTab === 'active' ? (
              <p>
                Henüz boya eklenmemiş.{' '}
                <button onClick={() => setShowAddModal(true)} className="text-red-600 underline cursor-pointer">
                  İlk boyayı ekle
                </button>
              </p>
            ) : (
              <p>Süresi geçmiş boya yok.</p>
            )}
          </div>
        ) : view === 'table' ? (
          <PaintTable
            groups={groups}
            expired={activeTab === 'expired'}
            onRowClick={setAdjustTarget}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ brand, items }) => {
              const pinned = isPinnedBrand(brand)
              const unitTotals = totalsByUnit(items)
              const collapsed = !expandedBrands.has(brand)
              return (
                <section key={brand || '—'} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleBrandCollapse(brand)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-white cursor-pointer ${pinned ? 'bg-red-700' : 'bg-gray-900'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-white/70 transition-transform ${collapsed ? '-rotate-90' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      <span className="text-sm font-bold uppercase tracking-wider truncate">{brandLabel(brand)}</span>
                      <span className="text-[11px] text-white/60 shrink-0">{items.length} çeşit</span>
                    </div>
                    <span className="text-xs font-semibold text-white/90 shrink-0">{unitTotals}</span>
                  </button>
                  {!collapsed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50">
                      {items.map(paint => (
                        <PaintCard
                          key={paint.id}
                          paint={paint}
                          expired={activeTab === 'expired'}
                          onAdjust={() => setAdjustTarget(paint)}
                          onDelete={() => handleDelete(paint.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {/* Tanı satırı — sorun olursa buradaki bilgiyi ilet */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
          <span>{USE_LOCAL ? '⚠ Demo modu (localStorage)' : 'Firebase modu'}</span>
          <span>{types.length} tanım · {paints.length} stok kaydı</span>
          <span>
            {sync.pending
              ? '↑ eşitlenmeyi bekleyen yazma var'
              : sync.fromCache
                ? '● çevrimdışı / önbellekten'
                : '● sunucuya bağlı'}
          </span>
          <span>sürüm 2026-09-08e</span>
        </div>
      </div>

      {showAddModal && (
        <AddPaintModal
          types={types}
          existingPaints={paints}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPaint}
          onManageCatalog={() => { setShowAddModal(false); setShowCatalog(true) }}
        />
      )}
      {showCatalog && (
        <CatalogModal
          types={types}
          onClose={() => setShowCatalog(false)}
          onAdd={handleAddType}
          onDelete={handleDeleteType}
        />
      )}
      {adjustTarget && (
        <AdjustModal
          paint={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onAdjust={handleAdjust}
          onEdit={handleEditMeta}
        />
      )}
      {showUsageModal && (
        <ProjectUsageModal
          paints={paints}
          existingProjects={projectNames}
          onClose={() => setShowUsageModal(false)}
          onAdd={handleAddUsage}
        />
      )}
    </main>
  )
}
