import React from 'react';
import { TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths } from 'date-fns';

interface FinancialForecastProps {
  invoices: Invoice[];
}

export default function FinancialForecast({ invoices }: FinancialForecastProps) {
  const calculateMonthlyStats = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const nextMonth = startOfMonth(addMonths(now, 1));
    const thirdMonth = startOfMonth(addMonths(now, 2));

    // Get current month's stats
    const thisMonthInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return isSameMonth(dueDate, currentMonth);
    });

    const thisMonthPaid = thisMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const thisMonthOutstanding = thisMonthInvoices
      .filter(inv => inv.status === 'outstanding')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Get next month's due invoices
    const nextMonthInvoices = invoices.filter(inv => {
      const dueDate = new Date(inv.dueDate);
      return isSameMonth(dueDate, nextMonth);
    });

    const nextMonthTotal = nextMonthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate collection rate (percentage of invoices that get paid)
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const collectionRate = totalInvoices > 0 ? paidInvoices / totalInvoices : 0;

    // Calculate average monthly revenue (from paid invoices)
    const monthlyRevenues = new Map<string, number>();
    invoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const date = new Date(inv.dueDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyRevenues.set(key, (monthlyRevenues.get(key) || 0) + inv.amount);
      });

    const averageMonthlyRevenue = monthlyRevenues.size > 0
      ? Array.from(monthlyRevenues.values()).reduce((sum, val) => sum + val, 0) / monthlyRevenues.size
      : 0;

    // Project next month's expected revenue
    const expectedNextMonthRevenue = nextMonthTotal * collectionRate;

    // Calculate projected annual revenue
    const projectedAnnualRevenue = averageMonthlyRevenue * 12;

    return {
      currentMonth: {
        name: format(currentMonth, 'MMMM'),
        paid: thisMonthPaid,
        outstanding: thisMonthOutstanding,
        total: thisMonthPaid + thisMonthOutstanding
      },
      nextMonth: {
        name: format(nextMonth, 'MMMM'),
        total: nextMonthTotal,
        expected: expectedNextMonthRevenue
      },
      thirdMonth: {
        name: format(thirdMonth, 'MMMM'),
        expected: averageMonthlyRevenue
      },
      annual: {
        projected: projectedAnnualRevenue
      },
      collectionRate: collectionRate * 100
    };
  };

  const forecast = calculateMonthlyStats();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
          <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Financial Forecast</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Collection Rate: {forecast.collectionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Month */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium dark:text-white">{forecast.currentMonth.name}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Paid</span>
              <span className="text-green-600 dark:text-green-400">
                R{forecast.currentMonth.paid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Outstanding</span>
              <span className="text-yellow-600 dark:text-yellow-400">
                R{forecast.currentMonth.outstanding.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t dark:border-gray-600">
              <span className="dark:text-white">Total</span>
              <span className="dark:text-white">R{forecast.currentMonth.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Next Month */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium dark:text-white">{forecast.nextMonth.name}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Due</span>
              <span className="dark:text-white">R{forecast.nextMonth.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Expected</span>
              <span className="text-blue-600 dark:text-blue-400">
                R{forecast.nextMonth.expected.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t dark:border-gray-600">
              <AlertCircle className="w-3 h-3" />
              <span>Based on collection rate</span>
            </div>
          </div>
        </div>

        {/* Third Month */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="font-medium dark:text-white">{forecast.thirdMonth.name}</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Projected</span>
              <span className="text-purple-600 dark:text-purple-400">
                R{forecast.thirdMonth.expected.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t dark:border-gray-600">
              <AlertCircle className="w-3 h-3" />
              <span>Based on historical average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Projection */}
      <div className="mt-4 pt-4 border-t dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium dark:text-white">Projected Annual Revenue</span>
          </div>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            R{forecast.annual.projected.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Based on average monthly revenue and collection rate
        </p>
      </div>
    </div>
  );
}