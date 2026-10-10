import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FiShield, FiFileText, FiRefreshCw, FiLock, FiCheckCircle, FiMail } from 'react-icons/fi';
import Card from '../components/ui/Card';

export default function Legal() {
  const location = useLocation();

  // Tab: 'refunds' | 'privacy' | 'terms' | 'dmca'
  const getInitialTab = () => {
    if (location.pathname.includes('refund')) return 'refunds';
    if (location.pathname.includes('privacy')) return 'privacy';
    if (location.pathname.includes('terms')) return 'terms';
    if (location.pathname.includes('dmca')) return 'dmca';
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'refunds';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E90FF] text-xs font-semibold mb-3">
            <FiShield className="w-3.5 h-3.5" />
            Trust, Security & Transparency
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Policies &amp; Legal Terms
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Clear guidelines on digital delivery, customer privacy, refund eligibility, and content copyright.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 pb-6 border-b border-slate-200 overflow-x-auto scrollbar-none mb-8">
          {[
            { id: 'refunds', label: 'Digital Goods & Refund Policy', icon: FiRefreshCw },
            { id: 'privacy', label: 'Privacy Policy', icon: FiLock },
            { id: 'terms', label: 'Terms of Service', icon: FiFileText },
            { id: 'dmca', label: 'Copyright & DMCA', icon: FiShield }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <Card className="p-6 sm:p-10 bg-white border border-slate-200/80 rounded-3xl shadow-sm text-slate-700 leading-relaxed space-y-8">
          {/* TAB 1: REFUND POLICY */}
          {activeTab === 'refunds' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-5">
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider">Consumer Protection</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Digital Goods Refund Policy</h2>
                <p className="text-xs text-slate-400 mt-1">Effective Date: January 1, 2026 • Last updated: October 2026</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs sm:text-sm text-slate-800 space-y-2">
                <p className="font-bold text-[#1E90FF] flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4" /> Summary of Digital Delivery Rights
                </p>
                <p>
                  Because eBooks sold on <strong>MidusaElibrary</strong> are intangible digital files delivered immediately upon M-PESA confirmation, general change-of-mind refunds are restricted once downloaded. However, we guarantee <strong>100% full replacement or refund</strong> under our consumer assurance clauses below.
                </p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Situations Eligible for Full Refund or Replacement</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                  <li>
                    <strong>Corrupted or Defective Files:</strong> If the PDF file cannot be opened, has missing pages, or formatting errors that prevent reading, and we are unable to provide a functional replacement within 24 hours.
                  </li>
                  <li>
                    <strong>Duplicate Billing:</strong> If your M-PESA transaction was billed more than once for the same checkout order, any excess payment is reversed in full within 2–4 hours.
                  </li>
                  <li>
                    <strong>Undelivered Digital Links:</strong> If payment was confirmed by Safaricom M-PESA but the digital download link or bookshelf access was not generated, our support team will manually dispatch the eBook or issue a refund.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Ineligible Circumstances</h3>
                <p className="text-sm text-slate-600">
                  Refunds cannot be granted if:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  <li>You completed the purchase and successfully downloaded the complete PDF file.</li>
                  <li>Your reading device lacks a PDF reader app (PDFs are universally compatible with Adobe, Apple Books, Google Drive, and web browsers).</li>
                  <li>You decided you no longer desire the book content after purchase.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. How to Request a Refund</h3>
                <p className="text-sm text-slate-600">
                  Contact our dedicated support desk within <strong>48 hours</strong> of transaction with your M-PESA Confirmation Code and registered account email:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="mailto:midusab@gmail.com?subject=Refund%20Request%20-%20MidusaElibrary"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    <FiMail className="w-4 h-4" /> Email: midusab@gmail.com
                  </a>
                  <a
                    href="https://wa.me/254112478220?text=Hi%20MidusaElibrary,%20I%20need%20help%20with%20an%20order"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    WhatsApp Support: 0112 478 220
                  </a>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-5">
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider">Data Protection</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Privacy Policy</h2>
                <p className="text-xs text-slate-400 mt-1">Compliant with Kenya Data Protection Act 2019 &amp; Global Privacy Standards</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Information We Collect</h3>
                <p className="text-sm text-slate-600">
                  We collect only the essential information required to deliver your purchased eBooks and manage your account:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                  <li><strong>Account Data:</strong> Name, email address, password hash (encrypted via bcrypt).</li>
                  <li><strong>Transaction Details:</strong> M-PESA phone number and transaction reference IDs. (We do not store banking passwords or PINs).</li>
                  <li><strong>Reading Activity:</strong> Books saved to your library, wishlists, and digital download timestamps.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. How Your Data Is Used</h3>
                <p className="text-sm text-slate-600">
                  Your information is strictly utilized to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  <li>Authenticate your login and grant digital downloads in "My Books".</li>
                  <li>Process automated payments via Safaricom Lipa Na M-PESA.</li>
                  <li>Send order receipts and important service notices.</li>
                  <li><strong>Never sell, rent, or lease your personal information to third-party advertisers.</strong></li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. Data Security</h3>
                <p className="text-sm text-slate-600">
                  All communications between your browser and our servers are encrypted with <strong>256-bit SSL/TLS encryption</strong>. Sensitive database records are stored in secure cloud infrastructure with strict access controls.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-5">
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider">User Agreement</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Terms of Service</h2>
                <p className="text-xs text-slate-400 mt-1">Governing digital eBook access on MidusaElibrary</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Digital License Grant</h3>
                <p className="text-sm text-slate-600">
                  When you purchase an eBook on MidusaElibrary, you are granted a non-exclusive, non-transferable, personal reading license. You are permitted to download and read the file on your personal computers, phones, tablets, and e-readers.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. Prohibited Uses &amp; Anti-Piracy</h3>
                <p className="text-sm text-slate-600">
                  To protect authors and publishers, you agree NOT to:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                  <li>Redistribute, resell, broadcast, or share downloaded PDF files publicly on torrents, messaging groups, or cloud drives.</li>
                  <li>Modify, reverse engineer, or strip intellectual property notices from book materials.</li>
                  <li>Attempt to bypass checkout validation or download unauthorized catalog titles.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">3. Currency &amp; Pricing</h3>
                <p className="text-sm text-slate-600">
                  All catalog prices are listed and billed in <strong>Kenyan Shillings (KSh)</strong>. Prices include all applicable taxes unless otherwise noted.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: COPYRIGHT & DMCA */}
          {activeTab === 'dmca' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-5">
                <span className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider">Intellectual Property</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">Copyright &amp; DMCA Notice</h2>
                <p className="text-xs text-slate-400 mt-1">Author Rights &amp; Content Takedown Procedure</p>
              </div>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">1. Respect for Intellectual Property</h3>
                <p className="text-sm text-slate-600">
                  MidusaElibrary strictly respects the rights of writers, creators, and publishing houses. All titles in our catalog are curated for educational, developmental, and transformative reading.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">2. DMCA Takedown Notices</h3>
                <p className="text-sm text-slate-600">
                  If you are a copyright holder or authorized agent and believe any title hosted on our platform infringes upon your copyright, please submit an expedited takedown notice containing:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                  <li>The specific title and URL of the eBook in question.</li>
                  <li>Proof of copyright ownership or legal representation.</li>
                  <li>Contact details (Full legal name, email, physical address).</li>
                </ul>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-3 text-xs">
                  <p className="font-bold text-slate-900">Designated Copyright Agent:</p>
                  <p className="text-slate-600">MidusaElibrary Legal Desk • Email: <a href="mailto:midusab@gmail.com" className="text-[#1E90FF] underline">midusab@gmail.com</a></p>
                  <p className="text-slate-500 mt-0.5">Response Time: All valid copyright notices are investigated and resolved within 24 business hours.</p>
                </div>
              </section>
            </div>
          )}

          {/* Footer Assistance Banner */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>Have questions regarding our legal agreements?</span>
            <Link to="/contact" className="text-[#1E90FF] font-semibold hover:underline">
              Visit Contact &amp; Help Desk →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
