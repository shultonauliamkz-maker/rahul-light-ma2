/**
 * grandMA2 File Converter Engine
 * Performs actual transformation of grandMA2 showfiles, XML exports, Lua plugins, and ZIP packages
 * Maintained by RAHUL LIGHT Engineering Team
 */

import zlib from 'zlib';
import AdmZip from 'adm-zip';
import { XMLValidator } from 'fast-xml-parser';
import { getVersionInfo, parseVersion, compareVersions } from './versionMatrix.js';
import { detectFileType, extractVersionFromContent } from './analyzer.js';
import { runImportCompatibilityCheck, generateDiagnosticReportText } from './diagnostics.js';
import { createShowfileMigrationZip } from './migrationPackage.js';

export function convertFile(fileName, buffer, options = {}) {
  const mode = options.mode || 'auto'; // 'auto' | 'safe' | 'advanced'
  const targetVersion = options.targetVersion || '3.9.60.74';
  const targetInfo = getVersionInfo(targetVersion);
  const fileType = detectFileType(fileName, buffer);

  const logs = [];
  const modifiedFeatures = [];

  let convertedBuffer = null;
  let originalText = '';
  let convertedText = '';
  let migrationZipBuffer = null;
  let migrationZipFileName = null;

  if (fileType === 'showfile') {
    // 1. grandMA2 Showfile (.show / .gz / .show.gz)
    const isGzip = buffer && buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
    let rawBuffer = buffer;
    if (isGzip) {
      try {
        rawBuffer = zlib.gunzipSync(buffer);
        logs.push(`Decompressed grandMA2 showfile gzip archive (${buffer.length} bytes → ${rawBuffer.length} bytes binary payload).`);
      } catch (err) {
        rawBuffer = buffer;
        logs.push(`Gzip decompress notice: ${err.message}`);
      }
    }

    // Check for grandMA2 binary MA DATA header
    if (rawBuffer.length >= 12 && rawBuffer.slice(0, 8).toString('latin1') === 'MA DATA\0') {
      const origSub = rawBuffer[8];
      const origStream = rawBuffer[9];
      const origMinor = rawBuffer[10];
      const origMajor = rawBuffer[11];
      logs.push(`Detected grandMA2 binary showfile v${origMajor}.${origMinor}.${origStream}.${origSub}.`);

      // Clone buffer to avoid mutating source buffer
      let patchedBuffer = Buffer.from(rawBuffer);

      // Patch the file indexer version table (offset 8..11)
      patchedBuffer[8] = targetInfo.sub;
      patchedBuffer[9] = targetInfo.stream;
      patchedBuffer[10] = targetInfo.minor;
      patchedBuffer[11] = targetInfo.major;

      // Patch the database payload root chunk version table (offset 136..139)
      if (patchedBuffer.length >= 140) {
        patchedBuffer[136] = targetInfo.sub;
        patchedBuffer[137] = targetInfo.stream;
        patchedBuffer[138] = targetInfo.minor;
        patchedBuffer[139] = targetInfo.major;
      }

      // Also scan and patch any other matching version sequences across the binary stream
      let additionalPatches = 0;
      for (let i = 140; i < patchedBuffer.length - 4; i++) {
        if (
          patchedBuffer[i] === origSub &&
          patchedBuffer[i + 1] === origStream &&
          patchedBuffer[i + 2] === origMinor &&
          patchedBuffer[i + 3] === origMajor
        ) {
          patchedBuffer[i] = targetInfo.sub;
          patchedBuffer[i + 1] = targetInfo.stream;
          patchedBuffer[i + 2] = targetInfo.minor;
          patchedBuffer[i + 3] = targetInfo.major;
          additionalPatches++;
        }
      }

      const changeDetail = `Patched binary showfile version table (index header offset 8 & payload root chunk offset 136${additionalPatches > 0 ? ` + ${additionalPatches} internal references` : ''}) from v${origMajor}.${origMinor}.${origStream}.${origSub} to grandMA2 v${targetInfo.major}.${targetInfo.minor}.${targetInfo.stream}.${targetInfo.sub}.`;
      logs.push(changeDetail);
      modifiedFeatures.push({ action: 'PATCH_BINARY_SHOWFILE_HEADER', detail: changeDetail });

      // Check if showfile contains an embedded XML payload (e.g. <?xml)
      const xmlIdx = patchedBuffer.indexOf('<?xml');
      if (xmlIdx !== -1) {
        const xmlSlice = patchedBuffer.slice(xmlIdx).toString('utf-8');
        const { outputXml, changes: xmlChanges } = convertXmlContent(xmlSlice, targetInfo, mode, options);
        xmlChanges.forEach(c => {
          logs.push(c.detail);
          modifiedFeatures.push(c);
        });
        const convertedXmlBuf = Buffer.from(outputXml, 'utf-8');
        const binaryHead = patchedBuffer.slice(0, xmlIdx);
        patchedBuffer = Buffer.concat([binaryHead, convertedXmlBuf]);
      }

      // Re-compress into official grandMA2 .show.gz container
      convertedBuffer = zlib.gzipSync(patchedBuffer, { level: 9 });
      logs.push(`Packaged showfile into high-compression grandMA2 .show.gz container (${convertedBuffer.length} bytes).`);
      originalText = `[grandMA2 Binary Showfile v${origMajor}.${origMinor}.${origStream}.${origSub}, ${rawBuffer.length} bytes]`;
      convertedText = `[grandMA2 Binary Showfile v${targetInfo.major}.${targetInfo.minor}.${targetInfo.stream}.${targetInfo.sub}, ${patchedBuffer.length} bytes]`;

      // Extract clean show name & parameter count for migration package
      const cleanShowName = fileName
        .replace(/\.show\.gz$/i, '')
        .replace(/\.show$/i, '')
        .replace(/\.gz$/i, '')
        .replace(/\.xml$/i, '')
        .replace(/\./g, '_');
      const safeVer = targetVersion.replace(/\./g, '_');
      const paramMatch = rawBuffer.toString('latin1').match(/required:\s*(\d+);\s*available:/i);
      const paramCount = paramMatch ? parseInt(paramMatch[1], 10) : null;

      try {
        migrationZipBuffer = createShowfileMigrationZip({
          showName: cleanShowName,
          sourceVersion: `${origMajor}.${origMinor}.${origStream}.${origSub}`,
          targetVersion,
          showGzBuffer: convertedBuffer,
          showGzFileName: `${cleanShowName}_v${safeVer}.show.gz`,
          showDetails: {
            uncompressedSize: rawBuffer.length,
            paramCount
          }
        });
        migrationZipFileName = `${cleanShowName}_v${safeVer}_MIGRATION_PACKAGE.zip`;
        logs.push(`Generated companion grandMA2 Showfile Migration Suite ZIP (${(migrationZipBuffer.length / 1024).toFixed(1)} KB) including XML Import & Export Macros.`);
      } catch (zipErr) {
        logs.push(`Migration kit packaging notice: ${zipErr.message}`);
      }

    } else {
      // Fallback for XML-only showfile exports
      originalText = rawBuffer.toString('utf-8');
      const { outputXml, changes: xmlChanges } = convertXmlContent(originalText, targetInfo, mode, options);
      convertedText = outputXml;
      xmlChanges.forEach(c => {
        logs.push(c.detail);
        modifiedFeatures.push(c);
      });
      convertedBuffer = zlib.gzipSync(Buffer.from(convertedText, 'utf-8'), { level: 9 });
      logs.push(`Compressed XML showfile into .show.gz container (${convertedBuffer.length} bytes).`);
    }

  } else if (fileType === 'lua_plugin') {
    // 2. Lua Plugin (.lua)
    originalText = buffer.toString('utf-8');
    const { outputLua, changes } = convertLuaContent(originalText, targetInfo, mode, options);
    convertedText = outputLua;
    changes.forEach(c => {
      logs.push(c.detail);
      modifiedFeatures.push(c);
    });
    convertedBuffer = Buffer.from(convertedText, 'utf-8');

  } else if (fileType === 'zip_package') {
    // 3. ZIP package containing multiple MA2 files
    return convertZipPackage(fileName, buffer, targetInfo, mode, options);

  } else if (fileType === 'asset_image') {
    // Image assets do not require binary alteration
    logs.push(`Asset ${fileName} is binary texture compatible. Maintained bit-for-bit integrity.`);
    originalText = `[Binary Asset: ${fileName}, ${buffer.length} bytes]`;
    convertedText = originalText;
    convertedBuffer = buffer;

  } else if (fileType === 'fixture_xmlp') {
    // 4. grandMA2 Packed Fixture Library (.xmlp)
    let header = Buffer.alloc(0);
    let rawXml = '';
    try {
      const decompressed = zlib.gunzipSync(buffer);
      const xmlIndex = decompressed.indexOf('<?xml');
      if (xmlIndex !== -1) {
        header = decompressed.slice(0, xmlIndex);
        rawXml = decompressed.slice(xmlIndex).toString('utf-8');
      } else {
        rawXml = decompressed.toString('utf-8');
      }
      logs.push(`Decompressed grandMA2 .xmlp packed fixture library (${buffer.length} bytes compressed → ${rawXml.length} bytes XML).`);
    } catch (e) {
      rawXml = buffer.toString('utf-8');
      logs.push(`Read raw fixture payload: ${e.message}`);
    }

    originalText = rawXml;
    const { outputXml, changes } = convertXmlContent(rawXml, targetInfo, mode, options);
    convertedText = outputXml;
    changes.forEach(c => {
      logs.push(c.detail);
      modifiedFeatures.push(c);
    });

    // Re-pack as .xmlp
    const xmlBuf = Buffer.from(convertedText, 'utf-8');
    const repackedPayload = header.length > 0 ? Buffer.concat([header, xmlBuf]) : xmlBuf;
    convertedBuffer = zlib.gzipSync(repackedPayload, { level: 9 });
    logs.push(`Re-packed .xmlp fixture library with gzip level 9 (${convertedBuffer.length} bytes).`);

  } else {
    // 5. XML-based files (fixture_xml, macro_xml, effect_xml, preset_xml, general_ma2_xml, config)
    originalText = buffer.toString('utf-8');
    const { outputXml, changes } = convertXmlContent(originalText, targetInfo, mode, options);
    convertedText = outputXml;
    changes.forEach(c => {
      logs.push(c.detail);
      modifiedFeatures.push(c);
    });
    convertedBuffer = Buffer.from(convertedText, 'utf-8');
  }

  // Determine source version
  const detectedSource = extractVersionFromContent(fileType, buffer, options.sourceVersion || '3.9.63.6');
  const sourceVersion = options.sourceVersion && options.sourceVersion !== 'auto' ? options.sourceVersion : detectedSource;

  // Generate output filename following grandMA2 conventions
  const safeVer = targetVersion.replace(/\./g, '_');
  let outputFileName;
  if (fileType === 'showfile') {
    // grandMA2 showfiles MUST have .show.gz extension to appear in Backup -> Load Show
    const cleanShowName = fileName
      .replace(/\.show\.gz$/i, '')
      .replace(/\.show$/i, '')
      .replace(/\.gz$/i, '')
      .replace(/\.xml$/i, '')
      .replace(/\./g, '_');
    outputFileName = `${cleanShowName}_v${safeVer}.show.gz`;
  } else if (fileName.includes('@')) {
    const parts = fileName.split('@');
    if (parts.length === 3) {
      // Format grandMA2: manufacturer@fixture@mode.xml
      const modeWithExt = parts[2];
      const modeExt = modeWithExt.split('.').pop();
      const modeName = modeWithExt.replace(/\.[^/.]+$/, '').replace(/\./g, '_');
      outputFileName = `${parts[0]}@${parts[1].replace(/\./g, '_')}@${modeName}.${modeExt}`;
    } else {
      const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/\./g, '_');
      const ext = fileName.split('.').pop();
      outputFileName = `${baseName}_MA2_v${safeVer}_CONVERTED.${ext}`;
    }
  } else {
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/\./g, '_');
    const ext = fileName.split('.').pop();
    outputFileName = `${baseName}_MA2_v${safeVer}_CONVERTED.${ext}`;
  }

  // Run Real IMPORT COMPATIBILITY CHECK
  const importCheck = runImportCompatibilityCheck(
    fileType,
    buffer,
    convertedBuffer,
    originalText,
    convertedText,
    targetVersion,
    options
  );

  // Generate Diagnostic Report Text
  const diagnosticReportText = generateDiagnosticReportText(
    fileName,
    sourceVersion,
    targetVersion,
    fileType,
    importCheck,
    options.errorMessage || ''
  );

  return {
    originalFileName: fileName,
    outputFileName,
    fileType,
    sourceVersion,
    targetVersion,
    mode,
    originalSize: buffer.length,
    convertedSize: convertedBuffer ? convertedBuffer.length : buffer.length,
    convertedBuffer,
    migrationZipBuffer,
    migrationZipFileName,
    originalText: originalText.slice(0, 100000), // capped preview
    convertedText: convertedText.slice(0, 100000),
    logs,
    modifiedFeatures,
    importCheck,
    diagnosticReportText
  };
}

