
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

interface CertificateCoords {
  dateX: number;
  dateY: number;
  nameX: number;
  nameY: number;
  completedX: number;
  completedY: number;
  courseX: number;
  courseY: number;
  subtitleX: number;
  subtitleY: number;
  verifyX: number;
  verifyY: number;
  qrX: number;
  qrY: number;
}

interface CertificateData {
  name: string;
  courseTitle: string;
  issuedAt: Date;
  verifyUrl: string;
  coords: CertificateCoords;
  fontPath?: string;
}

/** Load the PDF template */
export async function loadTemplate(): Promise<Buffer> {
  const pathModule = await import('path');
  
  // Try environment variable first
  if (process.env.CERT_TEMPLATE_PATH) {
    if (existsSync(process.env.CERT_TEMPLATE_PATH)) {
      return await readFile(process.env.CERT_TEMPLATE_PATH);
    }
  }

  // Try multiple path resolution methods for Vercel compatibility
  const possiblePaths = [
    pathModule.default.join(process.cwd(), 'public', 'Template.pdf'),
    pathModule.default.join(process.cwd(), 'Template.pdf'),
    pathModule.default.resolve(process.cwd(), 'public', 'Template.pdf'),
    pathModule.default.resolve(process.cwd(), 'Template.pdf'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return await readFile(path);
    }
  }

  // Fallback: fetch from GitHub raw URL if local file not found
  const githubUrl = process.env.CERT_TEMPLATE_URL || 
    'https://raw.githubusercontent.com/surajweb2603/ai_course/main/public/Template.pdf';
  
  try {
    const response = await fetch(githubUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template from ${githubUrl}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    throw new Error(
      `Failed to load certificate template. Tried paths: ${possiblePaths.join(', ')} and URL: ${githubUrl}. Error: ${error.message}`
    );
  }
}

/** Build verification URL */
export function generateVerifyUrl(code: string): string {
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  return `${base}/certificate/verify/${code}`;
}

/** Format issue date */
export function formatIssuedDate(date: Date): string {
  const locale = process.env.CERT_DATE_LOCALE || 'en-IN';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date);
}

/** Render the certificate */
export async function renderCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const { name, courseTitle, issuedAt, verifyUrl, coords, fontPath } = data;
  const templateBuffer = await loadTemplate();
  const pdfDoc = await PDFDocument.load(new Uint8Array(templateBuffer));
  const page = pdfDoc.getPages()[0];

  // Fonts
  let regularFont, boldFont;
  if (fontPath) {
    try {
      const fontBytes = await readFile(fontPath);
      regularFont = await pdfDoc.embedFont(new Uint8Array(fontBytes));
      boldFont = regularFont;
    } catch {
      regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }
  } else {
    regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  const color = rgb(0, 0, 0);
  const formattedDate = formatIssuedDate(issuedAt);

  // Dynamic font scaling
  const nameFont = name.length > 25 ? 22 : 26;
  const courseFont = courseTitle.length > 45 ? 15 : 17;

  // Draw text fields in visual order
  page.drawText(formattedDate, {
    x: coords.dateX,
    y: coords.dateY,
    size: 12,
    font: regularFont,
    color,
  });

  page.drawText(name, {
    x: coords.nameX,
    y: coords.nameY,
    size: nameFont,
    font: boldFont,
    color,
  });

  page.drawText('has successfully completed', {
    x: coords.completedX,
    y: coords.completedY,
    size: 12,
    font: regularFont,
    color,
  });

  page.drawText(courseTitle, {
    x: coords.courseX,
    y: coords.courseY,
    size: courseFont,
    font: boldFont,
    color,
    maxWidth: 380,
  });

  page.drawText(
    'An online non-credit course authorized by AiCourse and offered through Artificial Intelligence AI.',
    {
      x: coords.subtitleX,
      y: coords.subtitleY,
      size: 10,
      font: regularFont,
      color,
      maxWidth: 380,
    }
  );

  page.drawText(`Verify at: ${verifyUrl}`, {
    x: coords.verifyX,
    y: coords.verifyY,
    size: 10,
    font: regularFont,
    color,
  });

  // QR Code
  try {
    const qrData = await QRCode.toDataURL(verifyUrl, { margin: 0, scale: 6 });
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(new Uint8Array(qrBuffer));
    page.drawImage(qrImage, {
      x: coords.qrX,
      y: coords.qrY,
      width: parseInt(process.env.CERT_QR_SIZE || '90'),
      height: parseInt(process.env.CERT_QR_SIZE || '90'),
    });
    // QR code added to certificate
  } catch (err) {
    // Ignore QR code errors
  }

  return await pdfDoc.save();
}

/** Build final certificate */
export async function buildCertificatePDF({
  user,
  course,
  cert,
}: {
  user: any;
  course: any;
  cert: any;
}): Promise<Uint8Array> {
  const coords: CertificateCoords = {
    dateX: parseInt(process.env.CERT_FIELD_DATE_X || '150'),
    dateY: parseInt(process.env.CERT_FIELD_DATE_Y || '400'),
    nameX: parseInt(process.env.CERT_FIELD_NAME_X || '150'),
    nameY: parseInt(process.env.CERT_FIELD_NAME_Y || '350'),
    completedX: parseInt(process.env.CERT_FIELD_COMPLETED_X || '150'),
    completedY: parseInt(process.env.CERT_FIELD_COMPLETED_Y || '320'),
    courseX: parseInt(process.env.CERT_FIELD_COURSE_X || '150'),
    courseY: parseInt(process.env.CERT_FIELD_COURSE_Y || '290'),
    subtitleX: parseInt(process.env.CERT_FIELD_SUBTITLE_X || '150'),
    subtitleY: parseInt(process.env.CERT_FIELD_SUBTITLE_Y || '240'),
    verifyX: parseInt(process.env.CERT_FIELD_VERIFY_X || '480'),
    verifyY: parseInt(process.env.CERT_FIELD_VERIFY_Y || '120'),
    qrX: parseInt(process.env.CERT_QR_X || '180'),
    qrY: parseInt(process.env.CERT_QR_Y || '100'),
  };

  const verifyUrl = generateVerifyUrl(cert.code);
  return await renderCertificatePDF({
    name: cert.nameSnapshot || user.name,
    courseTitle: cert.courseTitleSnapshot || course.title,
    issuedAt: cert.issuedAt || new Date(),
    verifyUrl,
    coords,
    fontPath: process.env.CERT_FONT_PATH,
  });
}
