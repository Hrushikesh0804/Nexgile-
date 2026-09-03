import React, { useState } from 'react';
import { Plus, Trash2, Globe, Send, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/client';

interface Props {
  onSuccess: () => void;
}

export const QuestionnaireBuilder: React.FC<Props> = ({ onSuccess }) => {
  const [title, setTitle] = useState('2025 Corporate Scope 3 & Product Carbon Footprint Disclosure');
  const [description, setDescription] = useState('Mandatory annual ESG & GHG emission survey campaign for key suppliers.');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['EN', 'DE', 'FR', 'ES', 'ZH', 'JA']);

  const [fields, setFields] = useState<any[]>([
    { field_id: 'scope1_co2e', label: 'Scope 1 Direct CO2e (tCO2e)', type: 'number', required: true },
    { field_id: 'scope2_co2e', label: 'Scope 2 Purchased Energy (tCO2e)', type: 'number', required: true },
    { field_id: 'renewable_pct', label: '% Electricity from Renewable Sources', type: 'number', required: false },
    { field_id: 'evidence_doc', label: 'Third-Party GHG Audit Certificate', type: 'file', required: true }
  ]);

  const [newField, setNewField] = useState({ field_id: '', label: '', type: 'number', required: true });
  const [saving, setSaving] = useState(false);

  const handleAddField = () => {
    if (!newField.label) return;
    const fId = newField.field_id || newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setFields([...fields, { ...newField, field_id: fId }]);
    setNewField({ field_id: '', label: '', type: 'number', required: true });
  };

  const handleRemoveField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/suppliers/questionnaires', {
        title,
        description,
        fields,
        languages_list: selectedLangs
      });
      setSaving(false);
      onSuccess();
    } catch (err: any) {
      setSaving(false);
      alert(err.message || 'Failed to publish campaign');
    }
  };

  const availableLanguages = ['EN', 'DE', 'FR', 'ES', 'ZH', 'JA', 'IT', 'PT', 'NL', 'PL', 'KO', 'HI', 'AR'];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Campaign Design Studio
        </span>
        <h2 className="text-xl font-bold text-slate-100 mt-1">Scope 3 Questionnaire Builder</h2>
        <p className="text-xs text-slate-400">Design dynamic field schemas and multi-language translations (MongoDB schema store)</p>
      </div>

      <form onSubmit={handleSaveCampaign} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Supported Languages (25+ i18n Sub-document)</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 border border-slate-700 rounded-xl max-h-20 overflow-y-auto">
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (selectedLangs.includes(lang)) {
                      setSelectedLangs(selectedLangs.filter((l) => l !== lang));
                    } else {
                      setSelectedLangs([...selectedLangs, lang]);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    selectedLangs.includes(lang)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DYNAMIC FIELD CREATOR */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dynamic Fields Schema ({fields.length} Fields)</h3>

          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-slate-200">{f.label} <span className="font-mono text-[10px] text-emerald-400">({f.field_id})</span></p>
                  <p className="text-[10px] text-slate-500">Type: {f.type} | Required: {f.required ? 'Yes' : 'No'}</p>
                </div>
                <button type="button" onClick={() => handleRemoveField(idx)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <p className="text-xs font-semibold text-slate-300">Add New Dynamic Field</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Field Label (e.g. Water Use (m3))"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
              />
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
              >
                <option value="number">Numeric Input</option>
                <option value="text">Text Response</option>
                <option value="file">File Upload / Evidence</option>
              </select>
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Add Field
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2 rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Publish Disclosure Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};
