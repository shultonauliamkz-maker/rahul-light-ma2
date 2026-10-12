/**
 * grandMA2 File Diff Inspector
 * Computes line-by-line differences and unified diff chunks
 * Maintained by RAHUL LIGHT Engineering Team
 */

import * as diff from 'diff';

export function generateDiff(originalText, convertedText, fileName = 'file') {
  if (!originalText && !convertedText) {
    return {
      chunks: [],
      stats: { added: 0, removed: 0, modified: 0, unchanged: 0 },
      unified: ''
    };
  }

  // Generate unified diff
  const patch = diff.createTwoFilesPatch(
    `original/${fileName}`,
    `converted/${fileName}`,
    originalText || '',
    convertedText || '',
    'Source Version',
    'Target Version'
  );

  // Compute structured line diff
  const changes = diff.diffLines(originalText || '', convertedText || '');
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  const lines = [];
  let origLineNum = 1;
  let convLineNum = 1;

  changes.forEach(part => {
    const partLines = part.value.split(/\r?\n/);
    if (partLines.length > 0 && partLines[partLines.length - 1] === '') {
      partLines.pop();
    }

    partLines.forEach(l => {
      if (part.added) {
        added++;
        lines.push({
          type: 'add',
          origLine: null,
          convLine: convLineNum++,
          content: l
        });
      } else if (part.removed) {
        removed++;
        lines.push({
          type: 'del',
          origLine: origLineNum++,
          convLine: null,
          content: l
        });
      } else {
        unchanged++;
        lines.push({
          type: 'equal',
          origLine: origLineNum++,
          convLine: convLineNum++,
          content: l
        });
      }
    });
  });

  return {
    unified: patch,
    lines: lines.slice(0, 1000), // Limit to first 1000 lines for responsive UI rendering
    stats: {
      added,
      removed,
      modified: Math.min(added, removed),
      unchanged,
      totalLines: lines.length
    }
  };
}
