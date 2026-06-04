# Boya Stok Takip - Kurulum Rehberi

## 1. Supabase Veritabanı Kurulumu

1. https://supabase.com adresine git ve ücretsiz hesap aç
2. "New project" ile yeni proje oluştur (örn: "boya-stok")
3. Sol menüden **SQL Editor** > **New Query** aç
4. Aşağıdaki SQL kodunu yapıştır ve çalıştır:

```sql
-- Boyalar tablosu
CREATE TABLE paints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'litre',
  expiry_date DATE,
  color_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Herkese okuma ve yazma izni (şifresiz basit erişim)
ALTER TABLE paints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes okuyabilir" ON paints FOR SELECT USING (true);
CREATE POLICY "Herkes ekleyebilir" ON paints FOR INSERT WITH CHECK (true);
CREATE POLICY "Herkes güncelleyebilir" ON paints FOR UPDATE USING (true);
CREATE POLICY "Herkes silebilir" ON paints FOR DELETE USING (true);
```

5. Sol menüden **Project Settings** > **API** bölümüne git
6. **Project URL** ve **anon public** key'i kopyala

## 2. .env.local Dosyası Oluştur

Proje klasöründe `.env.local` dosyası oluştur:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Vercel'e Deploy

1. https://vercel.com adresine git ve GitHub ile giriş yap
2. GitHub'a projeyi push et (ya da Vercel CLI ile doğrudan deploy)
3. "Import Project" ile projeyi seç
4. **Environment Variables** bölümüne .env.local'daki değerleri ekle
5. Deploy et!

## 4. Lokal Geliştirme

```bash
npm install
cp .env.local.example .env.local
# .env.local dosyasını düzenle
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır.
