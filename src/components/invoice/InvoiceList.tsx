import React from 'react';
import { format } from 'date-fns';
import { Check, AlertCircle, Edit, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  playerId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'outstanding';
  items?: Array<{
    description: string;
    quantity: number;
    amount: number;
  }>;
  createdAt: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  players: Player[];
  onStatusToggle: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices,
  players,
  onStatusToggle,
  onEdit,
  onDelete
}: InvoiceListProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleDownload = (invoice: Invoice) => {
    try {
      const player = players.find(p => p.id === invoice.playerId);
      if (!player) {
        toast.error('Player information not found');
        return;
      }

      const doc = generateInvoicePDF(invoice, player);
      doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate invoice PDF');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Invoice Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.invoiceNumber}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {players.find(p => p.id === invoice.playerId)?.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  R{invoice.amount.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(invoice.dueDate), 'PP')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {isAdmin ? (
                  <button
                    onClick={() => onStatusToggle(invoice)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {invoice.status === 'paid' ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-1" />
                    )}
                    {invoice.status}
                  </button>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {invoice.status === 'paid' ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-1" />
                    )}
                    {invoice.status}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEdit(invoice)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit Invoice"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(invoice)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownload(invoice)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Download Invoice"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}