import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'How do I purchase a book?',
    a: 'Browse our Shop or Categories, add the title you want to your cart, then proceed to checkout. We accept M-PESA via our official Buy Goods Till Number (Till: 1820548 - MidusaELibrary) as well as M-PESA Express STK Push. Once payment is validated in real time, your book is instantly available in your dashboard.',
  },
  {
    q: 'How do I access my purchased books?',
    a: 'After purchase, sign in and head to your Dashboard. Under the "My Purchases" tab you will find every title you have bought with a direct download link. Books are available immediately after real-time M-PESA payment validation.',
  },
  {
    q: 'What formats do the books come in?',
    a: 'All titles are delivered as high-quality PDF files, readable on any smartphone, tablet, laptop, or e-reader without any additional app purchases.',
  },
  {
    q: 'Can I access books on multiple devices?',
    a: 'Yes. Once purchased, you can download and read your books on as many personal devices as you like. There is no device limit — it is a one-time purchase with lifetime ownership.',
  },
  {
    q: 'What is your refund policy?',
    a: 'Because digital files are delivered immediately upon payment confirmation, we do not offer change-of-mind refunds. However, if you experience a technical issue or receive a corrupted file, we guarantee a full replacement or refund. Contact us on WhatsApp (0112478220) within 7 days.',
  },
  {
    q: 'Do I need an account to buy a book?',
    a: 'Yes — a Google account is required to purchase books. Sign in takes just one click via your existing Google account, no passwords needed. This lets us securely link your purchase to your library.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us via WhatsApp at 0112478220, email us at midusab@gmail.com, or use the contact form on our Contact page. Typical response time is within 2 to 4 hours.',
  },
  {
    q: 'Are new books added regularly?',
    a: 'Yes. Our catalogue is continuously curated with high-impact titles in Self-Development, Psychology, Business & Finance, and Christian Growth. Check back often or subscribe to our readers club newsletter for new arrivals.',
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="bg-white py-16 sm:py-20 border-t border-slate-100" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Everything you need to know about buying, accessing, and enjoying your books on MidusaElibrary.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
                  isOpen ? 'border-[#1E90FF]/40 bg-blue-50/40' : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  id={`faq-btn-${idx}`}
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF]/40"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
                  {isOpen ? (
                    <FiChevronUp className="w-4 h-4 text-[#1E90FF] flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center text-sm text-slate-500">
          Still have questions?{' '}
          <Link to="/contact" className="text-[#1E90FF] font-semibold hover:underline">
            Contact our support team
          </Link>
          {' '}or chat on WhatsApp{' '}
          <a
            href="https://wa.me/254112478220"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] font-semibold hover:underline"
          >
            0112478220
          </a>
          .
        </div>
      </div>
    </section>
  );
}
