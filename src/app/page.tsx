'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, setDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import { subscribePaints, localAdd, localUpdate, localDelete } from '@/lib/localStore'
import type { Paint, NewPaint } from '@/lib/types'
import Header from '@/components/Header'
import PaintCard from '@/components/PaintCard'
import AddPaintModal from '@/components/AddPaintModal'
import AdjustModal from '@/components/AdjustModal'

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
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Paint | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (USE_LOCAL) {
      const saved = localStorage.getItem('boya-stok-last-op')
      if (saved) setLastUpdated(saved)
      return subscribePaints((data) => {
        setPaints(data)
        setLoading(false)
      })
    }

    const q = query(collection(getDb(), 'paints'), orderBy('name'))
    const unsubPaints = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        created_at: d.data().created_at?.toDate?.()?.toISOString() ?? '',
        updated_at: d.data().updated_at?.toDate?.()?.toISOString() ?? '',
      })) as Paint[]
      setPaints(data)
      setLoading(false)
    })

    const unsubMeta = onSnapshot(doc(getDb(), 'meta', 'status'), (snap) => {
      if (snap.exists()) {
        const ts = snap.data().lastUpdated?.toDate?.()?.toISOString() ?? ''
        if (ts) setLastUpdated(ts)
      }
    })

    return () => { unsubPaints(); unsubMeta() }
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

  const displayList = (activeTab === 'active' ? activePaints : expiredPaints).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddPaint(paint: NewPaint) {
    if (USE_LOCAL) {
      localAdd(paint)
    } else {
      await addDoc(collection(getDb(), 'paints'), {
        ...paint,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
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
      await updateDoc(doc(getDb(), 'paints', id), {
        quantity: newQty,
        updated_at: serverTimestamp(),
      })
    }
    await recordUpdate()
    setAdjustTarget(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu boyayı silmek istediğinizden emin misiniz?')) return
    if (USE_LOCAL) {
      localDelete(id)
    } else {
      await deleteDoc(doc(getDb(), 'paints', id))
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

        <div className="flex flex-wrap gap-2 mb-4 items-center">
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
          <button onClick={() => setShowAddModal(true)} className="btn-primary ml-auto">
            + Boya Ekle
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 mt-3 text-sm">Yükleniyor...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🎨</div>
            {search ? (
              <p>&quot;{search}&quot; için sonuç bulunamadı.</p>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayList.map(paint => (
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
      </div>

      {showAddModal && (
        <AddPaintModal onClose={() => setShowAddModal(false)} onAdd={handleAddPaint} />
      )}
      {adjustTarget && (
        <AdjustModal
          paint={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onAdjust={handleAdjust}
        />
      )}
    </main>
  )
}
