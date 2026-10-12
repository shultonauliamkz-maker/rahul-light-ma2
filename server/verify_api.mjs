import fs from 'fs';

async function testApi() {
  console.log('Testing /api/versions...');
  const vRes = await fetch('http://localhost:3000/api/versions');
  const vData = await vRes.json();
  console.log('Versions count:', vData.versions?.length);
  const testedCount = vData.versions?.filter(v => v.testedStatus === 'TESTED').length;
  console.log('Tested versions count:', testedCount);

  console.log('\nTesting /api/diagnose with parled...');
  const sampleXml = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_original.xml', 'utf-8');
  const dRes = await fetch('http://localhost:3000/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetVersion: '3.2.2.16',
      sourceVersion: '3.9.61.0',
      fileType: 'fixture_xml',
      fileName: 'alfacom@led_parled_(a)@8_ch_(a).xml',
      fileContent: sampleXml,
      errorMessage: 'Could not import fixture type'
    })
  });
  const dData = await dRes.json();
  console.log('Diagnose Success:', dData.success);
  console.log('Integrity:', dData.diagnostic?.importCheck?.fileIntegrity);
  console.log('Structure:', dData.diagnostic?.importCheck?.structureValidation);
  console.log('Target Compatibility:', dData.diagnostic?.importCheck?.targetCompatibility);
  console.log('First 300 chars of report:');
  console.log(dData.diagnostic?.diagnosticReportText?.slice(0, 300));
}

testApi().catch(console.error);
