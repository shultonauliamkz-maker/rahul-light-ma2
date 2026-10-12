/**
 * grandMA2 File Analyzer
 * Inspeksi struktur dan analisis kompatibilitas file lighting
 * Dikelola oleh Tim Rekayasa RAHUL LIGHT
 */

import zlib from 'zlib';
import AdmZip from 'adm-zip';
import { FEATURE_RULES, compareVersions, parseVersion, getVersionInfo } from './versionMatrix.js';

export function detectFileType(fileName, buffer) {
  const lowerName = (fileName || '').toLowerCase();
  const ext = (lowerName.split('.').pop() || '');
  const isGzip = buffer && buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

  // 1. Ekstensi eksplisit grandMA2 Showfile (.show.gz atau .show)
  if (lowerName.endsWith('.show.gz') || lowerName.endsWith('.show') || ext === 'show') {
    return 'showfile';
  }

  // 2. grandMA2 Library Fixture .xmlp (Packed / Compressed Fixture Profile)
  if (ext === 'xmlp' || lowerName.endsWith('.xmlp')) {
    return 'fixture_xmlp';
  }

  // 3. ZIP package
  if (ext === 'zip') {
    return 'zip_package';
  }

  // 4. Lua Plugin
  if (ext === 'lua') {
    return 'lua_plugin';
  }

  // 5. Image Assets
  if (['png', 'bmp', 'svg', 'jpg', 'jpeg'].includes(ext)) {
    return 'asset_image';
  }

  // 6. Config
  if (ext === 'cfg' || ext === 'ini') {
    return 'config_file';
  }

  // 7. Jika berformat Gzip (.gz atau binary stream terkompresi)
  if (isGzip) {
    try {
      const sampleDecomp = zlib.gunzipSync(buffer);
      // Profil lampu .xmlp PASTI mengandung tag <FixtureType
      if (sampleDecomp.includes(Buffer.from('<FixtureType')) || sampleDecomp.includes(Buffer.from('<?xml'))) {
        if (sampleDecomp.includes(Buffer.from('<FixtureType'))) {
          return 'fixture_xmlp';
        }
      }
      // Jika diawali MA DATA\0 dan bukan FixtureType, maka adalah Showfile
      if (sampleDecomp.length >= 12 && sampleDecomp.slice(0, 8).toString('latin1') === 'MA DATA\0') {
        return 'showfile';
      }
    } catch {
      // bukan gzip yang valid
    }
    return 'showfile';
  }

  // 8. Jika buffer uncompressed diawali MA DATA\0
  if (buffer && buffer.length >= 12 && buffer.slice(0, 8).toString('latin1') === 'MA DATA\0') {
    if (buffer.includes(Buffer.from('<FixtureType'))) {
      return 'fixture_xmlp';
    }
    return 'showfile';
  }

  // 9. Berkas XML grandMA2
  if (ext === 'xml') {
    const text = buffer ? buffer.toString('utf-8', 0, Math.min(buffer.length, 8192)) : '';
    if (/<FixtureType\b/i.test(text)) return 'fixture_xml';
    if (/<Effect\b|<Phaser\b|<Form\b/i.test(text)) return 'effect_xml';
    if (/<Macro\b/i.test(text)) return 'macro_xml';
    if (/<Plugin\b/i.test(text)) return 'plugin_xml';
    if (/<Preset\b|<Sequence\b|<Layout\b/i.test(text)) return 'preset_xml';
    if (/<Show\b|<ShowData\b/i.test(text)) return 'showfile';
    if (/<MA\b/i.test(text)) return 'general_ma2_xml';
  }

  return 'unknown';
}

