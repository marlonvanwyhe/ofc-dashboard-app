import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Invoice, Player } from '../types';

export const generateInvoicePDF = (invoice: Invoice, player: Player) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header
  doc.setFontSize(24);
  doc.text('INVOICE', pageWidth / 2, margin, { align: 'center' });

  // Company details
  doc.setFontSize(10);
  doc.text('Origin FC', margin, margin + 20);
  doc.text('Reg: 2023/224059/07', margin, margin + 25);
  doc.text('Email: info@originfc.co.za', margin, margin + 30);

  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, margin, margin + 45);
  doc.text(`Date: ${format(new Date(invoice.createdAt), 'PP')}`, margin, margin + 52);
  doc.text(`Due Date: ${format(new Date(invoice.dueDate), 'PP')}`, margin, margin + 59);

  // Player details
  doc.text('Bill To:', margin, margin + 70);
  doc.setFontSize(11);
  doc.text(player.name, margin, margin + 77);
  if (player.email) doc.text(player.email, margin, margin + 84);
  if (player.phone) doc.text(player.phone, margin, margin + 91);

  // Invoice items
  let y = margin + 110;
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - (2 * margin), 10, 'F');
  doc.setFontSize(10);
  doc.text('Description', margin + 5, y + 7);
  doc.text('Quantity', pageWidth - margin - 65, y + 7);
  doc.text('Amount', pageWidth - margin - 35, y + 7);

  // Items
  y += 15;
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach(item => {
      doc.text(item.description, margin + 5, y);
      doc.text(item.quantity.toString(), pageWidth - margin - 65, y);
      doc.text(`R${item.amount.toFixed(2)}`, pageWidth - margin - 35, y);
      y += 10;
    });
  } else {
    // If no items, show total as single line
    doc.text('Training and Development', margin + 5, y);
    doc.text('1', pageWidth - margin - 65, y);
    doc.text(`R${invoice.amount.toFixed(2)}`, pageWidth - margin - 35, y);
  }

  // Total
  y += 20;
  doc.line(margin, y - 5, pageWidth - margin, y - 5);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', pageWidth - margin - 65, y + 5);
  doc.text(`R${invoice.amount.toFixed(2)}`, pageWidth - margin - 35, y + 5);

  // Status
  doc.setFontSize(14);
  if (invoice.status === 'paid') {
    doc.setTextColor(0, 128, 0); // Green for paid
  } else {
    doc.setTextColor(255, 0, 0); // Red for outstanding
  }
  doc.text(
    invoice.status.toUpperCase(),
    pageWidth - margin,
    margin + 20,
    { align: 'right' }
  );

  // Footer
  doc.setTextColor(128, 128, 128); // Gray for footer
  doc.setFontSize(10);
  doc.text(
    'Thank you for your business',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: 'center' }
  );

  return doc;
};