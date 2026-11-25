import jsPDF from 'jspdf';

export interface ReportSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  note?: string;
}

// Email/web fonts are not required: PDF text stays selectable and printable.
const plain = (value: string | number) => String(value)
  .replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  .replace(/→/g, '>').replace(/…/g, '...').replace(/[^\x20-\x7e\xa0-\xff]/g, ' ');

export function buildBrandedReportPdf(title: string, generatedAt: string, sections: ReportSection[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 16;
  const width = 178;
  const bottom = 274;
  let y = 0;
  doc.setProperties({ title: `MindCare ${title}`, author: 'MindCare', subject: 'Aggregate administrative report' });
  const stamp = new Date(generatedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });

  function page(first = false) {
    if (!first) doc.addPage();
    doc.setFillColor(248, 252, 250);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(first ? 22 : 14);
    doc.text('MindCare.', margin, first ? 24 : 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('PUP Santa Maria Campus', 194, first ? 23 : 18, { align: 'right' });
    if (first) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(margin, 33, width, 48, 5, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(4, 120, 87);
      doc.text('ADMINISTRATIVE REPORT / AGGREGATE DATA', 23, 43);
      doc.setFontSize(23);
      doc.setTextColor(15, 23, 42);
      doc.text(plain(title), 23, 56);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Generated ${stamp} PHT`, 23, 68);
      y = 91;
    } else {
      doc.setFontSize(8);
      doc.text(plain(title), margin, 25);
      y = 34;
    }
  }

  function ensure(height: number) { if (y + height > bottom) page(); }
  function note(text: string) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const lines = doc.splitTextToSize(plain(text), width);
    for (const line of lines) {
      ensure(5); doc.setTextColor(71, 85, 105); doc.text(line, margin, y); y += 4;
    }
    y += 3;
  }

  page(true);
  for (const section of sections) {
    const weights = section.headers.map((_, index) => index === 0 ? 2 : 1);
    const total = weights.reduce((sum, value) => sum + value, 0);
    const widths = weights.map(weight => width * weight / total);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    const heads = section.headers.map((header, index) => doc.splitTextToSize(plain(header), widths[index] - 6) as string[]);
    const headerHeight = Math.max(...heads.map(lines => lines.length)) * 4 + 5;
    ensure(10 + headerHeight + 14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
    doc.text(plain(section.title), margin, y); y += 6;
    if (section.note) note(section.note);
    const drawHeader = () => {
      ensure(headerHeight + 12);
      doc.setFillColor(4, 120, 87); doc.roundedRect(margin, y, width, headerHeight, 1, 1, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      let x = margin;
      heads.forEach((lines, index) => { doc.text(lines, x + 3, y + 5); x += widths[index]; });
      y += headerHeight;
    };
    drawHeader();
    const rows = section.rows.length ? section.rows : [['No data available for the selected scope.', ...section.headers.slice(1).map(() => '-')]];
    rows.forEach((row, index) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      const cells = section.headers.map((_, column) => doc.splitTextToSize(plain(row[column] ?? '-'), widths[column] - 6) as string[]);
      const lineCount = Math.max(...cells.map(lines => lines.length));
      // Long cells split safely into multiple fragments without dropping text.
      for (let offset = 0; offset < lineCount; offset += 28) {
        const pieces = cells.map(lines => lines.slice(offset, offset + 28));
        const height = Math.max(...pieces.map(lines => lines.length), 1) * 4.2 + 4;
        if (y + height > bottom) { page(); drawHeader(); }
        doc.setFillColor(...(index % 2 ? [241, 245, 249] : [255, 255, 255]) as [number, number, number]);
        doc.rect(margin, y, width, height, 'F');
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(.2);
        doc.line(margin, y + height, margin + width, y + height);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(51, 65, 85);
        let x = margin;
        pieces.forEach((lines, column) => { if (lines.length) doc.text(lines, x + 3, y + 5); x += widths[column]; });
        y += height;
      }
    });
    y += 10;
  }
  note('Aggregate information supports campus wellness planning. Screening summaries are not clinical diagnoses. No student identities or private journal text are included.');
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('MindCare / Internal administrative use', margin, 286);
    doc.text(`${i} / ${pages}`, 194, 286, { align: 'right' });
  }
  return doc;
}
