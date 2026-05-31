/**
 * PDF Receipt Generator for ZVenue
 * Generates booking receipts matching the company design
 */
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../../../assets/images/icon.png');

const COMPANY = {
  name: 'ZVenue',
  address: '7621 Mali Galli, S-2 M B Heights, Miraj, Maharashtra, 416410',
  email: 'support.zvenue@gmail.com',
  phone: '+917249111100',
};

/**
 * Generate a PDF receipt buffer for a venue booking
 */
export function generateVenueReceipt(booking, venue, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header gradient bar
      doc.rect(0, 0, 595, 60).fill('#7a3317');
      doc.rect(0, 0, 595, 20).fill('#a85c3b');

      // Logo
      const logoPath = LOGO_PATH;
      try {
        doc.image(logoPath, 50, 70, { width: 70, height: 70 });
      } catch (e) {
        // Fallback: draw a placeholder box if logo not found
        doc.rect(50, 70, 70, 70).fill('#fce4ec').stroke('#7a3317');
      }

      // Title (shifted right to accommodate logo)
      doc.fontSize(28).fillColor('#7a3317').font('Helvetica-Bold')
        .text('ZVenue Payment Receipt', 130, 90);

      // Received by / from + Date box
      const y1 = 150;
      doc.fontSize(11).fillColor('#333').font('Helvetica-Bold')
        .text('Received by', 50, y1)
        .font('Helvetica').text(user?.full_name || 'Customer', 170, y1);

      doc.font('Helvetica-Bold').text('Received from', 50, y1 + 25)
        .font('Helvetica').text('ZVenue', 170, y1 + 25);

      // Date & Receipt box
      doc.rect(380, y1 - 10, 170, 70).fill('#fce4ec').stroke('#e0e0e0');
      doc.fontSize(10).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Date', 395, y1)
        .font('Helvetica').fillColor('#333')
        .text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' }), 395, y1 + 14);
      doc.fontSize(10).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Receipt Number', 395, y1 + 32)
        .font('Helvetica').fillColor('#333')
        .text(booking.booking_id_display || booking.id?.slice(0, 8) || 'N/A', 395, y1 + 46);

      // Item List section
      const y2 = 260;
      doc.rect(50, y2, 495, 30).fill('#fce4ec');
      doc.fontSize(14).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Item List', 65, y2 + 8);

      // Booking details
      const y3 = y2 + 50;
      const details = [
        ['Venue', venue?.name || 'N/A'],
        ['City', venue?.city || 'N/A'],
        ['Booking Date', booking.booking_date || 'N/A'],
        ['Time', booking.start_time && booking.end_time ? `${booking.start_time} – ${booking.end_time}` : 'N/A'],
        ['Guests', String(booking.guests || 'N/A')],
        ['Payment Method', booking.payment_method || 'Razorpay'],
        ['Payment ID', booking.payment_id || 'N/A'],
      ];

      details.forEach(([label, value], i) => {
        const rowY = y3 + (i * 22);
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold')
          .text(label + ':', 65, rowY);
        doc.font('Helvetica').fillColor('#333')
          .text(value, 200, rowY);
      });

      // Total amount box
      const yTotal = y3 + (details.length * 22) + 20;
      doc.rect(280, yTotal, 265, 35).fill('#fce4ec');
      doc.fontSize(14).fillColor('#333').font('Helvetica-Bold')
        .text('Total Amount:', 295, yTotal + 10)
        .text(`Rs. ${(booking.total || 0).toLocaleString('en-IN')}`, 430, yTotal + 10);

      // Company footer
      const yFooter = yTotal + 80;
      doc.fontSize(12).fillColor('#7a3317').font('Helvetica-Bold')
        .text(COMPANY.name, 50, yFooter);
      doc.fontSize(9).fillColor('#666').font('Helvetica')
        .text(COMPANY.address, 50, yFooter + 18)
        .text(`Email: ${COMPANY.email}`, 50, yFooter + 32)
        .text(`Phone: ${COMPANY.phone}`, 50, yFooter + 46);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate a PDF receipt buffer for a service booking
 */
export function generateServiceReceipt(booking, listing, user) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header gradient bar
      doc.rect(0, 0, 595, 60).fill('#7a3317');
      doc.rect(0, 0, 595, 20).fill('#a85c3b');

      // Logo
      const logoPath = LOGO_PATH;
      try {
        doc.image(logoPath, 50, 70, { width: 70, height: 70 });
      } catch (e) {
        doc.rect(50, 70, 70, 70).fill('#fce4ec').stroke('#7a3317');
      }

      // Title (shifted right to accommodate logo)
      doc.fontSize(28).fillColor('#7a3317').font('Helvetica-Bold')
        .text('ZVenue Payment Receipt', 130, 90);

      // Received by / from + Date box
      const y1 = 150;
      doc.fontSize(11).fillColor('#333').font('Helvetica-Bold')
        .text('Received by', 50, y1)
        .font('Helvetica').text(user?.full_name || 'Customer', 170, y1);

      doc.font('Helvetica-Bold').text('Received from', 50, y1 + 25)
        .font('Helvetica').text('ZVenue', 170, y1 + 25);

      // Date & Receipt box
      doc.rect(380, y1 - 10, 170, 70).fill('#fce4ec').stroke('#e0e0e0');
      doc.fontSize(10).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Date', 395, y1)
        .font('Helvetica').fillColor('#333')
        .text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' }), 395, y1 + 14);
      doc.fontSize(10).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Receipt Number', 395, y1 + 32)
        .font('Helvetica').fillColor('#333')
        .text(booking.booking_id_display || booking.id?.slice(0, 8) || 'N/A', 395, y1 + 46);

      // Item List section
      const y2 = 260;
      doc.rect(50, y2, 495, 30).fill('#fce4ec');
      doc.fontSize(14).fillColor('#7a3317').font('Helvetica-Bold')
        .text('Item List', 65, y2 + 8);

      // Booking details
      const y3 = y2 + 50;
      const details = [
        ['Service', listing?.name || 'N/A'],
        ['City', listing?.city || 'N/A'],
        ['Booking Date', booking.booking_date || 'N/A'],
        ['Time', booking.start_time && booking.end_time ? `${booking.start_time} – ${booking.end_time}` : 'N/A'],
        ['Quantity', String(booking.quantity || 1)],
        ['Unit Price', `Rs. ${(booking.unit_price || 0).toLocaleString('en-IN')}`],
        ['Discount', booking.discount_applied > 0 ? `Rs. ${booking.discount_applied.toLocaleString('en-IN')}` : 'Rs. 0'],
        ['Payment Method', booking.payment_method || 'Razorpay'],
        ['Payment ID', booking.payment_id || 'N/A'],
      ];

      details.forEach(([label, value], i) => {
        const rowY = y3 + (i * 22);
        doc.fontSize(10).fillColor('#666').font('Helvetica-Bold')
          .text(label + ':', 65, rowY);
        doc.font('Helvetica').fillColor('#333')
          .text(value, 200, rowY);
      });

      // Total amount box
      const yTotal = y3 + (details.length * 22) + 20;
      doc.rect(280, yTotal, 265, 35).fill('#fce4ec');
      doc.fontSize(14).fillColor('#333').font('Helvetica-Bold')
        .text('Total Amount:', 295, yTotal + 10)
        .text(`Rs. ${(booking.total_amount || 0).toLocaleString('en-IN')}`, 430, yTotal + 10);

      // Company footer
      const yFooter = yTotal + 80;
      doc.fontSize(12).fillColor('#7a3317').font('Helvetica-Bold')
        .text(COMPANY.name, 50, yFooter);
      doc.fontSize(9).fillColor('#666').font('Helvetica')
        .text(COMPANY.address, 50, yFooter + 18)
        .text(`Email: ${COMPANY.email}`, 50, yFooter + 32)
        .text(`Phone: ${COMPANY.phone}`, 50, yFooter + 46);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Upload PDF buffer to Cloudinary and return the URL
 * Uses unsigned upload preset with raw/upload endpoint for PDFs
 * Note: The filename in WhatsApp template controls what the recipient sees (.pdf)
 * Cloudinary raw files don't need extension in public_id
 */
export async function uploadReceiptToCloudinary(pdfBuffer, filename) {
  const CLOUD_NAME = 'dxprjeaun';
  const UPLOAD_PRESET = 'zvenue_unsigned';

  // Use base64 data URI
  const base64 = pdfBuffer.toString('base64');
  const dataUri = `data:application/pdf;base64,${base64}`;

  // Use raw/upload without .pdf extension in public_id (keeps URL accessible)
  // WhatsApp filename parameter handles the display name for the recipient
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('public_id', `receipts/${filename}`);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.secure_url) return data.secure_url;

  throw new Error(data.error?.message || 'Cloudinary upload failed');
}
