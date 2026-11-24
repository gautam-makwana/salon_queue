// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';

import Home        from './pages/Home';
import JoinQueue   from './pages/JoinQueue';
import MyStatus    from './pages/MyStatus';
import Reception   from './pages/Reception';
import BarberView  from './pages/BarberView';
import Display     from './pages/Display';
import Admin       from './pages/Admin';
import LoginPage   from './pages/LoginPage';
import NotFound    from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public customer routes */}
      <Route path="/"            element={<Home />} />
      <Route path="/join"        element={<JoinQueue />} />
      <Route path="/status/:id"  element={<MyStatus />} />
      <Route path="/display"     element={<Display />} />

      {/* Staff auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected staff routes */}
      <Route path="/reception" element={
        <RequireAuth roles={['RECEPTION', 'OWNER']}>
          <Reception />
        </RequireAuth>
      } />

      <Route path="/barber/:name" element={
        <RequireAuth roles={['BARBER', 'OWNER']}>
          <BarberView />
        </RequireAuth>
      } />

      <Route path="/admin" element={
        <RequireAuth roles={['OWNER']}>
          <Admin />
        </RequireAuth>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
