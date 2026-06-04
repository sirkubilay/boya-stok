import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-black text-white shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo — white rounded background so it shows on dark header */}
        <div className="relative w-14 h-14 shrink-0 bg-white rounded-xl p-1 shadow-md">
          <Image
            src="/logo.png"
            alt="Section Logo"
            fill
            className="object-contain p-0.5"
            priority
          />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight tracking-widest uppercase">Section</h1>
          <p className="text-[11px] text-red-400 leading-tight font-medium tracking-wide">
            professional applications
          </p>
          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Boya Deposu Stok Takip</p>
        </div>
      </div>
    </header>
  )
}
