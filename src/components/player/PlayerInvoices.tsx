import React from 'react';
import { format } from 'date-fns';
import { Download, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types';

interface PlayerInvoicesProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

export default function PlayerInvoices({ invoices, loading, error }: PlayerInvoicesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = {
    outstanding: invoices.filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-yellow-600 text-2xl font-bold">
            R{stats.outstanding.toFixed(2)}
          </div>
          <div className="text-yellow-800">Outstanding</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-green-600 text-2xl font-bold">
            R{stats.paid.toFixed(2)}
          </div>
          <div className="text-green-800">Paid</div>
        </div>
      </div>

      <h4 className="font-semibold mb-4">Recent Invoices</h4>
      {invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.slice(0, 5).map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">Invoice #{invoice.invoiceNumber}</div>
                <div className="text-sm text-gray-500">
                  Due: {format(new Date(invoice.dueDate), 'PP')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">R{invoice.amount.toFixed(2)}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
                <button className="text-gray-500 hover:text-gray-700">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          No invoices found
        </div>
      )}
    </div>
  );
}