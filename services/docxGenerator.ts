import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType } from 'docx';
import saveAs from 'file-saver';
import { PhotoItem } from '../types';

// Helper to read file as ArrayBuffer for the docx library
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to ArrayBuffer"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const generateDocxReport = async (photos: PhotoItem[], title: string) => {
  if (photos.length === 0) return;

  const children: (Paragraph)[] = [];

  // CONSTANTS for A4 Layout
  // 1 cm approx 37.795 pixels for docx layout calculations
  const CM_TO_PX = 37.795;
  
  // NARROW MARGINS (1.27 cm / 0.5 inch on all sides)
  const MARGIN_TWIPS = 720; 

  // FIXED DIMENSIONS REQUESTED BY USER
  // Width: 16 cm
  // Height: 12.01 cm
  const FIXED_WIDTH_PX = 16 * CM_TO_PX;
  const FIXED_HEIGHT_PX = 12.01 * CM_TO_PX;

  // Title of the document
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          font: "Calibri",
          size: 24, // 12pt = 24 half-points
          bold: true,
          color: "000000",
          language: { value: "cs-CZ" },
        }),
      ],
      alignment: AlignmentType.CENTER,
      // Request: Spacing After 0, Single Line Spacing
      spacing: { after: 0, line: 240 }, 
    })
  );

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];

    try {
      const imageBuffer = await readFileAsArrayBuffer(photo.file);

      // Page 1 = index 0 and 1. Page 2+ starts at index 2, 4, 6, ...
      const isStartOfNewPage = i > 0 && i % 2 === 0;

      // Detect image type from file MIME type
      const mimeType = photo.file.type;
      const imageType = mimeType === 'image/png' ? 'png'
        : mimeType === 'image/gif' ? 'gif'
        : mimeType === 'image/bmp' ? 'bmp'
        : 'jpg';

      // Image Paragraph
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: FIXED_WIDTH_PX,
                height: FIXED_HEIGHT_PX,
              },
              type: imageType,
            }),
          ],
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 0, after: 0, line: 240 },
          pageBreakBefore: isStartOfNewPage,
        })
      );

      // Empty line before every caption (always)
      children.push(new Paragraph({ children: [], spacing: { after: 0, line: 240 } }));

      // Caption Paragraph
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: photo.caption || `Foto č. ${i + 1}`,
              font: "Calibri",
              size: 22, // 11pt = 22 half-points
              language: { value: "cs-CZ" },
            }),
          ],
          alignment: AlignmentType.CENTER,
          keepLines: true,
          spacing: { after: 0, line: 240 },
        })
      );

      // Empty line after caption if there is a next photo
      if (i < photos.length - 1) {
        children.push(new Paragraph({ children: [], spacing: { after: 0, line: 240 } }));
      }

    } catch (error) {
      console.error(`Error processing image ${i}:`, error);
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            language: { value: "cs-CZ" },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_TWIPS, 
              right: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
            },
          },
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "fotodokumentace_export.docx");
};