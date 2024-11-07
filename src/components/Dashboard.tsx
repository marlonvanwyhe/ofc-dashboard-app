import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Calendar, TrendingUp, UserCog } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import FinancialForecast from './stats/FinancialForecast';
import { Invoice, Player } from '../types';

interface DashboardStats {
  totalPlayers: number;
  totalCoaches: number;
  totalPaidInvoices: number;
  totalOutstandingInvoices: number;
  attendanceRate: number;
  averageRating: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalCoaches: 0,
    totalPaidInvoices: 0,
    totalOutstandingInvoices: 0,
    attendanceRate: 0,
    averageRating: 0
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch players
        const playersSnapshot = await getDocs(collection(db, 'players'));
        const totalPlayers = playersSnapshot.docs.length;

        // Fetch coaches
        const coachesSnapshot = await getDocs(collection(db, 'coaches'));
        const totalCoaches = coachesSnapshot.docs.length;

        // Fetch invoices
        const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        setInvoices(invoicesData);
        
        // Calculate invoice totals
        const invoiceTotals = invoicesData.reduce((acc, invoice) => {
          if (invoice.status === 'paid') {
            acc.paid += invoice.amount;
          } else {
            acc.outstanding += invoice.amount;
          }
          return acc;
        }, { paid: 0, outstanding: 0 });

        // Fetch attendance records
        const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
        const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
          ...doc.data(),
          present: doc.data().present || false,
          rating: doc.data().rating || 0
        }));

        // Calculate attendance stats
        const totalSessions = attendanceRecords.length;
        const presentSessions = attendanceRecords.filter(record => record.present).length;
        const totalRatings = attendanceRecords.reduce((sum, record) => sum + (record.rating || 0), 0);

        const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;
        const averageRating = totalSessions > 0 ? totalRatings / totalSessions : 0;

        setStats({
          totalPlayers,
          totalCoaches,
          totalPaidInvoices: invoiceTotals.paid,
          totalOutstandingInvoices: invoiceTotals.outstanding,
          attendanceRate,
          averageRating
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
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
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-xl">
              <UserCog className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Coaches</p>
              <p className="text-2xl font-bold dark:text-white">{stats.totalCoaches}</p>
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
              <p className="text-2xl font-bold dark:text-white">R {stats.totalPaidInvoices.toFixed(2)}</p>
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
              <p className="text-2xl font-bold dark:text-white">R {stats.totalOutstandingInvoices.toFixed(2)}</p>
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