import fs from 'fs';
import { XMLValidator } from 'fast-xml-parser';

let xml = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\lunar_original.xml', 'utf-8');

// 1. Update <MA> root version
xml = xml.replace(/<MA\b([^>]*)>/i, (m, attrs) => {
  let a = attrs;
  a = a.replace(/major_vers=["']?\d+["']?/i, 'major_vers="3"');
  a = a.replace(/minor_vers=["']?\d+["']?/i, 'minor_vers="2"');
  a = a.replace(/stream_vers=["']?\d+["']?/i, 'stream_vers="2"');
  a = a.replace(/stream_sub_vers=["']?\d+["']?/i, 'stream_sub_vers="16"');
  a = a.replace(/xml\/(\d+\.\d+\.\d+(?:\.\d+)?)\/MA\.xsd/i, 'xml/3.2.2/MA.xsd');
  return `<MA${a}>`;
});

// 2. Add Rahul Light comment header
const header = '<!-- Downgraded by RAHUL LIGHT MA FILE DOWNGRADER for grandMA2 v3.2.2.16 -->\n';
xml = xml.replace(/(<\?xml[^>]*\?>\r?\n?)/i, `$1${header}`);

// 3. Ensure <Module name="Main Module">
xml = xml.replace(/<Module\b([^>]*?)>/gi, (m, attrs) => {
  if (!attrs.includes('name=')) {
    return `<Module name="Main Module"${attrs}>`;
  }
  return m;
});

// 4. Ensure <Instance> has patch="1" locked="true" with PROPER syntax (handling self-closing '/>')
xml = xml.replace(/<Instance\b([^>]*?)(\/?)>/gi, (m, attrs, selfClose) => {
  let a = attrs.trim();
  if (a.endsWith('/')) {
    a = a.slice(0, -1).trim();
    selfClose = '/';
  }
  if (!/\bpatch=/i.test(a)) a += ' patch="1"';
  if (!/\blocked=/i.test(a)) a += ' locked="true"';
  return `<Instance ${a}${selfClose ? ' /' : ''}>`;
});

// 5. Remove or comment out pre-3.8 / 3.9 exclusive tags:
// <VirtualFunctionBlocks ...>
xml = xml.replace(/<VirtualFunctionBlocks\b[^>]*>[\s\S]*?<\/VirtualFunctionBlocks>/gi, '');
xml = xml.replace(/<VirtualFunctionBlocks\b[^>]*\/>/gi, '');

// <FixtureMacroCollect ...>
xml = xml.replace(/<FixtureMacroCollect\b[^>]*>[\s\S]*?<\/FixtureMacroCollect>/gi, '');

// <AutoPresets ...>
xml = xml.replace(/<AutoPresets\b[^>]*>[\s\S]*?<\/AutoPresets>/gi, '');
xml = xml.replace(/<AutoPresets\b[^>]*\/>/gi, '');

// <RdmNotifications ...>
xml = xml.replace(/<RdmNotifications\b[^>]*>[\s\S]*?<\/RdmNotifications>/gi, '');
xml = xml.replace(/<RdmNotifications\b[^>]*\/>/gi, '');

// <media> embedded base64 images inside slots
xml = xml.replace(/<media\b[^>]*>[\s\S]*?<\/media>/gi, '');

// Normalize DMX defaults (e.g. default="106.000")
xml = xml.replace(/default="(\d+)\.\d+"/gi, 'default="$1"');

// Validate with fast-xml-parser
const valResult = XMLValidator.validate(xml);
console.log('XML Validator Result:', valResult);

if (valResult === true) {
  fs.writeFileSync('d:\\DOWNGRADE MA2\\server\\lunar_test_fixed.xml', xml, 'utf-8');
  console.log('Successfully written lunar_test_fixed.xml');
}
