import fs from 'fs';

const src = 'C:/Users/Aul/Downloads/RHL_1_5_ALL EFFCT_MA2_v3.2.2.16_CONVERTED.xml';
if (fs.existsSync(src)) {
  let effectXml = fs.readFileSync(src, 'utf8');

  // Strip comment before <MA>
  effectXml = effectXml.replace(/<!--[\s\S]*?-->/g, '');
  effectXml = effectXml.replace(/^\uFEFF/, '').trim();

  // Clean <MA> header for 3.2 (no stream_sub_vers)
  const effectXml32 = effectXml.replace(/<MA\b[^>]*>/i, 
    '<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.2.2/MA.xsd" major_vers="3" minor_vers="2" stream_vers="2">'
  );

  // Clean <MA> header for 3.7
  const effectXml37 = effectXml.replace(/<MA\b[^>]*>/i, 
    '<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.7.0/MA.xsd" major_vers="3" minor_vers="7" stream_vers="0" stream_sub_vers="5">'
  );

  // Deploy to 3.7
  const dir37Eff = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/effects';
  const dir37IE = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/importexport';
  if (fs.existsSync(dir37Eff)) fs.writeFileSync(dir37Eff + '/RHL_1_5_ALL_EFFCT.xml', effectXml37, 'utf8');
  if (fs.existsSync(dir37IE)) fs.writeFileSync(dir37IE + '/RHL_1_5_ALL_EFFCT.xml', effectXml37, 'utf8');
  console.log('Deployed effect to 3.7 effects and importexport');

  // Deploy to 3.2
  const dir32Eff = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/effects';
  const dir32IE = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/importexport';
  if (fs.existsSync(dir32Eff)) fs.writeFileSync(dir32Eff + '/RHL_1_5_ALL_EFFCT.xml', effectXml32, 'utf8');
  if (fs.existsSync(dir32IE)) fs.writeFileSync(dir32IE + '/RHL_1_5_ALL_EFFCT.xml', effectXml32, 'utf8');
  console.log('Deployed effect to 3.2 effects and importexport');
} else {
  console.log('Source file not found:', src);
}
