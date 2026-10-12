/**
 * RAHUL LIGHT — MA FILE DOWNGRADER
 * Logika Aplikasi Sisi Klien (Bahasa Indonesia)
 */

// Status Aplikasi
const state = {
  currentView: 'home',
  sourceVersion: 'auto',
  targetVersion: '3.9.60.74',
  mode: 'auto', // 'auto' | 'safe' | 'advanced'
  queuedFiles: [], // array objek { file, tempId, report, status, progress }
  activeJobId: null,
  activeConvertedResult: null,
  allRules: [],
  allVersions: []
};

// Selektor Elemen DOM
const elements = {
  navLinks: document.querySelectorAll('.nav-link'),
  pageViews: document.querySelectorAll('.page-view'),
  sourceVersionSelect: document.getElementById('sourceVersionSelect'),
  sourceVersionCustom: document.getElementById('sourceVersionCustom'),
  targetVersionSelect: document.getElementById('targetVersionSelect'),
  targetVersionCustom: document.getElementById('targetVersionCustom'),
  versionShiftBadge: document.getElementById('versionShiftBadge'),
  modeCards: document.querySelectorAll('.mode-radio-card'),
  advancedPanel: document.getElementById('advancedOptionsPanel'),
  dropZone: document.getElementById('dropZone'),
  fileInput: document.getElementById('fileInput'),
  browseFilesBtn: document.getElementById('browseFilesBtn'),
  fileQueueSection: document.getElementById('fileQueueSection'),
  fileCardsList: document.getElementById('fileCardsList'),
  queueCount: document.getElementById('queueCount'),
  clearAllFilesBtn: document.getElementById('clearAllFilesBtn'),
  analyzeAllFilesBtn: document.getElementById('analyzeAllFilesBtn'),
  analysisDashboard: document.getElementById('analysisDashboard'),
  overallStatusBadge: document.getElementById('overallStatusBadge'),
  statTotalIssues: document.getElementById('statTotalIssues'),
  statWarnings: document.getElementById('statWarnings'),
  statCritical: document.getElementById('statCritical'),
  statConvertible: document.getElementById('statConvertible'),
  issuesTableBody: document.getElementById('issuesTableBody'),
  executeConvertBtn: document.getElementById('executeConvertBtn'),
  resultsDashboard: document.getElementById('resultsDashboard'),
  resultsSubtext: document.getElementById('resultsSubtext'),
  resOrigName: document.getElementById('resOrigName'),
  resOrigSize: document.getElementById('resOrigSize'),
  resOutputName: document.getElementById('resOutputName'),
  resOutputSize: document.getElementById('resOutputSize'),
  resTargetVer: document.getElementById('resTargetVer'),
  resMode: document.getElementById('resMode'),
  resModCount: document.getElementById('resModCount'),
  engineLogsContainer: document.getElementById('engineLogsContainer'),
  diffStatAdded: document.getElementById('diffStatAdded'),
  diffStatRemoved: document.getElementById('diffStatRemoved'),
  diffContentScroll: document.getElementById('diffContentScroll'),
  downloadConvertedBtn: document.getElementById('downloadConvertedBtn'),
  downloadMigrationZipBtn: document.getElementById('downloadMigrationZipBtn'),
  deployToMA2Btn: document.getElementById('deployToMA2Btn'),
  downloadReportBtn: document.getElementById('downloadReportBtn'),
  convertAnotherBtn: document.getElementById('convertAnotherBtn'),
  historyTableBody: document.getElementById('historyTableBody'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  matrixTableBody: document.getElementById('matrixTableBody'),
  guideSearchInput: document.getElementById('guideSearchInput'),
  toastContainer: document.getElementById('toastContainer')
};

/* ==========================================================================
   INISIALISASI APLIKASI
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupVersionControls();
  setupModeControls();
  setupDropZone();
  setupSampleButtons();
  setupConversionActions();
  setupDiagnosticView();
  await loadServerMetadata();
  updateVersionShiftBadge();
});

/* ==========================================================================
   NAVIGASI
   ========================================================================== */
function setupNavigation() {
  elements.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetView = e.currentTarget.getAttribute('data-target');
      navigateTo(targetView);
    });
  });

  const heroStartBtn = document.getElementById('heroStartConvertingBtn');
  if (heroStartBtn) {
    heroStartBtn.addEventListener('click', () => navigateTo('downgrader'));
  }

  const heroGuideBtn = document.getElementById('heroExploreGuideBtn');
  if (heroGuideBtn) {
    heroGuideBtn.addEventListener('click', () => navigateTo('guide'));
  }

  const heroSampleBtn = document.getElementById('heroLoadSampleQuickBtn');
  if (heroSampleBtn) {
    heroSampleBtn.addEventListener('click', async () => {
      navigateTo('downgrader');
      await loadSample('sample-macro');
    });
  }

  const brandLink = document.getElementById('brandHomeLink');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  }
}

