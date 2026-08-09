// src/components/layout/Layout.jsx — UPDATED (hides BottomNav on PDP so it doesn't collide with the fixed action bar)
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  const hideBottomNav = location.pathname.startsWith('/product/')|| location.pathname === '/cart';
 
  

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <TopBar />
      <TopNav />
      <main className={`pt-16 md:pt-20 min-h-screen ${hideBottomNav ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}