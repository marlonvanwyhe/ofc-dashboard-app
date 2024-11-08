import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Invoice, Player } from '../../types';
import toast from 'react-hot-toast';

interface InvoiceStatementProps {
  invoices: Invoice[];
  players: Player[];
  onClose: () => void;
}

export default function InvoiceStatement({ invoices, players, onClose }: InvoiceStatementProps) {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const generateStatement = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;

      // Header
      doc.setFontSize(24);
      doc.text('INVOICE STATEMENT', pageWidth / 2, margin, { align: 'center' });

      // Company details
      doc.setFontSize(10);
      doc.text('Origin FC', margin, margin + 20);
      doc.text('Reg: 2023/224059/07', margin, margin + 25);
      doc.text('Email: info@originfc.co.za', margin, margin + 30);

      // Statement period
      doc.setFontSize(12);
      doc.text(`Statement Period: ${format(new Date(startDate), 'PP')} - ${format(new Date(endDate), 'PP')}`, margin, margin + 45);

      // Filter invoices by date range
      const filteredInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });

      // Sort invoices by date
      const sortedInvoices = filteredInvoices.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Table headers
      let y = margin + 60;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - (2 * margin), 10, 'F');
      doc.setFontSize(10);
      doc.text('Date', margin + 5, y + 7);
      doc.text('Invoice #', margin + 35, y + 7);
      doc.text('Player', margin + 70, y + 7);
      doc.text('Amount', pageWidth - margin - 40, y + 7);
      doc.text('Status', pageWidth - margin - 20, y + 7);

      // Table content
      y += 15;
      let totalAmount = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;

      sortedInvoices.forEach(invoice => {
        const player = players.find(p => p.id === invoice.playerId);
        
        doc.text(format(new Date(invoice.createdAt), 'dd/MM/yyyy'), margin + 5, y);
        doc.text(invoice.invoiceNumber, margin + 35, y);
        doc.text(player?.name || 'Unknown', margin + 70, y);
        doc.text(`R${invoice.amount.toFixed(2)}`, pageWidth - margin - 40, y);
        doc.text(invoice.status, pageWidth - margin - 20, y);

        totalAmount += invoice.amount;
        if (invoice.status === 'paid') {
          totalPaid += invoice.amount;
        } else {
          totalOutstanding += invoice.amount;
        }

        y += 10;

        // Add new page if needed
        if (y > doc.internal.pageSize.getHeight() - 50) {
          doc.addPage();
          y = margin;
        }
      });

      // Summary
      y += 10;
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      doc.text('Summary:', margin, y);
      y += 7;
      doc.text(`Total Amount: R${totalAmount.toFixed(2)}`, margin, y);
      y += 7;
      doc.text(`Total Paid: R${totalPaid.toFixed(2)}`, margin, y);
      y += 7;
      doc.text(`Total Outstanding: R${totalOutstanding.toFixed(2)}`, margin, y);

      // Save PDF
      doc.save('invoice-statement.pdf');
      toast.success('Statement generated successfully');
      onClose();
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold dark:text-white">Generate Statement</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          <button
            onClick={generateStatement}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Statement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}