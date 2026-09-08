import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Section – Boya Stok Takip",
  description: "Section Yapı Uygulamaları – Boya Deposu Stok Kontrol Sistemi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Boya Stok",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                // Yeni sürüm hazır olduğunda otomatik geç
                function promote(w) {
                  if (!w) return
                  w.addEventListener('statechange', function() {
                    if (w.state === 'installed' && navigator.serviceWorker.controller) {
                      w.postMessage('skipWaiting')
                    }
                  })
                }
                promote(reg.waiting)
                reg.addEventListener('updatefound', function() { promote(reg.installing) })
                setInterval(function() { reg.update() }, 60000)
              })
              var reloaded = false
              navigator.serviceWorker.addEventListener('controllerchange', function() {
                if (reloaded) return
                reloaded = true
                window.location.reload()
              })
            })
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
