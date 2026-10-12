/**
 * grandMA2 Direct Deployer Engine
 * Automatically installs converted fixtures, effects, macros, and plugins
 * directly into the local grandMA2 ProgramData libraries.
 * Maintained by RAHUL LIGHT Engineering Team
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';

const MA_BASE_DIR = 'C:\\ProgramData\\MA Lighting Technologies\\grandma';

/**
 * Detect all installed grandMA2 data directories
 */
export function detectInstalledMA2Versions() {
  const versions = [];
  try {
    if (fs.existsSync(MA_BASE_DIR)) {
      const items = fs.readdirSync(MA_BASE_DIR);
      for (const item of items) {
        if (item.startsWith('gma2_V_')) {
          const dirPath = path.join(MA_BASE_DIR, item);
          const stat = fs.statSync(dirPath);
          if (stat.isDirectory()) {
            const verString = item.replace('gma2_V_', '');
            versions.push({
              folder: item,
              version: verString,
              path: dirPath,
              hasLibrary: fs.existsSync(path.join(dirPath, 'library')),
              hasEffects: fs.existsSync(path.join(dirPath, 'effects')),
              hasMacros: fs.existsSync(path.join(dirPath, 'macros')),
              hasPlugins: fs.existsSync(path.join(dirPath, 'plugins')),
              hasShows: fs.existsSync(path.join(dirPath, 'shows'))
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error detecting grandMA2 versions:', err);
  }
  return versions;
}

/**
 * Check if grandMA2 onPC is actively running
 */
export function getRunningMA2Process() {
  try {
    const output = execSync('powershell "Get-Process -Name gma2onpc -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path"', { encoding: 'utf-8' }).trim();
    if (output) {
      const match = output.match(/grandMA2 onPC\s+([\d\.]+)/i);
      return {
        running: true,
        path: output,
        version: match ? match[1] : 'Unknown'
      };
    }
  } catch {}
  return { running: false };
}

/**
 * Helper to pack XML string into official grandMA2 .xmlp gzip format
 */
export function packToXmlp(xmlString) {
  // MA DATA binary header: 4d 41 20 44 41 54 41 00 05 00 07 03 37 0f 00 00 ef bb bf
  const headerHex = '4d4120444154410005000703370f0000efbbbf';
  const headerBuf = Buffer.from(headerHex, 'hex');
  const xmlBuf = Buffer.from(xmlString, 'utf-8');
  const payload = Buffer.concat([headerBuf, xmlBuf]);
  return zlib.gzipSync(payload, { level: 9 });
}

/**
 * Deploy converted file directly to grandMA2 installation
 */
export function deployToMA2(job, options = {}) {
  const installed = detectInstalledMA2Versions();
  if (installed.length === 0) {
    throw new Error('Tidak ditemukan folder instalasi grandMA2 di sistem C:\\ProgramData\\MA Lighting Technologies\\grandma\\');
  }

  // Determine target directory
  const targetVer = options.targetVersion || job.targetVersion || '3.2.2.16';
  const running = getRunningMA2Process();

  // Find best match folder (e.g. targetVer 3.7.0.5 -> gma2_V_3.7, 3.2.2.16 -> gma2_V_3.2.2)
  let matched = null;
  const parts = targetVer.split('.');
  const prefix2 = `gma2_V_${parts[0]}.${parts[1]}`;
  const prefix3 = `gma2_V_${parts[0]}.${parts[1]}.${parts[2]}`;

  matched = installed.find(v => v.folder === prefix3) ||
            installed.find(v => v.folder === prefix2) ||
            installed.find(v => v.folder.startsWith(prefix2)) ||
            (running.running ? installed.find(v => running.path.includes(v.version)) : null) ||
            installed[0];

  if (!matched) {
    throw new Error(`Tidak dapat menemukan folder grandMA2 untuk target versi ${targetVer}`);
  }

  const baseDir = matched.path;
  const fileType = job.fileType;
  const deployedPaths = [];
  const fileName = job.outputFileName || job.originalFileName;
  const buffer = Buffer.isBuffer(job.convertedBuffer)
    ? job.convertedBuffer
    : (Buffer.isBuffer(job.buffer) ? job.buffer : Buffer.from(job.convertedText || '', 'utf-8'));

  if (!buffer || buffer.length === 0) {
    throw new Error('Data berkas hasil konversi kosong. Silakan ulangi proses konversi.');
  }

  const text = buffer.toString('utf-8');

  let instruction = '';

  if (fileType === 'fixture_xml' || fileType === 'fixture_xmlp' || text.includes('<FixtureType')) {
    // 1. Fixture Library -> deploy to library/
    const libDir = path.join(baseDir, 'library');
    if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

    // Base name without extension
    const baseName = fileName.replace(/\.(xml|xmlp)$/i, '');
    
    // Save plain .xml
    const xmlPath = path.join(libDir, `${baseName}.xml`);
    fs.writeFileSync(xmlPath, text, 'utf-8');
    deployedPaths.push(xmlPath);

    // Save packed .xmlp (grandMA2 native factory format)
    const xmlpPath = path.join(libDir, `${baseName}.xmlp`);
    const xmlpBuf = packToXmlp(text);
    fs.writeFileSync(xmlpPath, xmlpBuf);
    deployedPaths.push(xmlpPath);

    instruction = `File fixture berhasil dipasang ke Library grandMA2 (${matched.folder}).
Langkah Import di grandMA2:
1. Buka Setup -> Patch & Fixture Schedule.
2. Klik tombol [Fixture Types] di sebelah kanan atas.
3. Klik tombol [Import] di pojok kanan bawah.
4. Pastikan pilihan Drive di kanan atas adalah [Drive 1: Internal].
5. Cari "${baseName.split('@')[1] || baseName}" atau Manufacturer "${baseName.split('@')[0] || ''}".
6. Pilih file lalu klik [Import]!
7. Masuk ke Layer -> klik [New] untuk mem-patch fixture ke showfile.`;

  } else if (fileType === 'effect_xml' || text.includes('<Effect') || text.includes('<Forms')) {
    // 2. Effect -> deploy to effects/ and importexport/
    const effDir = path.join(baseDir, 'effects');
    const ieDir = path.join(baseDir, 'importexport');
    if (!fs.existsSync(effDir)) fs.mkdirSync(effDir, { recursive: true });
    if (!fs.existsSync(ieDir)) fs.mkdirSync(ieDir, { recursive: true });

    const safeName = fileName.replace(/\.(xml)$/i, '').replace(/\./g, '_') + '.xml';
    const effPath = path.join(effDir, safeName);
    const iePath = path.join(ieDir, safeName);

    fs.writeFileSync(effPath, text, 'utf-8');
    fs.writeFileSync(iePath, text, 'utf-8');
    deployedPaths.push(effPath);
    deployedPaths.push(iePath);

    instruction = `File Effect berhasil dipasang ke folder Effects & ImportExport grandMA2 (${matched.folder}).
Langkah Import Effect di grandMA2:
1. Buka jendela pool [Effects] pada layar grandMA2.
2. Klik kanan (Edit) pada kotak Effect yang masih kosong.
3. Klik tombol [Load Predefined] atau [Import] di jendela editor Effect.
4. Pilih file "${safeName.replace('.xml', '')}" lalu klik [Import]!
Atau jalankan perintah CLI:
Import "${safeName.replace('.xml', '')}" At Effect 1 /overwrite`;

  } else if (fileType === 'macro_xml' || text.includes('<Macro')) {
    // 3. Macro -> deploy to macros/ and importexport/
    const macDir = path.join(baseDir, 'macros');
    const ieDir = path.join(baseDir, 'importexport');
    if (!fs.existsSync(macDir)) fs.mkdirSync(macDir, { recursive: true });
    if (!fs.existsSync(ieDir)) fs.mkdirSync(ieDir, { recursive: true });

    const safeName = fileName.replace(/\.(xml)$/i, '').replace(/\./g, '_') + '.xml';
    const macPath = path.join(macDir, safeName);
    const iePath = path.join(ieDir, safeName);

    fs.writeFileSync(macPath, text, 'utf-8');
    fs.writeFileSync(iePath, text, 'utf-8');
    deployedPaths.push(macPath);
    deployedPaths.push(iePath);

    instruction = `File Macro berhasil dipasang ke folder Macros grandMA2 (${matched.folder}).
Langkah Import Macro di grandMA2:
Buka jendela Macro Pool -> klik kanan kotak kosong -> klik [Import] -> pilih "${safeName.replace('.xml', '')}".`;

  } else if (fileType === 'plugin_xml' || fileType === 'lua_plugin' || text.includes('<Plugin') || fileName.endsWith('.lua')) {
    // 4. Plugin -> deploy to plugins/ and importexport/
    const plDir = path.join(baseDir, 'plugins');
    const ieDir = path.join(baseDir, 'importexport');
    if (!fs.existsSync(plDir)) fs.mkdirSync(plDir, { recursive: true });
    if (!fs.existsSync(ieDir)) fs.mkdirSync(ieDir, { recursive: true });

    const plPath = path.join(plDir, fileName);
    const iePath = path.join(ieDir, fileName);
    fs.writeFileSync(plPath, buffer);
    fs.writeFileSync(iePath, buffer);
    deployedPaths.push(plPath);
    deployedPaths.push(iePath);

    instruction = `File Plugin berhasil dipasang ke folder Plugins grandMA2 (${matched.folder}).
Langkah Import Plugin di grandMA2:
Buka Plugin Pool -> klik kanan kotak kosong -> klik [Import] -> pilih "${fileName}".`;

  } else if (fileType === 'showfile' || fileName.includes('.show') || fileName.endsWith('.gz')) {
    // 5. Showfile -> deploy to shows/
    const showDir = path.join(baseDir, 'shows');
    if (!fs.existsSync(showDir)) fs.mkdirSync(showDir, { recursive: true });

    // Clean base name for grandMA2 load dialog (no dots in base name!)
    const baseShowName = fileName
      .replace(/\.show\.gz$/i, '')
      .replace(/\.show$/i, '')
      .replace(/\.gz$/i, '')
      .replace(/\./g, '_');

    let gzBuffer, uncompressedBuffer;
    const isGzip = buffer && buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

    if (isGzip) {
      gzBuffer = buffer;
      try {
        uncompressedBuffer = zlib.gunzipSync(buffer);
      } catch {
        uncompressedBuffer = buffer;
      }
    } else {
      uncompressedBuffer = buffer;
      gzBuffer = zlib.gzipSync(buffer, { level: 9 });
    }

    // Deploy both .show.gz (compressed) and .show (uncompressed)
    const showGzPath = path.join(showDir, `${baseShowName}.show.gz`);
    const showPath = path.join(showDir, `${baseShowName}.show`);
    fs.writeFileSync(showGzPath, gzBuffer);
    fs.writeFileSync(showPath, uncompressedBuffer);
    deployedPaths.push(showGzPath);
    deployedPaths.push(showPath);

    // Pasang juga companion Migration XML Macro ke importexport/ untuk backup pemulihan
    const ieDir = path.join(baseDir, 'importexport');
    if (!fs.existsSync(ieDir)) fs.mkdirSync(ieDir, { recursive: true });
    const importMacroPath = path.join(ieDir, `Import_Show_${baseShowName}.xml`);
    const importMacroXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.1.0/MA.xsd" major_vers="3" minor_vers="1" stream_vers="0">
    <Info datetime="${new Date().toISOString()}" showfile="${baseShowName}" />
    <Macro index="0" name="MIGRATE IMPORT (${baseShowName})">
        <Macroline index="0"><text>Echo "=== MEMULAI IMPORT MODUL SHOWFILE ==="</text></Macroline>
        <Macroline index="1"><text>Import "fixtures" At Fixture 1</text></Macroline>
        <Macroline index="2"><text>Import "groups" At Group 1</text></Macroline>
        <Macroline index="3"><text>Import "dimmer_presets" At Preset 1.1</text></Macroline>
        <Macroline index="4"><text>Import "position_presets" At Preset 2.1</text></Macroline>
        <Macroline index="5"><text>Import "gobo_presets" At Preset 3.1</text></Macroline>
        <Macroline index="6"><text>Import "color_presets" At Preset 4.1</text></Macroline>
        <Macroline index="7"><text>Import "beam_presets" At Preset 5.1</text></Macroline>
        <Macroline index="8"><text>Import "sequences" At Sequence 1</text></Macroline>
        <Macroline index="9"><text>Import "effects" At Effect 1</text></Macroline>
        <Macroline index="10"><text>Import "macros" At Macro 1</text></Macroline>
        <Macroline index="11"><text>Echo "=== IMPORT SHOWFILE SELESAI ==="</text></Macroline>
    </Macro>
</MA>`;
    fs.writeFileSync(importMacroPath, Buffer.from(importMacroXml, 'utf-8'));
    deployedPaths.push(importMacroPath);

    instruction = `Showfile "${baseShowName}" berhasil dipasang langsung ke folder Shows grandMA2 (${matched.folder}).
Langkah Membuka Showfile di grandMA2:
1. Klik tombol [Backup] di pojok kanan atas grandMA2.
2. Klik tombol [Load Show].
3. Pastikan pilihan Drive di kanan atas bertuliskan [Drive 1: Internal].
4. Cari dan klik nama show "${baseShowName}" dari daftar tabel.
5. Klik tombol [Load Show] di pojok kanan bawah!
PENTING: Jika showfile ter-load namun isinya kosong (akibat C++ binary struct mismatch), jalankan Macro pemulihan XML dari folder importexport: Import "Import_Show_${baseShowName}" At Macro 999.`;
  }

  return {
    success: true,
    matchedTarget: matched.folder,
    targetVersion: matched.version,
    runningProcess: running,
    deployedPaths,
    instruction
  };
}
