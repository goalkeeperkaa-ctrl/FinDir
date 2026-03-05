import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LayoutDashboard, PieChart as PieChartIcon, Wallet, Settings,
  MessageSquare, Bell, Search, Plus, ArrowUpRight, ArrowDownRight,
  Activity, TrendingUp, Users, DollarSign, Filter, X, Coffee, Car, Zap, Upload, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '@/lib/utils';
import { Transaction, DashboardStats } from '@/types';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ImportModal } from '@/components/ImportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f0f11] text-zinc-100 font-sans overflow-hidden selection:bg-orange-500/30 p-4 md:p-6 gap-6 relative">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar - Floating Glass Panel */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content - Floating Glass Panel */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl">
        <Header setShowChat={setShowChat} showChat={showChat} />
        
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
            {activeTab === 'transactions' && <Transactions key="transactions" />}
            {activeTab === 'scenarios' && <Scenarios key="scenarios" />}
            {activeTab === 'reports' && <Reports key="reports" />}
            {activeTab === 'settings' && <SettingsTab key="settings" />}
          </AnimatePresence>
        </div>

        {/* AI Chat Overlay */}
        <AIChat show={showChat} onClose={() => setShowChat(false)} />
      </main>
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Обзор' },
    { id: 'transactions', icon: Wallet, label: 'Транзакции' },
    { id: 'scenarios', icon: Activity, label: 'Моделирование' },
    { id: 'reports', icon: PieChart, label: 'Отчеты' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <div className="w-20 lg:w-64 flex flex-col gap-6 shrink-0">
      {/* Brand Widget */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col items-center lg:items-start gap-4 shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-wide text-white hidden lg:block">Nexus<span className="text-orange-500">3.0</span></span>
        </div>
        <div className="hidden lg:block relative z-10">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Статус системы</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-medium text-zinc-300">Онлайн</span>
          </div>
        </div>
      </div>

      {/* Navigation Dock */}
      <nav className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex flex-col gap-2 shadow-lg">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
              activeTab === item.id 
                ? "text-white shadow-[0_0_20px_rgba(0,0,0,0.2)]" 
                : "text-zinc-500 hover:text-zinc-200"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 border border-white/5 rounded-2xl"
              />
            )}
            <item.icon className={cn("w-5 h-5 relative z-10 transition-colors", activeTab === item.id ? "text-orange-500" : "group-hover:text-white")} />
            <span className="hidden lg:block relative z-10">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Stats Widget */}
      <div className="hidden lg:flex bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex-col gap-4 shadow-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Эффективность</span>
          <Activity className="w-4 h-4 text-orange-500" />
        </div>
        <div className="text-4xl font-light text-white">84%</div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-[84%] shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
        </div>
      </div>
    </div>
  );
}

