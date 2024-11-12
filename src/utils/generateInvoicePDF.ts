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
  doc.text('Qty', pageWidth - margin - 80, y + 7, { align: 'center' });
  doc.text('Rate', pageWidth - margin - 45, y + 7, { align: 'center' });
  doc.text('Amount', pageWidth - margin - 5, y + 7, { align: 'right' });

  // Items
  y += 15;
  doc.setFont(undefined, 'normal');
  let items = invoice.items && invoice.items.length > 0 
    ? invoice.items 
    : [{ description: invoice.description || 'Training and Development', quantity: 1, amount: invoice.amount }];

  items.forEach(item => {
    // Description - allow wrapping for long descriptions
    const description = item.description || 'Training and Development';
    const descriptionWidth = pageWidth - (2 * margin) - 120; // Leave space for other columns
    const lines = doc.splitTextToSize(description, descriptionWidth);
    
    // Draw each line of the description
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, y + (index * 5));
    });

    // Calculate the maximum height needed for this row
    const rowHeight = Math.max(lines.length * 5, 8);

    // Draw other columns aligned to the bottom of the row
    doc.text(item.quantity.toString(), pageWidth - margin - 80, y + rowHeight - 3, { align: 'center' });
    doc.text(`R${item.amount.toFixed(2)}`, pageWidth - margin - 45, y + rowHeight - 3, { align: 'center' });
    const lineTotal = item.quantity * item.amount;
    doc.text(`R${lineTotal.toFixed(2)}`, pageWidth - margin - 5, y + rowHeight - 3, { align: 'right' });

    // Move to next row, adding extra space for wrapped text
    y += rowHeight + 5;
  });

  // Subtotal and Total
  y += 10;
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
  
  // Draw line above totals
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 90, y - 5, pageWidth - margin, y - 5);

  // Subtotal
  doc.text('Subtotal:', pageWidth - margin - 90, y);
  doc.text(`R${subtotal.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

  // Total
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.text('Total:', pageWidth - margin - 90, y);
  doc.text(`R${invoice.amount.toFixed(2)}`, pageWidth - margin - 5, y, { align: 'right' });

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

  // Banking Details
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Bank Details:', margin, pageHeight - 50);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text([
    'Company: Origin FC',
    'Bank: FNB',
    'Account: 63078075223',
    'Branch Code: 250655',
    `Reference: ${player.name}${player.playerNumber ? ` (${player.playerNumber})` : ''}`
  ], margin, pageHeight - 43);

  // Footer
  doc.setTextColor(128, 128, 128); // Gray for footer
  doc.setFontSize(10);
  doc.text(
    'Thank you for your business',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );

  return doc;
};