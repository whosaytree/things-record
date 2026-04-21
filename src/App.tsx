import { HashRouter, NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ItemFormPage from './pages/ItemFormPage';
import ItemDetailPage from './pages/ItemDetailPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/items/new" element={<ItemFormPage />} />
            <Route path="/items/:itemId" element={<ItemDetailPage />} />
            <Route path="/items/:itemId/edit" element={<ItemFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <nav className="bottom-nav" aria-label="主导航">
          <NavLink to="/" className={({ isActive }) => navClassName(isActive)}>
            首页
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => navClassName(isActive)}>
            设置
          </NavLink>
        </nav>
      </div>
    </HashRouter>
  );
}

function navClassName(isActive: boolean) {
  return `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`;
}

export default App;
