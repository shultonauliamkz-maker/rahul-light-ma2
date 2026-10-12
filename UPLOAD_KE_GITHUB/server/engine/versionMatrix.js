/**
 * grandMA2 Version Database & Compatibility Matrix
 * Dikelola oleh Tim Rekayasa RAHUL LIGHT
 */

export const MA2_VERSIONS = [
  {
    version: '3.9.63.6',
    major: 3,
    minor: 9,
    stream: 63,
    sub: 6,
    releaseDate: '2024-01-15',
    isLatest: true,
    testedStatus: 'TESTED',
    channel: 'Rilis Stabil Resmi',
    notes: 'Versi rilis resmi grandMA2 paling baru. Perbaikan stabilitas jaringan, Art-Net 4 sync, dan batas alokasi memori Lua.'
  },
  {
    version: '3.9.60.74',
    major: 3,
    minor: 9,
    stream: 60,
    sub: 74,
    releaseDate: '2023-08-20',
    isLatest: false,
    testedStatus: 'TESTED',
    channel: 'Standar Tur & Rental',
    notes: 'Versi standar paling banyak dipakai di konser tur dunia dan rental house. Mesin cue sangat stabil dengan stack Art-Net 3/4.'
  },
  {
    version: '3.9.60.27',
    major: 3,
    minor: 9,
    stream: 60,
    sub: 27,
    releaseDate: '2023-03-10',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Produksi Panggung',
    notes: 'Build pemeliharaan awal 3.9.60. Banyak terpasang pada konsol festival musik dan venue konser.'
  },
  {
    version: '3.9.51.2',
    major: 3,
    minor: 9,
    stream: 51,
    sub: 2,
    releaseDate: '2022-11-04',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Tur Legacy',
    notes: 'Build sebelum 3.9.60. Variasi protokol minor pada web remote dan isolasi plugin.'
  },
  {
    version: '3.9.0.3',
    major: 3,
    minor: 9,
    stream: 0,
    sub: 3,
    releaseDate: '2021-06-18',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Rilis Mayor 3.9',
    notes: 'Rilis awal cabang 3.9 yang memperkenalkan respons RDM yang disempurnakan dan ekspansi DMX remotes.'
  },
  {
    version: '3.8.0.0',
    major: 3,
    minor: 8,
    stream: 0,
    sub: 0,
    releaseDate: '2020-04-12',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Mayor Legacy 3.8',
    notes: 'Cabang mayor 3.8. Skema showfile generasi sebelumnya. Tidak mendukung tag kalibrasi warna 3.9.'
  },
  {
    version: '3.7.0.5',
    major: 3,
    minor: 7,
    stream: 0,
    sub: 5,
    releaseDate: '2019-09-30',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Mayor Legacy 3.7',
    notes: 'Build 3.7 stabil. Umum ditemukan pada instalasi tetap (fixed installs) dan meja siaran broadcast.'
  },
  {
    version: '3.6.1.1',
    major: 3,
    minor: 6,
    stream: 1,
    sub: 1,
    releaseDate: '2019-02-14',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Legacy 3.6',
    notes: 'Platform legacy 3.6. Belum memiliki metode gma.gui.progress pada pustaka Lua.'
  },
  {
    version: '3.5.0.6',
    major: 3,
    minor: 5,
    stream: 0,
    sub: 6,
    releaseDate: '2018-07-22',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Legacy 3.5',
    notes: 'Skema lama. Perbedaan sintaks baris perintah (CLI) pada manajemen tampilan (appearance) dan layout.'
  },
  {
    version: '3.3.4.3',
    major: 3,
    minor: 3,
    stream: 4,
    sub: 3,
    releaseDate: '2017-10-18',
    isLatest: false,
    testedStatus: 'NOT TESTED',
    channel: 'Ultra Legacy',
    notes: 'Build dasar konsol versi terdahulu. Perbedaan signifikan pada tag XML dan antarmuka pemrograman Lua.'
  },
  {
    version: '3.2.2.16',
    major: 3,
    minor: 2,
    stream: 2,
    sub: 16,
    releaseDate: '2016-11-20',
    isLatest: false,
    testedStatus: 'TESTED',
    channel: 'Klasik onPC & Wing',
    notes: 'Versi klasik 3.2.2.16 yang sangat banyak dipakai pengguna onPC dan Command Wing. Terverifikasi langsung pada pengujian internal.'
  }
];

/**
 * Definisi aturan kompatibilitas antar versi grandMA2
 */
