import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { InvoiceLineItem } from '../../types';

interface InvoiceLineItemsProps {
  items: InvoiceLineItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof InvoiceLineItem, value: string | number) => void;
  calculateTotal: () => number;
}

export default function InvoiceLineItems({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  calculateTotal
}: InvoiceLineItemsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Line Items</h4>
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 text-sm text-primary hover:text-secondary"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
          <div className="flex-1">
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
              placeholder="Description"
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
              placeholder="Qty"
              className="w-full p-2 border rounded-lg"
              min="1"
              required
            />
          </div>
          <div className="w-32">
            <input
              type="number"
              value={item.amount}
              onChange={(e) => onUpdateItem(index, 'amount', parseFloat(e.target.value) || 0)}
              placeholder="Amount"
              className="w-full p-2 border rounded-lg"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="w-32 p-2 text-right font-medium">
            R{(item.quantity * item.amount).toFixed(2)}
          </div>
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveItem(index)}
              className="text-red-500 hover:text-red-700 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      <div className="flex justify-end pt-4 border-t">
        <div className="text-right">
          <span className="text-gray-600">Total:</span>
          <p className="text-xl font-bold">R{calculateTotal().toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}