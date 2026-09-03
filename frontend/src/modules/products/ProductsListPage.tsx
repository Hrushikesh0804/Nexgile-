import React, { useState, useEffect } from 'react';
import { Package, Plus, Layers, ArrowRight, FileText } from 'lucide-react';
import apiClient from '../../core/api/client';

interface Props {
  onSelectProduct: (productId: string) => void;
}

export const ProductsListPage: React.FC<Props> = ({ onSelectProduct }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Consumer Electronics',
    functional_unit: '1 Unit for 5 Years Use',
    description: ''
  });

  const fetchProducts = () => {
    apiClient.get('/products')
      .then((res: any) => setProducts(res.data || []))
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products', form);
      setShowModal(false);
      setForm({ name: '', code: '', category: 'Consumer Electronics', functional_unit: '1 Unit for 5 Years Use', description: '' });
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Product Footprint Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">Product Catalog & LCA Boundaries</h1>
          <p className="text-slate-400 text-sm">Product Carbon Footprints (PCF), Hierarchical Bill of Materials (BOM), and LCA Stage Analysis</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Create Product / SKU
        </button>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {p.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Code: {p.code}</span>
              </div>

              <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
              <p className="text-xs text-slate-400">{p.description || 'No description provided.'}</p>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                <p>Functional Unit: <strong className="text-slate-200">{p.functional_unit}</strong></p>
              </div>
            </div>

            <button
              onClick={() => onSelectProduct(p.id)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 py-2 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-all"
            >
              <span>View BOM & PCF Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-3 glass-panel p-8 text-center text-slate-500 text-xs rounded-2xl">
            No products defined yet. Click "Create Product / SKU" to register a product and build its BOM.
          </div>
        )}
      </div>

      {/* CREATE PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. DecarbX Pro Environmental Sensor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Code</label>
                <input
                  type="text"
                  placeholder="e.g. PROD_SENSOR_X"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  <option value="Consumer Electronics">Consumer Electronics</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Apparel & Textiles">Apparel & Textiles</option>
                  <option value="Industrial Equipment">Industrial Equipment</option>
                  <option value="Packaging & Containers">Packaging & Containers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Functional Unit</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Sensor for 5 Years Operation"
                  value={form.functional_unit}
                  onChange={(e) => setForm({ ...form, functional_unit: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
