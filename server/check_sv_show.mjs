import fs from 'fs';
import zlib from 'zlib';

const showPath = 'C:\\ProgramData\\MA Lighting Technologies\\grandma\\gma2_V_3.2.2\\shows\\sv.show.gz';
if (fs.existsSync(showPath)) {
  const buf = fs.readFileSync(showPath);
  const decomp = zlib.gunzipSync(buf).toString('utf-8');
  const maMatch = decomp.match(/<MA\b[^>]*>/i);
  console.log('MA header in sv.show.gz:');
  console.log(maMatch ? maMatch[0] : 'None');

  // Also check how FixtureType tags look in sv.show.gz
  const ftMatches = decomp.match(/<FixtureType\b[\s\S]*?>/gi) || [];
  console.log('\nFixtureTypes in sv.show.gz (first 3):');
  ftMatches.slice(0, 3).forEach(ft => console.log(ft));
}
