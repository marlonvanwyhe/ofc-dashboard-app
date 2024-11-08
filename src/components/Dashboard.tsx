import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, UserCog } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import FinancialForecast from './stats/FinancialForecast';
import { Invoice, Player } from '../types';
import { useStats } from '../hooks/useStats';

export default function Dashboard() {
  const { players = [] } = useAppState();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading } = useStats(players);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        setInvoices(invoicesData);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading || statsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPaidInvoices = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOutstandingInvoices = invoices
    .filter(inv => inv.status === 'outstanding')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-xl">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalPlayers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-xl">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid Invoices</p>
              <p className="text-2xl font-bold dark:text-white">R {totalPaidInvoices.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-xl">
              <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Invoices</p>
              <p className="text-2xl font-bold dark:text-white">R {totalOutstandingInvoices.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-xl">
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-2xl font-bold dark:text-white">{stats.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/50 p-4 rounded-xl">
              <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-bold dark:text-white">{stats.averageRating.toFixed(1)}/10</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <FinancialForecast invoices={invoices} />
      </div>
    </div>
  );
}