function Header({ setShowChat, showChat }: { setShowChat: (v: boolean) => void, showChat: boolean }) {
  return (
    <header className="h-20 flex items-center justify-between px-8 z-10">
      {/* Breadcrumbs / Title */}
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 rounded-full bg-black/20 border border-white/5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Финансы / Обзор
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search Pill */}
        <div className="hidden md:flex items-center gap-3 bg-black/20 border border-white/5 rounded-full px-4 py-2.5 focus-within:border-white/20 transition-colors">
          <Search className="w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Поиск..." 
            className="bg-transparent border-none outline-none text-sm w-48 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        <button className="w-10 h-10 rounded-full bg-black/20 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
        </button>
        
        <button 
          onClick={() => setShowChat(!showChat)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border",
            showChat 
              ? "bg-orange-500 text-black border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]" 
              : "bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Ассистент</span>
        </button>
      </div>
    </header>
  );
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);
  };

  const openQuickAction = (data: any) => {
    setModalInitialData(data);
    setShowAddModal(true);
  };

  if (!stats) return <div className="p-10 text-zinc-500 animate-pulse">Загрузка нейроядра...</div>;

  const COLORS = ['#f97316', '#ef4444', '#eab308', '#84cc16', '#06b6d4', '#8b5cf6'];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Quick Actions Bar */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => openQuickAction({ type: 'income' })}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all whitespace-nowrap"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Доход</span>
        </button>
        <button 
          onClick={() => openQuickAction({ type: 'expense' })}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all whitespace-nowrap"
        >
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Расход</span>
        </button>
        <button 
          onClick={() => openQuickAction({ description: 'Кофе', amount: '350' })}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all whitespace-nowrap"
        >
          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Кофе</span>
        </button>
        <button 
          onClick={() => openQuickAction({ description: 'Такси', amount: '500' })}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all whitespace-nowrap"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Car className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Такси</span>
        </button>
        <button 
          onClick={() => openQuickAction({ description: 'Интернет', amount: '800' })}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all whitespace-nowrap"
        >
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Интернет</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Чистая прибыль" 
          value={stats.netProfit} 
          trend="+12.5%" 
          positive={true} 
          icon={DollarSign}
          desc="Доходы минус расходы"
        />
        <StatCard 
          title="Выручка" 
          value={stats.totalIncome} 
          trend="+8.2%" 
          positive={true} 
          icon={TrendingUp}
          desc="Общий доход за период"
        />
        <StatCard 
          title="Расходы" 
          value={stats.totalExpenses} 
          trend="-2.4%" 
          positive={false} 
          icon={Wallet}
          desc="Операционные траты"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden flex flex-col backdrop-blur-md">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-light flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Activity className="w-4 h-4 text-orange-500" />
              </div>
              Движение средств
            </h3>
            <div className="flex gap-2 bg-black/20 p-1 rounded-full border border-white/5">
              <div className="px-3 py-1 rounded-full bg-white/10 text-xs text-white">Месяц</div>
              <div className="px-3 py-1 rounded-full text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">Год</div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickMargin={15} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '0.5rem' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area type="monotone" dataKey="income" name="Доходы" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Расходы" stroke="#ef4444" strokeWidth={3} fillOpacity={0} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-8 flex flex-col backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none" />
          
          <h3 className="text-xl font-light mb-8 text-white relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <PieChartIcon className="w-4 h-4 text-orange-500" />
            </div>
            Расходы (Тек. месяц)
          </h3>
          
          <div className="flex-1 w-full min-h-0 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expenseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.expenseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-zinc-400 ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Overview Section */}
      <div className="bg-black/20 border border-white/5 rounded-[2rem] p-8 backdrop-blur-md relative overflow-hidden">
        <h3 className="text-xl font-light mb-6 text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          Бюджет на Февраль
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.budgetProgress.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-zinc-300">{item.category}</span>
                <div className="text-right">
                  <span className={cn("text-sm font-bold", item.percentage > 90 ? "text-red-400" : "text-white")}>
                    {formatCurrency(item.spent)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">/ {formatCurrency(item.limit)}</span>
                </div>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className={cn("h-full rounded-full relative", 
                    item.percentage > 100 ? "bg-red-500" : 
                    item.percentage > 80 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                >
                  {item.percentage > 100 && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  )}
                </motion.div>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{item.percentage.toFixed(0)}% использовано</span>
                <span>Остаток: {formatCurrency(Math.max(0, item.limit - item.spent))}</span>
              </div>
            </div>
          ))}
          {stats.budgetProgress.length === 0 && (
            <div className="col-span-full text-center py-8 text-zinc-500">
              Нет данных о расходах за этот месяц
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddTransactionModal 
            onClose={() => setShowAddModal(false)} 
            onSuccess={() => {
              setShowAddModal(false);
              fetchStats();
            }}
            initialData={modalInitialData}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ title, value, trend, positive, icon: Icon, desc }: any) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden hover:bg-white/5 hover:border-white/10 transition-all duration-300 group backdrop-blur-md">
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
        <Icon className="w-24 h-24 text-white" />
      </div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="p-4 bg-white/5 rounded-2xl text-zinc-300 group-hover:text-white group-hover:bg-white/10 transition-colors border border-white/5">
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border", positive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h4 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{title}</h4>
        <p className="text-4xl font-light tracking-tight text-white">{formatCurrency(value)}</p>
        {desc && <p className="text-xs text-zinc-600">{desc}</p>}
      </div>
    </div>
  );
}

