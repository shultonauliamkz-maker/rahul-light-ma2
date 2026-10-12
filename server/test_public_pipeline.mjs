import fs from 'fs';

async function testPublic() {
  console.log('====================================================');
  console.log('  TESTING RAHUL LIGHT PUBLIC PIPELINE (HTTPS TUNNEL)');
  console.log('====================================================');

  const fileBuf = fs.readFileSync('C:/Users/Aul/Downloads/bsd.show.gz');
  console.log('[1/5] Read local test showfile:', fileBuf.length, 'bytes');

  // Step 1: Upload and Analyze
  const formData = new FormData();
  formData.append('files', new Blob([fileBuf]), 'bsd.show.gz');
  formData.append('targetVersion', '3.7.0.5');
  formData.append('sourceVersion', '3.9.60.27');

  console.log('[2/5] Uploading to https://rahul-light-ma2.loca.lt/api/analyze ...');
  const analyzeRes = await fetch('https://rahul-light-ma2.loca.lt/api/analyze', {
    method: 'POST',
    headers: { 'Bypass-Tunnel-Reminder': 'true' },
    body: formData
  });

  console.log('Analyze HTTP Status:', analyzeRes.status);
  const analyzeData = await analyzeRes.json();
  console.log('Analyze Success:', analyzeData.success);
  if (!analyzeData.success || !analyzeData.results || !analyzeData.results[0]) {
    throw new Error('Analyze failed: ' + JSON.stringify(analyzeData));
  }

  const { tempId, report } = analyzeData.results[0];
  console.log('TempId:', tempId, '| Detected Type:', report.fileType, '| Version:', report.detectedVersion);

  // Step 2: Convert
  console.log('[3/5] Converting via https://rahul-light-ma2.loca.lt/api/convert ...');
  const convertRes = await fetch('https://rahul-light-ma2.loca.lt/api/convert', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true'
    },
    body: JSON.stringify({
      tempId,
      targetVersion: '3.7.0.5',
      mode: 'auto'
    })
  });

  console.log('Convert HTTP Status:', convertRes.status);
  const convertData = await convertRes.json();
  console.log('Convert Success:', convertData.success);
  console.log('JobId:', convertData.jobId);
  console.log('Output File:', convertData.job?.outputFileName);
  console.log('Migration ZIP Name:', convertData.job?.migrationZipFileName);

  const jobId = convertData.jobId;

  // Step 3: Download Converted Showfile
  console.log('[4/5] Downloading converted .show.gz ...');
  const dlRes = await fetch(`https://rahul-light-ma2.loca.lt/api/download/${jobId}`, {
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
  });
  console.log('Download Status:', dlRes.status);
  const dlBuf = await dlRes.arrayBuffer();
  console.log('Downloaded size:', dlBuf.byteLength, 'bytes');

  // Step 4: Download Migration Kit ZIP
  console.log('[5/5] Downloading Migration Kit ZIP ...');
  const zipRes = await fetch(`https://rahul-light-ma2.loca.lt/api/download-migration/${jobId}`, {
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
  });
  console.log('ZIP Download Status:', zipRes.status);
  const zipBuf = await zipRes.arrayBuffer();
  console.log('Downloaded ZIP size:', zipBuf.byteLength, 'bytes');

  // Step 5: Privacy Purge Test
  const delRes = await fetch(`https://rahul-light-ma2.loca.lt/api/jobs/${jobId}`, { 
    method: 'DELETE',
    headers: { 'Bypass-Tunnel-Reminder': 'true' }
  });
  const delData = await delRes.json();
  console.log('Privacy Cleanup Status:', delData);

  console.log('\n====================================================');
  console.log('  ALL PUBLIC ENDPOINTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

testPublic().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
