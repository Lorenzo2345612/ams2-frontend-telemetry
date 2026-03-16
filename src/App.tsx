import { Routes, Route } from 'react-router-dom';
import { Drawer } from '@/components/ui/drawer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RaceListPage } from '@/pages/RaceListPage';
import { LapComparisonPage } from '@/pages/LapComparisonPage';
import { FuelAnalysisPage } from '@/pages/FuelAnalysisPage';
import { FuelComparisonPage } from '@/pages/FuelComparisonPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Drawer>
              <Routes>
                <Route path="/" element={<LapComparisonPage />} />
                <Route path="/races" element={<RaceListPage />} />
                <Route path="/fuel" element={<FuelAnalysisPage />} />
                <Route path="/fuel/compare" element={<FuelComparisonPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
              </Routes>
            </Drawer>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
