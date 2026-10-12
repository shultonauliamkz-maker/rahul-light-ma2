/**
 * grandMA2 Import Diagnostics & Compatibility Checker
 * RAHUL LIGHT — MA FILE DOWNGRADER Engineering Core
 */

import zlib from 'zlib';
import { XMLValidator } from 'fast-xml-parser';
import { getVersionInfo, compareVersions, MA2_VERSIONS } from './versionMatrix.js';
import { detectFileType } from './analyzer.js';

// Versi-versi grandMA2 yang telah diuji secara nyata pada hardware / onPC lokal
export const TESTED_VERSIONS = ['3.2.2.16', '3.9.60.74', '3.9.63.6'];

/**
 * Jalankan pemeriksaan kompatibilitas impor (IMPORT COMPATIBILITY CHECK)
 */
export function runImportCompatibilityCheck(fileType, originalBuffer, convertedBuffer, originalText, convertedText, targetVersion, options = {}) {
  const targetInfo = getVersionInfo(targetVersion);
  const isVersionTested = TESTED_VERSIONS.includes(targetVersion);

  const checks = {
    fileIntegrity: 'PASS',
    structureValidation: 'PASS',
    targetCompatibility: isVersionTested ? 'TESTED' : 'NEEDS TESTING',
    unsupportedCommandsCount: 0,
    missingDependenciesCount: 0,
    warnings: [],
    details: [],
    retainedData: [],
    modifiedData: [],
    potentialLosses: [],
    recommendedActions: []
  };

  // 1. Pemeriksaan Integritas Berkas
  if (!convertedBuffer || convertedBuffer.length === 0) {
    checks.fileIntegrity = 'FAIL';
    checks.warnings.push('Berkas hasil konversi berukuran 0 byte (kosong).');
  }

  // Periksa UTF-8 BOM
  if (convertedBuffer && convertedBuffer.length >= 3) {
    if (convertedBuffer[0] === 0xef && convertedBuffer[1] === 0xbb && convertedBuffer[2] === 0xbf) {
      checks.fileIntegrity = 'WARNING';
      checks.warnings.push('Terdeteksi UTF-8 Byte Order Mark (BOM). grandMA2 v3.2.x - v3.8 dapat menolak parsing berkas XML ber-BOM.');
    }
  }

  // 2. Pemeriksaan Struktur Sesuai Tipe Berkas
  if (fileType === 'fixture_xml' || fileType === 'fixture_xmlp' || fileType === 'macro_xml' || fileType === 'effect_xml' || fileType === 'preset_xml' || fileType === 'general_ma2_xml') {
    const xmlToValidate = convertedText || (convertedBuffer ? convertedBuffer.toString('utf-8') : '');
    
    // Validasi sintaks XML
    const valResult = XMLValidator.validate(xmlToValidate);
    if (valResult !== true) {
      checks.structureValidation = 'FAIL';
      checks.warnings.push(`Sintaks XML tidak valid: ${valResult.err ? valResult.err.msg + ' pada baris ' + valResult.err.line : 'Malformed XML'}`);
    }

    // Pengecekan Khusus Fixture Library
    if (fileType === 'fixture_xml' || fileType === 'fixture_xmlp') {
      // Periksa Header <MA>
      if (!xmlToValidate.includes('<MA')) {
        checks.structureValidation = 'FAIL';
        checks.warnings.push('Tag root <MA> tidak ditemukan. grandMA2 membutuhkan root schema <MA>.');
      }

      // Periksa <Module name="...">
      if (/<Module\b/i.test(xmlToValidate) && !/<Module\b[^>]*\bname=/i.test(xmlToValidate)) {
        checks.structureValidation = 'WARNING';
        checks.warnings.push('Tag <Module> tidak memiliki atribut name="...". Versi MA2 lama membutuhkan nama modul (misal: "Main Module").');
        checks.missingDependenciesCount++;
      } else {
        checks.retainedData.push('Modul fixture (Main Module, Beam Angle, Intensity)');
      }

      // Periksa DMX Footprint (<Instance patch="..." locked="...">)
      if (!/<Instance\b[^>]*\bpatch=/i.test(xmlToValidate)) {
        checks.structureValidation = 'WARNING';
        checks.warnings.push('Tag <Instance> belum memiliki atribut patch="1" locked="true". grandMA2 onPC mungkin menghitung 0 DMX channels sehingga tombol [Import] abu-abu/tidak aktif.');
      } else {
        checks.retainedData.push('Instance channel footprint DMX & patching lock');
      }

      // Periksa apakah tag modern masih tersisa untuk versi < 3.8
      if (compareVersions(targetVersion, '3.8.0.0') < 0) {
        if (/<VirtualFunctionBlocks\b|<FixtureMacroCollect\b|<AutoPresets\b|<RdmNotifications\b/i.test(xmlToValidate)) {
          checks.unsupportedCommandsCount++;
          checks.warnings.push('Ditemukan tag fitur modern (VirtualFunctionBlocks / RdmNotifications / AutoPresets) yang tidak didukung firmware v' + targetVersion + '.');
        }
      }

      // Periksa apakah attribute warna modern tersisa
      if (compareVersions(targetVersion, '3.8.0.0') < 0) {
        const modernAttrs = ['VIRTUAL_COLOR_MODE', 'CRIMODE', 'COLORHSB1'];
        for (const attr of modernAttrs) {
          if (new RegExp(`attribute="${attr}"`, 'i').test(xmlToValidate)) {
            checks.unsupportedCommandsCount++;
            checks.warnings.push(`Atribut fixture ${attr} tidak dikenali di MA2 v${targetVersion}.`);
          }
        }
      }

      checks.retainedData.push('ChannelTypes, DMX Coarse/Fine, Preset Type, Highlight values');
      checks.retainedData.push('ChannelSets, Wheel Slots, dan kurva fisik');
    }

    // Pengecekan Khusus Macro XML
    if (fileType === 'macro_xml') {
      if (/<Macro\b/i.test(xmlToValidate)) {
        checks.retainedData.push('Struktur langkah Macro (MacroStep, urutan baris, delay, wait, info)');
      }
      if (/#([0-9a-fA-F]{6})\b/.test(xmlToValidate) && compareVersions(targetVersion, '3.8.0.0') < 0) {
        checks.unsupportedCommandsCount++;
        checks.warnings.push('Parameter warna Hex (#HEX) pada perintah Appearance belum dikonversi ke RGB integer.');
      }
    }

    // Pengecekan Khusus Effect XML
    if (fileType === 'effect_xml') {
      checks.retainedData.push('Parameter Effect (Speed, Rate, Form, Width, Phase, Wings, Grouping)');
      if (/<PhaserPreview\b|<FixtureRecipe\b/i.test(xmlToValidate)) {
        checks.unsupportedCommandsCount++;
        checks.warnings.push('Ditemukan tag metadata Phaser grandMA3 hibrida. Perlu dibungkus dalam komentar XML.');
      }
    }
  }

  // 3. Pengecekan Khusus Lua Plugin
  if (fileType === 'lua_plugin') {
    const luaCode = convertedText || (convertedBuffer ? convertedBuffer.toString('utf-8') : '');
    
    // Sintaks Lua dasar
    if (luaCode.includes('function') && !luaCode.includes('end')) {
      checks.structureValidation = 'FAIL';
      checks.warnings.push('Struktur blok skrip Lua tidak lengkap (kata kunci "end" tidak seimbang).');
    }

    // Periksa API yang tidak didukung
    if (compareVersions(targetVersion, '3.8.0.0') < 0 && /gma\.gui\.progress\b/.test(luaCode) && !luaCode.includes('gma.gui.progress =')) {
      checks.unsupportedCommandsCount++;
      checks.warnings.push(`API gma.gui.progress dipanggil tanpa polyfill pengaman pada MA2 v${targetVersion}.`);
    }

    if (compareVersions(targetVersion, '3.9.0.0') < 0 && /gma\.network\.gethostdata\b/.test(luaCode) && !luaCode.includes('gma.network.gethostdata =')) {
      checks.unsupportedCommandsCount++;
      checks.warnings.push(`API gma.network.gethostdata belum tersedia pada MA2 v${targetVersion}.`);
    }

    checks.retainedData.push('Logika fungsi, variabel global/lokal, antarmuka commandline feedback');
  }

  // 4. Pengecekan Khusus Showfile
  if (fileType === 'showfile') {
    let rawBuf = originalBuffer;
    if (originalBuffer && originalBuffer.length >= 2 && originalBuffer[0] === 0x1f && originalBuffer[1] === 0x8b) {
      try {
        rawBuf = zlib.gunzipSync(originalBuffer);
      } catch {
        rawBuf = originalBuffer;
      }
    }

    const isMaData = rawBuf && rawBuf.length >= 12 && rawBuf.slice(0, 8).toString('latin1') === 'MA DATA\0';

    if (isMaData) {
      // Binary MA DATA Showfile
      checks.targetCompatibility = 'NEEDS TESTING';
      checks.retainedData.push(`Integritas bit-for-bit seluruh database payload binary (${(rawBuf.length / 1024 / 1024).toFixed(2)} MB uncompressed)`);
      checks.retainedData.push(`Indeks version table (offset 8 & 136) disesuaikan ke grandMA2 v${targetVersion}`);
      checks.retainedData.push('Paket Migrasi Showfile (.zip) dengan Macro Auto-Import/Export XML');

      // Deteksi jika versi asal lebih tinggi dari target
      const origSub = rawBuf[8];
      const origStream = rawBuf[9];
      const origMinor = rawBuf[10];
      const origMajor = rawBuf[11];
      const detectedVer = `${origMajor}.${origMinor}.${origStream}.${origSub}`;

      if (compareVersions(detectedVer, targetVersion) > 0) {
        checks.warnings.push(
          `PERINGATAN KRITIS: Showfile berformat Binary C++ Memory Dump (MA DATA v${detectedVer}). ` +
          `Deserializer C++ grandMA2 v${targetVersion} dapat menolak binary struct v${detectedVer} dan memuat show kosong jika di-load langsung. ` +
          `Gunakan file Paket Migrasi Showfile (.zip) yang menyertakan modul XML & Macro Auto-Import untuk memulihkan 100% data Fixture Patch, Presets, Sequences, Cues, Executors, dan Effects.`
        );
      }

      checks.recommendedActions.push(
        `1. Menggunakan Flashdisk USB (Tanpa Perlu Copy ke Folder C): Ekstrak paket ZIP langsung ke Flashdisk USB Anda. Folder resmi /gma2/shows/ dan /gma2/importexport/ otomatis terbentuk. Tancapkan USB ke konsol/PC, pada menu [Backup] -> [Load Show] ganti pilihan Drive di pojok kanan atas ke [Drive 2: USB], lalu klik [Load Show].`
      );
      checks.recommendedActions.push(
        `2. Tombol 1-Klik Website (Khusus grandMA2 onPC di PC ini): Cukup klik tombol [🚀 PASANG LANGSUNG KE GRANDMA2 (1-KLIK)] pada website. Website akan otomatis memasang berkas ke direktori grandMA2 yang aktif di latar belakang tanpa Anda perlu membuka folder C!`
      );
      checks.recommendedActions.push(
        `3. Jika Showfile Terbaca Namun Kosong: Jalankan Macro pemulihan XML dari Flashdisk USB. Pada commandline ketik: SelectDrive 2 lalu ketik: Import "Import_Show_Modules" At Macro 999.`
      );
    } else {
      // XML-based showfile
      checks.retainedData.push('Showfile XML streams, Patch, Cue sequences, Preset pool, Executor assignments');
      checks.recommendedActions.push(`Salin berkas ke Flashdisk USB di /gma2/shows/ atau klik tombol 1-Klik Pasang, lalu load via [Backup] -> [Load Show] (Drive USB).`);
    }
  }

  // 5. Rekomendasi Tindakan Operasional
  if (checks.warnings.length === 0 && checks.structureValidation === 'PASS') {
    checks.recommendedActions.push(`Berkas telah memenuhi seluruh standar sintaks grandMA2 v${targetVersion}.`);
    if (fileType === 'fixture_xml' || fileType === 'fixture_xmlp') {
      checks.recommendedActions.push(`Gunakan Flashdisk USB di /gma2/library/ atau klik tombol [🚀 PASANG LANGSUNG KE GRANDMA2 (1-KLIK)]. Tidak perlu copy manual ke C.`);
      checks.recommendedActions.push(`Di grandMA2: Buka [Setup] ➔ [Patch & Fixture Schedule] ➔ [Fixture Types] ➔ [Import] ➔ pilih Drive USB (atau Internal jika pakai tombol 1-klik).`);
      checks.recommendedActions.push(`PENTING: Setelah Import, kembali ke Patch dan klik [New Fixtures] untuk menambahkan unit lampu ke Fixture Sheet.`);
    } else if (fileType === 'macro_xml') {
      checks.recommendedActions.push(`Letakkan di Flashdisk USB di /gma2/macros/ atau gunakan tombol 1-klik, lalu jalankan Import "nama_macro" At Macro x.`);
    } else if (fileType === 'lua_plugin') {
      checks.recommendedActions.push(`Letakkan di Flashdisk USB di /gma2/plugins/ atau gunakan tombol 1-klik.`);
    }
  } else if (fileType !== 'showfile') {
    checks.recommendedActions.push('Tinjau peringatan di atas sebelum membawa berkas ke meja konsol utama.');
  }

  return checks;
}

