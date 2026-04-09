/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  MoreHorizontal, 
  PieChart,
  Pencil,
  Trash2,
  X,
  Search,
  Moon,
  Sun,
  Lightbulb,
  AlertTriangle,
  FileText,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Check,
  Calendar
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const generateInsights = (expenses: any[]) => {
  const insights: string[] = [];
  if (!expenses || expenses.length === 0) {
    return ["Add some expenses to see your spending patterns.", "Track your weekly trends here."];
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (total > 0) {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    let topCategory = '';
    let topAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      const amount = amt as number;
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = cat;
      }
    }

    const topPercentage = Math.round((topAmount / total) * 100);
    if (topPercentage >= 30) {
      insights.push(`You spent ${topPercentage}% on ${topCategory}. Try reducing it.`);
    } else {
      insights.push(`Your highest spending is on ${topCategory} (${topPercentage}%).`);
    }
  } else {
    insights.push("Add some expenses to see your spending patterns.");
  }

  const sortedDates = expenses.map(e => new Date(e.date + 'T00:00:00').getTime()).sort((a, b) => b - a);
  const latestDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : new Date();
  
  const oneWeekAgo = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(latestDate.getTime() - 14 * 24 * 60 * 60 * 1000);

  let thisWeekTotal = 0;
  let lastWeekTotal = 0;

  expenses.forEach(exp => {
    const expDate = new Date(exp.date + 'T00:00:00');
    if (expDate > oneWeekAgo && expDate <= latestDate) {
      thisWeekTotal += exp.amount;
    } else if (expDate > twoWeeksAgo && expDate <= oneWeekAgo) {
      lastWeekTotal += exp.amount;
    }
  });

  if (lastWeekTotal > 0) {
    if (thisWeekTotal > lastWeekTotal) {
      insights.push(`Your spending increased this week compared to last week.`);
    } else if (thisWeekTotal < lastWeekTotal) {
      insights.push(`Great job! Your spending decreased this week.`);
    } else {
      insights.push(`Your spending this week is exactly the same as last week.`);
    }
  } else if (thisWeekTotal > 0) {
    insights.push(`You have started spending this week. Keep tracking!`);
  } else {
    insights.push(`No spending recorded in the last 7 days.`);
  }

  return insights.slice(0, 2);
};

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse expenses from local storage");
      }
    }
    return [
      { id: '1', title: 'Whole Foods Market', sub: 'Groceries', date: '2023-10-24', category: 'Food & Dining', amount: 42.50 },
      { id: '2', title: 'Uber Ride', sub: 'Downtown', date: '2023-10-23', category: 'Transportation', amount: 15.00 },
      { id: '3', title: 'Apple Store', sub: 'Accessories', date: '2023-10-21', category: 'Shopping', amount: 120.00 },
      { id: '4', title: 'Electric Bill', sub: 'Monthly', date: '2023-10-20', category: 'Bills & Utilities', amount: 85.00 },
      { id: '5', title: 'Starbucks', sub: 'Coffee', date: '2023-10-19', category: 'Food & Dining', amount: 6.50 },
    ];
  });

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Smart Features State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [budgetLimit, setBudgetLimit] = useState(() => {
    const saved = localStorage.getItem('budgetLimit');
    return saved ? parseFloat(saved) : 2000;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());
  const [budgetAlert, setBudgetAlert] = useState<{show: boolean, type: 'warning' | 'danger', message: string}>({show: false, type: 'warning', message: ''});

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('budgetLimit', budgetLimit.toString());
  }, [budgetLimit]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            exp.sub.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
      const matchesStart = filterStartDate ? exp.date >= filterStartDate : true;
      const matchesEnd = filterEndDate ? exp.date <= filterEndDate : true;
      
      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    });
  }, [expenses, searchQuery, filterCategory, filterStartDate, filterEndDate]);

  const smartInsights = useMemo(() => generateInsights(expenses), [expenses]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ''});

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = (msg: string) => {
    setToast({show: true, message: msg});
    setTimeout(() => setToast({show: false, message: ''}), 3000);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    setIsSubmitting(true);
    setTimeout(() => {
      if (editingId) {
        setExpenses(expenses.map(exp => 
          exp.id === editingId 
            ? { ...exp, category, title: category, date, amount: parseFloat(amount), notes }
            : exp
        ));
        setEditingId(null);
        showNotification('Expense updated successfully');
      } else {
        const newExpense = {
          id: Date.now().toString(),
          title: category,
          sub: 'Added manually',
          date: date,
          category: category,
          amount: parseFloat(amount),
          notes
        };
        setExpenses([newExpense, ...expenses]);
        showNotification('Expense added successfully');
      }
      setAmount('');
      setNotes('');
      setIsSubmitting(false);
    }, 600);
  };

  const handleEdit = (expense: any) => {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
    setNotes(expense.notes || '');
    setEditingId(expense.id);
  };

  const handleDelete = (id: string) => {
    setExpenseToDelete(id);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      setExpenses(expenses.filter(exp => exp.id !== expenseToDelete));
      setExpenseToDelete(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setCategory('Food & Dining');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getCategoryColors = (cat: string) => {
    switch (cat) {
      case 'Food & Dining': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Transportation': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Shopping': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Bills & Utilities': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getCategoryIcon = (cat: string) => {
    const className = "w-3.5 h-3.5 mr-1.5";
    switch (cat) {
      case 'Food & Dining': return <Utensils className={className} />;
      case 'Transportation': return <Car className={className} />;
      case 'Shopping': return <ShoppingBag className={className} />;
      case 'Bills & Utilities': return <Zap className={className} />;
      default: return <PieChart className={className} />;
    }
  };

  const { totalExpenses, todaySpending, monthlySpending, topCategoryThisMonth, weeklySpending, prevWeeklySpending, avgDailySpend, highestSpendingDay } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const categoryTotals: Record<string, number> = {};
    const dailyTotals: Record<string, number> = {};
    
    const totals = filteredExpenses.reduce((acc, curr) => {
      acc.totalExpenses += curr.amount;
      if (curr.date === today) acc.todaySpending += curr.amount;
      if (curr.date.startsWith(currentMonth)) {
        acc.monthlySpending += curr.amount;
        categoryTotals[curr.category] = (categoryTotals[curr.category] || 0) + curr.amount;
      }
      
      if (curr.date > oneWeekAgo && curr.date <= today) {
        acc.weeklySpending += curr.amount;
        dailyTotals[curr.date] = (dailyTotals[curr.date] || 0) + curr.amount;
      } else if (curr.date > twoWeeksAgo && curr.date <= oneWeekAgo) {
        acc.prevWeeklySpending += curr.amount;
      }
      return acc;
    }, { totalExpenses: 0, todaySpending: 0, monthlySpending: 0, weeklySpending: 0, prevWeeklySpending: 0 });

    let topCat = { name: '', amount: 0 };
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > topCat.amount) topCat = { name: cat, amount: amt };
    }
    
    let highestDay = { date: '', amount: 0 };
    for (const [date, amt] of Object.entries(dailyTotals)) {
      if (amt > highestDay.amount) highestDay = { date, amount: amt };
    }
    
    const avgDailySpend = totals.weeklySpending / 7;

    return { ...totals, topCategoryThisMonth: topCat, avgDailySpend, highestSpendingDay: highestDay };
  }, [filteredExpenses]);

  useEffect(() => {
    if (monthlySpending > budgetLimit) {
      setBudgetAlert({
        show: true, 
        type: 'danger', 
        message: `You've exceeded your monthly budget of ${formatCurrency(budgetLimit)}!`
      });
      const timer = setTimeout(() => setBudgetAlert(prev => ({...prev, show: false})), 5000);
      return () => clearTimeout(timer);
    } else if (monthlySpending > budgetLimit * 0.8) {
      setBudgetAlert({
        show: true, 
        type: 'warning', 
        message: `You're approaching your monthly budget of ${formatCurrency(budgetLimit)}.`
      });
      const timer = setTimeout(() => setBudgetAlert(prev => ({...prev, show: false})), 5000);
      return () => clearTimeout(timer);
    }
  }, [monthlySpending, budgetLimit]);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const pieChartData = useMemo(() => {
    const categoryTotals = filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const cats = Object.keys(categoryTotals);
    const backgroundColors = cats.map(cat => {
      switch (cat) {
        case 'Food & Dining': return ['#f97316', '#fdba74']; // orange
        case 'Transportation': return ['#3b82f6', '#93c5fd']; // blue
        case 'Shopping': return ['#a855f7', '#d8b4fe']; // purple
        case 'Bills & Utilities': return ['#10b981', '#6ee7b7']; // emerald
        default: return ['#6b7280', '#d1d5db']; // gray
      }
    });

    return {
      labels: cats,
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            
            if (context.dataIndex !== undefined) {
              const colors = backgroundColors[context.dataIndex] || ['#6b7280', '#d1d5db'];
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, colors[0]);
              gradient.addColorStop(1, colors[1]);
              return gradient;
            }
            return backgroundColors.map(colors => {
              const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
              gradient.addColorStop(0, colors[0]);
              gradient.addColorStop(1, colors[1]);
              return gradient;
            });
          },
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }, [filteredExpenses]);

  const pieOptions = {
    maintainAspectRatio: false,
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { 
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) label += ': ';
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
            }
            return label;
          }
        }
      }
    }
  };

  const barChartData = useMemo(() => {
    const dailyTotals = filteredExpenses.reduce((acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedDates = Object.keys(dailyTotals).sort();

    return {
      labels: sortedDates.map(date => {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Daily Spending',
          data: sortedDates.map(date => dailyTotals[date]),
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
            return gradient;
          },
          hoverBackgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 1)');
            return gradient;
          },
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [filteredExpenses]);

  const barOptions = {
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { display: true, color: 'rgba(156, 163, 175, 0.1)' }, 
        border: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif" },
          callback: function(value: any) {
            return '₹' + value;
          }
        }
      },
      x: { 
        grid: { display: false }, 
        border: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif" }
        }
      }
    }
  };

  return (
    <>
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-[#f8f9fa] flex items-center justify-center transition-opacity duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans p-4 md:p-8 transition-colors duration-300">
      {isDarkMode && (
        <style>{`
          .min-h-screen.bg-\\[\\#f8f9fa\\] { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important; background-size: 200% 200% !important; animation: gradientMove 15s ease infinite !important; }
          .bg-white { background: rgba(30, 41, 59, 0.7) !important; backdrop-filter: blur(24px) !important; -webkit-backdrop-filter: blur(24px) !important; border-color: rgba(255, 255, 255, 0.1) !important; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5) !important; }
          .text-gray-900 { color: #f8fafc !important; }
          .text-gray-700 { color: #cbd5e1 !important; }
          .text-gray-600 { color: #94a3b8 !important; }
          .text-gray-500 { color: #64748b !important; }
          .bg-gray-50\\/50, .bg-gray-50 { background: rgba(15, 23, 42, 0.5) !important; backdrop-filter: blur(12px) !important; border-color: rgba(255, 255, 255, 0.1) !important; color: #f8fafc !important; }
          .border-gray-100 { border-color: rgba(255, 255, 255, 0.1) !important; }
          .border-gray-200 { border-color: rgba(255, 255, 255, 0.15) !important; }
          .bg-gray-900 { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important; }
          .hover\\:bg-gray-800:hover { background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%) !important; box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5) !important; }
          .bg-gray-100 { background-color: rgba(255, 255, 255, 0.1) !important; color: #f8fafc !important; }
          .hover\\:bg-gray-200:hover { background-color: rgba(255, 255, 255, 0.15) !important; }
          .hover\\:bg-gray-50\\/80:hover { background-color: rgba(255, 255, 255, 0.05) !important; }
          
          /* Alerts, Insights & Badges Dark Mode */
          .bg-rose-50 { background-color: rgba(225, 29, 72, 0.1) !important; border-color: rgba(225, 29, 72, 0.2) !important; color: #fda4af !important; }
          .text-rose-800, .text-rose-600 { color: #fda4af !important; }
          .bg-amber-50 { background-color: rgba(217, 119, 6, 0.1) !important; border-color: rgba(217, 119, 6, 0.2) !important; color: #fcd34d !important; }
          .text-amber-800 { color: #fcd34d !important; }
          .bg-blue-50 { background-color: rgba(37, 99, 235, 0.1) !important; border-color: rgba(37, 99, 235, 0.2) !important; color: #93c5fd !important; }
          .text-blue-800, .text-blue-700, .text-blue-600 { color: #93c5fd !important; }
          .bg-orange-50 { background-color: rgba(249, 115, 22, 0.1) !important; border-color: rgba(249, 115, 22, 0.2) !important; color: #fdba74 !important; }
          .text-orange-700, .text-orange-600 { color: #fdba74 !important; }
          .bg-purple-50 { background-color: rgba(168, 85, 247, 0.1) !important; border-color: rgba(168, 85, 247, 0.2) !important; color: #d8b4fe !important; }
          .text-purple-700, .text-purple-600 { color: #d8b4fe !important; }
          .bg-emerald-50 { background-color: rgba(16, 185, 129, 0.1) !important; border-color: rgba(16, 185, 129, 0.2) !important; color: #6ee7b7 !important; }
          .text-emerald-700, .text-emerald-600 { color: #6ee7b7 !important; }
        `}</style>
      )}
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Expense Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your daily spending</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Smart Insights & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {topCategoryThisMonth.amount > 0 && (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-2xl flex items-start gap-3 transition-all md:col-span-2">
              <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Spending Insight</h4>
                <p className="text-sm mt-0.5 opacity-90">
                  You've spent the most on <strong>{topCategoryThisMonth.name}</strong> ({formatCurrency(topCategoryThisMonth.amount)}) this month.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <div className="p-2 bg-blue-50 rounded-xl">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-2">{formatCurrency(totalExpenses)}</div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="flex items-center text-emerald-600 font-medium mr-2">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                2.5%
              </span>
              vs last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Today's Spending</h3>
              <div className="p-2 bg-orange-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-2">{formatCurrency(todaySpending)}</div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="flex items-center text-rose-600 font-medium mr-2">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                12%
              </span>
              vs yesterday
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Spending</h3>
              <div className="p-2 bg-purple-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-2">{formatCurrency(monthlySpending)}</div>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              {isEditingBudget ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Budget:</span>
                  <input 
                    type="number" 
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-gray-50/50"
                    autoFocus
                  />
                  <button onClick={() => { setBudgetLimit(Number(tempBudget) || 0); setIsEditingBudget(false); }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Check className="w-4 h-4"/></button>
                  <button onClick={() => { setIsEditingBudget(false); setTempBudget(budgetLimit.toString()); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Budget: {formatCurrency(budgetLimit)}</span>
                  <button onClick={() => setIsEditingBudget(true)} className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            {/* Budget Progress Bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${monthlySpending > budgetLimit ? 'bg-rose-500' : monthlySpending > budgetLimit * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min((monthlySpending / budgetLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gray-200 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Weekly Summary</h3>
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-2">{formatCurrency(weeklySpending)}</div>
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <div className="flex items-center">
                {weeklySpending > prevWeeklySpending ? (
                  <span className="flex items-center text-rose-600 font-medium mr-2">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    {prevWeeklySpending > 0 ? Math.round(((weeklySpending - prevWeeklySpending) / prevWeeklySpending) * 100) : 100}%
                  </span>
                ) : (
                  <span className="flex items-center text-emerald-600 font-medium mr-2">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    {prevWeeklySpending > 0 ? Math.round(((prevWeeklySpending - weeklySpending) / prevWeeklySpending) * 100) : 0}%
                  </span>
                )}
                vs last week
              </div>
              <div className="text-xs mt-1">Avg daily: {formatCurrency(avgDailySpend)}</div>
              {highestSpendingDay.amount > 0 && (
                <div className="text-xs text-indigo-600 font-medium mt-1">
                  Peak: {formatDate(highestSpendingDay.date)} ({formatCurrency(highestSpendingDay.amount)})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Chart */}
          <div className="lg:col-span-1 space-y-8 animate-fade-in-up delay-200">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-gray-200">
              <h2 className="text-lg font-semibold mb-5 text-gray-900">Add Expense</h2>
              <form className="space-y-4" onSubmit={handleAddExpense}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-gray-900" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 hover:border-gray-300 hover:bg-gray-50 appearance-none text-gray-900 transition-all duration-300">
                      <option>Food & Dining</option>
                      <option>Transportation</option>
                      <option>Bills & Utilities</option>
                      <option>Shopping</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-gray-900" 
                  />
                </div>
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                    <span>Notes (Optional)</span>
                    <span className="text-gray-400 text-xs font-normal">{notes.length}/200</span>
                  </label>
                  <input 
                    type="text" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={200}
                    placeholder="Add a brief note..."
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 text-gray-900" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 mt-2 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Plus className="w-5 h-5 mr-1.5" />
                    )}
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Expense' : 'Add Expense')}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="mt-2 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-md hover:border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="h-48 w-full">
                <Pie data={pieChartData} options={pieOptions} />
              </div>
            </div>

            {/* Daily Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-md hover:border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Daily Expenses</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <div className="h-48 w-full">
                <Bar data={barChartData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Right Column: Table & Insights */}
          <div className="lg:col-span-2 animate-fade-in-up delay-300 flex flex-col gap-8">
            {/* Smart Insights Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Smart Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smartInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 transition-all hover:bg-gray-50">
                    <span className="text-xl leading-none">{idx === 0 ? '📊' : '📈'}</span>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full transition-all duration-300 hover:shadow-md hover:border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
                <button className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                  View All
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors text-sm"
                  />
                </div>
                <div>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-sm appearance-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Shopping">Shopping</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-2 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-sm text-gray-500"
                  />
                  <input 
                    type="date" 
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-2 py-2 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 text-sm text-gray-500"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                      <th className="pb-4 font-medium px-2">Expense</th>
                      <th className="pb-4 font-medium px-2">Date</th>
                      <th className="pb-4 font-medium px-2">Category</th>
                      <th className="pb-4 font-medium text-right px-2">Amount</th>
                      <th className="pb-4 font-medium text-right px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-gray-50/50 rounded-full flex items-center justify-center mb-5 shadow-sm border border-gray-100 animate-float">
                              <span className="text-4xl animate-rocket">🚀</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                              Your dashboard is looking a little empty. Add your first expense using the form above to get started!
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/80 hover:shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-200 group">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-gray-900">{expense.title}</div>
                              <div className="text-gray-500 text-xs mt-0.5">{expense.sub}</div>
                            </div>
                            {expense.notes && (
                              <div className="relative group/tooltip flex items-center">
                                <FileText className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-1.5 px-2.5 shadow-lg z-10 whitespace-normal break-words">
                                  {expense.notes}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-2 text-gray-600">{formatDate(expense.date)}</td>
                        <td className="py-4 px-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getCategoryColors(expense.category)}`}>
                            {getCategoryIcon(expense.category)}
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right font-semibold text-gray-900">-₹{expense.amount.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(expense)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this expense?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Alert Toast */}
      {budgetAlert.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 border ${budgetAlert.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${budgetAlert.type === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
            <div>
              <h4 className="font-semibold text-sm">{budgetAlert.type === 'danger' ? 'Budget Exceeded' : 'Budget Warning'}</h4>
              <p className="text-sm mt-0.5 opacity-90">{budgetAlert.message}</p>
            </div>
            <button onClick={() => setBudgetAlert(prev => ({...prev, show: false}))} className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
