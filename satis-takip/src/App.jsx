import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import BuildingCanvas from './components/BuildingCanvas';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:id" element={<BuildingCanvas />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
