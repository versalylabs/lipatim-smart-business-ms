import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory } from '../../types/inventory';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  FolderPlus,
  ArrowRight,
  Boxes,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditingId?: string | null;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  initialEditingId,
  onSelectCategory,
}) => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useApp();

  // Create form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [createError, setCreateError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  // Deleting state (confirmation + reassignment)
  const [deletingCat, setDeletingCat] = useState<ProductCategory | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  useEffect(() => {
    if (initialEditingId) {
      const target = categories.find((c) => c.id === initialEditingId);
      if (target) {
        setEditingId(target.id);
        setEditName(target.name);
        setEditDesc(target.description || '');
      }
    } else {
      setEditingId(null);
    }
  }, [initialEditingId, categories, isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (category: ProductCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDesc(category.description || '');
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Category name cannot be empty.');
      return;
    }

    if (!editingId) return;

    updateCategory(editingId, {
      name: editName.trim(),
      description: editDesc.trim(),
    });

    setEditingId(null);
    setEditName('');
    setEditDesc('');
    setEditError('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCreateError('Please enter a category name.');
      return;
    }

    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setCreateError(`A category named "${trimmed}" already exists.`);
      return;
    }

    const created = addCategory({
      name: trimmed,
      description: newCatDesc.trim(),
    });

    setNewCatName('');
    setNewCatDesc('');
    setCreateError('');

    if (onSelectCategory) {
      onSelectCategory(created.id);
    }
  };

  const handlePromptDelete = (category: ProductCategory) => {
    if (categories.length <= 1) {
      alert('You cannot delete the only remaining category.');
      return;
    }

    setDeletingCat(category);
    const otherCats = categories.filter((c) => c.id !== category.id);
    setReassignTargetId(otherCats[0]?.id || '');
  };

  const handleConfirmDelete = () => {
    if (!deletingCat) return;

    const res = deleteCategory(deletingCat.id, reassignTargetId || undefined);
    if (res.success) {
      setDeletingCat(null);
      setReassignTargetId('');
      if (editingId === deletingCat.id) {
        handleCancelEdit();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Manage Goods &amp; Inventory Categories
              </h2>
              <p className="text-xs text-slate-500">
                Add, rename, and delete inventory classifications across catalog &amp; POS checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close category manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Quick Add New Category Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>Add New Category</span>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setCreateError('');
                    }}
                    placeholder="e.g. Cosmetics & Personal Care"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="e.g. Soaps, lotions, fragrances & dental"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              {createError && (
                <div className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save New Category</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Delete Category Confirmation Dialog (when active) */}
          {deletingCat && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-rose-900">
                    Delete Category: &quot;{deletingCat.name}&quot;?
                  </div>
                  <p className="text-rose-700 text-[11px] leading-relaxed">
                    {(() => {
                      const count = products.filter((p) => p.categoryId === deletingCat.id).length;
                      if (count > 0) {
                        return `This category contains ${count} active product(s). To prevent orphaned inventory items, please select a replacement category to move them into:`;
                      }
                      return 'Are you sure you want to delete this category? This action will remove it from the filter bar and product forms.';
                    })()}
                  </p>
                </div>
              </div>

              {products.filter((p) => p.categoryId === deletingCat.id).length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reassign affected products to:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                  >
                    {categories
                      .filter((c) => c.id !== deletingCat.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Categories Table / List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
              <span>Existing Categories ({categories.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">
                Click pencil to edit or trash to remove
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white shadow-2xs">
              {categories.map((cat) => {
                const isEditingThis = editingId === cat.id;
                const itemCount = products.filter((p) => p.categoryId === cat.id).length;

                if (isEditingThis) {
                  return (
                    <form
                      key={cat.id}
                      onSubmit={handleSaveEdit}
                      className="p-3.5 bg-emerald-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Editing Category: {cat.name}</span>
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700">
                          {itemCount} active item(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Category Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Optional category description"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      {editError && (
                        <div className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{editError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium shrink-0">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      {cat.description ? (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cat.description}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                          Slug: {cat.slug}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        title="Edit category name & description"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptDelete(cat)}
                        disabled={categories.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          categories.length <= 1
                            ? 'Cannot delete the only remaining category'
                            : 'Delete category'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Changes take effect immediately across all inventory and POS search bars.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
