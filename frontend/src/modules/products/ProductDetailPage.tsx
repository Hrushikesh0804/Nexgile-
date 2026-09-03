import React, { useState, useEffect } from 'react';
import { ArrowLeft, Layers, Plus, Calculator, Download, GitCommit, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import apiClient from '../../core/api/client';
import { LineageDrawer } from '../carbon/LineageDrawer';
import { ScenarioPanel } from './ScenarioPanel';

interface Props {
  productId: string;
  onBack: () => void;
}

export const ProductDetailPage: React.FC<Props> = ({ productId, onBack }) => {
  const [product, setProduct] = useState<any | null>(null);
  const [boms, setBoms] = useState<any[]>([]);
  const [pcfs, setPcfs] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [boundaryType, setBoundaryType] = useState('cradle-to-gate');
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);

  const [showBomModal, setShowBomModal] = useState(false);
  const [bomForm, setBomForm] = useState({
    component_name: '',
    material_id: '',
    quantity: 1.0,
    unit: 'kg',
    loss_rate_pct: 0.0
  });

  const [calculating, setCalculating] = useState(false);
  const [reportExport, setReportExport] = useState<any | null>(null);

  const fetchDetail = () => {
    Promise.all([
      apiClient.get('/products').catch(() => ({ data: [] })),
      apiClient.get(`/products/${productId}/boms`).catch(() => ({ data: [] })),
      apiClient.get(`/products/${productId}/pcfs`).catch(() => ({ data: [] })),
      apiClient.get('/products/materials').catch(() => ({ data: [] })),
    ]).then(([prodRes, bomRes, pcfRes, matRes]) => {
      const found = (prodRes.data || []).find((p: any) => p.id === productId);
      setProduct(found || null);
      setBoms(bomRes.data || []);
      setPcfs(pcfRes.data || []);
      setMaterials(matRes.data || []);
      if (matRes.data && matRes.data.length > 0 && !bomForm.material_id) {
        setBomForm((prev) => ({ ...prev, material_id: matRes.data[0].id }));
      }
    });
  };

  useEffect(() => {
    fetchDetail();
  }, [productId]);

  const handleAddBom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/products/boms', {
        product_id: productId,
        component_name: bomForm.component_name,
        material_id: bomForm.material_id,
        quantity: parseFloat(bomForm.quantity as any),
        unit: bomForm.unit,
        loss_rate_pct: parseFloat(bomForm.loss_rate_pct as any)
      });
      setShowBomModal(false);
      setBomForm({ component_name: '', material_id: materials[0]?.id || '', quantity: 1.0, unit: 'kg', loss_rate_pct: 0.0 });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error adding BOM item');
    }
  };

  const handleCalculatePcf = async () => {
    setCalculating(true);
    try {
      // 1. Register or update LCA boundary context
      const lcaRes: any = await apiClient.post('/products/lcas', {
        product_id: productId,
        name: `LCA ${boundaryType}`,
        boundary_type: boundaryType,
        system_boundary_description: `Product system boundary set to ${boundaryType}`
      });

      // 2. Execute PCF calculation engine
      await apiClient.post(`/products/${productId}/calculate-pcf?lca_id=${lcaRes.data.id}`);
      setCalculating(false);
      fetchDetail();
    } catch (err: any) {
      setCalculating(false);
      alert(err.message || 'Error executing PCF engine');
    }
  };

  const handleExportReport = async (pcfId: string) => {
    try {
      const res: any = await apiClient.get(`/products/pcfs/${pcfId}/report`);
      setReportExport(res.data);
    } catch (err: any) {
      alert(err.message || 'Report export failed');
    }
  };

  const latestPcf = pcfs.length > 0 ? pcfs[0] : null;

  return (
    <div className="space-y-6">
      {/* TOP NAV BAR */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCalculatePcf}
            disabled={calculating || boms.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" /> {calculating ? 'Calculating PCF...' : 'Run Actual PCF Engine'}
          </button>
          {latestPcf && (
            <button
              onClick={() => handleExportReport(latestPcf.id)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export PCF Report
            </button>
          )}
        </div>
      </div>

      {/* PRODUCT HEADER & LCA BOUNDARY SELECTOR */}
      {product && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Code: {product.code}
            </span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">{product.name}</h1>
            <p className="text-slate-400 text-sm">Functional Unit: <span className="text-slate-200 font-medium">{product.functional_unit}</span></p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 px-2">LCA Boundary:</span>
            <select
              value={boundaryType}
              onChange={(e) => setBoundaryType(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-medium py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer border border-slate-700"
            >
              <option value="cradle-to-gate">Cradle-to-Gate (Raw Materials → Factory Gate)</option>
              <option value="gate-to-gate">Gate-to-Gate (Manufacturing Process Only)</option>
              <option value="cradle-to-grave">Cradle-to-Grave (Full Lifecycle + EOL Use)</option>
            </select>
          </div>
        </div>
      )}

      {/* PCF SUMMARY & STAGE BREAKDOWN CARD */}
      {latestPcf && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Carbon Footprint (PCF Actual)</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold text-emerald-400">{latestPcf.total_co2e_kg.toFixed(2)}</span>
                <span className="text-sm font-medium text-slate-400">kgCO2e per {product?.functional_unit || 'Unit'}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCalcId(latestPcf.id)}
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-all"
            >
              <GitCommit className="w-4 h-4 text-emerald-400" /> Inspect Product Lineage Trail
            </button>
          </div>

          {/* STAGE BREAKDOWN METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Raw Materials</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.material_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Manufacturing</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.manufacturing_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Packaging</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.packaging_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Transport</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.transport_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Facility Energy</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.energy_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">End-Of-Life (EOL)</p>
              <p className="text-base font-bold text-slate-100">{latestPcf.eol_co2e_kg.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">kg</span></p>
            </div>
          </div>
        </div>
      )}

      {/* HIERARCHICAL BILL OF MATERIALS (BOM) TREE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Bill of Materials (BOM) Tree ({boms.length} Components)
          </h2>
          <button
            onClick={() => setShowBomModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Component
          </button>
        </div>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Component Name</th>
              <th className="p-4">Material Specification</th>
              <th className="p-4">Quantity / Unit</th>
              <th className="p-4">Process Scrap Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {boms.map((item) => {
              const mat = materials.find((m) => m.id === item.material_id);
              return (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {item.component_name}
                  </td>
                  <td className="p-4 text-xs text-slate-300">{mat ? mat.name : 'Generic Material'}</td>
                  <td className="p-4 font-mono text-xs text-slate-200">{item.quantity} {item.unit}</td>
                  <td className="p-4 text-xs text-amber-400">{item.loss_rate_pct}%</td>
                </tr>
              );
            })}
            {boms.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 text-xs">
                  No BOM components added yet. Click "Add Component" to define materials for this product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SCENARIO SIMULATION PANEL */}
      {latestPcf && (
        <ScenarioPanel
          productId={productId}
          latestPcf={latestPcf}
          materials={materials}
        />
      )}

      {/* ADD BOM MODAL */}
      {showBomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Add BOM Component</h3>
            <form onSubmit={handleAddBom} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Component Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aluminum Enclosure Shell"
                  value={bomForm.component_name}
                  onChange={(e) => setBomForm({ ...bomForm, component_name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Material</label>
                <select
                  value={bomForm.material_id}
                  onChange={(e) => setBomForm({ ...bomForm, material_id: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={bomForm.quantity}
                    onChange={(e) => setBomForm({ ...bomForm, quantity: parseFloat(e.target.value) })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    value={bomForm.unit}
                    onChange={(e) => setBomForm({ ...bomForm, unit: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Manufacturing Loss Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={bomForm.loss_rate_pct}
                  onChange={(e) => setBomForm({ ...bomForm, loss_rate_pct: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowBomModal(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-semibold">Save Component</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT DISCLOSURE MODAL */}
      {reportExport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> PCF Disclosure Report Package
              </h3>
              <button onClick={() => setReportExport(null)} className="text-xs text-slate-400 hover:text-slate-200">Close</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Product: <strong className="text-slate-100">{reportExport.product_name} ({reportExport.product_code})</strong></p>
              <p>LCA Boundary: <strong className="text-emerald-400 uppercase">{reportExport.lca_boundary}</strong></p>
              <p>Total Footprint: <strong className="text-2xl text-emerald-400 font-bold block mt-1">{reportExport.total_pcf_co2e_kg} kgCO2e</strong></p>
              
              <div className="p-3 bg-slate-900 rounded-xl space-y-1 border border-slate-800">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Audit Lineage Links</p>
                {reportExport.lineage_links?.map((link: any, idx: number) => (
                  <p key={idx} className="font-mono text-[10px] text-slate-400">
                    • {link.component_name}: {link.quantity} → Lineage ID: <span className="text-emerald-400">{link.lineage_id}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setReportExport(null)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* LINEAGE DRAWER */}
      <LineageDrawer calculationId={selectedCalcId} onClose={() => setSelectedCalcId(null)} />
    </div>
  );
};
