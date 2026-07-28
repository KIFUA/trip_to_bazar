/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, Trash2, Share2, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShoppingItem {
  id: string;
  product: string;
  price: number;
  total: number;
  quantity: number;
  unit: string;
}

interface Category {
  id: string;
  name: string;
  products: string[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Овочі', products: ['Картопля', 'Морква', 'Цибуля', 'Капуста', 'Помідори', 'Огірки'].sort((a, b) => a.localeCompare(b)) },
  { id: '2', name: 'Фрукти', products: ['Яблука', 'Банани', 'Апельсини', 'Лимони', 'Груші'].sort((a, b) => a.localeCompare(b)) },
  { id: '3', name: 'М\'ясо', products: ['Курка', 'Свинина', 'Яловичина', 'Сало', 'Фарш'].sort((a, b) => a.localeCompare(b)) },
  { id: '4', name: 'Молочне', products: ['Молоко', 'Сир', 'Сметана', 'Масло', 'Йогурт'].sort((a, b) => a.localeCompare(b)) },
  { id: '5', name: 'Бакалія', products: ['Цукор', 'Сіль', 'Борошно', 'Олія', 'Гречка', 'Рис'].sort((a, b) => a.localeCompare(b)) },
];

const UNITS = ['кг', 'шт', 'пак'];

export default function App() {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('market_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('market_categories');
    const data: Category[] = saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    return data.map(cat => ({
      ...cat,
      products: [...cat.products].sort((a, b) => a.localeCompare(b))
    }));
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [currentTotal, setCurrentTotal] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentUnit, setCurrentUnit] = useState('кг');

  // Picker state
  // Force refresh comment
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const productRef = useRef<HTMLButtonElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('market_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('market_items', JSON.stringify(items));
  }, [items]);

  const handleAddItem = () => {
    if (!currentProduct) return;

    let p = parseFloat(currentPrice);
    let t = parseFloat(currentTotal);
    let q = parseFloat(currentQuantity);

    // Auto-calculation logic: fill the empty field based on the other two
    if (isNaN(p) && !isNaN(t) && !isNaN(q) && q !== 0) {
      p = t / q;
    } else if (isNaN(t) && !isNaN(p) && !isNaN(q)) {
      t = p * q;
    } else if (isNaN(q) && !isNaN(p) && !isNaN(t) && p !== 0) {
      q = t / p;
    }

    if (isNaN(p) || isNaN(t) || isNaN(q)) {
      alert('Будь ласка, заповніть хоча б два поля з трьох (Ціна, Сума, К-ть)');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      product: currentProduct,
      price: parseFloat(p.toFixed(2)),
      total: parseFloat(t.toFixed(2)),
      quantity: parseFloat(q.toFixed(2)),
      unit: currentUnit,
    };

    setItems([...items, newItem]);
    resetInputs();
    setIsAdding(false);
  };

