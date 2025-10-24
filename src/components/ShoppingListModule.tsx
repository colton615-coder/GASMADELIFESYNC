import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import Module from '@/components/Module';
import { ShoppingCartIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons';
import usePersistentState from '@/hooks/usePersistentState';
import AnimatedCheckbox from '@/components/AnimatedCheckbox';
import { logToDailyLog } from '@/services/logService';

interface ShoppingItem {
  id: number;
  text: string;
  completed: boolean;
  category: string | null;
}

const ShoppingListModule: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [items, setItems] = usePersistentState<ShoppingItem[]>('shoppingListItems', []);
  const [itemCategoryMap, setItemCategoryMap] = usePersistentState<Record<string, string>>('shoppingItemCategoryMap', {});

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingItemCategory, setEditingItemCategory] = useState('');

  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [isClearingCompleted, setIsClearingCompleted] = useState<boolean>(false);
  const [justAddedItemId, setJustAddedItemId] = useState<number | null>(null);

  // One-time data migration to add category field
  useEffect(() => {
    const migrationKey = 'shoppingListMigrationV2_category';
    if (localStorage.getItem(migrationKey)) return;

    const needsMigration = items.some((item: ShoppingItem) => typeof item.category === 'undefined');
    if (needsMigration) {
        const updatedItems = items.map((item: ShoppingItem) => ({
          ...item,
          category: (item as any).category !== undefined ? (item as any).category : null
        }));
        setItems(updatedItems);
    }
    localStorage.setItem(migrationKey, 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect for auto-suggesting category
  useEffect(() => {
    const handler = setTimeout(() => {
      const key = newItemText.trim().toLowerCase();
      if (itemCategoryMap[key]) {
        setNewItemCategory(itemCategoryMap[key]);
      }
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [newItemText, itemCategoryMap]);

  const hasCompletedItems = useMemo(() => items.some((item: ShoppingItem) => item.completed), [items]);

  const sortedItems = useMemo(() => [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.id - b.id;
  }), [items]);

  const groupedItems = useMemo(() => {
    return sortedItems.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>);
  }, [sortedItems]);

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });
  }, [groupedItems]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedText = newItemText.trim();
    if (trimmedText === '') return;

    const trimmedCategory = newItemCategory.trim();
    const newItem: ShoppingItem = {
      id: Date.now(),
      text: trimmedText,
      completed: false,
      category: trimmedCategory || null,
    };
    setItems([...items, newItem]);
    logToDailyLog('shopping_item_added', { text: newItem.text, category: newItem.category || 'none' });

    if (trimmedCategory) {
        setItemCategoryMap({ ...itemCategoryMap, [trimmedText.toLowerCase()]: trimmedCategory });
    }

    setNewItemText('');
    setNewItemCategory('');
    setJustAddedItemId(newItem.id);
    setTimeout(() => {
        setJustAddedItemId(null);
    }, 500);
  };

  const toggleItemCompletion = (id: number) => {
    const itemToToggle = items.find((item: ShoppingItem) => item.id === id);
    if (itemToToggle && !itemToToggle.completed) {
        logToDailyLog('shopping_item_completed', { itemId: id, text: itemToToggle.text });
    }
    setItems(
      items.map((item: ShoppingItem) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleStartEdit = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditingItemText(item.text);
    setEditingItemCategory(item.category || '');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemText('');
    setEditingItemCategory('');
  };

  const handleUpdateItem = () => {
    const trimmedText = editingItemText.trim();
    if (!editingItemId || trimmedText === '') {
        handleCancelEdit();
        return;
    }
    const trimmedCategory = editingItemCategory.trim();
    setItems(
      items.map((item: ShoppingItem) =>
        item.id === editingItemId ? { ...item, text: trimmedText, category: trimmedCategory || null } : item
      )
    );

    if (trimmedCategory) {
        setItemCategoryMap({ ...itemCategoryMap, [trimmedText.toLowerCase()]: trimmedCategory });
    }
    handleCancelEdit();
  };

  const handleDeleteItem = (id: number) => {
    setDeletingItemId(id);
  };

  const confirmDeleteItem = () => {
    if (deletingItemId !== null) {
      setItems(items.filter((item: ShoppingItem) => item.id !== deletingItemId));
      setDeletingItemId(null);
    }
  };
  
  const confirmClearCompleted = () => {
    setItems(items.filter((item: ShoppingItem) => !item.completed));
    setIsClearingCompleted(false);
  };

  const uniqueCategories = useMemo(() => [...new Set(Object.values(itemCategoryMap))], [itemCategoryMap]);

  return (
    <Module title="Shopping List" icon={<ShoppingCartIcon />} className={className}>
      <div className="flex flex-col h-full">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-2">
            <div className="flex-grow grid grid-cols-3 gap-2">
                 <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add an item..."
                    className="col-span-2 bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    aria-label="New shopping item"
                />
                <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="Category"
                    className="col-span-1 bg-white/10 text-white placeholder-gray-400 border border-transparent rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    aria-label="Item category"
                    list="category-suggestions"
                />
                 <datalist id="category-suggestions">
                    {uniqueCategories.map((cat: string) => <option key={cat} value={cat} />)}
                </datalist>
            </div>
            <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition font-semibold flex items-center justify-center gap-2 active:scale-95"
                aria-label="Add item"
            >
                <PlusIcon className="w-4 h-4" />
                <span>Add</span>
            </button>
        </form>

        <div className="h-12 flex items-center justify-end">
            {hasCompletedItems && !isClearingCompleted && (
                <button
                    onClick={() => setIsClearingCompleted(true)}
                    className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 rounded-md hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors"
                >
                    Clear Completed
                </button>
            )}
            {isClearingCompleted && (
                <div className="w-full flex items-center justify-between text-sm p-2 rounded-md bg-white/5">
                    <span className="text-gray-300">Clear all purchased items?</span>
                    <div className="flex items-center gap-2">
                        <button onClick={confirmClearCompleted} className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors" aria-label="Confirm clear completed"><CheckIcon className="w-4 h-4" /></button>
                        <button onClick={() => setIsClearingCompleted(false)} className="p-2 rounded-full text-gray-300 bg-white/10 hover:bg-white/20 transition-colors" aria-label="Cancel clear completed"><XIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-4 overflow-y-auto max-h-72 pr-2">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(category => (
                <div key={category}>
                    <h3 className="text-caption font-semibold text-indigo-300 mb-2 border-b border-white/10 pb-2 capitalize">{category}</h3>
                    <ul className="space-y-2">
                        {groupedItems[category].map((item: ShoppingItem) => (
                            <li
                                key={item.id}
                                className={`group flex items-center gap-4 p-2 rounded-md transition-all duration-300 ease-in-out ${
                                item.completed ? 'bg-green-500/10' : 'hover:bg-white/10'
                                } ${
                                editingItemId === item.id ? 'bg-white/15' : ''
                                } ${
                                deletingItemId === item.id ? 'bg-red-500/10' : ''
                                } ${
                                    justAddedItemId === item.id ? 'item-enter-animation' : ''
                                }`}
                                aria-label={`Item: ${item.text}, Status: ${item.completed ? 'Purchased' : 'Needed'}`}
                            >
                                {deletingItemId === item.id ? (
                                    <div className="w-full flex items-center justify-between text-sm">
                                        <span className="text-red-400 font-semibold">Delete this item?</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={confirmDeleteItem} className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors" aria-label="Confirm delete"><CheckIcon className="w-4 h-4" /></button>
                                            <button onClick={() => setDeletingItemId(null)} className="p-2 rounded-full text-gray-300 bg-white/10 hover:bg-white/20 transition-colors" aria-label="Cancel delete"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ) : editingItemId === item.id ? (
                                    <div className="w-full">
                                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateItem(); }} className="flex flex-col gap-2 text-sm">
                                            <div className="flex gap-2">
                                                <input type="text" value={editingItemText} onChange={(e) => setEditingItemText(e.target.value)} className="w-2/3 bg-white/10 text-white border border-transparent rounded-md px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" autoFocus />
                                                <input type="text" value={editingItemCategory} onChange={(e) => setEditingItemCategory(e.target.value)} placeholder="Category" className="w-1/3 bg-white/10 text-white border border-transparent rounded-md px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-400" list="category-suggestions" />
                                            </div>
                                            <div className="flex justify-end items-center gap-2">
                                                <button type="button" onClick={handleCancelEdit} className="px-2 py-2 text-xs rounded bg-white/10 hover:bg-white/20">Cancel</button>
                                                <button type="submit" className="px-2 py-2 text-xs rounded bg-indigo-600 hover:bg-indigo-700">Save</button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                <>
                                    <AnimatedCheckbox
                                      checked={item.completed}
                                      onChange={() => toggleItemCompletion(item.id)}
                                      variant="square"
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                        <span onClick={() => toggleItemCompletion(item.id)} className={`text-body cursor-pointer transition-colors duration-300 break-words ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                            {item.text}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-auto pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEdit(item)} className="p-2 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/20 transition-colors" aria-label={`Edit item: ${item.text}`}><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-colors" aria-label={`Delete item: ${item.text}`}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))
          ) : (
            <div className="text-center py-8 text-caption">
              <p>Your shopping list is empty.</p>
              <p className="mt-2">Add some items to get started!</p>
            </div>
          )}
        </div>
      </div>
    </Module>
  );
};

export default ShoppingListModule;