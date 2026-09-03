import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './core/components/Shell';
import { LoginPage } from './modules/auth/LoginPage';
import { AdminPage } from './modules/admin/AdminPage';
import { CarbonAccountingPage } from './modules/carbon/CarbonAccountingPage';
import { ProductsModulePage } from './modules/products/ProductsModulePage';
import { SuppliersModulePage } from './modules/suppliers/SuppliersModulePage';
import { AIAnalyticsModulePage } from './modules/ai_analytics/AIAnalyticsModulePage';
import { DashboardsFinanceModulePage } from './modules/dashboards/DashboardsFinanceModulePage';
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

            <Route path="carbon" element={<CarbonAccountingPage />} />


            <Route path="products" element={<ProductsModulePage />} />


            <Route path="suppliers" element={<SuppliersModulePage />} />


            <Route path="ai-analytics" element={<AIAnalyticsModulePage />} />
            <Route path="reduction-planning" element={<AIAnalyticsModulePage />} />


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
            <Route path="executive-dashboard" element={<DashboardsFinanceModulePage />} />
            <Route path="operational-drilldown" element={<DashboardsFinanceModulePage />} />
            <Route path="carbon-finance" element={<DashboardsFinanceModulePage />} />


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
