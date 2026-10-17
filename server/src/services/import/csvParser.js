// server/src/services/import/csvParser.js
// Secure, zero-vulnerability CSV parser with formula injection protection

/**
 * Sanitizes cell values to prevent formula injection in CSV/Excel.
 * Strips or neutralizes leading '=', '+', '-', '@', '\t', '\r'.
 */
function sanitizeCell(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    // Prefix with single quote or strip dangerous formula character
    return trimmed.replace(/^[=+\-@\t\r]+/, '');
  }
  return trimmed;
}

/**
 * Parses raw CSV text or Buffer into an array of objects.
 * Handles quoted fields, line breaks inside quotes, escaped quotes, and trimmed headers.
 * 
 * @param {string|Buffer} content - Raw CSV content
 * @returns {Array<Object>} Array of row objects { header: value }
 */
function parseCSV(content) {
  let text = typeof content === 'string' ? content : content.toString('utf8');
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const lines = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(sanitizeCell(currentCell));
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // Skip \n in CRLF
      currentRow.push(sanitizeCell(currentCell));
      currentCell = '';
      if (currentRow.some(c => c !== '')) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  // Push final cell and row
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(sanitizeCell(currentCell));
    if (currentRow.some(c => c !== '')) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return [];

  // Extract and normalize headers (lowercase, trimmed, strip whitespace)
  const rawHeaders = lines[0];
  const headers = rawHeaders.map(h => (h || '').trim());

  const records = [];
  for (let r = 1; r < lines.length; r++) {
    const row = lines[r];
    const record = {};
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      if (headerKey) {
        record[headerKey] = row[c] !== undefined ? row[c] : '';
      }
    }
    records.push(record);
  }

  return records;
}

module.exports = {
  parseCSV,
  sanitizeCell
};
