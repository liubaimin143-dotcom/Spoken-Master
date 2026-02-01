import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout';
import Studio from './pages/Studio';
import ListeningV2 from './pages/ListeningV2';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/studio" replace />} />
          <Route path="studio" element={<Studio />} />
          <Route path="listening" element={<ListeningV2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