  const resetInputs = () => {
    setCurrentProduct('');
    setCurrentPrice('');
    setCurrentTotal('');
    setCurrentQuantity('');
    setCurrentUnit('кг');
    setSelectedCategoryId(null);
    setShowPicker(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleFinish = async () => {
    if (items.length === 0) return;

    // New format: Product \n c - total \n ц - price \n к - quantity unit
    const listText = items
      .map(item => `${item.product}\nс - ${item.total.toFixed(2)}\nц - ${item.price.toFixed(2)}\nк - ${item.quantity.toFixed(2)} ${item.unit}`)
      .join('\n\n');
    
    const total = items.reduce((acc, item) => acc + item.total, 0).toFixed(2);
    const fullText = `ПОХІД НА БАЗАР\n\n${listText}\n\nРазом: ${total}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ПОХІД НА БАЗАР',
          text: fullText,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        copyToClipboard(fullText);
      }
    } else {
      copyToClipboard(fullText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Список скопійовано! Вставте його в Google Keep.');
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null> | 'submit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === 'submit') {
        handleAddItem();
      } else if (nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const selectProduct = (product: string) => {
    setCurrentProduct(product);
    setShowPicker(false);
    setTimeout(() => {
      priceRef.current?.focus();
      // Scroll to the input form if it's at the bottom
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 150);
  };

  const addNewProductToCategory = (catId: string, prodName: string) => {
    if (!prodName.trim()) return;
    const newCategories = categories.map(cat => {
      if (cat.id === catId && !cat.products.includes(prodName)) {
        return {
          ...cat,
          products: [...cat.products, prodName].sort((a, b) => a.localeCompare(b))
        };
      }
      return cat;
    });
    setCategories(newCategories);
    selectProduct(prodName);
  };

  if (isEditingList) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 pb-20">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-emerald-500 uppercase tracking-tight">Налаштування</h1>
          <button onClick={() => setIsEditingList(false)} className="p-4 bg-zinc-900 rounded-2xl border-2 border-zinc-800 shadow-xl">
            <X size={32} />
          </button>
        </header>

        <div className="space-y-3 max-w-lg mx-auto">
          <button 
            onClick={() => {
              const name = prompt('Назва нової категорії:');
              if (name) {
                const newId = Date.now().toString();
                setCategories([...categories, { id: newId, name, products: [] }]);
                setExpandedCategories(prev => ({ ...prev, [newId]: true }));
              }
            }}
            className="w-full py-3.5 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-400 font-black uppercase text-base tracking-widest bg-zinc-900/30 hover:border-emerald-500/40 hover:text-emerald-400 transition-all shadow-xl"
          >
            + Нова категорія
          </button>

          {categories.map((cat, catIdx) => {
            const isExpanded = !!expandedCategories[cat.id];
            return (
              <div key={cat.id} className={`bg-zinc-900 border-2 border-zinc-800 rounded-2xl shadow-xl transition-all ${isExpanded ? 'p-4' : 'px-4 py-2.5'}`}>
                <div className="flex justify-between items-center gap-3">
                  <button
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                  >
                    <ChevronDown 
                      size={20} 
                      className={`text-emerald-400 transition-transform shrink-0 ${isExpanded ? '' : '-rotate-90'}`} 
                    />
                    <span className="font-black text-xl leading-none text-emerald-400 truncate">{cat.name}</span>
                    <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                      {cat.products.length}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      if(confirm(`Видалити категорію ${cat.name}?`)) {
                        setCategories(categories.filter(c => c.id !== cat.id));
                      }
                    }}
                    className="text-zinc-600 hover:text-red-500 p-1 shrink-0"
                    title="Видалити категорію"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-zinc-500 tracking-wider shrink-0">Назва:</span>
                      <input 
                        className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-xl font-bold text-base text-emerald-300 focus:outline-none focus:border-emerald-500 w-full"
                        value={cat.name}
                        onChange={(e) => {
                          const newCats = [...categories];
                          newCats[catIdx].name = e.target.value;
                          setCategories(newCats);
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cat.products.map((prod, prodIdx) => (
                        <div key={prodIdx} className="bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                          <span className="text-zinc-100">{prod}</span>
                          <button 
                            onClick={() => {
                              const newCats = [...categories];
                              newCats[catIdx].products.splice(prodIdx, 1);
                              setCategories(newCats);
                            }}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const name = prompt('Назва нового продукту:');
                          if (name) {
                            const newCats = [...categories];
                            if (!newCats[catIdx].products.includes(name)) {
                              newCats[catIdx].products.push(name);
                              newCats[catIdx].products.sort((a, b) => a.localeCompare(b));
                              setCategories(newCats);
                            }
                          }
                        }}
                        className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-xl text-sm font-black border border-emerald-500/30 hover:bg-emerald-900/60 transition-all"
                      >
                        + Продукт
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-5 pb-32 overflow-x-hidden">
      <header className="mb-8 pt-6 flex flex-col items-center gap-4">
        <h1 className="text-4xl font-black tracking-tighter text-center uppercase italic text-emerald-400">
          Похід на Базар
        </h1>
        <button 
          onClick={() => setIsEditingList(true)}
          className="text-sm uppercase tracking-widest font-bold text-zinc-300 border-2 border-zinc-700 px-6 py-3 rounded-full hover:bg-zinc-900 transition-colors bg-zinc-900/50 shadow-lg"
        >
          Налаштування продуктів
        </button>
      </header>

      <main className="max-w-lg mx-auto space-y-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 flex justify-between items-center shadow-xl"
            >
              <div className="flex-1 overflow-hidden py-2">
                <h3 className="font-black text-3xl leading-tight truncate text-white">{item.product}</h3>
                <div className="text-zinc-100 text-base font-mono mt-4 flex flex-wrap gap-x-6 gap-y-3">
                  <span className="bg-zinc-800 px-3 py-1.5 rounded-xl border-2 border-zinc-700/50 font-black shadow-inner">с - {item.total.toFixed(2)}</span>
                  <span className="bg-zinc-800 px-3 py-1.5 rounded-xl border-2 border-zinc-700/50 font-black text-emerald-400 shadow-inner">ц - {item.price.toFixed(2)}</span>
                  <span className="bg-zinc-800 px-3 py-1.5 rounded-xl border-2 border-zinc-700/50 font-black text-blue-400 text-xl shadow-inner">к - {item.quantity.toFixed(2)} {item.unit}</span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-4 text-zinc-500 hover:text-red-500 transition-colors ml-4 bg-zinc-800/50 rounded-2xl border-2 border-zinc-800 shadow-lg"
              >
                <Trash2 size={32} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border-2 border-emerald-500/50 rounded-3xl p-6 space-y-6 shadow-2xl mt-4"
          >
            <div className="flex justify-between items-center pb-4 border-b-2 border-zinc-800">
              <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">Новий запис</h2>
              <button onClick={() => { setIsAdding(false); resetInputs(); }} className="text-zinc-400 hover:text-white p-2">
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-end gap-2">
                <div className="relative w-[211px]">
                  <label className="block text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Продукт</label>
                  <button
                    ref={productRef}
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-[211px] bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-4 py-3.5 text-left flex justify-between items-center focus:outline-none focus:border-emerald-500 transition-colors text-xl font-bold shadow-inner"
                  >
                    <span className={`truncate ${currentProduct ? 'text-zinc-50' : 'text-zinc-500'}`}>
                      {currentProduct || 'Оберіть...'}
                    </span>
                    <Plus size={24} className={`transition-transform text-emerald-400 shrink-0 ${showPicker ? 'rotate-45' : ''}`} />
                  </button>

                  {showPicker && (
                    <div className="absolute z-50 top-full left-0 w-72 mt-4 bg-zinc-900 border-2 border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-96 flex flex-col">
                      {!selectedCategoryId ? (
                        <div className="p-3 grid grid-cols-2 gap-3 overflow-y-auto">
                          {categories.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className="bg-zinc-800 p-5 rounded-xl text-sm font-black uppercase tracking-tight text-center hover:bg-zinc-700 active:scale-95 transition-all text-zinc-200"
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 flex flex-col h-full overflow-hidden">
                          <div className="flex items-center gap-2 mb-4">
                            <button 
                              onClick={() => setSelectedCategoryId(null)}
                              className="bg-zinc-800 p-3 rounded-xl text-zinc-400"
                            >
                              <X size={20} />
                            </button>
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{categories.find(c => c.id === selectedCategoryId)?.name}</h3>
                          </div>

                          {/* Add new product directly in picker */}
                          <div className="flex gap-2 mb-4">
                            <input 
                              id="new-prod-picker"
                              type="text" 
                              placeholder="Новий продукт..."
                              className="flex-1 bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-emerald-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addNewProductToCategory(selectedCategoryId, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                const input = document.getElementById('new-prod-picker') as HTMLInputElement;
                                addNewProductToCategory(selectedCategoryId, input.value);
                                input.value = '';
                              }}
                              className="bg-emerald-600 px-4 rounded-xl font-bold"
                            >
                              +
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-4">
                            {categories.find(c => c.id === selectedCategoryId)?.products.map((prod, i) => (
                              <button
                                key={i}
                                onClick={() => selectProduct(prod)}
                                className="bg-zinc-800 p-4 rounded-xl text-lg font-bold text-center hover:bg-emerald-900/40 hover:text-emerald-400 active:scale-95 transition-all text-zinc-100"
                              >
                                {prod}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Units selection block moved to top row vertically */}
                <div className="flex flex-col justify-center gap-1 bg-zinc-800 border-2 border-zinc-700 rounded-2xl p-1.5">
                  {UNITS.map(unit => (
                    <button
                      key={unit}
                      onClick={() => setCurrentUnit(unit)}
                      className={`px-3 py-1 text-xs font-black uppercase rounded-lg transition-all text-center ${
                        currentUnit === unit 
                          ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 shadow-inner scale-105' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 text-center">Ціна</label>
                  <input
                    ref={priceRef}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, totalRef)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-2 py-3 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-center text-xl font-black text-zinc-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 text-center">Сума</label>
                  <input
                    ref={totalRef}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={currentTotal}
                    onChange={(e) => setCurrentTotal(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, quantityRef)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-2 py-3 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-center text-xl font-black text-zinc-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 text-center">К-ть</label>
                  <input
                    ref={quantityRef}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'submit')}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl px-2 py-3 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-center text-xl font-black text-zinc-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="w-full h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 text-lg uppercase tracking-widest mt-4"
              >
                <Check size={22} /> Зберегти
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => {
              setIsAdding(true);
              setShowPicker(true);
            }}
            className="w-full py-8 border-4 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center gap-4 text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all group bg-zinc-900/20"
          >
            <Plus size={32} className="group-hover:scale-110 transition-transform" />
            <span className="text-lg uppercase tracking-widest font-black">Додати продукт</span>
          </button>
        )}

        {items.length > 0 && (
          <div className="pt-8 flex items-center gap-4 sticky bottom-6 z-40">
            <div className="flex-1 bg-zinc-950/90 backdrop-blur-xl border-4 border-emerald-500/30 px-6 py-5 rounded-3xl flex flex-col justify-center shadow-2xl">
              <span className="text-xs uppercase text-zinc-400 font-black tracking-widest leading-none mb-2">Разом до сплати</span>
              <span className="text-4xl font-black text-emerald-400 font-mono leading-none">
                {items.reduce((acc, item) => acc + item.total, 0).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleFinish}
              className="w-20 h-20 bg-zinc-900 border-4 border-zinc-700 text-emerald-400 rounded-3xl flex items-center justify-center hover:bg-zinc-800 hover:border-emerald-500/50 transition-all active:scale-90 group shadow-2xl"
              title="Поділитися списком"
            >
              <Share2 size={36} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