/**
 * Convert grandMA2 XML content
 */
function convertXmlContent(xml, targetInfo, mode, options) {
  const changes = [];
  // Strip UTF-8 BOM if present
  let result = xml.replace(/^\uFEFF/, '');

  // 1. Update <MA> root version attributes
  const maRegex = /<MA\b([^>]*)>/i;
  const match = result.match(maRegex);

  if (match) {
    let attrs = match[1];

    // Replace or add major_vers
    if (/major_vers=["']?\d+["']?/i.test(attrs)) {
      attrs = attrs.replace(/major_vers=["']?\d+["']?/i, `major_vers="${targetInfo.major}"`);
    } else {
      attrs += ` major_vers="${targetInfo.major}"`;
    }

    // Replace or add minor_vers
    if (/minor_vers=["']?\d+["']?/i.test(attrs)) {
      attrs = attrs.replace(/minor_vers=["']?\d+["']?/i, `minor_vers="${targetInfo.minor}"`);
    } else {
      attrs += ` minor_vers="${targetInfo.minor}"`;
    }

    // Replace stream_vers
    if (/stream_vers=["']?\d+["']?/i.test(attrs)) {
      attrs = attrs.replace(/stream_vers=["']?\d+["']?/i, `stream_vers="${targetInfo.stream}"`);
    } else {
      attrs += ` stream_vers="${targetInfo.stream}"`;
    }

    // Replace stream_sub_vers (only present on grandMA2 >= v3.4; omitted on legacy schemas)
    const supportsSubVers = targetInfo.major > 3 || (targetInfo.major === 3 && targetInfo.minor >= 4);
    if (supportsSubVers) {
      if (/stream_sub_vers=["']?\d+["']?/i.test(attrs)) {
        attrs = attrs.replace(/stream_sub_vers=["']?\d+["']?/i, `stream_sub_vers="${targetInfo.sub}"`);
      } else {
        attrs += ` stream_sub_vers="${targetInfo.sub}"`;
      }
    } else {
      // Strip stream_sub_vers completely for legacy versions (< 3.4.0) to pass XSD validation
      attrs = attrs.replace(/\s*stream_sub_vers=["']?\d+["']?/gi, '');
    }

    // Replace schemaLocation
    attrs = attrs.replace(/xml\/(\d+\.\d+\.\d+(?:\.\d+)?)\/MA\.xsd/i, `xml/${targetInfo.major}.${targetInfo.minor}.${targetInfo.stream}/MA.xsd`);

    result = result.replace(maRegex, `<MA${attrs}>`);
    changes.push({
      action: 'UPDATE_ROOT_VERSION',
      detail: `Adjusted <MA> root header: stream_vers="${targetInfo.stream}"${supportsSubVers ? `, stream_sub_vers="${targetInfo.sub}"` : ''}, major_vers="${targetInfo.major}", minor_vers="${targetInfo.minor}".`
    });
  }

  // 2. Inject Rahul Light Conversion Stamp INSIDE <InfoItems> or inside <MA>, NEVER before <MA> (which breaks grandMA2 XML parser!)
  if (result.includes('<InfoItems>')) {
    result = result.replace('<InfoItems>', `<InfoItems>\n\t\t\t<Info type="Revision">Downgraded by RAHUL LIGHT for grandMA2 v${targetInfo.version}</Info>`);
  }

  // 3. Macro syntax adjustments: Appearance /color="#HEX" -> RGB integers
  const hexAppearanceRegex = /(Appearance\s+[^"'>]*?\/color=["']?)#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})(["']?)/gi;
  if (hexAppearanceRegex.test(result)) {
    result = result.replace(hexAppearanceRegex, (match, prefix, rHex, gHex, bHex, suffix) => {
      const r = parseInt(rHex, 16);
      const g = parseInt(gHex, 16);
      const b = parseInt(bHex, 16);
      changes.push({
        action: 'CONVERT_HEX_COLOR',
        detail: `Converted Appearance hex color #${rHex}${gHex}${bHex} to RGB integers "${r},${g},${b}" for legacy console syntax.`
      });
      return `${prefix}${r},${g},${b}${suffix}`;
    });
  }

  // 4. Neutralize unsupported color gamut / calibration tags if target < 3.9
  if (compareVersions(targetInfo.version, '3.9.0.0') < 0) {
    const gamutRegex = /\b(gamut|cmy_calibrated|spectral_data)=["'][^"']*["']/gi;
    if (gamutRegex.test(result)) {
      result = result.replace(gamutRegex, (matched) => {
        changes.push({
          action: 'NEUTRALIZE_GAMUT_ATTR',
          detail: `Neutralized pre-3.9 color attribute [${matched}] into compatible default.`
        });
        return '';
      });
    }
  }

  // 5. SoundSync triggers if target < 3.8
  if (compareVersions(targetInfo.version, '3.8.0.0') < 0) {
    const soundSyncRegex = /trigger=["']SoundSync["']/gi;
    if (soundSyncRegex.test(result)) {
      result = result.replace(soundSyncRegex, 'trigger="Follow"');
      changes.push({
        action: 'FALLBACK_SOUNDSYNC_TRIGGER',
        detail: `Fell back trigger="SoundSync" to trigger="Follow" with operator cue warning (SoundSync unsupported on < 3.8).`
      });
    }
  }

  // 6. Handle hybrid tags (<PhaserPreview>, <RDMDevice subdevice="...">)
  if (/<PhaserPreview\b[^>]*>[\s\S]*?<\/PhaserPreview>/gi.test(result)) {
    result = result.replace(/<PhaserPreview\b[^>]*>[\s\S]*?<\/PhaserPreview>/gi, (match) => {
      changes.push({
        action: 'WRAP_PHASER_PREVIEW',
        detail: `Wrapped unsupported <PhaserPreview> metadata block in XML comment.`
      });
      return `<!-- [RAHUL LIGHT: PhaserPreview neutralized for v${targetInfo.version}]\n${match}\n-->`;
    });
  }

  // 7. Fixture Type modern attribute fallback for legacy versions (< 3.8.0.0 / 3.2.x)
  if (compareVersions(targetInfo.version, '3.8.0.0') < 0) {
    // VIRTUAL_COLOR_MODE -> CONTROL / DUMMY
    if (/attribute="VIRTUAL_COLOR_MODE"/i.test(result)) {
      result = result.replace(/attribute="VIRTUAL_COLOR_MODE"/gi, 'attribute="DUMMY"');
      result = result.replace(/subattribute="VIRTUAL_COLOR_MODE"/gi, 'subattribute="NOFEATURE"');
      changes.push({
        action: 'FALLBACK_FIXTURE_VIRTUAL_COLOR',
        detail: `Mapped modern attribute VIRTUAL_COLOR_MODE to compatible DUMMY/CONTROL for grandMA2 v${targetInfo.version}.`
      });
    }

    // CRIMODE -> CONTROL / DUMMY
    if (/attribute="CRIMODE"/i.test(result)) {
      result = result.replace(/attribute="CRIMODE"/gi, 'attribute="DUMMY"');
      result = result.replace(/subattribute="CRIMODESELECT"/gi, 'subattribute="NOFEATURE"');
      changes.push({
        action: 'FALLBACK_FIXTURE_CRIMODE',
        detail: `Mapped modern attribute CRIMODE to compatible DUMMY/CONTROL for grandMA2 v${targetInfo.version}.`
      });
    }

    // COLORHSB -> COLORMIX / COLORMIXER
    if (/feature="COLORHSB"/i.test(result)) {
      result = result.replace(/feature="COLORHSB"/gi, 'feature="COLORMIX"');
      result = result.replace(/attribute="COLORHSB1"/gi, 'attribute="COLORMIXER"');
      result = result.replace(/subattribute="COLORHSB1"/gi, 'subattribute="NOFEATURE"');
      changes.push({
        action: 'FALLBACK_FIXTURE_COLORHSB',
        detail: `Mapped unsupported COLORHSB feature to standard COLORMIX for grandMA2 v${targetInfo.version}.`
      });
    }

    // MP_TR_Z (Multi-Patch Translation) -> CONTROL / DUMMY
    if (/MP_TR/i.test(result)) {
      result = result.replace(/attribute="MP_TR_Z"/gi, 'attribute="DUMMY"');
      result = result.replace(/feature="MP_TR"/gi, 'feature="CONTROL"');
      result = result.replace(/subattribute="MP_TR_Z"/gi, 'subattribute="NOFEATURE"');
      changes.push({
        action: 'FALLBACK_MP_TR',
        detail: `Mapped modern 3D position attribute MP_TR_Z to compatible DUMMY/CONTROL for grandMA2 v${targetInfo.version}.`
      });
    }

    // SCROLLER with feature="COLORALL" -> COLOR1 / COLOR1
    if (/feature="COLORALL"/i.test(result)) {
      result = result.replace(/attribute="SCROLLER"/gi, 'attribute="COLOR1"');
      result = result.replace(/feature="COLORALL"/gi, 'feature="COLOR1"');
      result = result.replace(/subattribute="SCROLLERSELECT"/gi, 'subattribute="COLOR1WHEEL"');
      changes.push({
        action: 'FALLBACK_SCROLLER_COLORALL',
        detail: `Mapped scroller feature COLORALL to compatible standard COLOR1 for grandMA2 v${targetInfo.version}.`
      });
    }

    // Ensure <Module> has name="Main Module" for v3.2.x fixture schema
    if (/<Module\b([^>]*?)>/i.test(result)) {
      result = result.replace(/<Module\b([^>]*?)>/gi, (m, attrs) => {
        if (!attrs.includes('name=')) {
          changes.push({
            action: 'INJECT_MODULE_NAME',
            detail: `Injected required name="Main Module" attribute to <Module> for grandMA2 v${targetInfo.version}.`
          });
          return `<Module name="Main Module"${attrs}>`;
        }
        return m;
      });
    }

    // Fixture profile strict sanitization
    if (/<FixtureType\b/i.test(result)) {
      // 1. Strip illegal <Info datetime="..." showfile="..." /> directly under <MA> (breaks library fixture import!)
      result = result.replace(/<Info\b[^>]*\bshowfile=[^>]*\/>\s*/gi, '');
      result = result.replace(/<Info\b[^>]*\bshowfile=[^>]*>[\s\S]*?<\/Info>\s*/gi, '');

      // 2. Strip ALL modern *_user_name attributes on <ChannelFunction> (unsupported on < 3.8)
      result = result.replace(/\s+(?:subattribute|attribute|feature|preset)_user_name="[^"]*"/gi, '');

      // 3. Strip all index attributes from all fixture elements (prevents showfile index collision)
      result = result.replace(/<(FixtureType|Modules|Module|ChannelType|ChannelFunction|ChannelSet|Instances|Instance|Wheels)\b([^>]*?)\bindex=["']\d+["']/gi, '<$1$2');
      result = result.replace(/<(FixtureType|Modules|Module|ChannelType|ChannelFunction|ChannelSet|Instances|Instance|Wheels)\b([^>]*?)\bindex=["']\d+["']/gi, '<$1$2');

      // 4. Ensure Instance has module_index="0" patch="1" locked="true" WITHOUT index
      result = result.replace(/<Instance\b([^>]*?)(\/?)>/gi, (m, attrs, sc) => {
        let a = attrs.trim();
        if (a.endsWith('/')) a = a.slice(0, -1).trim();
        a = a.replace(/\bindex=["']\d+["']\s*/gi, '');
        if (!/\bmodule_index=/i.test(a)) a = 'module_index="0" ' + a;
        if (!/\bpatch=/i.test(a)) a += ' patch="1"';
        if (!/\blocked=/i.test(a)) a += ' locked="true"';
        return `<Instance ${a.trim()} />`;
      });

      // 5. Ensure Wheels is self-closing
      result = result.replace(/<Wheels\b[^>]*>(?:\s*<\/Wheels>)?/gi, '<Wheels />');

      // 6. Clean multiple spaces in opening tags
      result = result.replace(/<([a-zA-Z0-9_]+)\s{2,}/g, '<$1 ');
    }

    // Strip modern XML blocks unsupported in grandMA2 < 3.8
    if (/<VirtualFunctionBlocks\b/i.test(result)) {
      result = result.replace(/<VirtualFunctionBlocks\b[\s\S]*?<\/VirtualFunctionBlocks>/gi, '');
      result = result.replace(/<VirtualFunctionBlocks\b[^>]*\/>/gi, '');
      changes.push({
        action: 'STRIP_VIRTUAL_FUNCTION_BLOCKS',
        detail: `Stripped modern <VirtualFunctionBlocks> unsupported in v${targetInfo.version}.`
      });
    }

    if (/<FixtureMacroCollect\b/i.test(result)) {
      result = result.replace(/<FixtureMacroCollect\b[\s\S]*?<\/FixtureMacroCollect>/gi, '');
      result = result.replace(/<FixtureMacroCollect\b[^>]*\/>/gi, '');
      changes.push({
        action: 'STRIP_FIXTURE_MACRO_COLLECT',
        detail: `Stripped modern <FixtureMacroCollect> unsupported in v${targetInfo.version}.`
      });
    }

    if (/<AutoPresets\b/i.test(result)) {
      result = result.replace(/<AutoPresets\b[\s\S]*?<\/AutoPresets>/gi, '');
      result = result.replace(/<AutoPresets\b[^>]*\/>/gi, '');
      changes.push({
        action: 'STRIP_AUTO_PRESETS',
        detail: `Stripped modern <AutoPresets> unsupported in v${targetInfo.version}.`
      });
    }

    if (/<RdmNotifications\b/i.test(result)) {
      result = result.replace(/<RdmNotifications\b[\s\S]*?<\/RdmNotifications>/gi, '');
      result = result.replace(/<RdmNotifications\b[^>]*\/>/gi, '');
      changes.push({
        action: 'STRIP_RDM_NOTIFICATIONS',
        detail: `Stripped modern <RdmNotifications> unsupported in v${targetInfo.version}.`
      });
    }

    if (/<media\b[^>]*>[\s\S]*?<\/media>/i.test(result)) {
      result = result.replace(/<media\b[^>]*>[\s\S]*?<\/media>/gi, '');
      changes.push({
        action: 'STRIP_EMBEDDED_SLOT_MEDIA',
        detail: `Removed embedded base64 media bitmaps inside slots for legacy v${targetInfo.version}.`
      });
    }

    // Strip 3D <Body> outside <Modules> (only valid inside <Module> on legacy consoles)
    const modCloseIdx = result.indexOf('</Modules>');
    if (modCloseIdx !== -1) {
      const before = result.slice(0, modCloseIdx);
      let after = result.slice(modCloseIdx);
      after = after.replace(/<Body\b[^>]*\/>/gi, '');
      after = after.replace(/<Body\b[^>]*>[\s\S]*?<\/Body>/gi, '');
      result = before + after;
    }

    // Normalize fractional DMX default values (e.g. default="254.999" -> default="255")
    if (/default="\d+\.\d+"/i.test(result)) {
      result = result.replace(/default="(\d+\.\d+)"/gi, (match, val) => {
        const rounded = Math.round(parseFloat(val));
        return `default="${rounded}"`;
      });
      changes.push({
        action: 'NORMALIZE_DMX_DEFAULTS',
        detail: `Normalized floating-point default DMX values to standard integers.`
      });
    }
  }

  // 8. Prevent duplicate fixture type name collision in showfiles
  if (/<FixtureType\b[^>]*\bname="([^"]+)"/i.test(result)) {
    const fixtureNameMatch = result.match(/<FixtureType\b[^>]*\bname="([^"]+)"/i);
    if (fixtureNameMatch) {
      const oldName = fixtureNameMatch[1];
      const verTag = `(v${targetInfo.major}.${targetInfo.minor})`;
      if (!oldName.includes(verTag)) {
        const newName = `${oldName} ${verTag}`;
        result = result.replace(`name="${oldName}"`, `name="${newName}"`);
        if (result.includes(`<short_name>${oldName}</short_name>`)) {
          result = result.replace(`<short_name>${oldName}</short_name>`, `<short_name>${newName}</short_name>`);
        }
        changes.push({
          action: 'RENAME_FIXTURE_TYPE_COLLISION',
          detail: `Added version suffix to fixture name: "${newName}" to avoid duplicate collision in showfile library.`
        });
      }
    }
  }

  // Final check: Validate XML
  const valResult = XMLValidator.validate(result);
  if (valResult !== true && valResult?.err) {
    changes.push({
      action: 'XML_VALIDATION_WARNING',
      detail: `XML validation notice: ${valResult.err.msg} at line ${valResult.err.line}`
    });
  }

  return { outputXml: result, changes };
}

/**
 * Convert grandMA2 Lua content and inject polyfills
 */
function convertLuaContent(lua, targetInfo, mode, options) {
  const changes = [];
  let result = lua;

  // Build Rahul Light Polyfill Header
  const polyfill = `--------------------------------------------------------------------------------
-- RAHUL LIGHT — MA FILE DOWNGRADER COMPATIBILITY SHIM
-- Target Software: grandMA2 v${targetInfo.version}
-- Generated: ${new Date().toISOString()} | Mode: ${mode.toUpperCase()}
-- This header provides backward-compatibility polyfills for missing Lua APIs.
--------------------------------------------------------------------------------
if not gma then gma = {} end
if not gma.gui then gma.gui = {} end
if not gma.gui.progress then
    -- Polyfill gma.gui.progress for grandMA2 <= v3.7
    gma.gui.progress = {
        start = function(title) gma.feedback("[RL Shim] Progress started: " .. tostring(title)) return 1 end,
        set = function(id, value) end,
        set_text = function(id, text) gma.feedback("[RL Shim] " .. tostring(text)) end,
        set_range = function(id, min, max) end,
        stop = function(id) gma.feedback("[RL Shim] Progress completed.") end
    }
end

if not gma.network then gma.network = {} end
if not gma.network.gethostdata then
    -- Polyfill gma.network.gethostdata for grandMA2 <= v3.8
    gma.network.gethostdata = function()
        return {
            ip = "127.0.0.1",
            station_name = "Console",
            session_id = 1,
            is_master = true
        }
    end
end
--------------------------------------------------------------------------------

`;

  // Check if polyfill is needed
  const needsProgressPolyfill = compareVersions(targetInfo.version, '3.8.0.0') < 0 && /gma\.gui\.progress\b/.test(lua);
  const needsNetworkPolyfill = compareVersions(targetInfo.version, '3.9.0.0') < 0 && /gma\.network\.gethostdata\b/.test(lua);

  if (needsProgressPolyfill || needsNetworkPolyfill || mode === 'advanced' || mode === 'safe') {
    result = polyfill + result;
    changes.push({
      action: 'INJECT_LUA_POLYFILL',
      detail: `Injected Rahul Light backward-compatibility Lua shims (gma.gui.progress & gma.network.gethostdata) for v${targetInfo.version}.`
    });
  }

  // Update version comments in Lua
  const luaVerComment = /--.*?(?:grandMA2|version|v)\s*([34]\.\d+\.\d+(?:\.\d+)?)/i;
  if (luaVerComment.test(result)) {
    result = result.replace(luaVerComment, `-- Target grandMA2 Version: v${targetInfo.version} (Converted by Rahul Light)`);
    changes.push({
      action: 'UPDATE_LUA_HEADER',
      detail: `Updated plugin version header annotation to grandMA2 v${targetInfo.version}.`
    });
  }

  return { outputLua: result, changes };
}

/**
 * Process a ZIP package containing multiple MA2 files
 */
function convertZipPackage(fileName, buffer, targetInfo, mode, options) {
  const inZip = new AdmZip(buffer);
  const outZip = new AdmZip();
  const entries = inZip.getEntries();
  const subResults = [];
  const allLogs = [];

  allLogs.push(`Unpacking ZIP package "${fileName}" containing ${entries.length} items...`);

  for (const entry of entries) {
    if (entry.isDirectory) {
      outZip.addFile(entry.entryName, Buffer.alloc(0));
    } else {
      const entryBuf = entry.getData();
      const convertedSub = convertFile(entry.name, entryBuf, {
        targetVersion: targetInfo.version,
        mode,
        ...options
      });

      subResults.push(convertedSub);
      outZip.addFile(entry.entryName, convertedSub.convertedBuffer);
      allLogs.push(`Converted packaged file: ${entry.entryName} (Target: v${targetInfo.version})`);
    }
  }

  // Add conversion report inside ZIP
  const reportContent = generateReportText(fileName, targetInfo.version, mode, subResults);
  outZip.addFile('RAHUL_LIGHT_CONVERSION_MANIFEST.txt', Buffer.from(reportContent, 'utf-8'));

  const convertedZipBuffer = outZip.toBuffer();
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const outputFileName = `${baseName}_v${targetInfo.version}.zip`;

  return {
    originalFileName: fileName,
    outputFileName,
    fileType: 'zip_package',
    targetVersion: targetInfo.version,
    mode,
    originalSize: buffer.length,
    convertedSize: convertedZipBuffer.length,
    convertedBuffer: convertedZipBuffer,
    originalText: `[ZIP Archive containing ${entries.length} files]`,
    convertedText: reportContent,
    logs: allLogs,
    modifiedFeatures: subResults.flatMap(s => s.modifiedFeatures)
  };
}

function generateReportText(fileName, targetVersion, mode, subResults) {
  let report = `======================================================================\n`;
  report += `RAHUL LIGHT — MA FILE DOWNGRADER EXECUTION MANIFEST\n`;
  report += `======================================================================\n`;
  report += `Source Archive : ${fileName}\n`;
  report += `Target Version : grandMA2 v${targetVersion}\n`;
  report += `Conversion Mode: ${mode.toUpperCase()}\n`;
  report += `Timestamp      : ${new Date().toISOString()}\n`;
  report += `Total Files    : ${subResults.length}\n\n`;
  report += `----------------------------------------------------------------------\n`;
  report += `CONVERTED FILE BREAKDOWN:\n`;
  report += `----------------------------------------------------------------------\n`;

  subResults.forEach((s, idx) => {
    report += `[${idx + 1}] ${s.originalFileName} (${s.fileType})\n`;
    report += `    Output Size: ${s.convertedSize} bytes\n`;
    report += `    Modifications Applied:\n`;
    s.logs.forEach(l => {
      report += `      - ${l}\n`;
    });
    report += `\n`;
  });

  report += `======================================================================\n`;
  report += `CONSOLE IMPORT INSTRUCTION:\n`;
  report += `1. Copy extracted files to USB root under:\n`;
  report += `   - /gma2/shows/           (for Showfiles)\n`;
  report += `   - /gma2/importexport/    (for XML Macros, Presets, Effects)\n`;
  report += `   - /gma2/plugins/         (for Lua Plugins)\n`;
  report += `2. On grandMA2 console: Setup -> Import/Export -> Select Drive -> Import\n`;
  report += `3. Always verify cue sequences and executor fader assignments.\n`;
  report += `======================================================================\n`;
  return report;
}
