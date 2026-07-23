import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { marketingAPI } from '../services/api';
import logoImg from '../assets/pilbagen-logo.png';

function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Hash Scrolling
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false); // Close mobile menu on every navigation
  }, [location]);

  const navLinks = [
    { label: 'HOME', path: '/#home' },
    { label: 'ABOUT', path: '/#our-firm' },
    { label: 'PRACTICE AREAS', path: '/#practice-areas' },
    { label: 'CONTACT', path: '/#contact-us' },
    { label: 'CONSULTATION', path: '/#book-consultation' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-[#0A192F]/95 backdrop-blur-md py-2 sm:py-2.5 shadow-xl border-b border-[#D4AF37]/15' : 'bg-transparent py-2.5 sm:py-4'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-12 flex items-center justify-between gap-3">
        {/* Branding */}
        <Link to="/" className="flex items-center gap-3 group notranslate" translate="no">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg p-1">
            <img src={logoImg} alt="Pilbågen Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-display font-bold text-xl tracking-tight leading-none block">Pilbågen</span>
            <span className="text-[#D4AF37] font-semibold block mt-1 uppercase tracking-[0.25em] text-[10px]">Agency & Case Management System</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <NavLink key={link.path} to={link.path}
              className={({ isActive }) => `text-[13px] font-900 uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/login" className="bg-[#D4AF37] text-[#0A192F] px-6 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider hover:bg-[#F3C649] transition-all shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98]">
            LOGIN
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Toggle Menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 top-0 left-0 w-full h-full bg-[#111520] z-[90] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col p-6 sm:p-8 pt-24 sm:pt-32 space-y-6 sm:space-y-8 bg-[#111520] min-h-screen overflow-y-auto">
          {navLinks.map((link, i) => (
            <NavLink key={link.path} to={link.path}
              style={{ transitionDelay: `${i * 50}ms` }}
              className={({ isActive }) => `text-xl sm:text-2xl font-800 tracking-tight transition-all ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'} ${isActive ? 'text-primary-500' : 'text-white hover:text-primary-500'}`}>
              {link.label}
            </NavLink>
          ))}
          <div className={`pt-8 border-t border-white/5 transition-all duration-500 delay-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <Link to="/login" className="block w-full bg-primary-600 text-white text-center py-5 rounded-2xl font-800 text-lg shadow-2xl shadow-primary-600/30 active:scale-[0.98]">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

const SOCIAL_ICONS = {
  LinkedIn: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
  Instagram: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
  Facebook: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>,
  YouTube: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 00-1.94 2C1 8.14 1 12 1 12s0 3.86.4 5.58a2.78 2.78 0 001.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 001.94-2C23 15.86 23 12 23 12s0-3.86-.4-5.58zM9.54 15.56V8.45L15.81 12l-6.27 3.56z" /></svg>
};

function PublicFooter() {
  const [dynamicSocialLinks, setDynamicSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLinks = async () => {
      try {
        const res = await marketingAPI.getSocialLinks();
        if (mounted && res.success) {
          setDynamicSocialLinks(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch social links:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLinks();
    return () => { mounted = false; };
  }, []);

  return (
    <footer className="bg-[#0A192F] border-t border-[#D4AF37]/15 py-10 lg:py-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-10 sm:mb-12">
          {/* Brand Block */}
          <div className="space-y-10">
            <Link to="/" className="flex items-center gap-3 notranslate" translate="no">
              <div className="w-12 h-12 rounded-xl bg-[#0A192F] border border-[#D4AF37]/30 flex items-center justify-center p-2">
                <img src={logoImg} alt="Pilbågen Logo" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <span className="text-white font-display font-bold text-xl block tracking-tight">Pilbågen</span>
                <span className="text-[#D4AF37] text-[10px] font-semibold block mt-1 uppercase tracking-wider">Agency & Case Management</span>
              </div>
            </Link>
            <div className="text-slate-300 text-[14px] leading-relaxed space-y-4">
              <p className="text-pretty">Fast, secure, and clear case management platform built for Swedish law firms and agencies.</p>
            </div>
            <div className="pt-2">
              <p className="text-[#D4AF37] font-bold text-[13px] uppercase tracking-[0.25em]">www.pilbagen.se</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-bold text-[11px] uppercase tracking-[0.3em] mb-8 leading-none">System Navigation</h4>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Home Page', path: '/#home' },
                { label: 'System Features', path: '/#our-firm' },
                { label: 'Modules Overview', path: '/#practice-areas' },
                { label: 'Contact Support', path: '/#contact-us' },
                { label: 'Agency Login', path: '/login' }
              ].map(link => (
                <Link key={link.label} to={link.path} className="text-slate-300 hover:text-[#D4AF37] transition-all text-[14px] font-medium tracking-tight hover:translate-x-1">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-[11px] uppercase tracking-[0.3em] mb-8 leading-none">Pilbågen Support</h4>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href="mailto:support@pilbagen.se" className="text-white text-[14px] font-semibold tracking-tight hover:text-[#D4AF37] transition-colors">support@pilbagen.se</a>
              </div>
              <div className="flex gap-4 items-center">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9-9H3m9 9V3m0 9l-9 9" /></svg>
                <a href="https://www.pilbagen.se" className="text-white text-[14px] font-semibold tracking-tight hover:text-[#D4AF37] transition-colors">www.pilbagen.se</a>
              </div>
            </div>
          </div>

          {/* Social Presence */}
          <div>
            <h4 className="text-white font-bold text-[11px] uppercase tracking-[0.3em] mb-8 leading-none">Security Status</h4>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/20 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] text-[12px] font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                TLS Enforced & Multi-Tenant
              </div>
              <p className="text-[11px] text-slate-400">Strict data separation & activity audit logging per Swedish law firm regulations.</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 sm:pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <p className="text-[11px] text-slate-400 font-medium tracking-tight text-center md:text-left leading-relaxed">
            © {new Date().getFullYear()} Pilbågen. All rights reserved. Built for Swedish law firms & agencies.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex-wrap justify-center">
            <span className="hover:text-[#D4AF37] cursor-pointer transition-colors">Security Registry</span>
            <div className="w-1 h-1 bg-slate-500 rounded-full" />
            <span className="hover:text-[#D4AF37] cursor-pointer transition-colors">Privacy Policy</span>
            <div className="w-1 h-1 bg-slate-500 rounded-full" />
            <span className="hover:text-[#D4AF37] cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function WebsiteLayout({ toast }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#111520]">
      <PublicNavbar />
      <main className="flex-1 pt-24 sm:pt-28 lg:pt-36 pb-8 sm:pb-12 px-2 sm:px-6 lg:px-10 max-w-[1600px] mx-auto w-full overflow-x-clip">
        <Outlet context={{ toast }} />
      </main>
      <PublicFooter />
    </div>
  );
}
