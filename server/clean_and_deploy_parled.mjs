import fs from 'fs';
import { XMLValidator } from 'fast-xml-parser';

let xml = fs.readFileSync('d:\\DOWNGRADE MA2\\server\\parled_original.xml', 'utf-8');

// Strip BOM
xml = xml.replace(/^\uFEFF/, '');

// Clean <MA> header
xml = xml.replace(/<MA\b([^>]*)>/i, (m, attrs) => {
  let a = attrs;
  a = a.replace(/major_vers=["']?\d+["']?/i, 'major_vers="3"');
  a = a.replace(/minor_vers=["']?\d+["']?/i, 'minor_vers="2"');
  a = a.replace(/stream_vers=["']?\d+["']?/i, 'stream_vers="2"');
  a = a.replace(/stream_sub_vers=["']?\d+["']?/i, 'stream_sub_vers="16"');
  a = a.replace(/xml\/(\d+\.\d+\.\d+(?:\.\d+)?)\/MA\.xsd/i, 'xml/3.2.2/MA.xsd');
  return `<MA${a}>`;
});

// Remove index from FixtureType, Modules, Instances, Wheels
xml = xml.replace(/<FixtureType\b([^>]*?)\bindex=["']\d+["']/gi, '<FixtureType$1');
xml = xml.replace(/<Modules\b([^>]*?)(\/?)>/gi, (m, a, sc) => `<Modules${sc ? ' /' : ''}>`);
xml = xml.replace(/<Instances\b([^>]*?)(\/?)>/gi, (m, a, sc) => `<Instances${sc ? ' /' : ''}>`);
xml = xml.replace(/<Wheels\b([^>]*?)(\/?)>/gi, (m, a, sc) => {
  const isSelf = a.trim().endsWith('/') || sc === '/';
  return isSelf ? '<Wheels />' : '<Wheels>';
});

// Ensure Module has name="Main Module"
xml = xml.replace(/<Module\b([^>]*?)>/gi, (m, attrs) => {
  if (!attrs.includes('name=')) {
    return `<Module name="Main Module"${attrs}>`;
  }
  return m;
});

// Ensure Instance has patch="1" locked="true"
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

// Strip modern tags (both block and self-closing)
xml = xml.replace(/<VirtualFunctionBlocks\b[\s\S]*?<\/VirtualFunctionBlocks>/gi, '');
xml = xml.replace(/<VirtualFunctionBlocks\b[^>]*\/>/gi, '');

xml = xml.replace(/<FixtureMacroCollect\b[\s\S]*?<\/FixtureMacroCollect>/gi, '');
xml = xml.replace(/<FixtureMacroCollect\b[^>]*\/>/gi, '');

xml = xml.replace(/<AutoPresets\b[\s\S]*?<\/AutoPresets>/gi, '');
xml = xml.replace(/<AutoPresets\b[^>]*\/>/gi, '');

xml = xml.replace(/<RdmNotifications\b[\s\S]*?<\/RdmNotifications>/gi, '');
xml = xml.replace(/<RdmNotifications\b[^>]*\/>/gi, '');

xml = xml.replace(/<media\b[\s\S]*?<\/media>/gi, '');

// Strip Body outside Modules
const modIdx = xml.indexOf('</Modules>');
if (modIdx !== -1) {
  const before = xml.slice(0, modIdx);
  let after = xml.slice(modIdx);
  after = after.replace(/<Body\b[^>]*\/>/gi, '');
  after = after.replace(/<Body\b[^>]*>[\s\S]*?<\/Body>/gi, '');
  xml = before + after;
}

// Clean multiple blank lines
xml = xml.replace(/\n\s*\n\s*\n/g, '\n');

// Add comment header right after <?xml ... ?>
const stamp = '<!-- Downgraded by RAHUL LIGHT MA FILE DOWNGRADER for grandMA2 v3.2.2.16 -->\n';
xml = xml.replace(/(<\?xml[^>]*\?>\r?\n?)/i, `$1${stamp}`);

const val = XMLValidator.validate(xml);
console.log('XML Valid:', val);

if (val === true) {
  const targetPath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\library\\alfacom@led_parled_(a)_v3_2_2_16@8_ch_(a).xml';
  fs.writeFileSync(targetPath, xml, 'utf-8');
  console.log('Saved directly to library:', targetPath);
  console.log('Final XML length:', xml.length);
}
