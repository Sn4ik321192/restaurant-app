import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import MobileNav from './components/MobileNav.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Booking from './pages/Booking.jsx';
import About from './pages/About.jsx';
import Contacts from './pages/Contacts.jsx';
import Admin from './pages/Admin.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import Login from './pages/Login.jsx';
import Account from './pages/Account.jsx';
import { useRestaurant } from './context/RestaurantContext.jsx';

export default function App() {
  const location = useLocation();
  const { data } = useRestaurant();
  const [showSplash, setShowSplash] = useState(true);
  const [hideSplash, setHideSplash] = useState(false);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setHideSplash(true), 1250);
    const removeTimer = window.setTimeout(() => setShowSplash(false), 1900);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen overflow-hidden pb-20 text-cream md:pb-0">
      {showSplash && <SplashScreen exiting={hideSplash} name={data.restaurant.name} />}
      <Header />
      <main key={location.pathname} className="page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function SplashScreen({ exiting, name }) {
  return (
    <div className={`fixed inset-0 z-[100] grid place-items-center bg-ink ${exiting ? 'splash-exit' : 'splash-enter'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,179,95,0.22),transparent_32rem)]" />
      <div className="relative text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-gold/25 bg-charcoal shadow-glow">
          <div className="loader-ring h-16 w-16 rounded-full border-2 border-gold/20 border-t-gold" />
        </div>
        <p className="loader-title mt-8 font-display text-4xl font-bold text-cream sm:text-5xl">{name}</p>
        <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.34em] text-gold">Premium dining</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <section className="section-shell grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-3 font-display text-5xl font-bold">Страница не найдена</h1>
        <Link to="/" className="shine mt-8 inline-flex rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream">
          На главную
        </Link>
      </div>
    </section>
  );
}
