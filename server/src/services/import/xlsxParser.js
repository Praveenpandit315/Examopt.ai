// server/src/services/import/xlsxParser.js
// Excel XLSX Workbook and Multi-sheet parser

const xlsx = require('xlsx');
const { sanitizeCell } = require('./csvParser');

/**
 * Parses an XLSX buffer into an object mapping sheet names to arrays of row objects.
 * 
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Object} { sheets: { [sheetName]: Array<Object> }, defaultRecords: Array<Object> }
 */
function parseXLSX(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true, raw: false });
  const sheets = {};
  let defaultRecords = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to JSON with raw values formatted as strings
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    
    // Sanitize all cells against formula injection and trim headers
    const sanitizedRows = rawRows.map(row => {
      const cleanRow = {};
      for (const [key, val] of Object.entries(row)) {
        const cleanKey = (key || '').trim();
        cleanRow[cleanKey] = sanitizeCell(String(val !== null && val !== undefined ? val : ''));
      }
      return cleanRow;
    });

    sheets[sheetName] = sanitizedRows;
    if (defaultRecords.length === 0 && sanitizedRows.length > 0) {
      defaultRecords = sanitizedRows;
    }
  }

  return {
    sheetNames: workbook.SheetNames,
    sheets,
    defaultRecords
  };
}

module.exports = {
  parseXLSX
};
