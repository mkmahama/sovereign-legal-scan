declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    numpages: number;
    text: string;
  }

  const pdfParse: (
    data: Buffer,
    options?: { pagerender?: (pageData: unknown) => Promise<string> },
  ) => Promise<PdfParseResult>;

  export default pdfParse;
}
