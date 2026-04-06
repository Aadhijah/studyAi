const fs = require('fs');
const path = require('path');

async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  try {
    if (ext === '.txt') return fs.readFileSync(filePath, 'utf8');
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      return data.text || '';
    }
    if (ext === '.docx' || ext === '.doc') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
    if (ext === '.pptx' || ext === '.ppt') {
      const officeParser = require('officeparser');
      return new Promise((resolve) => {
        officeParser.parseOffice(filePath, (data, err) => {
          resolve(err ? '' : data || '');
        });
      });
    }
  } catch (e) {
    console.error('Text extraction error:', e.message);
  }
  return '';
}

module.exports = { extractTextFromFile };
