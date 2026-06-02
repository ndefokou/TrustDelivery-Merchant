import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateDelivery from './pages/CreateDelivery';
import DeliveryDetails from './pages/DeliveryDetails';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create-delivery" element={<CreateDelivery />} />
          <Route path="/delivery/:id" element={<DeliveryDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;