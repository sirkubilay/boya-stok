'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, setDoc, serverTimestamp, query, orderBy, increment
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import {
  subscribePaints, subscribePaintTypes,
  localAdd, localUpdate, localDelete, localEdit, localAddType, localDeleteType,
} from '@/lib/localStore'
import { isSameStock } from '@/lib/types'
import type { Paint, NewPaint, PaintMeta, PaintType, NewPaintType } from '@/lib/types'
import { brandLabel, groupByBrand, sortBrands } from '@/lib/brands'
import Header from '@/components/Header'
import PaintCard from '@/components/PaintCard'
import PaintTable from '@/components/PaintTable'
import AddPaintModal from '@/components/AddPaintModal'
import AdjustModal from '@/components/AdjustModal'
import CatalogModal from '@/components/CatalogModal'

const USE_LOCAL = process.env.NEXT_PUBLIC_USE_LOCAL === 'true'
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
  const [firebaseError, setFirebaseError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
  const [view, setView] = useState<'card' | 'table'>('card')
  const [brandFilter, setBrandFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Paint | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (USE_LOCAL) {
      const saved = localStorage.getItem('boya-stok-last-op')
      if (saved) setLastUpdated(saved)
      const unsubP = subscribePaints(setPaints)
      const unsubT = subscribePaintTypes(setTypes)
      return () => { unsubP(); unsubT() }
    }

    const q = query(collection(getDb(), 'paints'), orderBy('name'))
    const unsubPaints = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        type_id: null,
        brand: '',
        ...d.data(),
        created_at: d.data().created_at?.toDate?.()?.toISOString() ?? '',
        updated_at: d.data().updated_at?.toDate?.()?.toISOString() ?? '',
      })) as Paint[]
      setPaints(data)
      setFirebaseError('')
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

    return () => { unsubPaints(); unsubTypes(); unsubMeta() }
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

  async function handleAddPaint(paint: NewPaint) {
    const match = paints.find(p => isSameStock(p, paint))
    if (USE_LOCAL) {
      localAdd(paint)
    } else {
      try {
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Boya kaydedilemedi: ' + msg)
        return
      }
    }
    await recordUpdate()
    setShowAddModal(false)
  }

  async function handleAdjust(id: string, delta: number) {
    const paint = paints.find(p => p.id === id)
    if (!paint) return
    const newQty = Math.max(0, paint.quantity + delta)
    if (USE_LOCAL) {
      localUpdate(id, newQty)
    } else {
      try {
        await updateDoc(doc(getDb(), 'paints', id), {
          quantity: newQty,
          updated_at: serverTimestamp(),
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Miktar güncellenemedi: ' + msg)
        return
      }
    }
    await recordUpdate()
    setAdjustTarget(null)
  }

  async function handleEditMeta(id: string, fields: PaintMeta) {
    if (USE_LOCAL) {
      localEdit(id, fields)
    } else {
      try {
        await updateDoc(doc(getDb(), 'paints', id), {
          ...fields,
          updated_at: serverTimestamp(),
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Bilgiler güncellenemedi: ' + msg)
        return
      }
    }
    await recordUpdate()
  }

  async function handleAddType(type: NewPaintType) {
    if (USE_LOCAL) {
      localAddType(type)
    } else {
      try {
        await addDoc(collection(getDb(), 'paint_types'), { ...type, created_at: serverTimestamp() })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Boya tanımlanamadı: ' + msg)
      }
    }
  }

  async function handleDeleteType(id: string) {
    if (USE_LOCAL) {
      localDeleteType(id)
    } else {
      try {
        await deleteDoc(doc(getDb(), 'paint_types', id))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Tanım silinemedi: ' + msg)
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu boyayı silmek istediğinizden emin misiniz?')) return
    if (USE_LOCAL) {
      localDelete(id)
    } else {
      try {
        await deleteDoc(doc(getDb(), 'paints', id))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setFirebaseError('Boya silinemedi: ' + msg)
        return
      }
    }
    await recordUpdate()
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
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center text-xs text-red-700">
          <strong>Hata:</strong> {firebaseError}
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
          </div>
          <button onClick={() => setShowCatalog(true)} className="btn-secondary text-sm">
            Boya Tanımları ({types.length})
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Boya Ekle
          </button>
        </div>

        {/* Marka filtresi */}
        {brands.length > 0 && (
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

        {displayList.length === 0 ? (
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
          <div className="flex flex-col gap-6">
            {groups.map(({ brand, items }) => (
              <section key={brand || '—'}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{brandLabel(brand)}</h2>
                  <span className="text-xs text-gray-400">
                    {items.length} çeşit · {items.reduce((s, p) => s + p.quantity, 0).toLocaleString('tr-TR')} toplam
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </section>
            ))}
          </div>
        )}
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
    </main>
  )
}
