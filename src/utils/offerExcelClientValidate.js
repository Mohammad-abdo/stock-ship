/**
 * Client-side checks mirroring stokship/src/utils/offerExcelValidation.js
 * (headers row + at least one importable data row). Uses SheetJS (xlsx).
 */
import * as XLSX from 'xlsx';

export const EXCEL_TEMPLATE_HEADERS = [
  'NO',
  'IMAGE',
  'ITEM NO.',
  'DESCRIPTION',
  'Colour',
  'SPEC.',
  'QUANTITY',
  'Unit',
  'UNIT PRICE',
  'CURRENCY',
  'AMOUNT',
  'PACKING',
  'PACKAGE QUANTITY (CTN)',
  'UNIT G.W. (KGS)',
  'TOTAL G.W. (KGS)',
  'Length',
  'Width',
  'Height',
  'TOTAL CBM',
];

const normalizeExcelHeader = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/[()]/g, '');

const headersMatchTemplate = (headerRow) => {
  if (!headerRow || !Array.isArray(headerRow)) return false;
  for (let i = 0; i < EXCEL_TEMPLATE_HEADERS.length; i += 1) {
    const expected = normalizeExcelHeader(EXCEL_TEMPLATE_HEADERS[i]);
    const actual = normalizeExcelHeader(headerRow[i]);
    if (actual !== expected) return false;
  }
  return true;
};

/** Same rules as server rowWouldBeImported (columns C, D, G → indices 2,3,6). */
const rowWouldBeImported = (row) => {
  if (!row || !Array.isArray(row)) return false;
  const itemNo = String(row[2] ?? '').trim();
  const cellD = String(row[3] ?? '').trim();
  const productName = cellD || itemNo;
  const quantity = parseInt(row[6], 10) || 0;
  if ((!productName && !itemNo) || quantity === 0) return false;
  return true;
};

/**
 * @param {File} file
 * @returns {Promise<{ ok: boolean, errors: string[] }>}
 */
export async function validateOfferExcelFile(file) {
  const errors = [];
  if (!file) {
    errors.push('No file selected');
    return { ok: false, errors };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstName = workbook.SheetNames[0];
    if (!firstName) {
      errors.push('Excel file is empty');
      return { ok: false, errors };
    }
    const sheet = workbook.Sheets[firstName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    const headerRow = rows[0];
    if (!headersMatchTemplate(headerRow)) {
      errors.push('Excel sheet must match the template');
      return { ok: false, errors };
    }

    let importable = 0;
    for (let r = 1; r < rows.length; r += 1) {
      if (rowWouldBeImported(rows[r])) importable += 1;
    }
    if (importable === 0) {
      errors.push(
        'At least one product row is required: enter item number or description and quantity greater than zero.'
      );
      return { ok: false, errors };
    }

    return { ok: true, errors: [] };
  } catch (e) {
    console.error('Excel client validation:', e);
    errors.push('Could not read the Excel file. Check that it is a valid .xlsx file.');
    return { ok: false, errors };
  }
}