function navigateTo(viewName) {
  state.currentView = viewName;
  elements.navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-target') === viewName);
  });
  elements.pageViews.forEach(v => {
    v.classList.toggle('active', v.id === `view-${viewName}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (viewName === 'history') {
    fetchHistory();
  } else if (viewName === 'guide') {
    renderCompatibilityMatrix();
  }
}

/* ==========================================================================
   KONTROL VERSI
   ========================================================================== */
function setupVersionControls() {
  elements.sourceVersionSelect.addEventListener('change', () => {
    const val = elements.sourceVersionSelect.value;
    if (val === 'custom') {
      elements.sourceVersionCustom.classList.add('visible');
      state.sourceVersion = elements.sourceVersionCustom.value || '3.9.63.6';
    } else {
      elements.sourceVersionCustom.classList.remove('visible');
      state.sourceVersion = val;
    }
    updateVersionShiftBadge();
  });

  elements.sourceVersionCustom.addEventListener('input', () => {
    state.sourceVersion = elements.sourceVersionCustom.value || '3.9.63.6';
    updateVersionShiftBadge();
  });

  elements.targetVersionSelect.addEventListener('change', () => {
    const val = elements.targetVersionSelect.value;
    if (val === 'custom') {
      elements.targetVersionCustom.classList.add('visible');
      state.targetVersion = elements.targetVersionCustom.value || '3.9.60.74';
    } else {
      elements.targetVersionCustom.classList.remove('visible');
      state.targetVersion = val;
    }
    updateVersionShiftBadge();
  });

  elements.targetVersionCustom.addEventListener('input', () => {
    state.targetVersion = elements.targetVersionCustom.value || '3.9.60.74';
    updateVersionShiftBadge();
  });
}

function updateVersionShiftBadge() {
  const src = state.sourceVersion === 'auto' ? 'Deteksi Otomatis' : `v${state.sourceVersion}`;
  const tgt = `v${state.targetVersion}`;
  elements.versionShiftBadge.textContent = `${src} ➔ ${tgt}`;
}

/* ==========================================================================
   PEMILIHAN MODE KONVERSI
   ========================================================================== */
function setupModeControls() {
  elements.modeCards.forEach(card => {
    card.addEventListener('click', () => {
      elements.modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.mode = card.getAttribute('data-mode');

      if (state.mode === 'advanced') {
        elements.advancedPanel.classList.add('visible');
      } else {
        elements.advancedPanel.classList.remove('visible');
      }
    });
  });
}

/* ==========================================================================
   DROP ZONE & UNGGAH BERKAS
   ========================================================================== */
function setupDropZone() {
  elements.browseFilesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.fileInput.click();
  });

  elements.dropZone.addEventListener('click', () => {
    elements.fileInput.click();
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropZone.classList.remove('drag-over');
    });
  });

  elements.dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  });

  elements.fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  });

  elements.clearAllFilesBtn.addEventListener('click', () => {
    state.queuedFiles = [];
    renderFileQueue();
    elements.analysisDashboard.classList.remove('visible');
    elements.resultsDashboard.classList.remove('visible');
    showToast('Antrean berkas berhasil dibersihkan.', 'info');
  });

  elements.analyzeAllFilesBtn.addEventListener('click', () => {
    runBatchAnalysis();
  });
}

async function handleFiles(files) {
  for (const file of files) {
    state.queuedFiles.push({
      file,
      tempId: null,
      report: null,
      status: 'Siap Dianalisis',
      progress: 100
    });
  }

  renderFileQueue();
  showToast(`${files.length} berkas ditambahkan. Menjalankan analisis kompatibilitas...`, 'info');
  await runBatchAnalysis();
}

function renderFileQueue() {
  elements.queueCount.textContent = state.queuedFiles.length;
  if (state.queuedFiles.length === 0) {
    elements.fileQueueSection.classList.remove('visible');
    elements.fileCardsList.innerHTML = '';
    return;
  }

  elements.fileQueueSection.classList.add('visible');
  elements.fileCardsList.innerHTML = '';

  state.queuedFiles.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'file-card-item';

    const fileType = item.report ? item.report.fileType : '';
    const catInfo = formatFileTypeCategory(fileType, item.file.name);
    const sizeKB = (item.file.size / 1024).toFixed(1);

    let statusBadgeClass = 'status-convertible';
    let statusText = item.status;
    if (item.report) {
      if (item.report.status === 'Kompatibel' || item.report.status === 'Compatible') {
        statusBadgeClass = 'status-compatible';
        statusText = 'Kompatibel';
      } else if (item.report.status === 'Perlu Peninjauan' || item.report.status === 'Needs Review') {
        statusBadgeClass = 'status-review';
        statusText = 'Perlu Peninjauan';
      } else if (item.report.status === 'Tidak Didukung' || item.report.status === 'Unsupported') {
        statusBadgeClass = 'status-unsupported';
        statusText = 'Tidak Didukung';
      } else {
        statusBadgeClass = 'status-convertible';
        statusText = 'Dapat Dikonversi';
      }
    }

    card.innerHTML = `
      <div class="file-type-icon" style="color:${catInfo.color};">${catInfo.icon}</div>
      <div class="file-main-info">
        <div class="file-name-row">
          <span class="file-name-text">${escapeHtml(item.file.name)}</span>
          <span class="file-badge-type" style="border-color:${catInfo.color}; color:${catInfo.color};">${catInfo.badge}</span>
          ${item.report ? `<span class="file-badge-type" style="color:var(--accent-cyan);">Asal: v${item.report.detectedSource}</span>` : ''}
        </div>
        <div class="file-meta-row">
          <span>${sizeKB} KB</span>
          <span>📁 Folder Konsol: <strong style="color:var(--text-primary);">${catInfo.folder}</strong></span>
          <span>Target: grandMA2 v${state.targetVersion}</span>
        </div>
      </div>
      <div>
        <span class="file-status-badge ${statusBadgeClass}">${statusText}</span>
      </div>
      <div class="file-actions-row">
        <button class="btn btn-sm btn-danger remove-file-btn" data-index="${idx}" title="Hapus Berkas">✕</button>
      </div>
    `;

    elements.fileCardsList.appendChild(card);
  });

  // Pasang tombol hapus berkas individual
  document.querySelectorAll('.remove-file-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      state.queuedFiles.splice(idx, 1);
      renderFileQueue();
      if (state.queuedFiles.length === 0) {
        elements.analysisDashboard.classList.remove('visible');
      }
    });
  });
}

function formatFileTypeCategory(type, fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  if (type === 'fixture_xml' || type === 'fixture_xmlp' || ext === 'xmlp') {
    return {
      category: 'Library Fixtures',
      badge: ext === 'xmlp' ? 'XMLP (PACKED FIXTURE)' : 'FIXTURE XML',
      icon: '💡',
      folder: '/gma2/library/',
      color: '#00d2ff'
    };
  }
  if (type === 'effect_xml') {
    return {
      category: 'Effect & Phaser',
      badge: 'EFFECT XML',
      icon: '🌊',
      folder: '/gma2/importexport/',
      color: '#ff9d00'
    };
  }
  if (type === 'macro_xml') {
    return {
      category: 'Macro XML',
      badge: 'MACRO XML',
      icon: '⚡',
      folder: '/gma2/importexport/',
      color: '#ffe600'
    };
  }
  if (type === 'lua_plugin' || type === 'plugin_xml' || ext === 'lua') {
    return {
      category: 'Plugins',
      badge: 'LUA PLUGIN',
      icon: '🧩',
      folder: '/gma2/plugins/',
      color: '#00ff88'
    };
  }
  if (type === 'showfile' || ext === 'show' || ext === 'gz') {
    return {
      category: 'Showfile grandMA2',
      badge: ext === 'gz' ? 'SHOW GZIP' : 'SHOWFILE',
      icon: '🎛️',
      folder: '/gma2/shows/',
      color: '#c44dff'
    };
  }
  if (type === 'zip_package' || ext === 'zip') {
    return {
      category: 'Paket Tur ZIP',
      badge: 'ZIP BUNDLE',
      icon: '📦',
      folder: 'Root Direktori USB',
      color: '#00e1ff'
    };
  }
  return {
    category: 'Berkas MA2',
    badge: (ext || 'BERKAS').toUpperCase(),
    icon: '📄',
    folder: '/gma2/importexport/',
    color: '#8e9aa8'
  };
}

/* ==========================================================================
   PENGUJI SAMPEL INSTAN BERDASARKAN KATEGORI
   ========================================================================== */
function setupSampleButtons() {
  const fBtn = document.getElementById('loadSampleFixtureBtn');
  if (fBtn) fBtn.addEventListener('click', () => loadSample('sample-fixture'));

  const pBtn = document.getElementById('loadSamplePluginBtn');
  if (pBtn) pBtn.addEventListener('click', () => loadSample('sample-plugin'));

  const mBtn = document.getElementById('loadSampleMacroBtn');
  if (mBtn) mBtn.addEventListener('click', () => loadSample('sample-macro'));

  const eBtn = document.getElementById('loadSampleEffectBtn');
  if (eBtn) eBtn.addEventListener('click', () => loadSample('sample-effect'));

  const sBtn = document.getElementById('loadSampleShowBtn');
  if (sBtn) sBtn.addEventListener('click', () => loadSample('sample-show'));

  const zBtn = document.getElementById('loadSampleZipBtn');
  if (zBtn) zBtn.addEventListener('click', () => loadSample('sample-zip'));
}

async function loadSample(sampleId) {
  try {
    showToast(`Memuat berkas uji coba sampel "${sampleId}"...`, 'info');
    const response = await fetch(`/api/samples/load/${sampleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersion: state.targetVersion })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    const dummyFile = {
      name: data.sample.fileName,
      size: data.sample.size,
      type: 'sample'
    };

    state.queuedFiles = [{
      file: dummyFile,
      tempId: data.tempId,
      report: data.report,
      status: data.report.status,
      progress: 100
    }];

    renderFileQueue();
    renderAnalysisReport(data.report, data.tempId);
    showToast(`Berkas sampel berhasil dimuat & dianalisis: ${data.sample.fileName}`, 'success');
  } catch (err) {
    showToast(`Gagal memuat sampel: ${err.message}`, 'error');
  }
}

