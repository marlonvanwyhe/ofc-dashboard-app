import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { Player, InvoiceLineItem } from '../../types';
import InvoiceLineItems from './InvoiceLineItems';

interface InvoiceFormData {
  playerId: string;
  dueDate: string;
  description: string;
  status: 'paid' | 'outstanding';
  lineItems: InvoiceLineItem[];
}

interface InvoiceFormProps {
  players: Player[];
  formData: InvoiceFormData;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (data: InvoiceFormData) => void;
  onClose: () => void;
  loading: boolean;
  isEditing: boolean;
}

export default function InvoiceForm({
  players,
  formData,
  onSubmit,
  onChange,
  onClose,
  loading,
  isEditing
}: InvoiceFormProps) {
  const handleAddItem = () => {
    onChange({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        { description: '', quantity: 1, amount: 0 }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    onChange({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index)
    });
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    onChange({ ...formData, lineItems: updatedItems });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player
              </label>
              <select
                value={formData.playerId}
                onChange={(e) =>
                  onChange({ ...formData, playerId: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  onChange({ ...formData, dueDate: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                onChange({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded-lg"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                onChange({
                  ...formData,
                  status: e.target.value as 'paid' | 'outstanding'
                })
              }
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="outstanding">Outstanding</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <InvoiceLineItems
              items={formData.lineItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
              calculateTotal={calculateTotal}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}