/**
 * Express API Routes for RAHUL LIGHT — MA FILE DOWNGRADER
 * Handles file uploads, analysis, conversions, diffs, downloads, and sample generation
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { MA2_VERSIONS, FEATURE_RULES, getVersionInfo } from '../engine/versionMatrix.js';
import { analyzeCompatibility } from '../engine/analyzer.js';
import { convertFile } from '../engine/converter.js';
import { generateDiff } from '../engine/diffGenerator.js';
import { getSampleFiles } from '../engine/samples.js';
import { runImportCompatibilityCheck, generateDiagnosticReportText, TESTED_VERSIONS } from '../engine/diagnostics.js';
import { detectInstalledMA2Versions, getRunningMA2Process, deployToMA2 } from '../engine/maDeployer.js';

const router = express.Router();

// Configure Multer for in-memory file uploads with 50MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// In-memory conversion job store & history
const jobStore = new Map();
const conversionHistory = [];

// Cleanup stale jobs after 1 hour (auto memory retention policy)
const JOB_RETENTION_MS = 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobStore.entries()) {
    if (now - (job.createdAt || now) > JOB_RETENTION_MS) {
      jobStore.delete(id);
    }
  }
}, 10 * 60 * 1000);

/**
 * GET /api/health - Production Health Check & Server Status
 */
router.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'UP',
    brand: 'RAHUL LIGHT',
    service: 'MA2 FILE DOWNGRADER',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rssMB: (mem.rss / 1024 / 1024).toFixed(1),
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(1)
    },
    activeJobsInRam: jobStore.size,
    supportedVersions: MA2_VERSIONS.length
  });
});

/**
 * DELETE /api/jobs/:jobId - Explicitly purge converted showfile from server memory
 */
router.delete('/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const existed = jobStore.delete(jobId);
  res.json({
    success: true,
    purged: existed,
    message: existed ? 'Berkas showfile Anda berhasil dihapus dari memori server.' : 'Job ID tidak ditemukan atau sudah kadaluarsa.'
  });
});

/**
 * GET /api/versions - Get all supported grandMA2 versions
 */
router.get('/versions', (req, res) => {
  res.json({
    success: true,
    versions: MA2_VERSIONS
  });
});

/**
 * GET /api/rules - Get all compatibility rules
 */
router.get('/rules', (req, res) => {
  res.json({
    success: true,
    rules: FEATURE_RULES
  });
});

/**
 * GET /api/samples - List available test sample files
 */
router.get('/samples', (req, res) => {
  const samples = getSampleFiles();
  const list = Object.entries(samples).map(([key, item]) => ({
    id: key,
    fileName: item.fileName,
    fileType: item.fileType,
    version: item.version,
    description: item.description,
    size: item.buffer.length
  }));
  res.json({ success: true, samples: list });
});

/**
 * POST /api/samples/load/:sampleId - Load sample file for analysis
 */
router.post('/samples/load/:sampleId', (req, res) => {
  const { sampleId } = req.params;
  const samples = getSampleFiles();
  const sample = samples[sampleId];

  if (!sample) {
    return res.status(404).json({ success: false, error: 'Sample file not found' });
  }

  const targetVersion = req.body.targetVersion || '3.9.60.74';
  const report = analyzeCompatibility(sample.fileName, sample.buffer, {
    sourceVersion: sample.version,
    targetVersion
  });

  // Store in temp buffer job for instant conversion
  const tempId = uuidv4();
  jobStore.set(tempId, {
    id: tempId,
    createdAt: Date.now(),
    fileName: sample.fileName,
    buffer: sample.buffer,
    fileType: sample.fileType,
    report
  });

  res.json({
    success: true,
    tempId,
    sample: {
      id: sampleId,
      fileName: sample.fileName,
      fileType: sample.fileType,
      size: sample.buffer.length,
      version: sample.version
    },
    report
  });
});

/**
 * POST /api/analyze - Upload files and run deep compatibility analysis
 */
