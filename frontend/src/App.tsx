import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './core/components/Shell';
import { LoginPage } from './modules/auth/LoginPage';
import { AdminPage } from './modules/admin/AdminPage';
import { PlaceholderModulePage } from './core/components/PlaceholderModulePage';
import { useAuthStore } from './core/store/authStore';
import { 
  LayoutDashboard, Factory, Package, Users, Sparkles, 
  TrendingDown, FileCheck, Coins, ShieldCheck, FileSearch, Database 
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin" replace />} />
            
            <Route
              path="dashboard"
              element={
                <PlaceholderModulePage
                  title="Executive Dashboard"
                  moduleNumber={0}
                  description="Cross-module analytics aggregating emissions, data quality, scenarios, and compliance status."
                  icon={LayoutDashboard}
                  features={[
                    'Scope 1, 2, 3 aggregated emissions view',
                    'Facility & Entity breakdown maps',
                    'Real-time data completeness index',
                    'Recent calculation activity feed'
                  ]}
                />
              }
            />

            <Route
              path="carbon"
              element={
                <PlaceholderModulePage
                  title="Enterprise Carbon Accounting"
                  moduleNumber={1}
                  description="Scope 1, Scope 2, and Scope 3 activity data collection, emission factor library, and calculation engine."
                  icon={Factory}
                  features={[
                    'Scope 1 Direct Stationary & Mobile Combustion',
                    'Scope 2 Location & Market-Based Electricity',
                    'Emission Factor Library with Version Control',
                    'Lineage-backed reproducible calculations'
                  ]}
                />
              }
            />

            <Route
              path="products"
              element={
                <PlaceholderModulePage
                  title="Product LCA & Carbon Footprint"
                  moduleNumber={2}
                  description="Bill of Materials (BOM) carbon allocation, cradle-to-gate LCA boundaries, and product-level footprinting."
                  icon={Package}
                  features={[
                    'BOM component material carbon mapping',
                    'Product Carbon Footprint (PCF) calculation',
                    'Life Cycle Assessment boundary definitions',
                    'Alternative material scenario analysis'
                  ]}
                />
              }
            />

            <Route
              path="suppliers"
              element={
                <PlaceholderModulePage
                  title="Supplier Engagement & Scope 3"
                  moduleNumber={3}
                  description="Supplier onboarding, Mongo-backed flexible questionnaires, data validation, and scorecards."
                  icon={Users}
                  features={[
                    'Flexible Mongo-backed questionnaire builder',
                    'Supplier Scope 3 primary data request portal',
                    'Automated anomaly & completeness validation',
                    'Supplier carbon intensity benchmarking'
                  ]}
                />
              }
            />

            <Route
              path="ai-analytics"
              element={
                <PlaceholderModulePage
                  title="AI Analytics & Decarbonization"
                  moduleNumber={4}
                  description="Machine learning forecasting, OCR document extraction pipeline, anomaly detection, and what-if Monte Carlo runs."
                  icon={Sparkles}
                  features={[
                    'Invoice & Utility Meter OCR document extraction',
                    'Automated data anomaly detection flags',
                    'Emissions forecasting models',
                    'Isolated Monte Carlo scenario simulations'
                  ]}
                />
              }
            />

            <Route
              path="reduction-planning"
              element={
                <PlaceholderModulePage
                  title="Reduction Planning & MAC Curve"
                  moduleNumber={4}
                  description="Marginal Abatement Cost (MAC) curve analysis, initiative tracking, and target progress forecasting."
                  icon={TrendingDown}
                  features={[
                    'Marginal Abatement Cost (MAC) curve generation',
                    'Decarbonization initiative tracking',
                    'SBTi target alignment monitoring',
                    'Capex / Opex ROI calculator'
                  ]}
                />
              }
            />

            <Route
              path="compliance"
              element={
                <PlaceholderModulePage
                  title="Regulatory Compliance & Disclosure"
                  moduleNumber={6}
                  description="Automated disclosure generation for CSRD/ESRS, CBAM, TCFD, EU Taxonomy, SEC, and CDP backed by lineage."
                  icon={FileCheck}
                  features={[
                    'CSRD / ESRS double materiality & reporting',
                    'CBAM import emission certificate calculator',
                    'TCFD climate risk disclosure alignment',
                    'Lineage-backed audit exports for external assurance'
                  ]}
                />
              }
            />

            <Route
              path="carbon-finance"
              element={
                <PlaceholderModulePage
                  title="Dashboards & Carbon Finance"
                  moduleNumber={5}
                  description="Internal carbon pricing, carbon budgets, carbon credits/offsets portfolio, and green investment tracking."
                  icon={Coins}
                  features={[
                    'Internal Carbon Pricing (ICP) engine',
                    'Entity & Department carbon budgeting',
                    'Carbon credit & offset registry tracking',
                    'Decarbonization project ROI analytics'
                  ]}
                />
              }
            />

            <Route
              path="data-quality"
              element={
                <PlaceholderModulePage
                  title="Data Quality & Governance Console"
                  moduleNumber={8}
                  description="Platform-wide completeness scoring, confidence ratings, and anomaly flag remediation."
                  icon={ShieldCheck}
                  features={[
                    'Completeness index by Facility & Entity',
                    'Source data confidence level breakdown',
                    'Active data anomaly flags & workflow review',
                    'Validation status overview'
                  ]}
                />
              }
            />

            <Route
              path="evidence-audit"
              element={
                <PlaceholderModulePage
                  title="Evidence & Audit Lineage Browser"
                  moduleNumber={8}
                  description="Immutable audit trail browser showing data lineage from raw invoice/meter to report disclosure."
                  icon={FileSearch}
                  features={[
                    'Full calculation lineage trail inspector',
                    'Factor & formula version history viewer',
                    'Document evidence metadata browser',
                    'Third-party auditor export package'
                  ]}
                />
              }
            />

            <Route
              path="integrations"
              element={
                <PlaceholderModulePage
                  title="Data Integration Layer"
                  moduleNumber={7}
                  description="Connectors for REST APIs, CSV imports, utility webhooks, field mapping, and sync pipeline."
                  icon={Database}
                  features={[
                    'Utility provider API connectors',
                    'Bulk CSV / Excel import wizard',
                    'ERP & Finance integration stubs',
                    'Field mapping & data reconciliation'
                  ]}
                />
              }
            />

            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