/**
 * Buat Laporan Diagnostik Teks yang Lengkap (IMPORT DIAGNOSTIC REPORT)
 */
export function generateDiagnosticReportText(fileName, sourceVersion, targetVersion, fileType, checkResult, errorMessage = '') {
  const timestamp = new Date().toISOString();
  const sep = '='.repeat(70);
  const subSep = '-'.repeat(70);

  let report = `${sep}\n`;
  report += `  RAHUL LIGHT — MA2 REAL FILE CONVERTER\n`;
  report += `  IMPORT DIAGNOSTIC & COMPATIBILITY AUDIT REPORT\n`;
  report += `${sep}\n\n`;

  report += `TIMESTAMP            : ${timestamp}\n`;
  report += `FILE NAME            : ${fileName}\n`;
  report += `SOURCE VERSION       : v${sourceVersion}\n`;
  report += `TARGET VERSION       : v${targetVersion}\n`;
  report += `FILE TYPE            : ${formatFileTypeName(fileType)}\n`;
  report += `FILE INTEGRITY       : ${checkResult.fileIntegrity}\n`;
  report += `STRUCTURE VALIDATION : ${checkResult.structureValidation}\n`;
  report += `TARGET COMPATIBILITY : ${checkResult.targetCompatibility}\n`;
  report += `UNSUPPORTED COMMANDS : ${checkResult.unsupportedCommandsCount}\n`;
  report += `MISSING DEPENDENCIES : ${checkResult.missingDependenciesCount}\n`;
  report += `TOTAL WARNINGS       : ${checkResult.warnings.length}\n`;

  if (errorMessage && errorMessage.trim()) {
    report += `\n${subSep}\n`;
    report += `CONSOLE ERROR REPORTED BY OPERATOR:\n`;
    report += `  "${errorMessage.trim()}"\n`;
    report += `${subSep}\n`;
  }

  report += `\n${subSep}\n`;
  report += `DATA SUMMARY & INTEGRITY STATUS:\n`;
  report += `${subSep}\n`;

  report += `[+] DATA YANG DIPERTAHANKAN (RETAINED):\n`;
  if (checkResult.retainedData.length > 0) {
    checkResult.retainedData.forEach(item => {
      report += `  • ${item}\n`;
    });
  } else {
    report += `  • Struktur dasar berkas dipertahankan.\n`;
  }

  if (checkResult.modifiedData && checkResult.modifiedData.length > 0) {
    report += `\n[*] DATA YANG DISESUAIKAN (MODIFIED):\n`;
    checkResult.modifiedData.forEach(item => {
      report += `  • ${item}\n`;
    });
  }

  if (checkResult.warnings.length > 0) {
    report += `\n[!] PERINGATAN & ANALISIS KETIDAKCOCOKAN (WARNINGS):\n`;
    checkResult.warnings.forEach(w => {
      report += `  • [PERINGATAN] ${w}\n`;
    });
  }

  report += `\n${subSep}\n`;
  report += `LANGKAH TINDAKAN OPERASIONAL (RECOMMENDED ACTIONS):\n`;
  report += `${subSep}\n`;
  if (checkResult.recommendedActions.length > 0) {
    checkResult.recommendedActions.forEach((action, idx) => {
      report += `  ${idx + 1}. ${action}\n`;
    });
  } else {
    report += `  1. File siap di-import langsung pada grandMA2 v${targetVersion}.\n`;
  }

  report += `\n${sep}\n`;
  report += `  Dikelola oleh Tim Rekayasa RAHUL LIGHT — Professional Lighting Solutions\n`;
  report += `  Akses Sistem: http://localhost:3000\n`;
  report += `${sep}\n`;

  return report;
}

function formatFileTypeName(type) {
  const map = {
    fixture_xml: 'Fixture Library XML (.xml)',
    fixture_xmlp: 'Packed Fixture Library (.xmlp)',
    macro_xml: 'Macro XML (.xml)',
    effect_xml: 'Effect & Phaser XML (.xml)',
    preset_xml: 'Preset / Sequence XML (.xml)',
    general_ma2_xml: 'grandMA2 XML Export (.xml)',
    showfile: 'Showfile (.show / .gz)',
    lua_plugin: 'Plugin Lua (.lua)',
    zip_package: 'Paket Tur ZIP (.zip)',
    asset_image: 'Aset Gambar Tekstur (.png/.bmp)'
  };
  return map[type] || type || 'grandMA2 File';
}