export function extractVersionFromContent(fileType, buffer, defaultSource = '3.9.63.6') {
  if (!buffer || buffer.length === 0) return defaultSource;

  // 1. Direct check for grandMA2 Binary MA DATA Header (offset 8..11)
  let rawBuf = buffer;
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    try {
      rawBuf = zlib.gunzipSync(buffer);
    } catch {
      rawBuf = buffer;
    }
  }

  if (rawBuf.length >= 12 && rawBuf.slice(0, 8).toString('latin1') === 'MA DATA\0') {
    const sub = rawBuf[8];
    const stream = rawBuf[9];
    const minor = rawBuf[10];
    const major = rawBuf[11];
    if (major >= 1 && major <= 5) {
      return `${major}.${minor}.${stream}.${sub}`;
    }
  }

  let contentText = '';

  if (fileType === 'showfile' || fileType === 'fixture_xmlp') {
    const xmlIndex = rawBuf.indexOf('<?xml');
    contentText = xmlIndex !== -1 ? rawBuf.slice(xmlIndex, xmlIndex + 4096).toString('utf-8') : rawBuf.toString('utf-8', 0, 4096);
  } else if (fileType === 'zip_package') {
    return defaultSource;
  } else {
    contentText = buffer.toString('utf-8', 0, 8192);
  }

  // Periksa tag XML <MA ... major_vers="3" minor_vers="9" stream_vers="63" stream_sub_vers="6">
  const maTagMatch = contentText.match(/<MA\b[^>]*>/i);
  if (maTagMatch) {
    const maTag = maTagMatch[0];
    const major = maTag.match(/major_vers=["']?(\d+)["']?/i);
    const minor = maTag.match(/minor_vers=["']?(\d+)["']?/i);
    const stream = maTag.match(/stream_vers=["']?(\d+)["']?/i);
    const sub = maTag.match(/stream_sub_vers=["']?(\d+)["']?/i);

    if (major && minor) {
      const majNum = major[1];
      const minNum = minor[1];
      const stNum = stream ? stream[1] : '0';
      const subNum = sub ? sub[1] : '0';
      return `${majNum}.${minNum}.${stNum}.${subNum}`;
    }

    const schemaMatch = maTag.match(/xml\/(\d+\.\d+\.\d+(?:\.\d+)?)\/MA\.xsd/i);
    if (schemaMatch) {
      return schemaMatch[1];
    }
  }

  // Periksa komentar Lua: -- grandMA2 Lua Plugin v3.9.63.6
  if (fileType === 'lua_plugin') {
    const luaVerMatch = contentText.match(/--.*?(?:grandMA2|version|v)?\s*([34]\.\d+\.\d+(?:\.\d+)?)/i);
    if (luaVerMatch) {
      return luaVerMatch[1];
    }
  }

  return defaultSource;
}

/**
 * Jalankan analisis kompatibilitas mendalam
 */
export function analyzeCompatibility(fileName, buffer, options = {}) {
  const fileType = detectFileType(fileName, buffer);
  const selectedSource = options.sourceVersion || '3.9.63.6';
  const targetVersion = options.targetVersion || '3.9.60.74';
  
  const detectedSource = extractVersionFromContent(fileType, buffer, selectedSource);
  const effectiveSource = options.manualOverride ? selectedSource : detectedSource;

  const issues = [];
  let fileText = '';
  let isDecompressedShow = false;
  let isBinaryShow = false;
  let showStats = null;

  if (fileType === 'showfile') {
    let rawBuf = buffer;
    if (buffer && buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
      try {
        rawBuf = zlib.gunzipSync(buffer);
        isDecompressedShow = true;
      } catch {
        rawBuf = buffer;
      }
    }

    if (rawBuf.length >= 12 && rawBuf.slice(0, 8).toString('latin1') === 'MA DATA\0') {
      isBinaryShow = true;
      // Ekstrak info metadata dari binary showfile
      const xmlIndex = rawBuf.indexOf('<?xml');
      if (xmlIndex !== -1) {
        fileText = rawBuf.slice(xmlIndex).toString('utf-8');
      } else {
        fileText = '';
      }

      // Deteksi parameter DMX dari string log session
      let paramCount = null;
      const paramMatch = rawBuf.toString('latin1').match(/required:\s*(\d+);\s*available:/i);
      if (paramMatch) paramCount = parseInt(paramMatch[1], 10);

      showStats = {
        uncompressedSize: rawBuf.length,
        paramCount,
        hasEmbeddedXml: xmlIndex !== -1
      };
    } else {
      fileText = rawBuf.toString('utf-8');
    }
  } else if (fileType === 'fixture_xmlp') {
    try {
      const decompressed = zlib.gunzipSync(buffer);
      const xmlIndex = decompressed.indexOf('<?xml');
      fileText = xmlIndex !== -1 ? decompressed.slice(xmlIndex).toString('utf-8') : decompressed.toString('utf-8');
    } catch {
      fileText = buffer.toString('utf-8');
    }
  } else if (fileType === 'zip_package') {
    return analyzeZipPackage(fileName, buffer, effectiveSource, targetVersion);
  } else if (fileType === 'asset_image') {
    return {
      fileName,
      fileType,
      detectedSource: effectiveSource,
      targetVersion,
      status: 'Kompatibel',
      canConvert: false,
      isAsset: true,
      fileSize: buffer.length,
      issues: [
        {
          code: 'ASSET_READY',
          severity: 'info',
          line: 1,
          featureName: 'Berkas Asset Gambar Standar',
          description: `Berkas gambar (${fileName}) kompatibel dengan seluruh versi konsol grandMA2 yang mendukung tekstur bitmap/vektor.`,
          impact: 'Tidak memerlukan konversi. Letakkan langsung ke folder USB /gma2/bitmaps.',
          resolution: 'Pertahankan format file asli tanpa perubahan.'
        }
      ],
      stats: { totalIssues: 0, critical: 0, warnings: 0, info: 1, convertible: 0 }
    };
  } else {
    fileText = buffer.toString('utf-8');
  }

  const lines = fileText ? fileText.split(/\r?\n/) : [];
  const isDowngrade = compareVersions(effectiveSource, targetVersion) > 0;

  // 1. Pengecekan pergeseran versi
  if (isDowngrade) {
    issues.push({
      code: 'VER_DOWNGRADE_REQUIRED',
      severity: 'warning',
      line: 1,
      featureName: `Pergeseran Versi (${effectiveSource} ➔ ${targetVersion})`,
      description: `Metadata file berasal dari versi ${effectiveSource}, lebih baru dari versi konsol target (${targetVersion}).`,
      impact: `Konsol akan menolak file saat impor atau menampilkan peringatan: "Wrong software version / Stream version mismatch".`,
      resolution: `Perbarui atribut major_vers, minor_vers, stream_vers pada header <MA> dan lokasi schema ke ${targetVersion}.`
    });

    if (isBinaryShow) {
      issues.push({
        code: 'SHOWFILE_BINARY_STRUCT_MISMATCH',
        severity: 'warning',
        line: 1,
        featureName: 'Struktur Internal Database Binary MA DATA (C++ Deserializer)',
        description: `Showfile merupakan binary database terkompilasi C++ dari grandMA2 v${effectiveSource} (${(showStats.uncompressedSize / 1024 / 1024).toFixed(2)} MB${showStats.paramCount ? `, ${showStats.paramCount} parameter DMX` : ''}). Struct objek internal C++ berbeda antar versi major konsol.`,
        impact: `Nama showfile akan terbaca pada menu Load Show di grandMA2 v${targetVersion}. Namun saat di-load, fail-safe internal grandMA2 dapat menginisialisasi show default kosong jika struct binary tidak cocok.`,
        resolution: `Website akan mem-patch header .show.gz dan menyertakan Paket Migrasi XML Lengkap (ZIP) berisi modul import/export untuk transfer 100% data fixtures, patch, presets, cues, executors, dan effects.`
      });
    }
  } else if (compareVersions(effectiveSource, targetVersion) < 0) {
    issues.push({
      code: 'VER_UPGRADE_OR_SAME',
      severity: 'info',
      line: 1,
      featureName: `Versi Sama/Kompatibel (${effectiveSource} ≤ ${targetVersion})`,
      description: `Versi asal sudah kompatibel dengan target ${targetVersion}. grandMA2 secara alami dapat membuka file ekspor versi lama.`,
      impact: 'Konsol dapat membuka berkas secara langsung.',
      resolution: 'Konversi bersifat opsional dan aman.'
    });
  }

  // 2. Pemeriksaan berbasis XML
  if (fileType === 'macro_xml' || fileType === 'effect_xml' || fileType === 'preset_xml' || fileType === 'general_ma2_xml' || fileType === 'showfile' || fileType === 'plugin_xml') {
    const maTag = fileText.match(/<MA\b[^>]*>/i);
    if (maTag) {
      const streamMatch = maTag[0].match(/stream_vers=["']?(\d+)["']?/i);
      const targetInfo = getVersionInfo(targetVersion);
      if (streamMatch && parseInt(streamMatch[1], 10) > targetInfo.stream) {
        issues.push({
          code: 'XML_STREAM_VERS_HIGHER',
          severity: 'critical',
          line: 2,
          featureName: `Perbedaan Stream Version (stream_vers="${streamMatch[1]}")`,
          description: `Root XML menentukan stream_vers="${streamMatch[1]}". Konsol tujuan menghendaki stream_vers="${targetInfo.stream}".`,
          impact: `Konsol grandMA2 versi lama akan menampilkan: "File stream version ${streamMatch[1]} is higher than console stream version ${targetInfo.stream}" dan membatalkan impor.`,
          resolution: `Sesuaikan nilai atribut ke stream_vers="${targetInfo.stream}" dan stream_sub_vers="${targetInfo.sub}".`
        });
      }
    }

    lines.forEach((line, idx) => {
      // Kalibrasi Gamut Warna
      if (/\b(?:gamut|cmy_calibrated|spectral_data|color_space)\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.9.0.0') < 0) {
          issues.push({
            code: 'XML_COLOR_GAMUT_UNSUPPORTED',
            severity: 'warning',
            line: idx + 1,
            featureName: 'Atribut Kalibrasi Warna Spektral & Gamut',
            description: `Ditemukan atribut kalibrasi warna: ${line.trim().slice(0, 80)}...`,
            impact: `Versi sebelum 3.9 tidak mendukung kurva gamut warna baru. Konsol akan membuang atau gagal mem-parsing atribut ini.`,
            resolution: `Mode Aman: Bungkus atribut dalam komentar ramah mundur (backward-compatible).`
          });
        }
      }

      // Trigger SoundSync
      if (/\b(?:sound_sync|audio_analysis_band|bpm_trigger)\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.8.0.0') < 0) {
          issues.push({
            code: 'XML_SOUND_SYNC_UNSUPPORTED',
            severity: 'critical',
            line: idx + 1,
            featureName: 'Trigger Cue Audio SoundSync',
            description: `Ditemukan trigger analisis audio SoundSync: ${line.trim().slice(0, 80)}...`,
            impact: `Versi sebelum 3.8 tidak memiliki mesin analisis frekuensi SoundSync. Cue tidak akan terpanggil otomatis sesuai ketukan bass.`,
            resolution: `Alihkan tipe trigger ke "Follow" standar dengan notifikasi untuk operator lighting.`
          });
        }
      }

      // Subdevice RDM
      if (/<RDMDevice\b[^>]*subdevice=/i.test(line)) {
        if (compareVersions(targetVersion, '3.9.0.0') < 0) {
          issues.push({
            code: 'XML_RDM_SUBDEVICE_UNSUPPORTED',
            severity: 'warning',
            line: idx + 1,
            featureName: 'Konfigurasi Sub-device RDM',
            description: `Ditemukan pemetaan subdevice RDM: ${line.trim().slice(0, 80)}...`,
            impact: `Firmware sebelum 3.9 tidak mendukung penomoran subdevice RDM; berpotensi merusak struktur patch.`,
            resolution: `Bungkus dalam blok komentar XML aman atau sesuaikan ke perangkat RDM induk.`
          });
        }
      }

      // Tag Phaser / Hybrid
      if (/<PhaserPreview\b|<GDTFRef\b|<FixtureRecipe\b/i.test(line)) {
        issues.push({
          code: 'XML_HYBRID_PHASER_UNSUPPORTED',
          severity: 'warning',
          line: idx + 1,
          featureName: 'Tag Metadata Phaser / Recipe grandMA3',
          description: `Ditemukan tag sekuens hibrida: ${line.trim().slice(0, 80)}...`,
          impact: `Konsol grandMA2 versi lama akan menolak elemen XML yang tidak dikenal.`,
          resolution: `Bungkus dalam blok komentar XML yang aman tanpa menghapus cue dasar.`
        });
      }

      // Atribut Lampu Modern (VIRTUAL_COLOR_MODE, CRIMODE, COLORHSB) untuk versi < 3.8 / 3.2
      if (/\b(?:VIRTUAL_COLOR_MODE|CRIMODE|COLORHSB1|CRIMODESELECT)\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.8.0.0') < 0) {
          issues.push({
            code: 'XML_FIXTURE_MODERN_ATTR_UNSUPPORTED',
            severity: 'critical',
            line: idx + 1,
            featureName: 'Atribut Fixture Modern (VIRTUAL_COLOR_MODE / CRIMODE / HSB)',
            description: `Ditemukan atribut fixture modern yang tidak didukung firmware lama: ${line.trim().slice(0, 80)}...`,
            impact: `grandMA2 v${targetVersion} akan menolak impor fixture atau channel kontrol warna tidak dapat diakses pada encoder wheel.`,
            resolution: `Konversi otomatis atribut ke CONTROL/DUMMY standar konsol agar fixture dapat di-patch dengan mulus.`
          });
        }
      }
    });
  }

  // 3. Pemeriksaan berbasis Lua
  if (fileType === 'lua_plugin' || fileType === 'plugin_xml') {
    lines.forEach((line, idx) => {
      // gma.gui.progress
      if (/gma\.gui\.progress\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.8.0.0') < 0) {
          issues.push({
            code: 'LUA_GUI_PROGRESS_UNSUPPORTED',
            severity: 'critical',
            line: idx + 1,
            featureName: 'API Dialog gma.gui.progress',
            description: `Pemanggilan gma.gui.progress terdeteksi pada baris ${idx + 1}.`,
            impact: `Pada grandMA2 <= 3.7, method progress bernilai nil. Eksekusi plugin akan crash dengan error "attempt to call a nil value".`,
            resolution: `Sisipkan Rahul Light Lua Polyfill Shim di awal skrip agar perintah berjalan aman tanpa crash.`
          });
        }
      }

      // gma.network.gethostdata
      if (/gma\.network\.gethostdata\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.9.0.0') < 0) {
          issues.push({
            code: 'LUA_NETWORK_GETHOSTDATA_UNSUPPORTED',
            severity: 'warning',
            line: idx + 1,
            featureName: 'API Jaringan gma.network.gethostdata',
            description: `Pemanggilan gma.network.gethostdata pada baris ${idx + 1}.`,
            impact: `Fungsi ini belum tersedia pada MA2 <= 3.8 dan mengembalikan nilai nil.`,
            resolution: `Sisipkan shim tiruan fallback yang mengembalikan struktur default IP dan sesi konsol.`
          });
        }
      }

      // gma.show.property
      if (/gma\.show\.property\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.5.0.0') < 0) {
          issues.push({
            code: 'LUA_SHOW_PROPERTY_UNSUPPORTED',
            severity: 'critical',
            line: idx + 1,
            featureName: 'API Akses Properti gma.show.property',
            description: `Akses properti objek langsung pada baris ${idx + 1}.`,
            impact: `API properti belum diekspos pada build MA2 sebelum versi 3.5.`,
            resolution: `Sediakan wrapper kompatibilitas atau gunakan peringatan fallback perintah commandline.`
          });
        }
      }

      // Operator Bitwise Lua 5.3
      if (/(?:\b\d+\s*[&|~]\s*\d+\b|\b\d+\s*<<\s*\d+\b|\b\d+\s*>>\s*\d+\b)/.test(line) && !line.trim().startsWith('--')) {
        if (compareVersions(targetVersion, '3.9.50.0') < 0) {
          issues.push({
            code: 'LUA_BITWISE_SYNTAX_UNSUPPORTED',
            severity: 'critical',
            line: idx + 1,
            featureName: 'Sintaks Bitwise Lua 5.3 (&, |, ~, <<, >>)',
            description: `Sintaks bitwise modern terdeteksi pada baris ${idx + 1}.`,
            impact: `Konsol target menjalankan runtime Lua 5.1 tanpa operator bitwise bawaan; memicu error parser saat load skrip.`,
            resolution: `Transpile atau ganti dengan pemanggilan fungsi pustaka bit (bit.band, bit.bor).`
          });
        }
      }
    });
  }

  // 4. Pemeriksaan perintah Macro CLI
  if (fileType === 'macro_xml' || fileType === 'showfile') {
    lines.forEach((line, idx) => {
      // Warna Hex Appearance
      const hexColorMatch = line.match(/Appearance\s+.*\/color=["']?#([0-9a-fA-F]{6})["']?/i);
      if (hexColorMatch && compareVersions(targetVersion, '3.8.0.0') < 0) {
        issues.push({
          code: 'MACRO_HEX_COLOR_UNSUPPORTED',
          severity: 'warning',
          line: idx + 1,
          featureName: 'Format Warna Heksadesimal pada Perintah Appearance',
          description: `Ditemukan warna heksadesimal "${hexColorMatch[0]}" pada baris ${idx + 1}.`,
          impact: `Konsol grandMA2 versi lama tidak mendukung nilai string hex pada parameter /color.`,
          resolution: `Konversi warna heksadesimal menjadi integer RGB yang dipisahkan koma ("r,g,b").`
        });
      }

      // Perintah NetworkSpeed
      if (/\b(?:NetworkSpeed|PortSpeed|ArtNetSyncMode)\b/i.test(line)) {
        if (compareVersions(targetVersion, '3.9.0.0') < 0) {
          issues.push({
            code: 'MACRO_NETWORK_CMD_UNSUPPORTED',
            severity: 'warning',
            line: idx + 1,
            featureName: 'Perintah CLI Konfigurasi Port Jaringan',
            description: `Ditemukan perintah interface jaringan: ${line.trim().slice(0, 80)}`,
            impact: `Keyword baris perintah ini belum ada di mesin CLI grandMA2 versi lama.`,
            resolution: `Komentari baris macro tersebut dengan tag penjelasan operasional.`
          });
        }
      }
    });
  }

  // Perhitungan statistik
  const critical = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const info = issues.filter(i => i.severity === 'info').length;
  const convertible = issues.filter(i => i.resolution && !i.code.startsWith('VER_UPGRADE')).length;

  let status = 'Kompatibel';
  if (!isDowngrade && issues.length === 0) {
    status = 'Kompatibel';
  } else if (critical > 0) {
    status = 'Perlu Peninjauan';
  } else if (warnings > 0 || isDowngrade) {
    status = 'Dapat Dikonversi';
  }

  return {
    fileName,
    fileType,
    sourceVersion: effectiveSource,
    detectedSource: effectiveSource,
    targetVersion,
    status,
    canConvert: isDowngrade || issues.length > 0,
    isDecompressedShow,
    fileSize: buffer.length,
    issues,
    stats: {
      totalIssues: issues.length,
      critical,
      warnings,
      info,
      convertible
    }
  };
}

function analyzeZipPackage(fileName, buffer, sourceVersion, targetVersion) {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    const subReports = [];

    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        const entryBuf = entry.getData();
        const entryReport = analyzeCompatibility(entry.entryName, entryBuf, {
          sourceVersion,
          targetVersion
        });
        subReports.push(entryReport);
      }
    }

    const allIssues = subReports.flatMap(r => r.issues);
    const critical = allIssues.filter(i => i.severity === 'critical').length;
    const warnings = allIssues.filter(i => i.severity === 'warning').length;
    const info = allIssues.filter(i => i.severity === 'info').length;

    let status = 'Kompatibel';
    if (critical > 0) status = 'Perlu Peninjauan';
    else if (warnings > 0 || allIssues.length > 0) status = 'Dapat Dikonversi';

    return {
      fileName,
      fileType: 'zip_package',
      detectedSource: sourceVersion,
      targetVersion,
      status,
      canConvert: true,
      fileSize: buffer.length,
      issues: allIssues,
      subReports,
      stats: {
        totalIssues: allIssues.length,
        critical,
        warnings,
        info,
        convertible: allIssues.length,
        totalFilesInZip: subReports.length
      }
    };
  } catch (err) {
    return {
      fileName,
      fileType: 'zip_package',
      detectedSource: sourceVersion,
      targetVersion,
      status: 'Konversi Gagal',
      canConvert: false,
      fileSize: buffer.length,
      issues: [
        {
          code: 'ZIP_CORRUPT',
          severity: 'critical',
          line: 1,
          featureName: 'Arsip ZIP Rusak / Tidak Valid',
          description: `Gagal membaca arsip ZIP: ${err.message}`,
          impact: 'Tidak dapat mengekstrak isi berkas di dalam paket.',
          resolution: 'Periksa integritas file ZIP sebelum mengunggah kembali.'
        }
      ],
      stats: { totalIssues: 1, critical: 1, warnings: 0, info: 0, convertible: 0 }
    };
  }
}
