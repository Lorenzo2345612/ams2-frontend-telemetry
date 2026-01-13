import { Routes, Route } from 'react-router-dom';
import { Drawer } from '@/components/ui/drawer';
import { RaceListPage } from '@/pages/RaceListPage';
import { LapComparisonPage } from '@/pages/LapComparisonPage';
import { FuelAnalysisPage } from '@/pages/FuelAnalysisPage';
import { FuelComparisonPage } from '@/pages/FuelComparisonPage';

function App() {
  return (
    <Drawer>
      <Routes>
        <Route path="/" element={<LapComparisonPage />} />
        <Route path="/races" element={<RaceListPage />} />
        <Route path="/fuel" element={<FuelAnalysisPage />} />
        <Route path="/fuel/compare" element={<FuelComparisonPage />} />
      </Routes>
    </Drawer>
  );
}

export default App;
