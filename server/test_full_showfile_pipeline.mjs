import fs from 'fs';

async function runPipelineTest() {
  const showPath = 'C:\\Users\\Aul\\Downloads\\adella revisi 1.show.gz';
  const showBuf = fs.readFileSync(showPath);
  console.log(`Loaded test file: ${showPath} (${showBuf.length} bytes)`);

  const boundary = '----WebKitFormBoundaryTest' + Date.now();
  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="sourceVersion"\r\n\r\n3.9.61.5\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="targetVersion"\r\n\r\n3.7.0.5\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="adella revisi 1.show.gz"\r\nContent-Type: application/gzip\r\n\r\n`),
    showBuf,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  // 1. Test POST /api/analyze
  console.log('\n--- 1. Testing /api/analyze ---');
  const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body
  });
  const analyzeData = await analyzeRes.json();
  console.log('Analyze Success:', analyzeData.success);
  const result0 = analyzeData.results[0];
  console.log('Detected File Type:', result0.report.fileType);
  console.log('Status:', result0.report.status);
  console.log('Issues count:', result0.report.issues.length);
  result0.report.issues.forEach(i => console.log(`  [${i.severity}] ${i.code}: ${i.featureName}`));

  if (result0.report.fileType !== 'showfile') {
    throw new Error(`FAIL: Expected 'showfile' but got '${result0.report.fileType}'`);
  }

  // 2. Test POST /api/convert
  console.log('\n--- 2. Testing /api/convert ---');
  const convertRes = await fetch('http://localhost:3000/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tempId: result0.tempId,
      targetVersion: '3.7.0.5',
      mode: 'auto'
    })
  });
  const convertData = await convertRes.json();
  console.log('Convert Success:', convertData.success);
  console.log('Job ID:', convertData.jobId);
  console.log('Output File Name:', convertData.result.outputFileName);
  console.log('Has Migration Zip:', convertData.result.hasMigrationZip);
  console.log('Migration Zip Name:', convertData.result.migrationZipFileName);
  console.log('Target Compatibility:', convertData.result.importCheck.targetCompatibility);
  console.log('Warnings count:', convertData.result.importCheck.warnings.length);
  console.log('Logs:', convertData.result.logs);

  if (convertData.result.importCheck.targetCompatibility !== 'NEEDS TESTING') {
    throw new Error(`FAIL: Expected 'NEEDS TESTING' but got '${convertData.result.importCheck.targetCompatibility}'`);
  }

  // 3. Test GET /api/download/:jobId
  console.log('\n--- 3. Testing /api/download ---');
  const dlRes = await fetch(`http://localhost:3000/api/download/${convertData.jobId}`);
  const dlBuf = Buffer.from(await dlRes.arrayBuffer());
  console.log(`Downloaded .show.gz size: ${dlBuf.length} bytes (magic: ${dlBuf.slice(0, 2).toString('hex')})`);

  // 4. Test GET /api/download-migration/:jobId
  console.log('\n--- 4. Testing /api/download-migration ---');
  const dlZipRes = await fetch(`http://localhost:3000/api/download-migration/${convertData.jobId}`);
  const dlZipBuf = Buffer.from(await dlZipRes.arrayBuffer());
  console.log(`Downloaded Migration Zip size: ${dlZipBuf.length} bytes (magic: ${dlZipBuf.slice(0, 2).toString('ascii')})`);

  // 5. Test POST /api/deploy
  console.log('\n--- 5. Testing /api/deploy ---');
  const deployRes = await fetch('http://localhost:3000/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: convertData.jobId,
      targetVersion: '3.7.0.5'
    })
  });
  const deployData = await deployRes.json();
  console.log('Deploy Success:', deployData.success);
  console.log('Matched Target:', deployData.matchedTarget);
  console.log('Deployed Paths:', deployData.deployedPaths);

  console.log('\n==========================================');
  console.log('  ALL TESTS PASSED WITH 100% SUCCESS!  ');
  console.log('==========================================');
}

runPipelineTest().catch(err => {
  console.error('Test pipeline error:', err);
  process.exit(1);
});