/* ==========================================================================
   ANALISIS KOMPATIBILITAS
   ========================================================================== */
async function runBatchAnalysis() {
  if (state.queuedFiles.length === 0) return;

  const filesToUpload = state.queuedFiles.filter(item => !item.tempId && item.file instanceof File);
  if (filesToUpload.length === 0 && state.queuedFiles[0]?.report) {
    renderAnalysisReport(state.queuedFiles[0].report, state.queuedFiles[0].tempId);
    return;
  }

  const formData = new FormData();
  filesToUpload.forEach(item => {
    formData.append('files', item.file);
  });
  formData.append('sourceVersion', state.sourceVersion);
  formData.append('targetVersion', state.targetVersion);
  formData.append('manualOverride', state.sourceVersion !== 'auto');

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    data.results.forEach((resItem) => {
      const match = state.queuedFiles.find(q => q.file.name === resItem.fileName);
      if (match) {
        match.tempId = resItem.tempId;
        match.report = resItem.report;
        match.status = resItem.report.status;
      }
    });

    renderFileQueue();

    const primary = state.queuedFiles[0];
    if (primary && primary.report) {
      renderAnalysisReport(primary.report, primary.tempId);
    }

    showToast('Analisis kompatibilitas berhasil diselesaikan.', 'success');
  } catch (err) {
    showToast(`Analisis gagal: ${err.message}`, 'error');
  }
}

