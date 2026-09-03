import React, { useState, useEffect } from 'react';
import { Package, Layers, Plus, Database } from 'lucide-react';
import apiClient from '../../core/api/client';
import { ProductsListPage } from './ProductsListPage';
import { ProductDetailPage } from './ProductDetailPage';

export const ProductsModulePage: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>('products');

  const [materials, setMaterials] = useState<any[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: 'Metals',
    recycled_content_pct: 0.0
  });

  const fetchMaterials = () => {
    apiClient.get('/products/materials')
      .then((res: any) => setMaterials(res.data || []))
      .catch(() => setMaterials([]));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products/materials', {
        name: materialForm.name,
        category: materialForm.category,
        recycled_content_pct: parseFloat(materialForm.recycled_content_pct as any)
      });
      setShowMaterialModal(false);
      setMaterialForm({ name: '', category: 'Metals', recycled_content_pct: 0.0 });
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Error creating material');
    }
  };

  if (selectedProductId) {
    return (
      <ProductDetailPage
        productId={selectedProductId}
        onBack={() => setSelectedProductId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* MODULE TAB NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'products' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" /> Products Catalog & LCA
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'materials' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-400" /> Materials & Component Library
        </button>
      </div>

      {activeTab === 'products' && (
        <ProductsListPage onSelectProduct={(id) => setSelectedProductId(id)} />
      )}

      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">Raw Materials Library ({materials.length})</h2>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Register Material
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    {m.category}
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">{m.recycled_content_pct}% Recycled</span>
                </div>
                <h3 className="font-bold text-slate-100">{m.name}</h3>
              </div>
            ))}
          </div>

          {showMaterialModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Register Raw Material</h3>
                <form onSubmit={handleCreateMaterial} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Material Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Recycled Eco-Aluminum"
                      value={materialForm.name}
                      onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category</label>
                    <select
                      value={materialForm.category}
                      onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                    >
                      <option value="Metals">Metals</option>
                      <option value="Plastics">Plastics</option>
                      <option value="Textiles">Textiles</option>
                      <option value="Bio-based">Bio-based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Recycled Content (%)</label>
                    <input
                      type="number"
                      step="any"
                      value={materialForm.recycled_content_pct}
                      onChange={(e) => setMaterialForm({ ...materialForm, recycled_content_pct: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowMaterialModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                    <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Material</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
