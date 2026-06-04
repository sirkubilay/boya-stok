import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logoPath = join(__dirname, '../public/logo.png')
const iconsDir = join(__dirname, '../public/icons')

mkdirSync(iconsDir, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(iconsDir, `icon-${size}x${size}.png`))
  console.log(`✓ icon-${size}x${size}.png`)
}

// Maskable icon — logo with white safe-zone padding
await sharp(logoPath)
  .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .resize(512, 512)
  .png()
  .toFile(join(iconsDir, 'maskable-512x512.png'))
console.log('✓ maskable-512x512.png')

// Apple touch icon (180x180, square white bg)
await sharp(logoPath)
  .resize(160, 160, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .resize(180, 180)
  .png()
  .toFile(join(__dirname, '../public/apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png')

// Favicon
await sharp(logoPath)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(join(__dirname, '../public/favicon.png'))
console.log('✓ favicon.png')

console.log('\nTüm ikonlar oluşturuldu!')