function renderAnalysisReport(report, tempId) {
  state.activeJobId = tempId;
  elements.analysisDashboard.classList.add('visible');

  // Label status keseluruhan dalam Bahasa Indonesia
  let statusText = report.status;
  if (report.status === 'Compatible') statusText = 'Kompatibel';
  else if (report.status === 'Convertible') statusText = 'Dapat Dikonversi';
  else if (report.status === 'Needs Review') statusText = 'Perlu Peninjauan';
  else if (report.status === 'Unsupported') statusText = 'Tidak Didukung';

  elements.overallStatusBadge.textContent = statusText.toUpperCase();
  elements.overallStatusBadge.className = 'file-status-badge';
  if (statusText === 'Kompatibel') elements.overallStatusBadge.classList.add('status-compatible');
  else if (statusText === 'Perlu Peninjauan') elements.overallStatusBadge.classList.add('status-review');
  else if (statusText === 'Tidak Didukung') elements.overallStatusBadge.classList.add('status-unsupported');
  else elements.overallStatusBadge.classList.add('status-convertible');

  // Badge Deteksi Kategori File
  const catBadge = document.getElementById('detectedCategoryBadge');
  if (catBadge && report) {
    const cat = formatFileTypeCategory(report.fileType, report.fileName);
    catBadge.textContent = `${cat.icon} Kategori: ${cat.category} (USB: ${cat.folder})`;
    catBadge.style.borderColor = cat.color;
    catBadge.style.color = cat.color;
  }

  // Statistik angka
  elements.statTotalIssues.textContent = report.stats.totalIssues;
  elements.statWarnings.textContent = report.stats.warnings;
  elements.statCritical.textContent = report.stats.critical;
  elements.statConvertible.textContent = report.stats.convertible;

  // Isi tabel masalah
  elements.issuesTableBody.innerHTML = '';
  if (report.issues.length === 0) {
    elements.issuesTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--accent-green); padding: 2rem;">
          ✓ Tidak ditemukan ketidaksesuaian. Berkas dapat dibuka langsung di grandMA2 v${report.targetVersion}.
        </td>
      </tr>
    `;
  } else {
    report.issues.forEach(issue => {
      const row = document.createElement('tr');
      let sevClass = 'sev-info';
      let sevLabel = 'Info';
      if (issue.severity === 'critical') {
        sevClass = 'sev-critical';
        sevLabel = 'Kritis';
      } else if (issue.severity === 'warning') {
        sevClass = 'sev-warning';
        sevLabel = 'Peringatan';
      }

      row.innerHTML = `
        <td><span class="issue-severity-tag ${sevClass}">${sevLabel}</span></td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${issue.line || '—'}</td>
        <td><div class="issue-feature-title">${escapeHtml(issue.featureName)}</div></td>
        <td>
          <div class="issue-desc">${escapeHtml(issue.description)}</div>
          <div class="issue-impact"><strong>Dampak Konsol:</strong> ${escapeHtml(issue.impact)}</div>
        </td>
        <td>
          <div class="issue-resolution">${escapeHtml(issue.resolution)}</div>
        </td>
      `;
      elements.issuesTableBody.appendChild(row);
    });
  }

  elements.analysisDashboard.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   EKSEKUSI KONVERSI DOWNGRADE
   ========================================================================== */
function setupConversionActions() {
  elements.executeConvertBtn.addEventListener('click', async () => {
    await executeConversion();
  });

  elements.downloadConvertedBtn.addEventListener('click', () => {
    if (state.activeConvertedResult && state.activeConvertedResult.jobId) {
      window.location.href = `/api/download/${state.activeConvertedResult.jobId}`;
      showToast('Mengunduh berkas hasil konversi...', 'success');
    }
  });

  if (elements.downloadMigrationZipBtn) {
    elements.downloadMigrationZipBtn.addEventListener('click', () => {
      if (state.activeConvertedResult && state.activeConvertedResult.jobId) {
        window.location.href = `/api/download-migration/${state.activeConvertedResult.jobId}`;
        showToast('Mengunduh Paket Lengkap Migrasi Showfile (.zip)...', 'success');
      }
    });
  }

  if (elements.deployToMA2Btn) {
    elements.deployToMA2Btn.addEventListener('click', async () => {
      if (!state.activeConvertedResult || !state.activeConvertedResult.jobId) {
        showToast('Belum ada berkas konversi aktif untuk dipasang.', 'error');
        return;
      }
      elements.deployToMA2Btn.disabled = true;
      elements.deployToMA2Btn.innerHTML = `<span>⏳ Memasang ke grandMA2...</span>`;
      try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: state.activeConvertedResult.jobId,
            targetVersion: state.targetVersion
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        showToast(`✓ Berhasil dipasang langsung ke grandMA2 (${data.matchedTarget})!`, 'success');

        alert(`BERHASIL DIPASANG KE GRANDMA2!\n\nTarget Direktori: ${data.matchedTarget}\nLokasi Berkas:\n${data.deployedPaths.join('\n')}\n\n${data.instruction}`);
      } catch (err) {
        showToast(`Gagal memasang otomatis: ${err.message}`, 'error');
      } finally {
        elements.deployToMA2Btn.disabled = false;
        elements.deployToMA2Btn.innerHTML = `<span>🚀 PASANG LANGSUNG KE GRANDMA2 (1-KLIK)</span>`;
      }
    });
  }

  elements.downloadReportBtn.addEventListener('click', () => {
    if (state.activeConvertedResult && state.activeConvertedResult.jobId) {
      window.location.href = `/api/report/${state.activeConvertedResult.jobId}`;
      showToast('Mengunduh laporan audit konversi...', 'info');
    }
  });

  elements.convertAnotherBtn.addEventListener('click', () => {
    elements.resultsDashboard.classList.remove('visible');
    elements.analysisDashboard.classList.remove('visible');
    state.queuedFiles = [];
    renderFileQueue();
    elements.dropZone.scrollIntoView({ behavior: 'smooth' });
  });

  elements.clearHistoryBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/clear-history', { method: 'POST' });
      fetchHistory();
      showToast('Riwayat konversi berhasil dibersihkan.', 'info');
    } catch (err) {
      showToast('Gagal membersihkan riwayat.', 'error');
    }
  });

  elements.guideSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filterCompatibilityMatrix(term);
  });
}

async function executeConversion() {
  if (!state.activeJobId) {
    showToast('Tidak ada berkas aktif yang siap dikonversi.', 'error');
    return;
  }

  elements.executeConvertBtn.disabled = true;
  elements.executeConvertBtn.innerHTML = `<span>⏳ Mengonversi & Mengemas Ulang...</span>`;

  try {
    const payload = {
      tempId: state.activeJobId,
      mode: state.mode,
      targetVersion: state.targetVersion,
      options: {
        injectLuaShims: document.getElementById('advInjectLuaShims').checked,
        convertHexColors: document.getElementById('advConvertHexColors').checked,
        wrapPhaserTags: document.getElementById('advWrapPhaserTags').checked,
        fallbackSoundSync: document.getElementById('advFallbackSoundSync').checked
      }
    };

    const res = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    state.activeConvertedResult = {
      jobId: data.jobId,
      ...data.result
    };

    renderConversionResults(state.activeConvertedResult);
    showToast('Konversi berhasil diselesaikan!', 'success');
  } catch (err) {
    showToast(`Konversi gagal: ${err.message}`, 'error');
  } finally {
    elements.executeConvertBtn.disabled = false;
    elements.executeConvertBtn.innerHTML = `<span>⚡ KONVERSI BERKAS SEKARANG</span>`;
  }
}

function renderConversionResults(res) {
  elements.resultsDashboard.classList.add('visible');
  elements.resultsSubtext.textContent = `Berkas berhasil disesuaikan untuk grandMA2 v${res.targetVersion} (Mode: ${res.mode.toUpperCase()})`;

  elements.resOrigName.textContent = res.originalFileName;
  elements.resOrigSize.textContent = `${(res.originalSize / 1024).toFixed(1)} KB`;
  elements.resOutputName.textContent = res.outputFileName;
  elements.resOutputSize.textContent = `${(res.convertedSize / 1024).toFixed(1)} KB`;
  elements.resTargetVer.textContent = `v${res.targetVersion}`;
  elements.resMode.textContent = `Mode ${res.mode.toUpperCase()}`;
  elements.resModCount.textContent = `${res.modifiedFeatures ? res.modifiedFeatures.length : 0} penyesuaian diterapkan`;

  if (elements.downloadMigrationZipBtn) {
    if (res.hasMigrationZip) {
      elements.downloadMigrationZipBtn.style.display = 'inline-flex';
    } else {
      elements.downloadMigrationZipBtn.style.display = 'none';
    }
  }

  // Render IMPORT COMPATIBILITY CHECK
  const check = res.importCheck;
  if (check) {
    const elInteg = document.getElementById('resCheckIntegrity');
    if (elInteg) {
      elInteg.textContent = check.fileIntegrity;
      elInteg.className = `stat-value ${check.fileIntegrity === 'PASS' ? 'green' : (check.fileIntegrity === 'WARNING' ? 'amber' : 'red')}`;
    }

    const elStruct = document.getElementById('resCheckStructure');
    if (elStruct) {
      elStruct.textContent = check.structureValidation;
      elStruct.className = `stat-value ${check.structureValidation === 'PASS' ? 'green' : 'red'}`;
    }

    const elCompat = document.getElementById('resCheckTargetCompat');
    if (elCompat) {
      elCompat.textContent = check.targetCompatibility;
      elCompat.className = `stat-value ${check.targetCompatibility === 'TESTED' ? 'cyan' : 'amber'}`;
    }

    const elUnsupp = document.getElementById('resCheckUnsupported');
    if (elUnsupp) elUnsupp.textContent = check.unsupportedCommandsCount;

    const elMissing = document.getElementById('resCheckMissingDep');
    if (elMissing) elMissing.textContent = check.missingDependenciesCount;

    const compatBadge = document.getElementById('resCompatibilityBadge');
    if (compatBadge) {
      if (check.targetCompatibility === 'TESTED') {
        compatBadge.textContent = '✓ TESTED & COMPATIBLE';
        compatBadge.className = 'file-status-badge status-compatible';
      } else {
        compatBadge.textContent = '⚠️ NEEDS TESTING';
        compatBadge.className = 'file-status-badge status-review';
      }
    }

    const retainedList = document.getElementById('resRetainedList');
    if (retainedList) {
      retainedList.innerHTML = check.retainedData && check.retainedData.length > 0
        ? check.retainedData.map(item => `<li>• ${escapeHtml(item)}</li>`).join('')
        : '<li>• Struktur dan data asli dipertahankan.</li>';
    }

    const actionsList = document.getElementById('resActionsList');
    if (actionsList) {
      actionsList.innerHTML = check.recommendedActions && check.recommendedActions.length > 0
        ? check.recommendedActions.map(item => `<li>• ${escapeHtml(item)}</li>`).join('')
        : '<li>• Berkas siap digunakan langsung pada grandMA2.</li>';
    }
  }

  // Unduh Laporan Diagnostik Teks
  const dlDiagBtn = document.getElementById('downloadDiagnosticTxtBtn');
  if (dlDiagBtn) {
    dlDiagBtn.onclick = () => {
      const textToDownload = res.diagnosticReportText || 'Laporan diagnostik belum tersedia.';
      const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IMPORT_DIAGNOSTIC_${res.outputFileName || 'report'}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Mengunduh Laporan Diagnostik Import (.txt)...', 'success');
    };
  }

  // Render log aktivitas mesin
  elements.engineLogsContainer.innerHTML = '';
  res.logs.forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = log;
    elements.engineLogsContainer.appendChild(div);
  });

  // Render diff granular
  if (res.diff) {
    elements.diffStatAdded.textContent = `+${res.diff.stats.added} baris`;
    elements.diffStatRemoved.textContent = `-${res.diff.stats.removed} baris`;

    elements.diffContentScroll.innerHTML = '';
    res.diff.lines.forEach(line => {
      const row = document.createElement('div');
      row.className = `diff-line-row ${line.type}`;
      row.innerHTML = `
        <span class="diff-num-orig">${line.origLine || ''}</span>
        <span class="diff-num-conv">${line.convLine || ''}</span>
        <span class="diff-code-text">${escapeHtml(line.content)}</span>
      `;
      elements.diffContentScroll.appendChild(row);
    });
  }

  elements.resultsDashboard.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   MODUL DIAGNOSTIK IMPOR (IMPORT DIAGNOSTIC CENTER)
   ========================================================================== */
function setupDiagnosticView() {
  const runBtn = document.getElementById('runDiagnosticBtn');
  const fileInput = document.getElementById('diagFileInput');
  const sourceSelect = document.getElementById('diagSourceVer');
  const targetSelect = document.getElementById('diagTargetVer');
  const typeSelect = document.getElementById('diagFileType');
  const errorInput = document.getElementById('diagErrorMessage');
  const resultContainer = document.getElementById('diagnosticResultContainer');
  const rawTextPre = document.getElementById('diagReportRawText');
  const dlReportBtn = document.getElementById('diagDownloadReportTxtBtn');

  if (!runBtn) return;

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.innerHTML = `<span>⏳ Menjalankan Diagnostik Mendalam...</span>`;

    const formData = new FormData();
    formData.append('sourceVersion', sourceSelect.value);
    formData.append('targetVersion', targetSelect.value);
    formData.append('fileType', typeSelect.value);
    formData.append('errorMessage', errorInput.value);

    if (fileInput && fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    } else {
      formData.append('fileName', `sample_${typeSelect.value}.xml`);
    }

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const diag = data.diagnostic;
      const check = diag.importCheck;

      resultContainer.style.display = 'block';

      document.getElementById('diagReportIntegrity').textContent = check.fileIntegrity;
      document.getElementById('diagReportIntegrity').className = `stat-value ${check.fileIntegrity === 'PASS' ? 'green' : 'red'}`;

      document.getElementById('diagReportStructure').textContent = check.structureValidation;
      document.getElementById('diagReportStructure').className = `stat-value ${check.structureValidation === 'PASS' ? 'green' : 'red'}`;

      document.getElementById('diagReportTargetCompat').textContent = check.targetCompatibility;
      document.getElementById('diagReportTargetCompat').className = `stat-value ${check.targetCompatibility === 'TESTED' ? 'cyan' : 'amber'}`;

      document.getElementById('diagReportUnsupported').textContent = check.unsupportedCommandsCount;
      document.getElementById('diagReportMissingDep').textContent = check.missingDependenciesCount;

      rawTextPre.textContent = diag.diagnosticReportText;

      dlReportBtn.onclick = () => {
        const blob = new Blob([diag.diagnosticReportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IMPORT_DIAGNOSTIC_REPORT_${diag.targetVersion}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Mengunduh Laporan Diagnostik (.txt)...', 'success');
      };

      resultContainer.scrollIntoView({ behavior: 'smooth' });
      showToast('Laporan diagnostik berhasil dianalisis!', 'success');
    } catch (err) {
      showToast(`Gagal menjalankan diagnostik: ${err.message}`, 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `<span>🔍 JALANKAN ANALISIS DIAGNOSTIK</span>`;
    }
  });
}

/* ==========================================================================
   METADATA & RIWAYAT
   ========================================================================== */
async function loadServerMetadata() {
  try {
    const [verRes, ruleRes] = await Promise.all([
      fetch('/api/versions').then(r => r.json()),
      fetch('/api/rules').then(r => r.json())
    ]);

    if (verRes.success) {
      state.allVersions = verRes.versions;
    }
    if (ruleRes.success) {
      state.allRules = ruleRes.rules;
    }
  } catch (err) {
    console.error('Gagal memuat metadata server:', err);
  }
}

async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (!data.success) return;

    elements.historyTableBody.innerHTML = '';
    if (data.history.length === 0) {
      elements.historyTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            Belum ada riwayat konversi. Berkas yang dikonversi akan tercatat di sini.
          </td>
        </tr>
      `;
      return;
    }

    data.history.forEach(item => {
      const row = document.createElement('tr');
      const timeStr = new Date(item.timestamp).toLocaleTimeString();
      row.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${timeStr}</td>
        <td><strong>${escapeHtml(item.originalFileName)}</strong></td>
        <td style="color: var(--accent-cyan);">${escapeHtml(item.outputFileName)}</td>
        <td><span class="panel-title-badge">v${item.targetVersion}</span></td>
        <td>${item.mode.toUpperCase()}</td>
        <td>${(item.convertedSize / 1024).toFixed(1)} KB</td>
        <td><span class="file-status-badge status-compatible">Sukses</span></td>
        <td>
          <a class="btn btn-sm btn-primary" href="/api/download/${item.id}">Unduh</a>
          <a class="btn btn-sm btn-secondary" href="/api/report/${item.id}">Laporan</a>
        </td>
      `;
      elements.historyTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Gagal mengambil riwayat:', err);
  }
}

function renderCompatibilityMatrix() {
  filterCompatibilityMatrix('');
}

function filterCompatibilityMatrix(searchTerm) {
  elements.matrixTableBody.innerHTML = '';
  const filtered = state.allRules.filter(r => {
    if (!searchTerm) return true;
    return r.name.toLowerCase().includes(searchTerm) ||
           r.description.toLowerCase().includes(searchTerm) ||
           r.category.toLowerCase().includes(searchTerm) ||
           r.downgradeStrategy.toLowerCase().includes(searchTerm);
  });

  if (filtered.length === 0) {
    elements.matrixTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Tidak ditemukan fitur atau tag yang cocok dengan kata kunci.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(r => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong style="color: var(--text-primary);">${escapeHtml(r.name)}</strong>
        <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.2rem;">${escapeHtml(r.description)}</div>
      </td>
      <td><span class="file-badge-type">${escapeHtml(r.category)}</span></td>
      <td><span class="panel-title-badge">v${escapeHtml(r.minVersion)}</span></td>
      <td style="color: #fca5a5; font-size: 0.82rem;">${escapeHtml(r.impact)}</td>
      <td style="color: #86efac; font-size: 0.82rem;">${escapeHtml(r.downgradeStrategy)}</td>
    `;
    elements.matrixTableBody.appendChild(row);
  });
}

/* ==========================================================================
   UTILITAS NOTIFIKASI TOAST
   ========================================================================== */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
