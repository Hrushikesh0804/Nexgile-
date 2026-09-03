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
import { ComplianceModulePage } from './modules/compliance/ComplianceModulePage';
import { IntegrationsModulePage } from './modules/integrations/IntegrationsModulePage';
import { DataQualityConsolePage } from './modules/hardening/DataQualityConsolePage';
import { EvidenceAuditBrowserPage } from './modules/hardening/EvidenceAuditBrowserPage';
import { BulkOperationsPage } from './modules/hardening/BulkOperationsPage';
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


            <Route path="compliance" element={<ComplianceModulePage />} />


            <Route path="executive-dashboard" element={<DashboardsFinanceModulePage />} />
            <Route path="operational-drilldown" element={<DashboardsFinanceModulePage />} />
            <Route path="carbon-finance" element={<DashboardsFinanceModulePage />} />



            <Route path="data-quality" element={<DataQualityConsolePage />} />
            <Route path="evidence-audit" element={<EvidenceAuditBrowserPage />} />
            <Route path="bulk-operations" element={<BulkOperationsPage />} />


            <Route path="integrations" element={<IntegrationsModulePage />} />


            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
