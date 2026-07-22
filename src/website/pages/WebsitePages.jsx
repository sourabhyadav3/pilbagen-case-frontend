import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../services/api';
import hero3DImg from '../../assets/pilbagen-hero.png';
import receptionImg from '../../assets/pilbagen-reception.png';
import vaultImg from '../../assets/pilbagen-vault.png';
import skylineImg from '../../assets/pilbagen-skyline.png';

// ── Interactive Enhancements ──────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}



export function HomePage() {
  useScrollReveal();
  const practiceAreas = [
    { title: 'Conflict Control (Jävkontroll)', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, desc: 'Independent workspace function searching SSN, Org numbers, and historical party roles.' },
    { title: 'Time & Invoicing', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, desc: 'Track hourly fees, waste of time, outlays, Word/PDF drafts, and optional Fortnox sync.' },
    { title: 'Global Document Index', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, desc: 'Sub-3-second indexed search across PDF content, Word files, metadata, and case folders.' },
    { title: 'Encrypted Chat & Tasks', icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, desc: 'Secure multi-party chat, attachments, daily calendar activities, and deadline tracking.' }
  ];

  return (
    <div className="animate-fade-in space-y-16 sm:space-y-20 lg:space-y-24 overflow-x-clip relative">

      {/* 1. HERO SECTION */}
      <section id="home" className="relative pt-6 pb-12 sm:pt-10 sm:pb-14 lg:pt-16 lg:pb-20 overflow-hidden scroll-mt-28 sm:scroll-mt-32 reveal-on-scroll">
        <div className="relative z-10 text-center lg:text-left grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div className="lg:pr-10">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-[1.05] tracking-tight text-balance">
              Fast, Secure & <span className="text-[#D4AF37]">Clear Case Management</span>
            </h1>
            <p className="text-[#D4AF37] font-semibold text-lg sm:text-xl max-w-3xl mx-auto lg:mx-0 mb-4 tracking-wide uppercase">
              Pilbågen – Built for Swedish Law Firms & Legal Agencies
            </p>
            <p className="text-white/80 text-base sm:text-lg max-w-3xl mx-auto lg:mx-0 mb-8 leading-relaxed text-pretty">
              Streamline your agency's client management, conflict of interest controls, document indexing, time & billing, and invoice workflows on a strictly multi-tenant platform.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5">
              <Link to="/login" className="btn btn-primary w-full sm:w-auto justify-center px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold uppercase tracking-wider shadow-2xl shadow-[#D4AF37]/20 hover:-translate-y-1 transition-all duration-300">
                Log In to Pilbågen
              </Link>
              <a href="#our-firm" className="btn btn-secondary w-full sm:w-auto justify-center px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold uppercase tracking-wider bg-white/5 shadow-md border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                Explore Modules
              </a>
            </div>
          </div>
          <div className="relative group reveal-right max-w-xl mx-auto lg:ml-auto w-full">
            <div className="absolute -inset-4 bg-[#D4AF37]/10 rounded-3xl rotate-2 blur-xl -z-10 group-hover:rotate-0 transition-transform duration-1000" />
            <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-2xl bg-[#0A192F]/90 backdrop-blur-xl p-3">
              <img
                src={hero3DImg}
                alt="Pilbågen Legal Tech System"
                className="w-full h-full object-cover rounded-xl aspect-[4/3] group-hover:scale-102 transition-transform duration-700 shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/80 via-transparent to-transparent pointer-events-none rounded-xl" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Pilbågen Cloud 1.0</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/10">Swedish Law Standard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OUR FIRM SECTION (Combined from AboutPage) */}
      <section id="our-firm" className="space-y-10 sm:space-y-16 lg:space-y-20 scroll-mt-28 sm:scroll-mt-32 reveal-on-scroll">
        <div className="text-center">

        </div>

        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
          <div className="relative group order-2 lg:order-1 reveal-left max-w-xl mx-auto w-full">
            <div className="absolute -inset-4 bg-[#D4AF37]/10 rounded-3xl -rotate-2 -z-10 group-hover:rotate-0 transition-transform duration-1000" />
            <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-2xl bg-[#0A192F]/90 p-2">
              <img
                src={vaultImg}
                alt="Pilbågen Multi-Tenant Security & Cloud Vault"
                className="w-full h-full object-cover rounded-xl aspect-[4/3] group-hover:scale-105 transition-transform duration-1000"
              />
            </div>
          </div>
          <div className="space-y-10 order-1 lg:order-2">
            <div className="space-y-6">
              <p className="text-white/80 leading-relaxed text-lg font-medium text-left text-pretty">
                Pilbågen is an agency and case management web application designed for Swedish law firms. Built for speed, clarity, and ease of use, it simplifies daily workflows for lawyers, partners, and legal assistants.
              </p>
              <p className="text-white/80 leading-relaxed text-lg font-medium text-left text-pretty">
                With isolated multi-tenant architecture, strict permission controls (Agency, Office, and Case level), and full audit logging, Pilbågen ensures your firm operates with maximum privacy, security, and traceability.
              </p>
            </div>

            <div className="grid gap-6 pt-4">
              <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white text-[15px] uppercase tracking-wider">Multi-Tenant Isolation</p>
                  <p className="text-[11px] text-slate-300 tracking-wide mt-1">Each agency account is strictly isolated on the server side.</p>
                </div>
              </div>
              <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-white text-[15px] uppercase tracking-wider">Traceability & Audit Logging</p>
                  <p className="text-[11px] text-slate-300 tracking-wide mt-1">Every client edit, conflict check, document access, and invoice is logged with timestamp & user ID.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRACTICE AREAS SECTION */}
      <section id="practice-areas" className="scroll-mt-32 reveal-on-scroll">
        <div className="text-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4 tracking-tight">System Modules</h2>
          <div className="w-12 h-1 bg-[#D4AF37] rounded-full mx-auto mb-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
          {practiceAreas.map(area => (
            <div key={area.title} className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#D4AF37]/30 transition-all duration-300 group flex flex-col items-center h-full text-center relative overflow-hidden active:scale-[0.98] hover:-translate-y-0.5">
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-4 group-hover:bg-[#D4AF37]/20 transition-colors shadow-inner">
                {area.icon}
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2 tracking-tight leading-tight">{area.title}</h3>
              {area.desc && (
                <p className="text-slate-300 leading-relaxed text-[12px] font-medium">
                  {area.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/5 py-8 sm:py-10 rounded-2xl border border-white/5 shadow-inner px-4 sm:px-8 max-w-4xl mx-auto overflow-hidden relative">
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4 tracking-tight">Our Commitment to Swedish Agencies</h2>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed font-medium max-w-2xl mx-auto">
            Engineered specifically for law firms, providing strict security, audit trail logging, and streamlined daily case workflows.
          </p>
        </div>
      </section>

      {/* 4. PARTY PORTAL SECTION */}
      <section className="relative overflow-hidden rounded-2xl bg-white/5 text-white p-6 sm:p-10 shadow-xl border border-white/10 reveal-on-scroll">
        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center text-left">
          <div>
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-6 leading-tight tracking-tight">Focused Workflow at <span className="text-[#D4AF37]">Every Stage</span></h2>
            <p className="text-slate-300 text-sm lg:text-base mb-8 leading-relaxed font-medium">
              Pilbågen organizes conflict checks, document management, time entries, and invoicing into one structured interface.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Case Strategy & Planning', desc: '' },
                { title: 'Document Preparation', desc: '' },
                { title: 'Ongoing Legal Support', desc: '' },
                { title: 'Attorney Communication', desc: '' }
              ].map(item => (
                <div key={item.title} className="flex items-center gap-3 group">
                  <div className="w-7 h-7 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full flex items-center justify-center font-bold text-[13px] border border-[#D4AF37]/40 flex-shrink-0">✓</div>
                  <h4 className="text-[14px] font-semibold text-white tracking-tight">{item.title}</h4>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-inner space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-[#0A192F] flex items-center justify-center font-bold shadow-lg">
                  ⚖️
                </div>
                <div>
                  <h4 className="text-lg font-bold tracking-tight">Agency Portal</h4>
                  <p className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider">Active Workspace</p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-slate-300 text-[13px] leading-relaxed">"Multi-tenant data separation and quick conflict search ready for everyday firm usage."</p>
              </div>
              <Link to="/login" className="flex items-center justify-center w-full py-3.5 bg-[#D4AF37] text-[#0A192F] rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-[#F3C649] transition-all shadow-lg">
                Enter Agency Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT US SECTION (Combined from ContactPage) */}
      <section id="contact-us" className="scroll-mt-28 sm:scroll-mt-32 space-y-10 sm:space-y-16 lg:space-y-20 reveal-on-scroll">
        <div className="text-center">
          <span className="text-primary-500 font-900 text-[11px] uppercase tracking-[0.3em] mb-4 block leading-none">Get in Touch</span>
          <h2 className="text-4xl lg:text-5xl font-display font-900 text-white mb-6 tracking-tight text-balance">Contact Our Firm</h2>
          <div className="w-12 h-1 bg-primary-500 rounded-full mx-auto mb-8" />
          <p className="text-white/80 text-lg lg:text-xl max-w-2xl mx-auto font-500 leading-relaxed text-center text-pretty">Connect with our office for expert legal guidance and professional matter advocacy.</p>
        </div>

        <div className="max-w-4xl mx-auto w-full text-left">
          <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl text-white shadow-xl relative overflow-hidden group flex flex-col md:flex-row gap-8 items-center">
            {/* Our Office Image */}
            <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/20 shadow-inner w-full md:w-1/2 aspect-video flex-shrink-0">
              <img src={receptionImg} alt="Pilbågen Swedish Law Firm Reception" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            {/* Office Info & Support Details */}
            <div className="w-full md:w-1/2 space-y-6">
              <div>
                <h3 className="text-[18px] font-bold mb-3 flex items-center gap-2.5 tracking-tight relative z-10 text-white">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-md" /> Pilbågen Headquarters
                </h3>
                <div className="flex flex-col gap-1 pb-3 border-b border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37]">Main Office Location</span>
                  <span className="text-white font-medium text-sm">Kungsgatan 12, 111 35 Stockholm, Sweden</span>
                </div>
              </div>

              {/* System Support */}
              <div>
                <h4 className="text-[13px] font-bold mb-3 tracking-tight text-white uppercase tracking-wider">System Support Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Electronic Inquiry', value: 'support@pilbagen.se', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, link: 'mailto:support@pilbagen.se' },
                    { label: 'Digital Access', value: 'www.pilbagen.se', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9-9H3m9 9V3m0 9l-9 9" /></svg>, link: 'https://www.pilbagen.se' }
                  ].map(item => (
                    <a key={item.label} href={item.link} className="flex gap-2.5 p-3 bg-white/5 border border-white/5 rounded-xl hover:border-[#D4AF37]/30 transition-all group items-center">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#D4AF37] group-hover:text-white transition-colors flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.15em] leading-none mb-0.5 truncate">{item.label}</p>
                        <p className="text-[12px] font-semibold text-white tracking-tight truncate">{item.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOOK CONSULTATION SECTION (Combined from BookConsultationPage) */}
      <section id="book-consultation" className="scroll-mt-28 sm:scroll-mt-32 space-y-8">
        <div className="text-center">
          <span className="text-[#D4AF37] font-bold text-[11px] uppercase tracking-[0.3em] mb-2 block leading-none">Schedule Evaluation</span>
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4 tracking-tight">Request a Demo Consultation</h2>
          <div className="w-12 h-1 bg-[#D4AF37] rounded-full mx-auto mb-4" />
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-medium leading-relaxed">Schedule a demo evaluation to see how Pilbågen optimizes legal case management for your law firm.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 text-left items-start">
          {/* B. CONSULTATION FORM */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]" />
              <div className="mb-6">
                <h3 className="text-xl lg:text-2xl font-display font-bold text-white mb-2 tracking-tight">Schedule Demo Consultation</h3>
                <p className="text-slate-300 font-medium text-xs">Select your preferred date and time to schedule a platform walkthrough.</p>
              </div>
              <ConsultationForm />
            </div>
          </div>

          {/* C. SIDE PANEL INFO */}
          <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold text-white tracking-tight leading-none">Onboarding Process</h3>
              <div className="space-y-3">
                {[
                  { title: '01 - Request Demo', desc: 'Provide your law office details to request a guided platform walkthrough.' },
                  { title: '02 - Environment Setup', desc: 'We configure isolated multi-tenant workspaces and user accounts.' },
                  { title: '03 - Firm Onboarding', desc: 'Import law office templates, price lists, and start live case management.' }
                ].map(item => (
                  <div key={item.title} className="p-4 bg-white/5 border border-white/5 rounded-xl shadow-sm hover:border-[#D4AF37]/30 transition-all group">
                    <p className="font-bold text-[#D4AF37] text-[13px] tracking-tight mb-1">{item.title}</p>
                    <p className="text-[12px] text-slate-300 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export function ContactForm() {
  const { toast } = useOutletContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const fd = new FormData(form);
      const phone = fd.get('phone');
      await api.leads.publicInquiry({
        full_name: fd.get('full_name'),
        email: fd.get('email'),
        phone: phone != null && String(phone).trim() !== '' ? phone : '',
        matter_type: fd.get('matter_type'),
        message: fd.get('message'),
      });
      toast('Your message has been received. Our team will contact you soon.', 'success');
      form.reset();
    } catch (err) {
      toast(err.message || 'Could not submit your inquiry. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-white/70 uppercase tracking-widest ml-1">Full Name <span className="text-[#D4AF37]">*</span></label>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] group-focus-within:scale-110 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <input name="full_name" required className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-3.5 text-[15px] outline-none focus:border-[#D4AF37]/60 focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500 shadow-sm" placeholder="Your Full Name" />
          </div>
        </div>
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-white/70 uppercase tracking-widest ml-1">Email Address <span className="text-[#D4AF37]">*</span></label>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] group-focus-within:scale-110 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-3.5 text-[15px] outline-none focus:border-[#D4AF37]/60 focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500 shadow-sm" placeholder="your.name@agency.se" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <label className="block text-[13px] font-bold text-white/70 uppercase tracking-widest ml-1">Phone Number</label>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] group-focus-within:scale-110 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <input name="phone" className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-3.5 text-[15px] outline-none focus:border-[#D4AF37]/60 focus:ring-4 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500 shadow-sm" placeholder="+46 8 123 456 78" />
          </div>
        </div>
        <div className="space-y-2.5">
          <label className="block text-[13px] font-800 text-white/80 uppercase tracking-widest ml-1">Area of Representation</label>
          <p className="text-[11px] text-white/70 font-600 mb-2 ml-1">Select the practice area relevant to your matter</p>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300 z-10 pointer-events-none">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
            </div>
            <select name="matter_type" className="w-full bg-white/5 border-2 border-white/5 rounded-[2rem] pl-16 pr-12 py-5 text-[17px] outline-none focus:border-primary-500/50 focus:ring-8 focus:ring-primary-500/5 transition-all duration-300 appearance-none text-white font-600 cursor-pointer shadow-sm hover:border-white/10 focus:shadow-xl focus:shadow-primary-500/10">
              <option value="Personal Injury Advocacy" className="bg-[#1a2233]">Personal Injury Advocacy</option>
              <option value="International Law" className="bg-[#1a2233]">International Law</option>
              <option value="Immigration" className="bg-[#1a2233]">Immigration</option>
              <option value="Civil Litigation" className="bg-[#1a2233]">Civil Litigation</option>
              <option value="Creative Law" className="bg-[#1a2233]">Creative Law</option>
              <option value="Business Law" className="bg-[#1a2233]">Business Law</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 group-focus-within:text-primary-500 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        <label className="block text-[13px] font-800 text-white/80 uppercase tracking-widest ml-1">Matter Summary <span className="text-primary-500">*</span></label>
        <div className="relative group">
          <div className="absolute left-6 top-7 text-white/70 group-focus-within:text-primary-500 group-focus-within:scale-110 transition-all duration-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <textarea name="message" required className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] pl-16 pr-8 py-6 text-[17px] outline-none focus:border-primary-500/50 focus:ring-8 focus:ring-primary-500/5 transition-all duration-300 min-h-[180px] resize-none font-600 text-white placeholder:text-white/60 shadow-sm hover:border-white/10 focus:shadow-xl focus:shadow-primary-500/10" placeholder="Provide a brief overview of your matter, including key dates, parties involved, and current status." />
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mt-4">
          <h4 className="text-[13px] font-900 text-white uppercase tracking-widest mb-2">Notice</h4>
          <p className="text-[12px] text-white/70 font-600 leading-relaxed text-pretty">
            Submission of this form does not establish an attorney-party relationship and is not legal advice.Please do not include confidential or time-sensitive information.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <button disabled={loading} className={`w-full py-4 bg-[#D4AF37] text-[#0A192F] font-bold rounded-2xl uppercase tracking-widest text-[14px] hover:bg-[#F3C649] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#D4AF37]/20 transition-all duration-300 active:scale-[0.99] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {loading ? 'Processing Inquiry...' : 'Send Inquiry Now'}
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-6 font-semibold uppercase tracking-[0.2em]">
          Encrypted Registry Transmission • <span className="text-[#D4AF37]">Pilbågen Secure Protocol</span>
        </p>
      </div>
    </form>
  );
}

export function ConsultationForm() {
  const { toast } = useOutletContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const fd = new FormData(form);
      await api.leads.publicConsultation({
        full_name: fd.get('full_name'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        preferred_date: fd.get('preferred_date'),
        matter_type: 'Conflict Control & Compliance',
        message: fd.get('message'),
      });
      toast('Consultation request transmitted. Our staff will contact you to confirm the time.', 'success');
      form.reset();
    } catch (err) {
      toast(err.message || 'Could not submit your request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[12px] font-bold text-white/70 uppercase tracking-wider ml-1">Full Name <span className="text-[#D4AF37]">*</span></label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <input name="full_name" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[14px] outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500" placeholder="Contact Name" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[12px] font-bold text-white/70 uppercase tracking-wider ml-1">Email Address <span className="text-[#D4AF37]">*</span></label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[14px] outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500" placeholder="work@agency.se" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[12px] font-bold text-white/70 uppercase tracking-wider ml-1">Phone Number</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </div>
          <input name="phone" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[14px] outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-all font-medium text-white placeholder:text-slate-500" placeholder="+46 8 123 456 78" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[12px] font-bold text-white/70 uppercase tracking-wider ml-1">Preferred Date <span className="text-[#D4AF37]">*</span></label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-[#D4AF37] transition-all z-10 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <input name="preferred_date" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[14px] outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-all font-medium text-white shadow-sm cursor-pointer color-scheme-dark" style={{ colorScheme: 'dark' }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[12px] font-bold text-white/70 uppercase tracking-wider ml-1">Notes / Inquiry Details <span className="text-[#D4AF37]">*</span></label>
        <div className="relative group">
          <div className="absolute left-4 top-4 text-white/70 group-focus-within:text-[#D4AF37] transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <textarea name="message" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-[14px] outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/10 transition-all min-h-[120px] resize-none font-medium text-white placeholder:text-slate-500" placeholder="Specify your law firm details or questions..." />
        </div>
      </div>

      <div className="pt-2">
        <button disabled={loading} className={`w-full py-3.5 bg-[#D4AF37] text-[#0A192F] font-bold rounded-xl uppercase tracking-wider text-[13px] hover:bg-[#F3C649] transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {loading ? 'Submitting Request...' : 'Schedule Demo Now'}
        </button>
      </div>
    </form>
  );
}

export function ClientPortalLandingPage() {
  return (
    <div className="animate-fade-in space-y-16 sm:space-y-20 lg:space-y-24 overflow-x-clip">
      {/* 1. PAGE HEADER / HERO */}
      <section className="relative py-12 sm:py-14 lg:py-20 overflow-hidden bg-white/5 -mx-4 sm:-mx-6 px-4 sm:px-6 rounded-b-3xl shadow-inner border-b border-white/5">
        <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
          <svg className="w-[30rem] h-[30rem]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.5h7c-.47 4.18-3.05 7.85-7 9.12V11.5H5V6.3l7-3.11v8.31z" /></svg>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-primary-500 font-900 text-[11px] uppercase tracking-[0.4em] mb-6 block leading-none">Member Connectivity Hub</span>
          <h1 className="text-4xl lg:text-7xl font-display font-900 text-white mb-10 leading-tight tracking-tight">Party Portal Access</h1>
          <p className="text-white/80 text-lg lg:text-xl max-w-2xl mx-auto mb-16 leading-relaxed font-500 text-pretty">
            We utilize a secure party portal to provide a centralized hub for matter management,document transmittal and persistent communication.
          </p>
          <div className="flex justify-center flex-wrap gap-6 lg:gap-8">
            <Link to="/login" className="btn btn-primary px-12 py-6 text-base font-900 uppercase tracking-widest shadow-2xl shadow-primary-500/40 hover:-translate-y-1 transition-all duration-300 rounded-[1.5rem]">Access Portal</Link>
            <a href="#contact-us" className="btn btn-secondary px-12 py-6 text-base font-900 uppercase tracking-widest bg-white/5 shadow-sm border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 rounded-[1.5rem]">Need Access?</a>
          </div>
        </div>
      </section>






      {/* Floating Action Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border-4 border-white/20"
      >
        <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
        .reveal-on-scroll, .reveal-left, .reveal-right {
          opacity: 0;
          transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-on-scroll { transform: translateY(40px); }
        .reveal-left { transform: translateX(-50px); }
        .reveal-right { transform: translateX(50px); }
        
        .reveal-visible {
          opacity: 1;
          transform: translate(0, 0);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}} />
    </div>
  );
}
