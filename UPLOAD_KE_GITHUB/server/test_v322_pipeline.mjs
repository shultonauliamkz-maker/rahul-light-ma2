import fs from 'fs';

async function testV322() {
  const showPath = 'C:\\Users\\Aul\\Downloads\\adella revisi 1.show.gz';
  const showBuf = fs.readFileSync(showPath);

  const boundary = '----WebKitFormBoundaryTest' + Date.now();
  let body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="sourceVersion"\r\n\r\n3.9.61.5\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="targetVersion"\r\n\r\n3.2.2.16\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="adella revisi 1.show.gz"\r\nContent-Type: application/gzip\r\n\r\n`),
    showBuf,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const analyzeRes = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body
  });
  const analyzeData = await analyzeRes.json();
  const result0 = analyzeData.results[0];

  const convertRes = await fetch('http://localhost:3000/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tempId: result0.tempId,
      targetVersion: '3.2.2.16',
      mode: 'auto'
    })
  });
  const convertData = await convertRes.json();
  console.log('v3.2.2.16 Convert Result:');
  console.log('Output Name:', convertData.result.outputFileName);
  console.log('Target Compatibility:', convertData.result.importCheck.targetCompatibility);
  console.log('Has Migration Zip:', convertData.result.hasMigrationZip);
  console.log('Logs:', convertData.result.logs);
}

testV322().catch(e => { console.error(e); process.exit(1); });