function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = () => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(setTransactions);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
      return;
    }
    setDeletingId(id);
    fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setTransactions(transactions.filter(t => t.id !== id));
        }
      })
      .catch(err => console.error('Delete error:', err))
      .finally(() => setDeletingId(null));
  };

  const categories = Array.from(new Set(transactions.map(t => t.category_name)));

  const filteredTransactions = transactions.filter(tx => {
    const date = new Date(tx.date);
    const amount = tx.amount;
    
    if (filters.startDate && date < new Date(filters.startDate)) return false;
    if (filters.endDate && date > new Date(filters.endDate)) return false;
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) return false;
    if (filters.category && tx.category_name !== filters.category) return false;
    
    return true;
  });

  const clearFilters = () => setFilters({ startDate: '', endDate: '', minAmount: '', maxAmount: '', category: '' });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full relative backdrop-blur-md shadow-2xl"
    >
      <div className="p-8 border-b border-white/5 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-light text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            Журнал операций
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border", 
                showFilters 
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/30" 
                  : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-white"
              )}
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-white/10 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/10"
            >
              <Upload className="w-4 h-4" />
              Импорт
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Дата с</label>
                    <input 
                      type="date" 
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Дата по</label>
                    <input 
                      type="date" 
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Сумма от</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Сумма до</label>
                    <input 
                      type="number" 
                      placeholder="∞"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Категория</label>
                    <div className="relative">
                      <select 
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500/50 appearance-none transition-colors cursor-pointer"
                      >
                        <option value="">Все категории</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-4 top-3 pointer-events-none text-zinc-500">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 mt-2 border-t border-white/5">
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Сбросить все фильтры
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="overflow-auto flex-1 p-2">
        <table className="w-full text-left text-sm border-separate border-spacing-y-1 px-6">
          <thead className="text-zinc-500 font-medium sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-normal uppercase tracking-wider text-xs">Дата</th>
              <th className="px-6 py-4 font-normal uppercase tracking-wider text-xs">Описание</th>
              <th className="px-6 py-4 font-normal uppercase tracking-wider text-xs">Категория</th>
              <th className="px-6 py-4 font-normal uppercase tracking-wider text-xs">Статус</th>
              <th className="px-6 py-4 text-right font-normal uppercase tracking-wider text-xs">Сумма</th>
              <th className="px-6 py-4 text-center font-normal uppercase tracking-wider text-xs">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="group transition-all duration-200">
                <td className="px-6 py-4 font-mono text-zinc-400 whitespace-nowrap bg-white/[0.02] first:rounded-l-2xl group-hover:bg-white/5 transition-colors border-y border-l border-transparent group-hover:border-white/5">{tx.date}</td>
                <td className="px-6 py-4 font-medium text-zinc-200 bg-white/[0.02] group-hover:bg-white/5 transition-colors border-y border-transparent group-hover:border-white/5">{tx.description}</td>
                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/5 transition-colors border-y border-transparent group-hover:border-white/5">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-zinc-400 border border-white/5 whitespace-nowrap">
                    {tx.category_name}
                  </span>
                </td>
                <td className="px-6 py-4 bg-white/[0.02] group-hover:bg-white/5 transition-colors border-y border-transparent group-hover:border-white/5">
                  <span className={cn("text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap border",
                    tx.status === 'cleared' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  )}>
                    {tx.status === 'cleared' ? 'Проведено' : 'В обработке'}
                  </span>
                </td>
                <td className={cn("px-6 py-4 text-right font-mono font-medium whitespace-nowrap bg-white/[0.02] group-hover:bg-white/5 transition-colors border-y border-transparent group-hover:border-white/5",
                  tx.category_type === 'income' ? "text-emerald-400" : "text-zinc-300"
                )}>
                  <div className="flex items-center justify-end gap-2">
                    {tx.category_type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {formatCurrency(tx.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center bg-white/[0.02] last:rounded-r-2xl group-hover:bg-white/5 transition-colors border-y border-r border-transparent group-hover:border-white/5">
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    disabled={deletingId === tx.id}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Удалить транзакцию"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Search className="w-6 h-6 text-zinc-600" />
                    </div>
                    <p>Транзакции не найдены</p>
                    <button onClick={clearFilters} className="text-orange-500 hover:text-orange-400 text-sm">Сбросить фильтры</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddTransactionModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              fetchTransactions();
            }}
          />
        )}
        {showImportModal && (
          <ImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchTransactions();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}



function Scenarios() {
  const [hires, setHires] = useState(3);
  const [salary, setSalary] = useState(150000);
  
  const currentMonthlyBurn = 1200000; // Example base burn
  const additionalCost = hires * salary;
  const projectedBurn = currentMonthlyBurn + additionalCost;
  
  const yearlyImpact = additionalCost * 12;

  const chartData = [
    { name: 'Сейчас', value: currentMonthlyBurn },
    { name: 'Прогноз', value: projectedBurn },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-light text-white">Симулятор расходов</h2>
        <p className="text-zinc-400">Оцените влияние найма новых сотрудников на бюджет компании.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 bg-[#121214] border border-white/5 rounded-2xl p-8 space-y-10 h-fit">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-zinc-300">Новые сотрудники</label>
              <span className="text-orange-500 font-bold font-mono text-xl bg-orange-500/10 px-3 py-1 rounded-lg">{hires} чел.</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              value={hires} 
              onChange={(e) => setHires(parseInt(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-zinc-300">Зарплата (Gross)</label>
              <span className="text-orange-500 font-bold font-mono text-xl bg-orange-500/10 px-3 py-1 rounded-lg">{formatCurrency(salary)}</span>
            </div>
            <input 
              type="range" 
              min="50000" 
              max="500000" 
              step="10000"
              value={salary} 
              onChange={(e) => setSalary(parseInt(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
             <p className="text-sm text-zinc-400 mb-1">Дополнительный ФОТ в месяц:</p>
             <p className="text-2xl font-mono text-white">{formatCurrency(additionalCost)}</p>
          </div>
        </div>

        {/* Visual Impact */}
        <div className="lg:col-span-7 bg-[#121214] border border-white/5 rounded-2xl p-8 flex flex-col">
          <h3 className="text-lg font-medium text-zinc-100 mb-6">Прогноз ежемесячных расходов</h3>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" width={80} tick={{fontSize: 14}} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                  {
                    chartData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={index === 0 ? '#52525b' : '#f97316'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
             <div>
                <p className="text-sm text-zinc-500">Текущий Burn Rate</p>
                <p className="text-xl font-mono text-zinc-300">{formatCurrency(currentMonthlyBurn)}</p>
             </div>
             <div>
                <p className="text-sm text-zinc-500">Прогнозируемый Burn Rate</p>
                <p className="text-xl font-mono text-orange-500 font-bold">{formatCurrency(projectedBurn)}</p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Reports() {
  const [plData, setPlData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);
  const [unitEconomics, setUnitEconomics] = useState<any>(null);
  const [activeReport, setActiveReport] = useState('p-l');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const plRes = await fetch('/api/reports/p-l');
      const plJson = await plRes.json();
      setPlData(plJson);

      const cfRes = await fetch('/api/reports/cash-flow');
      const cfJson = await cfRes.json();
      setCashFlowData(cfJson);

      const anomRes = await fetch('/api/anomalies');
      const anomJson = await anomRes.json();
      setAnomaliesData(anomJson);

      const ueRes = await fetch('/api/unit-economics');
      const ueJson = await ueRes.json();
      setUnitEconomics(ueJson);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    }
  };

  if (!plData || !cashFlowData || !anomaliesData || !unitEconomics) {
    return <div className="p-10 text-zinc-500 animate-pulse">Загрузка отчетов...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Report Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveReport('p-l')}
          className={cn("px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
            activeReport === 'p-l'
              ? "bg-orange-500 text-black"
              : "bg-white/5 text-zinc-300 hover:bg-white/10"
          )}
        >
          P&L
        </button>
        <button
          onClick={() => setActiveReport('cash-flow')}
          className={cn("px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
            activeReport === 'cash-flow'
              ? "bg-orange-500 text-black"
              : "bg-white/5 text-zinc-300 hover:bg-white/10"
          )}
        >
          Кассовый поток
        </button>
        <button
          onClick={() => setActiveReport('unit-economics')}
          className={cn("px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
            activeReport === 'unit-economics'
              ? "bg-orange-500 text-black"
              : "bg-white/5 text-zinc-300 hover:bg-white/10"
          )}
        >
          Юнит-экономика
        </button>
        <button
          onClick={() => setActiveReport('anomalies')}
          className={cn("px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
            activeReport === 'anomalies'
              ? "bg-orange-500 text-black"
              : "bg-white/5 text-zinc-300 hover:bg-white/10"
          )}
        >
          Аномалии
        </button>
      </div>

      {activeReport === 'p-l' && (
        <div className="space-y-6">
          {/* P&L Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Выручка</p>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(plData.totalIncome)}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Расходы</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(plData.totalExpenses)}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Чистая прибыль</p>
              <p className="text-3xl font-bold text-orange-400">{formatCurrency(plData.netProfit)}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Маржа</p>
              <p className="text-3xl font-bold text-blue-400">{plData.profitMargin}%</p>
            </div>
          </div>

          {/* Income */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-light mb-6 text-white">Доходы</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-zinc-500 font-normal">Категория</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Сумма</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Кол-во операций</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Доля</th>
                </tr>
              </thead>
              <tbody>
                {plData.income.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 text-white">{row.category}</td>
                    <td className="py-4 text-right font-mono text-emerald-400">{formatCurrency(row.total_amount)}</td>
                    <td className="py-4 text-right text-zinc-400">{row.transaction_count}</td>
                    <td className="py-4 text-right text-zinc-400">100%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expenses */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-light mb-6 text-white">Расходы по категориям</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-zinc-500 font-normal">Категория</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Сумма</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Кол-во операций</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Доля</th>
                </tr>
              </thead>
              <tbody>
                {plData.expenses.map((row: any, i: number) => {
                  const percentage = ((row.total_amount / plData.totalExpenses) * 100).toFixed(1);
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4 text-white">{row.category}</td>
                      <td className="py-4 text-right font-mono text-red-400">{formatCurrency(row.total_amount)}</td>
                      <td className="py-4 text-right text-zinc-400">{row.transaction_count}</td>
                      <td className="py-4 text-right text-zinc-400">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'cash-flow' && (
        <div className="space-y-6">
          {/* Cash Flow Chart */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8 h-[400px]">
            <h3 className="text-xl font-light mb-6 text-white">Движение денежных средств по месяцам</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="inflow" name="Приходы" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Уходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Table */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-light mb-6 text-white">Детализация по месяцам</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-zinc-500 font-normal">Месяц</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Приходы</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Уходы</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Чистый поток</th>
                  <th className="pb-4 text-zinc-500 font-normal text-right">Операций</th>
                </tr>
              </thead>
              <tbody>
                {cashFlowData.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-4 text-white">{row.month}</td>
                    <td className="py-4 text-right font-mono text-emerald-400">{formatCurrency(row.inflow)}</td>
                    <td className="py-4 text-right font-mono text-red-400">{formatCurrency(row.outflow)}</td>
                    <td className={cn("py-4 text-right font-mono font-bold", row.net > 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatCurrency(row.net)}
                    </td>
                    <td className="py-4 text-right text-zinc-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'unit-economics' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Выручка</p>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(unitEconomics.revenue)}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Расходы</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(unitEconomics.expenses)}</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Маржа</p>
              <p className="text-3xl font-bold text-blue-400">{unitEconomics.margin_percent}%</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Чистая прибыль</p>
              <p className={cn("text-3xl font-bold", unitEconomics.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {formatCurrency(unitEconomics.profit)}
              </p>
            </div>
          </div>

          {/* Burn Rate & Runway */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-light mb-4 text-white">Скорость трат (Burn Rate)</h3>
              <p className="text-4xl font-bold text-orange-400 mb-2">{formatCurrency(unitEconomics.burn_rate)}</p>
              <p className="text-zinc-500 text-sm">в месяц</p>
            </div>
            <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-light mb-4 text-white">Runway (Финансовая подушка)</h3>
              <p className="text-4xl font-bold text-blue-400 mb-2">{unitEconomics.runway_months}</p>
              <p className="text-zinc-500 text-sm">месяцев работы</p>
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
            <h3 className="text-xl font-light mb-6 text-white">Динамика (месяц к месяцу)</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-zinc-500 text-sm mb-2">Рост выручки</p>
                <p className={cn("text-2xl font-bold", unitEconomics.growth.revenue_mom >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {unitEconomics.growth.revenue_mom > 0 ? '+' : ''}{unitEconomics.growth.revenue_mom}%
                </p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm mb-2">Изменение расходов</p>
                <p className={cn("text-2xl font-bold", unitEconomics.growth.expense_mom <= 0 ? "text-emerald-400" : "text-red-400")}>
                  {unitEconomics.growth.expense_mom > 0 ? '+' : ''}{unitEconomics.growth.expense_mom}%
                </p>
              </div>
            </div>
          </div>

          {/* 6 Month Trend */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8 h-[400px]">
            <h3 className="text-xl font-light mb-6 text-white">Тренд на 6 месяцев</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={unitEconomics.monthly_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Выручка" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Расходы" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'anomalies' && (
        <div className="space-y-6">
          {/* Anomalies Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Всего транзакций проверено</p>
              <p className="text-3xl font-bold text-white">{anomaliesData.total}</p>
            </div>
            <div className="bg-black/20 border border-red-500/20 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Высокая степень риска</p>
              <p className="text-3xl font-bold text-red-400">{anomaliesData.summary.high_severity}</p>
            </div>
            <div className="bg-black/20 border border-yellow-500/20 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">Средняя степень риска</p>
              <p className="text-3xl font-bold text-yellow-400">{anomaliesData.summary.medium_severity}</p>
            </div>
          </div>

          {/* Anomalies Table */}
          {anomaliesData.anomalies.length > 0 ? (
            <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
              <h3 className="text-xl font-light mb-6 text-white">Обнаруженные аномалии</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-4 text-zinc-500 font-normal">Дата</th>
                    <th className="pb-4 text-zinc-500 font-normal">Сумма</th>
                    <th className="pb-4 text-zinc-500 font-normal">Описание</th>
                    <th className="pb-4 text-zinc-500 font-normal">Категория</th>
                    <th className="pb-4 text-zinc-500 font-normal">Статус</th>
                    <th className="pb-4 text-zinc-500 font-normal text-right">Z-Score</th>
                  </tr>
                </thead>
                <tbody>
                  {anomaliesData.anomalies.map((anom: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-4 text-white">{anom.date}</td>
                      <td className="py-4 font-mono text-orange-400 font-bold">{formatCurrency(anom.amount)}</td>
                      <td className="py-4 text-zinc-300 truncate">{anom.description}</td>
                      <td className="py-4 text-white">{anom.category}</td>
                      <td className="py-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium",
                          anom.severity === 'high'
                            ? "bg-red-500/20 text-red-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        )}>
                          {anom.severity === 'high' ? '🔴 Высокая' : '🟡 Средняя'}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono text-zinc-400">{anom.zscore}σ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-black/20 border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-zinc-400 text-lg">✨ Аномалий не обнаружено. Всё в порядке!</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function SettingsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2 text-white">Настройки</h1>
        <p className="text-zinc-500">Управление параметрами приложения</p>
      </div>

      <div className="space-y-6">
        {/* API Keys Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-light mb-4 text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            API Интеграции
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">OpenAI API Key</label>
              <div className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-zinc-500 text-sm">
                Настроено на сервере (не отображается в целях безопасности)
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Используется для AI категоризации и чата. Получить ключ: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400">platform.openai.com/api-keys</a>
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-light mb-4 text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            О приложении
          </h2>

          <div className="space-y-3 text-sm text-zinc-400">
            <p><span className="text-white">FinDir</span> - платформа для автоматизированного финансового анализа</p>
            <p><span className="text-white">Версия:</span> 1.0.0</p>
            <p><span className="text-white">Технология:</span> React 19, Express, Tailwind CSS</p>
            <p><span className="text-white">AI помощник:</span> OpenAI</p>
          </div>
        </div>

        {/* Feature Status */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-light mb-4 text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Статус функций
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">Транзакции</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">Отчеты</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">CSV/Excel импорт</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">AI ассистент</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-zinc-300">Сценарии</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AIChat({ show, onClose }: { show: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Приветствую. Я AFM. Я проанализировал ваши последние транзакции. Чем могу помочь?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Ошибка соединения с нейроядром.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="absolute top-0 right-0 w-[450px] h-full bg-[#18181b] border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="font-medium text-white">AFM Ассистент</span>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  m.role === 'user' 
                    ? "bg-zinc-100 text-black" 
                    : "bg-white/5 text-zinc-200 border border-white/5"
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-2xl flex gap-1.5 border border-white/5">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/10 bg-[#18181b]">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Спросите о финансах..."
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-zinc-600"
              />
              <button 
                onClick={send}
                disabled={loading}
                className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-500 disabled:opacity-50 transition-colors shadow-lg shadow-orange-900/20"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
