import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Activity, ArrowDownRight } from 'lucide-react';

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    description?: string;
    amount?: string;
    category_id?: string;
    type?: 'income' | 'expense';
  };
}

export function AddTransactionModal({ onClose, onSuccess, initialData }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || ''
  });
  const [categories, setCategories] = useState<{id: string, name: string, type: string}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        // If initialData has a type, filter categories or pre-select one based on type if category_id is not provided
        if (initialData?.type && !initialData.category_id) {
            // This logic is optional, but could be useful if we want to default to the first category of a type
            // const defaultCat = data.find((c: any) => c.type === initialData.type);
            // if (defaultCat) setFormData(prev => ({ ...prev, category_id: defaultCat.id }));
        }
      });
  }, []);

  // Debounce analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description.length > 3 && formData.amount && !formData.category_id) {
        analyzeCategory();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.description, formData.amount]);

  const analyzeCategory = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: formData.description, 
          amount: parseFloat(formData.amount) 
        })
      });
      const data = await res.json();
      if (data.category_id) {
        setFormData(prev => ({ ...prev, category_id: data.category_id }));
      }
    } catch (error) {
      console.error("Failed to analyze category", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to save transaction", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#18181b] border border-white/10 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-600" />
        
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-light text-white">Новая транзакция</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium">Дата</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium">Сумма (₽)</label>
            <input 
              type="number" 
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-colors font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium">Описание</label>
            <input 
              type="text" 
              required
              placeholder="Например: Оплата хостинга"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider font-medium flex justify-between">
              Категория
              {isAnalyzing && <span className="text-orange-500 animate-pulse flex items-center gap-1"><Activity className="w-3 h-3" /> AI анализ...</span>}
            </label>
            <div className="relative">
              <select 
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 appearance-none transition-colors cursor-pointer"
              >
                <option value="" disabled>Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'income' ? 'Доход' : 'Расход'})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white/5 text-zinc-300 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-orange-500 text-black py-3 rounded-xl text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
