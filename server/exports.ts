import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

export async function createDocx(title: string, body: string) {
  const document = new Document({ sections: [{ children: [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: "center" }),
    ...body.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] })),
  ] }] });
  return Packer.toBuffer(document);
}

export async function createPdf(title: string, body: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({ size: "A4", margins: { top: 64, bottom: 64, left: 72, right: 72 }, info: { Title: title } });
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    pdf.font("Times-Bold").fontSize(15).text(title, { align: "center" }).moveDown();
    pdf.font("Times-Roman").fontSize(11).text(body, { align: "left", lineGap: 3 });
    pdf.end();
  });
}
