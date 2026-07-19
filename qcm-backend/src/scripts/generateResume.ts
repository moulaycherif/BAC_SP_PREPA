import { PDFDocument, StandardFonts } from "pdf-lib";

export default async function generateResumeBuffer(
  subject: string,
  chapter: string,
  content: string
): Promise<Uint8Array> {

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 12;
  const maxWidth = page.getWidth() - 80;
  let y = page.getHeight() - 40;

  // ---- TITRE ----
  page.drawText(subject, { x: 40, y, size: 22, font });
  y -= 40;

  page.drawText(`Chapitre : ${chapter}`, { x: 40, y, size: 18, font });
  y -= 50;

  // ---- Séparer paragraphes sur les \n ----
  const paragraphs = content.split(/\r?\n/);

  for (let paragraph of paragraphs) {

    // Trim pour éviter les espaces qui posent problème
    paragraph = paragraph.trim();
    if (paragraph === "") {
      y -= 16;
      continue;
    }

    const words = paragraph.split(" ");
    let currentLine = "";

    for (let word of words) {
      const testLine = currentLine + word + " ";
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth) {
        // dessine la ligne
        page.drawText(currentLine, {
          x: 40,
          y,
          size: fontSize,
          font,
        });
        y -= 16;
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }

    // dessiner la dernière ligne du paragraphe
    if (currentLine.trim() !== "") {
      page.drawText(currentLine, {
        x: 40,
        y,
        size: fontSize,
        font,
      });
      y -= 20;
    }
  }

  return await pdfDoc.save();
}
