import React, { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import InvoiceForm from './invoice/InvoiceForm';
import InvoiceList from './invoice/InvoiceList';
import InvoiceStatement from './invoice/InvoiceStatement';
import FinancialForecast from './stats/FinancialForecast';
import { Player, Invoice, InvoiceLineItem } from '../types';
import { addInvoice } from '../lib/firestore';

type FilterStatus = 'all' | 'outstanding' | 'paid';

export default function InvoiceManagement() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [formData, setFormData] = useState({
    playerId: '',
    dueDate: '',
    description: '',
    status: 'outstanding' as 'paid' | 'outstanding',
    lineItems: [{ description: '', quantity: 1, amount: 0 }] as InvoiceLineItem[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        let invoicesQuery;
        if (user?.role === 'player' && user.profileId) {
          invoicesQuery = query(
            collection(db, 'invoices'),
            where('playerId', '==', user.profileId),
            orderBy('createdAt', 'desc')
          );
        } else {
          invoicesQuery = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
        }

        const [invoicesSnapshot, playersSnapshot, teamsSnapshot] = await Promise.all([
          getDocs(invoicesQuery),
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'teams'))
        ]);

        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        
        const playersData = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        const teamsData = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));

        setInvoices(invoicesData);
        setPlayers(playersData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };

    fetchData();
  }, [user]);

  const filteredInvoices = invoices.filter(invoice => {
    const player = players.find(p => p.id === invoice.playerId);
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesSearch = !searchQuery || 
      (player?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesTeam = !selectedTeam || player?.teamId === selectedTeam;

    return matchesStatus && matchesSearch && matchesTeam;
  });

  const totalOutstanding = filteredInvoices
    .filter(inv => inv.status === 'outstanding')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const total = formData.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
      
      const invoiceData = {
        playerId: formData.playerId,
        amount: total,
        dueDate: formData.dueDate,
        description: formData.description,
        status: formData.status,
        lineItems: formData.lineItems,
        createdAt: new Date().toISOString()
      };

      if (editingInvoice) {
        await updateDoc(doc(db, 'invoices', editingInvoice.id), {
          ...invoiceData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Invoice updated successfully!');
      } else {
        await addInvoice(invoiceData);
        toast.success('Invoice created successfully!');
      }

      setFormData({
        playerId: '',
        dueDate: '',
        description: '',
        status: 'outstanding',
        lineItems: [{ description: '', quantity: 1, amount: 0 }]
      });
      setEditingInvoice(null);
      setShowModal(false);

      // Refresh invoices list
      const invoicesSnapshot = await getDocs(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')));
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (invoice: Invoice) => {
    try {
      const newStatus = invoice.status === 'paid' ? 'outstanding' : 'paid';
      await updateDoc(doc(db, 'invoices', invoice.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Invoice marked as ${newStatus}`);
      const updatedInvoices = invoices.map(inv =>
        inv.id === invoice.id ? { ...inv, status: newStatus } : inv
      );
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteDoc(doc(db, 'invoices', invoiceToDelete.id));
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
      toast.success('Invoice deleted successfully!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSearchInput('');
    setSelectedTeam('');
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Total Invoices</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {filteredInvoices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Outstanding</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                R{totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold dark:text-white">Paid</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                R{totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">
          {user?.role === 'player' ? 'My Invoices' : 'Invoice Management'}
        </h2>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowStatementModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FileText className="w-5 h-5" />
                Generate Statement
              </button>
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setFormData({
                    playerId: '',
                    dueDate: '',
                    description: '',
                    status: 'outstanding',
                    lineItems: [{ description: '', quantity: 1, amount: 0 }]
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Create Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {user?.role !== 'player' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by player or invoice number..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="outstanding">Outstanding</option>
              <option value="paid">Paid</option>
            </select>

            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <InvoiceList
        invoices={filteredInvoices}
        players={players}
        onStatusToggle={handleStatusToggle}
        onEdit={(invoice) => {
          setEditingInvoice(invoice);
          setFormData({
            playerId: invoice.playerId,
            dueDate: invoice.dueDate,
            description: invoice.description,
            status: invoice.status,
            lineItems: invoice.lineItems || [{ description: '', quantity: 1, amount: 0 }]
          });
          setShowModal(true);
        }}
        onDelete={(invoice) => {
          setInvoiceToDelete(invoice);
          setShowDeleteModal(true);
        }}
      />

      {showModal && (
        <InvoiceForm
          players={players}
          formData={formData}
          onSubmit={handleSubmit}
          onChange={setFormData}
          onClose={() => {
            setShowModal(false);
            setEditingInvoice(null);
          }}
          loading={loading}
          isEditing={!!editingInvoice}
        />
      )}

      {showDeleteModal && invoiceToDelete && (
        <DeleteConfirmationModal
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice ${invoiceToDelete.invoiceNumber}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setInvoiceToDelete(null);
          }}
        />
      )}

      {showStatementModal && (
        <InvoiceStatement
          invoices={invoices}
          players={players}
          onClose={() => setShowStatementModal(false)}
        />
      )}
    </div>
  );
}