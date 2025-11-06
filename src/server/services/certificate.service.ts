import { Readable } from 'stream';
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
import { nanoid } from 'nanoid';
import { Certificate, ICertificate } from '../../models/Certificate';
import User, { IUser } from '../../models/User';
import { Course, ICourse } from '../../models/Course';
import { Progress } from '../../models/Progress';
import { formatDateForCert } from '../../utils/format';

interface CertificateEligibilityResult {
  user: IUser;
  course: ICourse;
}

interface PDFGenerationOptions {
  cert: ICertificate;
  user: IUser;
  course: ICourse;
  locale?: string;
  theme?: {
    primaryHex: string;
    accentHex: string;
  };
}

/**
 * Check if user is eligible for certificate (100% completion)
 */
export async function ensureEligible(userId: string, courseId: string): Promise<CertificateEligibilityResult> {
  // Load course and verify ownership
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  if (course.userId.toString() !== userId) {
    throw new Error('Unauthorized: You can only download certificates for your own courses');
  }

  // Load user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check progress - compute server-side
  const progress = await Progress.findOne({ userId, courseId });
  if (!progress) {
    throw new Error('No progress found for this course');
  }

  if (progress.percent !== 100) {
    throw new Error('Certificate not available: Course must be 100% complete');
  }

  return { user, course };
}

/**
 * Generate unique certificate code
 */
export function generateCertCode(): string {
  return nanoid(12);
}

/**
 * Create or retrieve existing certificate (idempotent)
 */
export async function upsertCertificate(user: IUser, course: ICourse): Promise<ICertificate> {
  // Check if certificate already exists
  let certificate = await Certificate.findOne({ 
    userId: user._id, 
    courseId: course._id 
  });

  if (!certificate) {
    // Create new certificate
    const code = generateCertCode();
    certificate = new Certificate({
      userId: user._id,
      courseId: course._id,
      code,
      nameSnapshot: user.name || user.email,
      courseTitleSnapshot: course.title
    });
    await certificate.save();
  }

  return certificate;
}

/**
 * Create PDF certificate stream
 */
export async function createCertificatePDFStream(options: PDFGenerationOptions): Promise<Readable> {
  const { cert, user, course, locale = 'en-IN', theme } = options;
  
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: {
      top: 48,
      bottom: 48,
      left: 48,
      right: 48
    }
  });

  const stream = new Readable();
  stream._read = () => {};

  doc.on('data', (chunk: Buffer) => stream.push(chunk));
  doc.on('end', () => stream.push(null));
  doc.on('error', (err: Error) => stream.emit('error', err));

  // Colors
  const primaryColor = theme?.primaryHex || '#6d28d9';
  const accentColor = theme?.accentHex || '#db2777';

  // Header band
  doc.rect(0, 0, doc.page.width, 80)
     .fill(primaryColor);

  // Accent line
  doc.rect(0, 80, doc.page.width, 2)
     .fill(accentColor);

  // Title
  doc.fontSize(30)
     .fillColor('white')
     .text('Certificate of Completion', 0, 20, {
       align: 'center',
       width: doc.page.width
     });

  // Main content area
  const contentY = 120;
  const centerX = doc.page.width / 2;

  // Recipient name
  doc.fontSize(40)
     .fillColor('black')
     .text(cert.nameSnapshot, 0, contentY, {
       align: 'center',
       width: doc.page.width
     });

  // Course title
  doc.fontSize(20)
     .fillColor('#374151')
     .text(cert.courseTitleSnapshot, 0, contentY + 60, {
       align: 'center',
       width: doc.page.width
     });

  // Completion text
  const completionDate = formatDateForCert(cert.issuedAt, locale);
  doc.fontSize(14)
     .fillColor('#6b7280')
     .text(`has successfully completed the course on ${completionDate}`, 0, contentY + 100, {
       align: 'center',
       width: doc.page.width
     });

  // Footer
  const footerY = doc.page.height - 80;
  const issuer = process.env.CERT_ISSUER || 'AiCourse Generator';

  // Issuer text (left)
  doc.fontSize(12)
     .fillColor('#6b7280')
     .text(issuer, 48, footerY);

  // Verification code and QR (right)
  const codeText = `Code: ${cert.code}`;
  const codeWidth = doc.widthOfString(codeText);
  const rightX = doc.page.width - 48 - codeWidth;

  doc.fontSize(12)
     .fillColor('#6b7280')
     .text(codeText, rightX, footerY);

  // Generate QR code
  try {
    const verifyUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/certificate/verify/${cert.code}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 110,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to buffer
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    
    // Position QR code
    const qrX = rightX;
    const qrY = footerY + 20;
    
    doc.image(qrBuffer, qrX, qrY, { width: 110 });
  } catch (error) {
    // Continue without QR code
  }

  // Finalize PDF
  doc.end();

  return stream;
}
