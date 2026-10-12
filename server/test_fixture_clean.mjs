import fs from 'fs';
import zlib from 'zlib';
import { XMLValidator } from 'fast-xml-parser';

// Read parled original
let xml = fs.readFileSync('d:/DOWNGRADE MA2/server/parled_original.xml', 'utf8');

// 1. Strip BOM and any comments
xml = xml.replace(/^\uFEFF/, '').trim();
xml = xml.replace(/<!--[\s\S]*?-->/g, '');

// 2. Remove <Info ... showfile=... /> under <MA>
xml = xml.replace(/<Info\b[^>]*\bshowfile=[^>]*\/>/gi, '');
xml = xml.replace(/<Info\b[^>]*\bshowfile=[^>]*>[\s\S]*?<\/Info>/gi, '');

// 3. Remove all modern *_user_name attributes
xml = xml.replace(/\s+(?:subattribute|attribute|feature|preset)_user_name="[^"]*"/gi, '');

// 4. Remove modern blocks
xml = xml.replace(/<VirtualFunctionBlocks\b[\s\S]*?<\/VirtualFunctionBlocks>/gi, '');
xml = xml.replace(/<VirtualFunctionBlocks\b[^>]*\/>/gi, '');
xml = xml.replace(/<FixtureMacroCollect\b[\s\S]*?<\/FixtureMacroCollect>/gi, '');
xml = xml.replace(/<FixtureMacroCollect\b[^>]*\/>/gi, '');
xml = xml.replace(/<AutoPresets\b[\s\S]*?<\/AutoPresets>/gi, '');
xml = xml.replace(/<AutoPresets\b[^>]*\/>/gi, '');
xml = xml.replace(/<RdmNotifications\b[\s\S]*?<\/RdmNotifications>/gi, '');
xml = xml.replace(/<RdmNotifications\b[^>]*\/>/gi, '');
xml = xml.replace(/<media\b[\s\S]*?<\/media>/gi, '');

// 5. Remove index attributes from FixtureType, Modules, Module, ChannelType, ChannelFunction, ChannelSet, Instances, Instance, Wheels
xml = xml.replace(/<(FixtureType|Modules|Module|ChannelType|ChannelFunction|ChannelSet|Instances|Instance|Wheels)\b([^>]*?)\bindex=["']\d+["']/gi, '<$1$2');
xml = xml.replace(/<(FixtureType|Modules|Module|ChannelType|ChannelFunction|ChannelSet|Instances|Instance|Wheels)\b([^>]*?)\bindex=["']\d+["']/gi, '<$1$2');

// 6. Ensure Module has name="Main Module"
xml = xml.replace(/<Module\b([^>]*?)>/gi, (m, attrs) => {
  if (!attrs.includes('name=')) return `<Module name="Main Module"${attrs}>`;
  return m;
});

// 7. Ensure Instance has module_index="0" patch="1" locked="true"
xml = xml.replace(/<Instance\b([^>]*?)(\/?)>/gi, (m, attrs, sc) => {
  let a = attrs.trim();
  if (a.endsWith('/')) a = a.slice(0, -1).trim();
  if (!/\bmodule_index=/i.test(a)) a = 'module_index="0" ' + a;
  if (!/\bpatch=/i.test(a)) a += ' patch="1"';
  if (!/\blocked=/i.test(a)) a += ' locked="true"';
  return `<Instance ${a.trim()} />`;
});

// 8. Ensure Wheels is self-closing
xml = xml.replace(/<Wheels\b[^>]*>(?:\s*<\/Wheels>)?/gi, '<Wheels />');

// 9. Remove Body outside Modules
const modIdx = xml.indexOf('</Modules>');
if (modIdx !== -1) {
  const before = xml.slice(0, modIdx);
  let after = xml.slice(modIdx);
  after = after.replace(/<Body\b[^>]*\/>/gi, '');
  after = after.replace(/<Body\b[^>]*>[\s\S]*?<\/Body>/gi, '');
  xml = before + after;
}

// 10. Clean multiple spaces in tags
xml = xml.replace(/<([a-zA-Z0-9_]+)\s{2,}/g, '<$1 ');

// 11. Clean blank lines
xml = xml.replace(/\n\s*\n\s*\n/g, '\n');

// 12. Adjust <MA> header
function makeMaHeader(major, minor, stream, sub) {
  let subAttr = (major > 3 || (major === 3 && minor >= 4)) ? ` stream_sub_vers="${sub}"` : '';
  return `<?xml version="1.0" encoding="utf-8"?>\n<MA xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/${major}.${minor}.${stream}/MA.xsd" major_vers="${major}" minor_vers="${minor}" stream_vers="${stream}"${subAttr} xmlns="http://schemas.malighting.de/grandma2/xml/MA">`;
}

// Create clean XML for 3.7
const xml37 = xml.replace(/<\?xml[^>]*\?>\s*<MA\b[^>]*>/i, makeMaHeader(3, 7, 0, 5));
// Create clean XML for 3.2
const xml32 = xml.replace(/<\?xml[^>]*\?>\s*<MA\b[^>]*>/i, makeMaHeader(3, 2, 2, 16));

console.log('XML 3.7 Valid:', XMLValidator.validate(xml37));
console.log('XML 3.2 Valid:', XMLValidator.validate(xml32));

// Helper to create .xmlp payload
function createXmlp(xmlString) {
  // MA DATA binary header: 4d 41 20 44 41 54 41 00 05 00 07 03 37 0f 00 00 ef bb bf
  const headerHex = '4d4120444154410005000703370f0000efbbbf';
  const headerBuf = Buffer.from(headerHex, 'hex');
  const xmlBuf = Buffer.from(xmlString, 'utf8');
  const payload = Buffer.concat([headerBuf, xmlBuf]);
  return zlib.gzipSync(payload, { level: 9 });
}

// Deploy to 3.7 library
const dir37 = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.7/library';
if (fs.existsSync(dir37)) {
  fs.writeFileSync(dir37 + '/alfacom@led_parled_(a)@8_ch_(a).xml', xml37, 'utf8');
  fs.writeFileSync(dir37 + '/alfacom@led_parled_(a)@8_ch_(a).xmlp', createXmlp(xml37));
  console.log('Deployed clean .xml and .xmlp to 3.7 library!');
}

// Deploy to 3.2 library
const dir32 = 'C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/library';
if (fs.existsSync(dir32)) {
  fs.writeFileSync(dir32 + '/alfacom@led_parled_(a)@8_ch_(a).xml', xml32, 'utf8');
  fs.writeFileSync(dir32 + '/alfacom@led_parled_(a)@8_ch_(a).xmlp', createXmlp(xml32));
  console.log('Deployed clean .xml and .xmlp to 3.2 library!');
}
