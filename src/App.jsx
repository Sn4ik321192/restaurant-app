import React, { useEffect, useRef, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import AdminPayments from './pages/AdminPayments.jsx';
import Login from './pages/Login.jsx';
import Account from './pages/Account.jsx';
import { useRestaurant } from './context/RestaurantContext.jsx';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeEmailLinkSignIn, data, birthdayGreeting, accountKey } = useRestaurant();
  const [showSplash, setShowSplash] = useState(true);
  const [hideSplash, setHideSplash] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [showBirthdayGreeting, setShowBirthdayGreeting] = useState(false);
  const authCallbackHandled = useRef(false);

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

  useEffect(() => {
    if (authCallbackHandled.current) return;

    const rawHash = window.location.hash.replace(/^#\/?/, '');
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    const authError = params.get('error_description') || params.get('error');

    if (!accessToken && !authError) return;

    authCallbackHandled.current = true;

    const cleanUrl = `${window.location.origin}${window.location.pathname}#/login`;
    window.history.replaceState(null, '', cleanUrl);

    if (authError) {
      setAuthNotice(`Supabase отклонил ссылку: ${authError}`);
      return;
    }

    completeEmailLinkSignIn(accessToken).then((result) => {
      if (result.ok) {
        setAuthNotice('Вход по ссылке подтвержден. Осталось добавить телефон в профиле.');
        navigate(result.user.role === 'admin' ? '/admin/orders' : '/account', { replace: true });
        return;
      }

      setAuthNotice(result.error || 'Не удалось войти по ссылке из письма');
    });
  }, [completeEmailLinkSignIn, navigate]);

  useEffect(() => {
    if (!birthdayGreeting || !accountKey) {
      setShowBirthdayGreeting(false);
      return;
    }

    const storageKey = `restaurant-app-birthday-greeting-${accountKey}-${birthdayGreeting.year}`;

    try {
      setShowBirthdayGreeting(localStorage.getItem(storageKey) !== 'seen');
    } catch {
      setShowBirthdayGreeting(true);
    }
  }, [accountKey, birthdayGreeting?.id, birthdayGreeting?.year]);

  const closeBirthdayGreeting = () => {
    if (birthdayGreeting && accountKey) {
      try {
        localStorage.setItem(`restaurant-app-birthday-greeting-${accountKey}-${birthdayGreeting.year}`, 'seen');
      } catch {
        // If storage is blocked, closing the modal for this session is enough.
      }
    }

    setShowBirthdayGreeting(false);
  };

  return (
    <div className="min-h-screen overflow-hidden pb-20 text-cream md:pb-0">
      <AmbientMotion />
      {showSplash && <SplashScreen exiting={hideSplash} name={data.restaurant.name} />}
      <Header />
      {authNotice && <AuthNotice message={authNotice} onClose={() => setAuthNotice('')} />}
      {showBirthdayGreeting && birthdayGreeting && (
        <BirthdayGreetingModal greeting={birthdayGreeting} restaurantName={data.restaurant.name} onClose={closeBirthdayGreeting} />
      )}
      <main>
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
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function BirthdayGreetingModal({ greeting, restaurantName, onClose }) {
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/78 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-gold/24 bg-charcoal p-6 shadow-glow md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,179,95,0.22),transparent_28rem)]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-gold/18 text-cream/58 hover:bg-gold hover:text-ink"
          aria-label="Закрыть поздравление"
        >
          <X size={18} />
        </button>

        <div className="relative">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold/28 bg-gold/12 text-gold shadow-glow">
            <Gift size={34} />
          </div>
          <p className="mt-6 text-center text-xs font-extrabold uppercase tracking-[0.3em] text-gold">{restaurantName}</p>
          <h2 className="mt-3 text-center font-display text-4xl font-bold leading-tight text-cream md:text-5xl">{greeting.title}</h2>
          <p className="mx-auto mt-5 max-w-md text-center leading-7 text-cream/68">{greeting.text}</p>

          <div className="mt-7 rounded-3xl border border-gold/16 bg-ink/60 p-5 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold">Подарок дня</p>
            <p className="mt-3 text-2xl font-black text-cream">Персональное поздравление в профиле</p>
            <p className="mt-2 text-sm leading-6 text-cream/52">Поздравление также появится в разделе уведомлений и останется частью клиентского профиля на этот день.</p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              to="/account"
              onClick={onClose}
              className="shine inline-flex items-center justify-center rounded-full bg-gold px-6 py-4 font-extrabold text-ink hover:bg-cream"
            >
              Открыть профиль
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gold/25 px-6 py-4 font-bold text-gold hover:bg-gold hover:text-ink"
            >
              Спасибо
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AmbientMotion() {
  return (
    <div className="motion-atmosphere" aria-hidden="true">
      <span className="motion-halo motion-halo-1" />
      <span className="motion-halo motion-halo-2" />
      <span className="motion-halo motion-halo-3" />
      <span className="motion-grain" />
    </div>
  );
}

function AuthNotice({ message, onClose }) {
  return (
    <div className="fixed left-1/2 top-24 z-[90] w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-gold/25 bg-charcoal/96 p-4 text-sm font-bold text-cream shadow-glow backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <p className="leading-6">{message}</p>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-gold/25 px-3 py-1 text-gold hover:bg-gold hover:text-ink">
          OK
        </button>
      </div>
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