router.post('/analyze', upload.array('files', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }

    const sourceVersion = req.body.sourceVersion || '3.9.63.6';
    const targetVersion = req.body.targetVersion || '3.9.60.74';
    const manualOverride = req.body.manualOverride === 'true';

    const results = [];

    for (const file of req.files) {
      const report = analyzeCompatibility(file.originalname, file.buffer, {
        sourceVersion,
        targetVersion,
        manualOverride
      });

      const tempId = uuidv4();
      jobStore.set(tempId, {
        id: tempId,
        createdAt: Date.now(),
        fileName: file.originalname,
        buffer: file.buffer,
        fileType: report.fileType,
        report
      });

      results.push({
        tempId,
        fileName: file.originalname,
        fileSize: file.size,
        report
      });
    }

    res.json({
      success: true,
      targetVersion,
      sourceVersion,
      results
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/convert - Execute file downgrade conversion
 */
router.post('/convert', (req, res) => {
  try {
    const { tempId, mode = 'auto', targetVersion = '3.9.60.74', options = {} } = req.body;

    const sourceJob = jobStore.get(tempId);
    if (!sourceJob) {
      return res.status(404).json({ success: false, error: 'File session expired or not found. Please upload again.' });
    }

    const conversionResult = convertFile(sourceJob.fileName, sourceJob.buffer, {
      mode,
      targetVersion,
      ...options
    });

    // Generate diff
    const diffResult = generateDiff(
      conversionResult.originalText,
      conversionResult.convertedText,
      sourceJob.fileName
    );

    const convertedJobId = uuidv4();
    const finalJob = {
      id: convertedJobId,
      createdAt: Date.now(),
      originalFileName: conversionResult.originalFileName,
      outputFileName: conversionResult.outputFileName,
      fileType: conversionResult.fileType,
      sourceVersion: conversionResult.sourceVersion,
      targetVersion,
      mode,
      originalSize: conversionResult.originalSize,
      convertedSize: conversionResult.convertedSize,
      convertedBuffer: conversionResult.convertedBuffer,
      migrationZipBuffer: conversionResult.migrationZipBuffer,
      migrationZipFileName: conversionResult.migrationZipFileName,
      originalText: conversionResult.originalText,
      convertedText: conversionResult.convertedText,
      logs: conversionResult.logs,
      modifiedFeatures: conversionResult.modifiedFeatures,
      diff: diffResult,
      importCheck: conversionResult.importCheck,
      diagnosticReportText: conversionResult.diagnosticReportText,
      status: 'Success'
    };

    jobStore.set(convertedJobId, finalJob);

    // Save to history
    const historyItem = {
      id: convertedJobId,
      timestamp: new Date().toISOString(),
      originalFileName: finalJob.originalFileName,
      outputFileName: finalJob.outputFileName,
      fileType: finalJob.fileType,
      sourceVersion: finalJob.sourceVersion,
      targetVersion: finalJob.targetVersion,
      mode: finalJob.mode,
      originalSize: finalJob.originalSize,
      convertedSize: finalJob.convertedSize,
      warningsCount: conversionResult.importCheck ? conversionResult.importCheck.warnings.length : 0,
      criticalCount: conversionResult.importCheck && conversionResult.importCheck.structureValidation === 'FAIL' ? 1 : 0,
      logsCount: finalJob.logs.length,
      importStatus: conversionResult.importCheck ? conversionResult.importCheck.targetCompatibility : 'NEEDS TESTING'
    };
    conversionHistory.unshift(historyItem);
    if (conversionHistory.length > 50) conversionHistory.pop();

    res.json({
      success: true,
      jobId: convertedJobId,
      result: {
        originalFileName: finalJob.originalFileName,
        outputFileName: finalJob.outputFileName,
        fileType: finalJob.fileType,
        sourceVersion: finalJob.sourceVersion,
        targetVersion: finalJob.targetVersion,
        mode: finalJob.mode,
        originalSize: finalJob.originalSize,
        convertedSize: finalJob.convertedSize,
        logs: finalJob.logs,
        modifiedFeatures: finalJob.modifiedFeatures,
        diff: diffResult,
        importCheck: finalJob.importCheck,
        diagnosticReportText: finalJob.diagnosticReportText,
        hasMigrationZip: !!finalJob.migrationZipBuffer,
        migrationZipFileName: finalJob.migrationZipFileName
      }
    });
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/download/:jobId - Download converted file
 */
router.get('/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job || !job.convertedBuffer) {
    return res.status(404).send('File not found or expired.');
  }

  // If user requested migration zip
  if (req.query.type === 'zip' && job.migrationZipBuffer) {
    res.setHeader('Content-Disposition', `attachment; filename="${job.migrationZipFileName || 'Showfile_Migration_Package.zip'}"`);
    res.setHeader('Content-Type', 'application/zip');
    return res.send(job.migrationZipBuffer);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${job.outputFileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.send(job.convertedBuffer);
});

/**
 * GET /api/download-migration/:jobId - Download showfile migration suite package
 */
router.get('/download-migration/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job || !job.migrationZipBuffer) {
    return res.status(404).send('Paket migrasi tidak tersedia untuk berkas ini.');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${job.migrationZipFileName || 'Showfile_Migration_Package.zip'}"`);
  res.setHeader('Content-Type', 'application/zip');
  res.send(job.migrationZipBuffer);
});

/**
 * GET /api/report/:jobId - Generate and download conversion audit report
 */
router.get('/report/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).send('Job record not found.');
  }

  const format = req.query.format || 'markdown';

  let report = `# LAPORAN AUDIT PENYESUAIAN BERKAS — RAHUL LIGHT\n\n`;
  report += `- **Berkas Asal**: \`${job.originalFileName}\` (${job.originalSize} byte)\n`;
  report += `- **Berkas Hasil**: \`${job.outputFileName}\` (${job.convertedSize} byte)\n`;
  report += `- **Kategori Berkas**: \`${job.fileType}\`\n`;
  report += `- **Versi Target Konsol**: grandMA2 v${job.targetVersion}\n`;
  report += `- **Mode Konversi**: ${job.mode.toUpperCase()}\n`;
  report += `- **Waktu Eksekusi**: ${new Date(job.createdAt).toLocaleString('id-ID')}\n\n`;

  report += `## Modifikasi & Langkah Downgrade yang Diterapkan\n\n`;
  if (job.logs && job.logs.length > 0) {
    job.logs.forEach(log => {
      report += `- ${log}\n`;
    });
  } else {
    report += `*Tidak memerlukan perubahan struktural khusus.*\n`;
  }

  report += `\n## Panduan Impor Resmi ke Konsol grandMA2 (Flashdisk USB)\n\n`;
  report += `1. Tancapkan flashdisk USB ke komputer.\n`;
  report += `2. Salin berkas hasil konversi ke folder yang sesuai di dalam direktori \`/gma2/\`:\n`;
  report += `   - **Fixture Type (Profil Lampu)**: \`/gma2/library/\`\n`;
  report += `   - **Showfile**: \`/gma2/shows/\`\n`;
  report += `   - **Macro / Preset / Effect**: \`/gma2/importexport/\`\n`;
  report += `   - **Plugin Lua**: \`/gma2/plugins/\`\n`;
  report += `   - **Ikon & Gambar**: \`/gma2/bitmaps/\`\n`;
  report += `3. Tancapkan flashdisk USB ke port konsol fisik grandMA2.\n`;
  report += `4. Alur Impor Profil Fixture Type:\n`;
  report += `   a. Buka [Setup] -> [Patch & Fixture Schedule] -> [Fixture Types] -> [Import].\n`;
  report += `   b. Pilih Drive (USB jika dari flashdisk, atau Internal jika dari PC).\n`;
  report += `   c. Pilih profil lampu lalu klik [Import].\n`;
  report += `   d. Tutup jendela Fixture Types, masuk ke Layer -> [New Fixtures] -> masukkan Jumlah & Patch DMX -> klik [Apply] -> [Save Changes].\n`;
  report += `5. Selalu verifikasi tracking cue dan pergerakan encoder wheel sebelum acara dimulai.\n\n`;
  report += `---\n*Dihasilkan oleh Suite Rekayasa Lighting RAHUL LIGHT*\n`;

  if (format === 'json') {
    return res.json({
      title: 'Rahul Light Conversion Report',
      jobId,
      metadata: job,
      markdown: report
    });
  }

  res.setHeader('Content-Disposition', `attachment; filename="RahulLight_Report_${job.originalFileName}.md"`);
  res.setHeader('Content-Type', 'text/markdown');
  res.send(report);
});

/**
 * GET /api/history - Return conversion history
 */
router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: conversionHistory
  });
});

