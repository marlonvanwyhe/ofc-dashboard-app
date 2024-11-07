import React from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';

interface InvoiceStatsProps {
  outstanding: number;
  paid: number;
}

export default function InvoiceStats({ outstanding, paid }: InvoiceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Outstanding Invoices</h3>
            <p className="text-3xl font-bold text-yellow-600">
              R{outstanding.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Paid Invoices</h3>
            <p className="text-3xl font-bold text-green-600">
              R{paid.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}