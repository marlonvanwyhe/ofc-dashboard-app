import React from 'react';
import { X } from 'lucide-react';

interface InvoiceItemProps {
  description: string;
  quantity: number;
  amount: number;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onAmountChange: (value: number) => void;
  onRemove: () => void;
  showRemove: boolean;
}

export default function InvoiceItem({
  description,
  quantity,
  amount,
  onDescriptionChange,
  onQuantityChange,
  onAmountChange,
  onRemove,
  showRemove
}: InvoiceItemProps) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-1">
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Item description"
          className="w-full p-2 border rounded-lg"
          required
        />
      </div>
      <div className="w-24">
        <input
          type="number"
          value={quantity || ''}
          onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 0))}
          placeholder="Qty"
          className="w-full p-2 border rounded-lg"
          min="1"
          required
        />
      </div>
      <div className="w-32">
        <input
          type="number"
          value={amount || ''}
          onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
          placeholder="Amount"
          className="w-full p-2 border rounded-lg"
          min="0"
          step="0.01"
          required
        />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}