export const FEATURE_RULES = [
  // Fitur Fixture & Library Lampu
  {
    id: 'fixture_modern_attributes_pre38',
    category: 'Fixture Library',
    name: 'Atribut Warna Modern (HSB, CRIMODE, VIRTUAL_COLOR_MODE)',
    description: 'Atribut fixture modern seperti VIRTUAL_COLOR_MODE, CRIMODE, dan COLORHSB1 yang belum ada pada grandMA2 v3.8 ke bawah.',
    minVersion: '3.8.0.0',
    impact: 'Konsol versi 3.2 - 3.7 akan gagal mengimpor fixture type atau channel kontrol warna tidak dapat diputar pada encoder wheel.',
    downgradeStrategy: 'Alihkan (fallback) atribut VIRTUAL_COLOR_MODE dan CRIMODE ke atribut CONTROL/DUMMY standar, dan normalisasikan nilai default integer.'
  },
  // Fitur Skema & XML
  {
    id: 'schema_version_stream_63',
    category: 'Skema XML',
    name: 'Skema Header Stream Version 63',
    description: 'Header root XML menetapkan stream_vers="63" dan stream_sub_vers="6"',
    minVersion: '3.9.63.0',
    impact: 'Konsol akan menampilkan peringatan "Stream Version Mismatch" dan menolak mengimpor file secara langsung.',
    downgradeStrategy: 'Tulis ulang atribut stream_vers dan stream_sub_vers pada tag <MA> agar cocok dengan versi konsol tujuan.'
  },
  {
    id: 'xml_color_gamut_calibration',
    category: 'Data Warna XML',
    name: 'Kalibrasi Warna Gamut & Kurva Spektral',
    description: 'Atribut "gamut", "cmy_calibrated", dan "spectral_data" pada node fixture atau preset.',
    minVersion: '3.9.0.0',
    impact: 'grandMA2 versi sebelum 3.9 akan melaporkan kesalahan sintaks atau mengabaikan atribut warna lampu fixture.',
    downgradeStrategy: 'Mode Aman: bungkus atribut gamut dalam komentar kompatibel. Mode Otomatis: sesuaikan ke standar baseline RGB/CMY konsol.'
  },
  {
    id: 'xml_sound_sync_triggers',
    category: 'Trigger Sequence',
    name: 'Trigger Cue SoundSync & Analisis Audio BPM',
    description: 'Trigger sequence cue dengan atribut "sound_sync" dan "audio_analysis_band".',
    minVersion: '3.8.0.0',
    impact: 'Tidak didukung oleh versi sebelum 3.8. Cue dapat gagal terpanggil secara otomatis atau kembali ke pemicu "Go".',
    downgradeStrategy: 'Alihkan tipe trigger ke standar "Follow" atau "Time" dengan peringatan operasional kepada operator.'
  },
  {
    id: 'xml_advanced_rdm_config',
    category: 'Data Perangkat RDM',
    name: 'Konfigurasi Sub-device RDM Lanjutan',
    description: 'Tag <RDMDevice> dengan parameter subdevice yang diperkenalkan pada 3.9.',
    minVersion: '3.9.0.0',
    impact: 'Konsol lama tidak mengenali pemetaan subdevice RDM; berisiko mengacaukan tampilan patch jaringan.',
    downgradeStrategy: 'Bungkus node <RDMDevice> dalam komentar XML yang aman untuk konsol versi di bawah 3.9.'
  },
  {
    id: 'xml_phaser_preview_meta',
    category: 'Metadata Transisi',
    name: 'Metadata Hybrid Phaser & Transisi grandMA3',
    description: 'Tag metadata khusus <PhaserPreview> atau <GDTFRef> pada pustaka fixture hibrida.',
    minVersion: '3.9.60.0',
    impact: 'Konsol grandMA2 versi lama menolak tag anak skema yang tidak dikenal.',
    downgradeStrategy: 'Komentari atau bersihkan tag metadata hibrida tanpa mengubah data cue utama.'
  },

  // Fitur API Lua
  {
    id: 'lua_gma_gui_progress',
    category: 'API Lua',
    name: 'gma.gui.progress (Kotak Dialog Progress Bar)',
    description: 'Metode API: gma.gui.progress.start(), gma.gui.progress.set(), gma.gui.progress.stop()',
    minVersion: '3.8.0.0',
    impact: 'Skrip crash dengan pesan error "attempt to index field progress (a nil value)" pada MA2 <= 3.7.',
    downgradeStrategy: 'Sisipkan Shim Polyfill Lua Rahul Light yang mem-bypass gma.gui.progress secara aman ke konsol feedback.'
  },
  {
    id: 'lua_gma_network_gethostdata',
    category: 'API Lua',
    name: 'gma.network.gethostdata() (Informasi Jaringan)',
    description: 'API inspeksi jaringan yang menyediakan data IP stasiun, ID sesi, dan status peran konsol.',
    minVersion: '3.9.0.0',
    impact: 'Mengembalikan nilai nil atau error pada grandMA2 versi <= 3.8.',
    downgradeStrategy: 'Sisipkan fallback shim yang mengembalikan struktur data host stasiun standar.'
  },
  {
    id: 'lua_gma_show_property_access',
    category: 'API Lua',
    name: 'gma.show.property.get() / property.set()',
    description: 'Manipulasi properti objek langsung yang ditambahkan pada revisi 3.x lanjutan.',
    minVersion: '3.5.0.0',
    impact: 'Tidak tersedia pada grandMA2 v3.3. Plugin akan gagal saat mencoba membaca/menulis properti objek.',
    downgradeStrategy: 'Sediakan wrapper kompatibilitas atau gunakan perintah CLI baris perintah (gma.cmd).'
  },
  {
    id: 'lua_bitwise_operators',
    category: 'Sintaks Lua',
    name: 'Operator Bitwise Lua 5.3 (&, |, ~, >>, <<)',
    description: 'Operator bitwise native pada lingkungan Lua 5.3+ vs Lua 5.1 klasik.',
    minVersion: '3.9.50.0',
    impact: 'Konsol MA2 lama menggunakan Lua 5.1 tanpa sintaks operator bitwise; menyebabkan crash parser sintaks saat load.',
    downgradeStrategy: 'Transpile atau gunakan fungsi pustaka bitwise yang kompatibel (bit.band, bit.bor, bit.rshift).'
  },

  // Sintaks Perintah Baris Perintah (CLI) Macro
  {
    id: 'macro_appearance_color_hex',
    category: 'Sintaks Macro',
    name: 'Perintah Appearance /color="#HEX"',
    description: 'Penetapan warna langsung menggunakan kode heksadesimal pada pool dan executor.',
    minVersion: '3.8.0.0',
    impact: 'Konsol lama hanya menerima nama warna preset atau format integer RGB yang dipisahkan koma.',
    downgradeStrategy: 'Konversi kode warna heksadesimal (#00d2ff) menjadi nilai integer RGB (0, 210, 255).'
  },
  {
    id: 'macro_network_speed_config',
    category: 'Sintaks Macro',
    name: 'Perintah NetworkSpeed / Port Ethernet via CLI',
    description: 'Perintah untuk mengatur bitrate interface port dan sinkronisasi Art-Net 4 langsung dari macro.',
    minVersion: '3.9.0.0',
    impact: 'Perintah tidak dikenal pada konsol lama; eksekusi macro berhenti atau memicu error sintaks merah.',
    downgradeStrategy: 'Komentari baris perintah macro tersebut dengan tag penjelasan operasional.'
  },
  {
    id: 'macro_plugin_call_params',
    category: 'Sintaks Macro',
    name: 'Sintaks Eksekusi Plugin Berparameter (/parameter="...")',
    description: 'Pemanggilan plugin berparameter yang diperkenalkan pada versi 3.9.',
    minVersion: '3.9.0.0',
    impact: 'Konsol sebelum 3.9 gagal mem-parsing parameter tambahan pada baris perintah Plugin.',
    downgradeStrategy: 'Pisahkan parameter ke dalam macroline SetGlobalVar yang diikuti pemanggilan Plugin standar.'
  }
];

export function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const p1 = v1.split('.').map(n => parseInt(n, 10) || 0);
  const p2 = v2.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function parseVersion(vStr) {
  if (!vStr) return null;
  const parts = vStr.trim().replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  return {
    version: vStr,
    major: parts[0] || 3,
    minor: parts[1] || 9,
    stream: parts[2] || 60,
    sub: parts[3] || 0
  };
}

export function getVersionInfo(vStr) {
  const clean = (vStr || '').trim().replace(/^v/i, '');
  const found = MA2_VERSIONS.find(v => v.version === clean);
  if (found) return found;
  const parsed = parseVersion(clean);
  if (!parsed) return MA2_VERSIONS[1]; // default 3.9.60.74
  return {
    ...parsed,
    releaseDate: 'Kustom',
    isLatest: false,
    channel: 'Versi Manual Kustom',
    notes: `Versi target kustom yang ditentukan pengguna: ${clean}`
  };
}