/**
 * POST /api/clear-history - Clear history
 */
router.post('/clear-history', (req, res) => {
  conversionHistory.length = 0;
  res.json({ success: true, message: 'Conversion history cleared.' });
});

/**
 * POST /api/diagnose - Manual or direct Import Diagnostic analysis
 */
router.post('/diagnose', upload.single('file'), (req, res) => {
  try {
    const targetVersion = req.body.targetVersion || '3.2.2.16';
    const sourceVersion = req.body.sourceVersion || '3.9.63.6';
    const errorMessage = req.body.errorMessage || '';
    const fileType = req.body.fileType || (req.file ? detectFileType(req.file.originalname, req.file.buffer) : 'fixture_xml');
    const fileName = req.file ? req.file.originalname : (req.body.fileName || 'fixture.xml');
    const buffer = req.file ? req.file.buffer : Buffer.from(req.body.fileContent || '', 'utf-8');
    const text = buffer.toString('utf-8');

    const importCheck = runImportCompatibilityCheck(
      fileType,
      buffer,
      buffer,
      text,
      text,
      targetVersion,
      { errorMessage, sourceVersion }
    );

    const diagnosticReportText = generateDiagnosticReportText(
      fileName,
      sourceVersion,
      targetVersion,
      fileType,
      importCheck,
      errorMessage
    );

    res.json({
      success: true,
      diagnostic: {
        fileName,
        sourceVersion,
        targetVersion,
        fileType,
        errorMessage,
        importCheck,
        diagnosticReportText
      }
    });
  } catch (err) {
    console.error('Diagnostic error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/system-ma2 - Detect local grandMA2 installation and active process
 */
router.get('/system-ma2', (req, res) => {
  try {
    const installed = detectInstalledMA2Versions();
    const running = getRunningMA2Process();
    res.json({
      success: true,
      installed,
      running
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/deploy - 1-Click Deploy converted file directly to grandMA2
 */
router.post('/deploy', (req, res) => {
  try {
    const { jobId, targetVersion } = req.body;
    // Always prioritize jobStore which holds the actual binary/XML convertedBuffer
    let job = jobStore.get(jobId);

    if (!job) {
      job = conversionHistory.find(j => j.id === jobId);
    }

    if (!job || (!job.convertedBuffer && !job.buffer && !job.convertedText)) {
      return res.status(404).json({ success: false, error: 'Conversion job payload not found or expired. Silakan lakukan konversi berkas kembali.' });
    }

    const deployResult = deployToMA2(job, { targetVersion });
    res.json({
      success: true,
      ...deployResult
    });
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
