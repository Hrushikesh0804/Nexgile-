import React from 'react';
import { ShieldCheck, FileCheck, Award, Globe, Scale, FileText, ArrowRight } from 'lucide-react';

interface Props {
  onSelectFramework: (fwName: string) => void;
}

export const FrameworkSelectorView: React.FC<Props> = ({ onSelectFramework }) => {
  const frameworks = [
    {
      id: 'csrd',
      code: 'CSRD_ESRS',
      title: 'CSRD / ESRS Standards',
      desc: 'EU Corporate Sustainability Reporting Directive. Double materiality, ESRS E1-E5 disclosures, XBRL tags, and value-chain reporting.',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      badge: 'Mandatory EU 2025'
    },
    {
      id: 'cbam',
      code: 'CBAM',
      title: 'CBAM Import Regulation',
      desc: 'EU Carbon Border Adjustment Mechanism. Track embedded carbon in imported steel, aluminum, fertilizer, and electricity.',
      icon: Globe,
      color: 'from-teal-500/20 to-indigo-500/10 border-teal-500/30 text-teal-400',
      badge: 'Quarterly Filing'
    },
    {
      id: 'tcfd',
      code: 'TCFD',
      title: 'TCFD Climate Disclosure',
      desc: 'Task Force on Climate-related Financial Disclosures. Governance, Strategy, Risk Management, Metrics & Target disclosures.',
      icon: Award,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400',
      badge: 'Global Standard'
    },
    {
      id: 'taxonomy',
      code: 'EU_TAXONOMY',
      title: 'EU Sustainable Taxonomy',
      desc: 'Technical screening criteria, Do No Significant Harm (DNSH) compliance, and CapEx / OpEx green alignment percentages.',
      icon: Scale,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
      badge: 'EU Sustainable Finance'
    },
    {
      id: 'sec',
      code: 'SEC_CLIMATE',
      title: 'SEC Climate Rules',
      desc: 'US Securities and Exchange Commission climate-related disclosures for public registrants.',
      icon: FileCheck,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      badge: 'US SEC Mandate'
    },
    {
      id: 'cdp',
      code: 'CDP',
      title: 'CDP Questionnaire Workspace',
      desc: 'Carbon Disclosure Project annual climate questionnaire response scoring and submission history.',
      icon: FileText,
      color: 'from-blue-500/20 to-teal-500/10 border-blue-500/30 text-blue-400',
      badge: 'Investor Scoring'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Global Regulatory Frameworks
        </span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Regulatory Compliance & Disclosure Workspace</h1>
        <p className="text-slate-400 text-sm">Select a regulatory framework to generate audit-ready disclosure reports with complete lineage traceability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworks.map((fw) => {
          const IconComp = fw.icon;
          return (
            <div
              key={fw.id}
              onClick={() => onSelectFramework(fw.id)}
              className={`glass-panel p-6 rounded-2xl border bg-gradient-to-br ${fw.color} space-y-4 hover:scale-[1.02] transition-all cursor-pointer shadow-lg flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700">
                    {fw.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100">{fw.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{fw.desc}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold pt-2 border-t border-slate-800/80 text-slate-200">
                Open Framework Workspace <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
