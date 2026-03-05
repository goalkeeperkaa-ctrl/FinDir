import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<{date?: string, income_column?: string, expense_column?: string, description?: string, category?: string}>({});
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [autoCategory, setAutoCategory] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      setError('Поддерживаются только файлы CSV и Excel (.xlsx, .xls)');
      setIsLoading(false);
      return;
    }

    if (isExcel) {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setError('Файл пуст или не содержит данных');
            setIsLoading(false);
            return;
          }

          // Get available columns
          const cols = Object.keys(jsonData[0]).filter(k => k.trim() !== '');
          setAvailableColumns(cols);
          setRawData(jsonData);
          setShowColumnMapping(true);
          setIsLoading(false);
        } catch (err: any) {
          setError(`Ошибка при чтении Excel: ${err.message}`);
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV files
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            setError(`Ошибка при чтении CSV: ${results.errors[0].message}`);
            setIsLoading(false);
            return;
          }

          const data = results.data as any[];
          if (data.length === 0) {
            setError('Файл пуст или не содержит данных');
            setIsLoading(false);
            return;
          }

          // Get available columns
          const cols = Object.keys(data[0]).filter(k => k.trim() !== '');
          setAvailableColumns(cols);
          setRawData(data);
          setShowColumnMapping(true);
          setIsLoading(false);
        },
        error: (error) => {
          setError(`Ошибка парсинга CSV: ${error.message}`);
          setIsLoading(false);
        }
      });
    }
  };

  const normalizeData = () => {
    const normalized = rawData.flatMap(row => {
      const transactions: any[] = [];

      // Process income column
      if (columnMapping.income_column && row[columnMapping.income_column]) {
        const amount = parseFloat(String(row[columnMapping.income_column]));
        if (!isNaN(amount) && amount > 0) {
          transactions.push({
            date: columnMapping.date ? row[columnMapping.date] : new Date().toISOString().split('T')[0],
            amount: amount,
            description: columnMapping.description ? row[columnMapping.description] : 'Доход',
            category_name: 'Выручка',
            type: 'income'
          });
        }
      }

      // Process expense column
      if (columnMapping.expense_column && row[columnMapping.expense_column]) {
        const amount = parseFloat(String(row[columnMapping.expense_column]));
        if (!isNaN(amount) && amount > 0) {
          transactions.push({
            date: columnMapping.date ? row[columnMapping.date] : new Date().toISOString().split('T')[0],
            amount: amount,
            description: columnMapping.description ? row[columnMapping.description] : 'Расход',
            category_name: columnMapping.category ? row[columnMapping.category] : 'Сервисы и ПО',
            type: 'expense',
            autoCategory: autoCategory
          });
        }
      }

      return transactions;
    }).filter(row => row.date && row.amount);

    if (normalized.length === 0) {
      setError('Не найдены строки с доходами или расходами. Проверьте выбранные колонки.');
      return null;
    }

    return normalized;
  };

  const proceedWithImport = () => {
    const normalized = normalizeData();
    if (normalized) {
      setPreview(normalized.slice(0, 5));
      setShowColumnMapping(false);
      submitImport(normalized);
    }
  };

  const smartAnalyzeTable = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have data
      if (!rawData || rawData.length === 0) {
        setError('Нет данных для анализа. Загрузите файл.');
        setIsLoading(false);
        return;
      }

      console.log('Starting smart analysis with', rawData.length, 'rows');
      console.log('Sample data:', rawData[0]);

      // Send raw table data to AI for analysis
      const res = await fetch('/api/analyze-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableData: rawData })
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const err = await res.json();
        console.error('API Error:', err);
        setError(`Ошибка анализа: ${err.error || 'Неизвестная ошибка'}`);
        setIsLoading(false);
        return;
      }

      const result = await res.json();
      console.log('Analysis result:', result);

      if (!result.analyzed || result.analyzed.length === 0) {
        setError('AI не смог проанализировать данные. Попробуйте выбрать колонки вручную.');
        setIsLoading(false);
        return;
      }

      setPreview(result.analyzed.slice(0, 5));
      setShowColumnMapping(false);
      submitImport(result.analyzed);
    } catch (e: any) {
      console.error('Smart analysis error:', e);
      setError(`Ошибка при анализе таблицы: ${e.message || String(e)}`);
      setIsLoading(false);
    }
  };

  const submitImport = async (transactions: any[]) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, autoCategory })
      });

      if (!res.ok) {
        const err = await res.json();
        setError(`Ошибка API: ${err.error || 'Неизвестная ошибка'}`);
        setIsLoading(false);
        return;
      }

      const result = await res.json();
      setImportResult(result);
      setIsLoading(false);

      if (result.count && result.count > 0) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError('Не удалось импортировать транзакции. Проверьте формат данных.');
      }
    } catch (e: any) {
      console.error('Import error:', e);
      setError(`Ошибка загрузки: ${e.message || String(e)}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#18181b] border border-white/10 rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-600" />

        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-light text-white">Импорт транзакций</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!importResult ? (
          showColumnMapping ? (
            <div className="space-y-6">
              <div>
                <div className="mb-6">
                  <button
                    onClick={smartAnalyzeTable}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg text-sm font-bold hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 transition-all mb-2"
                  >
                    ✨ Умный анализ таблицы
                  </button>
                  <p className="text-xs text-zinc-500 text-center">Нейросеть сама распределит доходы и расходы</p>
                </div>

                <div className="border-t border-white/10 pt-6 mt-4">
                  <h4 className="text-white font-medium mb-4">Или выберите колонки вручную:</h4>
                  <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Дата (опционально)</label>
                    <select
                      value={columnMapping.date || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, date: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">-- Выберите колону с датой --</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">Доходы</label>
                      <select
                        value={columnMapping.income_column || ''}
                        onChange={(e) => setColumnMapping({...columnMapping, income_column: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">-- Опционально --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-500 mb-2">Расходы *</label>
                      <select
                        value={columnMapping.expense_column || ''}
                        onChange={(e) => setColumnMapping({...columnMapping, expense_column: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="">-- Выберите колону с расходами --</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Описание (опционально)</label>
                    <select
                      value={columnMapping.description || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, description: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">-- Опционально --</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2">Категория расходов (опционально)</label>
                    <select
                      value={columnMapping.category || ''}
                      onChange={(e) => setColumnMapping({...columnMapping, category: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">-- Опционально --</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCategory}
                        onChange={(e) => setAutoCategory(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-blue-300">
                        🤖 Автоматически распределить расходы по категориям (требуется API ключ)
                      </span>
                    </label>
                  </div>
                </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowColumnMapping(false);
                    setRawData([]);
                  }}
                  className="flex-1 bg-white/5 text-zinc-300 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
                >
                  Отмена
                </button>
                <button
                  onClick={proceedWithImport}
                  disabled={!columnMapping.expense_column && !columnMapping.income_column}
                  className="flex-1 bg-orange-500 text-black py-2 rounded-lg text-sm font-bold hover:bg-orange-400 disabled:opacity-50"
                >
                  Продолжить
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
            <div className="text-sm text-zinc-400 space-y-2">
              <p>📋 Загрузите CSV или Excel файл с колонками:</p>
              <code className="block bg-black/40 p-3 rounded-lg text-xs">
                date (дата), amount (сумма), description (описание), category (категория - опционально)
              </code>
            </div>

            <label className="block">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
              <div className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isLoading ? "border-orange-500/50 bg-orange-500/10" : "border-white/10 hover:border-orange-500/30"
              )}>
                <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                <p className="text-white font-medium">
                  {isLoading ? 'Загрузка...' : 'Выберите файл для загрузки'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">CSV, XLSX или XLS</p>
              </div>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Ошибка</p>
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              </div>
            )}

            {preview.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 mb-3">Предпросмотр (первые 5 строк):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-2 text-zinc-400">Дата</th>
                        <th className="text-right py-2 px-2 text-zinc-400">Сумма</th>
                        <th className="text-left py-2 px-2 text-zinc-400">Тип</th>
                        <th className="text-left py-2 px-2 text-zinc-400">Категория</th>
                        <th className="text-left py-2 px-2 text-zinc-400">Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2 px-2 text-zinc-400">{row.date}</td>
                          <td className="py-2 px-2 text-right text-white font-mono">{row.amount}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              row.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {row.type === 'income' ? '💰 Доход' : '💸 Расход'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-zinc-400">{row.category_name}</td>
                          <td className="py-2 px-2 text-zinc-400 truncate">{row.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="text-emerald-400 text-2xl">✓</div>
            </div>
            <div>
              <p className="text-white font-medium text-lg mb-2">✅ Импорт успешно завершен!</p>
              <p className="text-zinc-400 text-sm">
                Загружено: <span className="font-mono text-emerald-400 font-bold">{importResult.count || 0}</span> {' '}
                транзакц{importResult.count === 1 ? 'ия' : importResult.count % 10 === 1 ? 'ия' : 'ий'}
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 text-left bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs font-medium mb-2">⚠️ Ошибки при загрузке:</p>
                  <ul className="text-yellow-300 text-xs space-y-1">
                    {importResult.errors.slice(0, 3).map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
