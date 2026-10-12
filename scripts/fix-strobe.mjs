import fs from 'fs';

let xml = fs.readFileSync('test-files/strobe_converted_by_user.xml', 'utf-8');

// 1. Add name="Main Module" to Module if missing
xml = xml.replace(/<Module\b([^>]*?)>/i, (m, attrs) => {
  if (!attrs.includes('name=')) {
    return `<Module name="Main Module"${attrs}>`;
  }
  return m;
});

// 2. Add patch="1" locked="true" to Instance if missing
xml = xml.replace(/<Instance\b([^>]*?)>/i, (m, attrs) => {
  let a = attrs;
  if (!a.includes('patch=')) a += ' patch="1"';
  if (!a.includes('locked=')) a += ' locked="true"';
  return `<Instance${a}>`;
});

// 3. Fallback MP_TR_Z (Multi-Patch Translation Z) to DUMMY
xml = xml.replace(/attribute="MP_TR_Z"/gi, 'attribute="DUMMY"');
xml = xml.replace(/feature="MP_TR"/gi, 'feature="CONTROL"');
xml = xml.replace(/subattribute="MP_TR_Z"/gi, 'subattribute="NOFEATURE"');

// 4. Fallback SCROLLER with feature="COLORALL" to COLOR1
xml = xml.replace(/attribute="SCROLLER"/gi, 'attribute="COLOR1"');
xml = xml.replace(/feature="COLORALL"/gi, 'feature="COLOR1"');
xml = xml.replace(/subattribute="SCROLLERSELECT"/gi, 'subattribute="COLOR1WHEEL"');

fs.writeFileSync('d:/DOWNGRADE MA2/test-files/strobe_fixed.xml', xml);
fs.writeFileSync('C:/ProgramData/MA Lighting Technologies/grandma/gma2_V_3.2.2/library/alfacom@strobe_100_rgb_v3_2_2_16@11_ch.xml', xml);
fs.writeFileSync('C:/Users/Aul/Downloads/alfacom@strobe_100_rgb_v3_2_2_16@11_ch.xml', xml);
fs.writeFileSync('C:/Users/Aul/Downloads/AULIA MM/alfacom@strobe_100_rgb_v3_2_2_16@11_ch.xml', xml);

console.log('Fixed XML written to library and downloads successfully!');
