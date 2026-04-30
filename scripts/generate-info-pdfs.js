const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const projectRoot = process.cwd();
const infoDir = path.join(projectRoot, 'info');

if (!fs.existsSync(infoDir)) {
  throw new Error('Folder info nie istnieje.');
}

const txtFiles = fs
  .readdirSync(infoDir)
  .filter((file) => file.toLowerCase().endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b, 'pl'));

if (!txtFiles.length) {
  console.log('Brak plikow TXT do konwersji.');
  process.exit(0);
}

for (const txtFile of txtFiles) {
  const txtPath = path.join(infoDir, txtFile);
  const pdfPath = path.join(infoDir, txtFile.replace(/\.txt$/i, '.pdf'));
  const text = fs.readFileSync(txtPath, 'utf8');

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: txtFile.replace(/\.txt$/i, ''),
      Author: 'UFREV',
      Subject: 'Info documents export',
      Creator: 'scripts/generate-info-pdfs.js',
    },
  });

  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(txtFile.replace(/\.txt$/i, ''), { align: 'left' });

  doc.moveDown(0.8);

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(text, {
      align: 'left',
      lineGap: 2,
    });

  doc.end();
}

console.log(`Wygenerowano PDF: ${txtFiles.length} plikow.`);
