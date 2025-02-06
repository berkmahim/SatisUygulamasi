import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import BuildingCanvas from './components/BuildingCanvas';
import CustomerList from './pages/CustomerList';
import BlockDetail from './pages/BlockDetail';
import BlockSalePage from './pages/BlockSalePage';
import PaymentPlanPage from './pages/PaymentPlanPage';
import ProjectDetail from './pages/ProjectDetail';
import Header from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/building" element={<BuildingCanvas />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/projects/:projectId/blocks/:blockId" element={<BlockDetail />} />
            <Route path="/projects/:projectId/blocks/:blockId/sale" element={<BlockSalePage />} />
            <Route path="/projects/:projectId/blocks/:blockId/payment-plan" element={<PaymentPlanPage />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
