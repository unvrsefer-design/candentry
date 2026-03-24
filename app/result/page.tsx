async function downloadPDF(result: ResultData) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;
  const left = 40;
  const lineHeight = 18;

  function drawText(
    text: string,
    x: number,
    size = 12,
    bold = false,
    color = rgb(1, 1, 1)
  ) {
    if (y < 50) {
      y = height - 40;
      pdfDoc.addPage([595, 842]);
    }

    const currentPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

    currentPage.drawText(text, {
      x,
      y,
      size,
      font: bold ? boldFont : font,
      color,
    });

    y -= lineHeight;
  }

  function drawSectionTitle(title: string) {
    y -= 8;
    drawText(title, left, 14, true, rgb(0.2, 0.8, 1));
    y -= 4;
  }

  function drawBulletList(items: string[]) {
    items.forEach((item) => {
      drawWrappedText(`• ${item}`, left + 10, 11);
    });
  }

  function drawWrappedText(text: string, x: number, size = 12) {
    const maxWidth = 500;
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, size);

      if (textWidth > maxWidth) {
        drawText(line, x, size, false, rgb(1, 1, 1));
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      drawText(line, x, size, false, rgb(1, 1, 1));
    }
  }

  drawText("Candentry Analysis Report", left, 20, true, rgb(0.2, 0.8, 1));
  y -= 10;

  drawText(`File: ${result.fileName}`, left, 12);
  drawText(`Mode: ${result.mode || "balanced"}`, left, 12);
  y -= 8;

  drawSectionTitle("Summary Scores");
  drawText(`Hire Score: ${result.hireScore}/100`, left, 12, true);
  drawText(`Decision: ${result.finalDecision}`, left, 12, true);
  drawText(`Technical Match: ${result.technicalMatch}/100`, left, 12);
  drawText(`Experience Match: ${result.experienceMatch}/100`, left, 12);
  drawText(`Risk Score: ${result.riskScore}/100`, left, 12);

  drawSectionTitle("Strengths");
  drawBulletList(result.strengths || []);

  drawSectionTitle("Risks");
  drawBulletList(result.risks || []);

  drawSectionTitle("Missing Skills");
  drawBulletList(result.missingSkills || []);

  drawSectionTitle("Growth Potential");
  drawWrappedText(result.growthPotential || "-", left + 10, 11);

  drawSectionTitle("Reasoning");
  drawWrappedText(result.reasoning || "-", left + 10, 11);

  if (result.consensusSummary) {
    drawSectionTitle("Consensus Summary");
    drawWrappedText(result.consensusSummary, left + 10, 11);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.fileName || "candentry-report"}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
}