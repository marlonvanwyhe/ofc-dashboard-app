import React, { useState, useEffect } from 'react';
import { UserPlus, List, Grid, Mail, Trash2, Shield, Pencil } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import CreateUserForm from './auth/CreateUserForm';
import EditAdminForm from './admin/EditAdminForm';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  role: 'admin';
  createdAt: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  });
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  const fetchAdmins = async () => {
    try {
      const adminsQuery = query(collection(db, 'admins'), orderBy('name'));
      const snapshot = await getDocs(adminsQuery);
      const adminsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Admin[];
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateUser = async (userId: string) => {
    setShowCreateUserForm(false);
    await fetchAdmins();
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;
    try {
      await deleteDoc(doc(db, 'admins', adminToDelete.id));
      await fetchAdmins();
      toast.success('Admin deleted successfully');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    } finally {
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleUpdateAdmin = async (data: Partial<Admin>) => {
    if (!selectedAdmin) return;
    
    try {
      await updateDoc(doc(db, 'admins', selectedAdmin.id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      await fetchAdmins();
      setShowEditModal(false);
      setSelectedAdmin(null);
      toast.success('Admin updated successfully');
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin');
    }
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {admins.map((admin) => (
        <div key={admin.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg dark:text-white">{admin.name}</h3>
                {admin.position && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{admin.position}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(admin)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setAdminToDelete(admin);
                  setShowDeleteModal(true);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span>{admin.email}</span>
            </div>
            {admin.phone && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Phone: {admin.phone}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Admin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {admins.map((admin) => (
            <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2">
                      <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {admin.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</div>
                {admin.phone && (
                  <div className="text-sm text-gray-500">{admin.phone}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {admin.position || 'Not specified'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setAdminToDelete(admin);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Admin Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateUserForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
          >
            <UserPlus className="w-5 h-5" />
            Add Admin
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {showCreateUserForm && (
        <CreateUserForm
          role="admin"
          onSuccess={handleCreateUser}
          onClose={() => setShowCreateUserForm(false)}
          formData={formData}
        />
      )}

      {showDeleteModal && adminToDelete && (
        <DeleteConfirmationModal
          title="Delete Admin"
          message={`Are you sure you want to delete ${adminToDelete.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setAdminToDelete(null);
          }}
        />
      )}

      {showEditModal && selectedAdmin && (
        <EditAdminForm
          admin={selectedAdmin}
          onSubmit={handleUpdateAdmin}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}
    </div>
  );
}