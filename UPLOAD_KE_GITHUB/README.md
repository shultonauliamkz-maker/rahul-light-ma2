# RAHUL LIGHT — MA FILE DOWNGRADER
> **Professional grandMA2 Lighting File Compatibility Suite**

![Rahul Light](https://img.shields.io/badge/Platform-grandMA2-00d2ff.svg)
![Status](https://img.shields.io/badge/Status-Production_Ready-00e676.svg)
![Engine](https://img.shields.io/badge/Engine-Node.js_Express-0077ff.svg)

---

## ⚡ Ikhtisar Proyek (Project Overview)

**RAHUL LIGHT — MA FILE DOWNGRADER** adalah platform web profesional untuk programmer lighting, operator panggung, dan teknisi rental grandMA2 yang memungkinkan konversi showfile, plugin Lua, macro XML, efek, dan paket file grandMA2 dari versi software yang lebih baru ke versi yang lebih lama (downgrade) dengan analisis kompatibilitas mendalam tanpa kehilangan data (zero silent data loss).

### Headline Resmi:
> **"YOUR MA FILE. YOUR VERSION."**  
> *Convert and prepare your grandMA2 files for older software versions with intelligent compatibility analysis.*

---

## 🚀 Fitur Utama

1. **Mesin Analisis Kompatibilitas Mendalam**:
   - Deteksi otomatis format file (`.show`, `.gz`, `.xml`, `.lua`, `.zip`, `.png`, `.bmp`, `.cfg`).
   - Ekstraksi versi sumber dari header XML `<MA stream_vers="..." stream_sub_vers="...">` atau komentar Lua.
   - Evaluasi terhadap target firmware grandMA2 (v3.9.63.6, v3.9.60.74, v3.9.60.27, v3.9.51.2, v3.9.0.3, v3.8.0.0, v3.7.0.5, v3.6.1.1, v3.5.0.6, v3.3.4.3, atau manual custom).
   - Klasifikasi status: **Compatible**, **Convertible**, **Needs Review**, **Unsupported**, **Conversion Failed**.
   - Penjelasan dampak di konsol (Console Impact) dan solusi perbaikan (Resolution) secara transparan.

2. **Tiga Strategi Konversi (Pipeline Downgrade)**:
   - **Auto Downgrade**: Penyesuaian otomatis skema XML root, konversi warna hex ke RGB integer, pembungkusan tag yang tidak dikenal dalam komentar aman, dan injeksi shim Lua.
   - **Safe Conversion**: Mode non-destruktif ketat, tidak menghapus elemen apa pun tanpa anotasi fallback, dan memberikan peringatan eksplisit.
   - **Advanced Conversion**: Parameter kustom (toggle injeksi shim Lua `gma.gui.progress` & network, pembungkusan tag Phaser/Recipe, fallback trigger SoundSync ke "Follow", dll).

3. **Pemrosesan File Nyata (Real Backend Engine)**:
   - Dekompresi byte-level gzip stream pada showfile `.show` dan `.gz` asli, parsing pohon XML, penyesuaian versi skema, dan kompresi ulang gzip level 9 dengan integritas checksum utuh.
   - Injeksi **Rahul Light Lua Compatibility Shim** pada plugin Lua untuk mencegah error fatal `nil value` saat memanggil method API baru di firmware lama.
   - Penanganan file ZIP multi-file otomatis (unpack, konversi individual, generasi audit manifest, dan repackaging).

4. **Granular Diff Inspector & Pelaporan**:
   - Tampilan perbandingan baris demi baris (*Side-by-Side* dan *Unified Diff*) sebelum dan sesudah konversi.
   - Log eksekusi aktivitas engine secara real-time.
   - Unduh file hasil konversi bersih.
   - Unduh Laporan Audit Konversi (format Markdown / JSON).

5. **6 Halaman Lengkap**:
   - **Home**: Banner selamat datang bertema cyber-lighting, kartu fitur, dan katalog tipe file yang didukung.
   - **File Downgrader**: Area Drag & Drop besar, tombol sampel instan, antrean file, kartu analisis, dan dashboard hasil konversi.
   - **Conversion History**: Riwayat konversi sesi dengan tautan unduh ulang dan laporan.
   - **Compatibility Guide**: Matriks perbandingan aturan kompatibilitas XML, Lua, Macro, dan firmware grandMA2.
   - **Documentation**: Panduan arsitektur format file MA2, skema XML, dan struktur folder USB resmi.
   - **About Rahul Light**: Profil brand, filosofi rekayasa lighting, dan standar keselamatan panggung.

---

## 🛠️ Cara Menjalankan Aplikasi

Aplikasi berjalan di atas Node.js (v18+) dan Express:

```bash
# 1. Masuk ke direktori
cd "d:\DOWNGRADE MA2"

# 2. Install dependensi (jika belum)
npm install

# 3. Jalankan server produksi
npm start

# Atau jalankan dengan hot-reload
npm run dev
```

Buka browser dan akses:  
👉 **`http://localhost:3000`**

---

## 🧪 Berkas Uji Coba Tersedia (Test Files)

Di folder `test-files/` telah disediakan berkas pengujian autentik untuk langsung dicoba:
- `RL_Color_Bump_v3.9.63.xml` (Macro XML dengan stream 63 & warna hex)
- `RL_Auto_Rigger_v3.9.63.lua` (Plugin Lua dengan API 3.8/3.9)
- `MainStage_RahulLight_v3.9.63.show` (Showfile gzip terkompresi dengan trigger SoundSync)
- `RahulLight_TourBundle_v3.9.63.zip` (Paket ZIP lengkap)

*Anda juga dapat langsung mengklik tombol uji cepat di antarmuka web:*
- ⚡ **Macro XML (v3.9.63)**
- ⚡ **Lua Plugin (v3.9.63)**
- ⚡ **Showfile Gzip (v3.9.63)**
- ⚡ **Tour Bundle ZIP**

---

## 💾 Panduan Impor ke Konsol grandMA2

Setelah mengunduh file hasil konversi dari Rahul Light, letakkan file pada USB flash drive dengan struktur direktori resmi MA2:

```
USB_DRIVE/
└── gma2/
    ├── shows/          <-- Showfile (.show / .gz)
    ├── importexport/   <-- Macro, Effect, Preset, Fixture (.xml)
    ├── plugins/        <-- Plugin (.lua)
    ├── bitmaps/        <-- Image & Icon (.png / .bmp)
    └── config/         <-- File Konfigurasi (.cfg)
```

### Langkah di Konsol Fisik grandMA2:
1. Masukkan USB ke port konsol / PC onPC.
2. Tekan tombol **[Setup]** di layar utama konsol.
3. Pilih **[Import / Export]**.
4. Pilih drive USB Anda pada tab atas (misal `Drive 2: USB`).
5. Pilih item yang ingin diimpor dan tekan tombol **[Import]**.
6. Periksa urutan cue dan fader executor sebelum live rehearsal.

---

## ⚖️ Disclaimer
*grandMA2® adalah merek dagang terdaftar dari MA Lighting Technology GmbH. RAHUL LIGHT adalah platform rekayasa independen yang dikembangkan untuk mendukung komunitas operator dan programmer lighting di seluruh dunia.*
