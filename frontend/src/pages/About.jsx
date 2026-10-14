import { Link } from 'react-router-dom';
import { FiTarget, FiShield, FiUsers, FiAward, FiCheck, FiArrowRight, FiMail } from 'react-icons/fi';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Cardimg from '../assets/hero15.png';

const PILLARS = [
  {
    title: 'Self-Development',
    desc: 'Proven frameworks for building habits, mental discipline, and high-performance mindsets that create lasting personal transformation.',
    color: '#1E90FF',
    bg: '#EFF6FF',
  },
  {
    title: 'Psychology',
    desc: 'Understand human behaviour, cognitive patterns, and emotional intelligence to improve relationships and decision-making.',
    color: '#1E90FF',
    bg: '#F5F3FF',
  },
  {
    title: 'Business & Finance',
    desc: 'Practical playbooks on entrepreneurship, investing, and building financial independence — tailored for the African context.',
    color: '#1E90FF',
    bg: '#ECFDF5',
  },
  {
    title: 'Christian Growth',
    desc: 'Faith-based literature for spiritual grounding, biblical wisdom, and purposeful living in the modern world.',
    color: '#1E90FF',
    bg: '#FFFBEB',
  },
];

const VALUES = [
  { icon: FiTarget, title: 'Curated Quality', desc: 'Every title is personally reviewed for practical depth and reader impact before it enters our catalogue.' },
  { icon: FiShield, title: 'Fair & Transparent', desc: 'KSh-priced titles with M-PESA checkout. No hidden fees, no subscriptions — you buy once and own forever.' },
  { icon: FiUsers, title: 'Reader-First', desc: 'We listen to our community. New categories, requests, and features are driven by what readers actually need.' },
  { icon: FiAward, title: 'Lifetime Access', desc: 'Your purchased books are always available in your dashboard. No expiry, no re-purchase.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <div
        className="relative py-20 sm:py-28 bg-cover bg-center bg-fixed overflow-hidden"
        style={{ backgroundImage: `url(${Cardimg})` }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/65" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Knowledge for a better you
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            MidusaElibrary is Kenya's digital bookstore for high-impact literature. We cut through the noise and deliver books that shape character, intellect, wealth, and faith.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/library">
              <Button size="md" className="px-7 text-sm font-semibold">
                Browse the Shop
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md" className="px-7 text-sm font-semibold border-white/30  hover:bg-white/10">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mission & Values */}
      <div className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Mission + Accessibility cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="p-7 sm:p-8 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E90FF] flex items-center justify-center mb-5">
                <FiTarget className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Our Mission</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                To equip readers across Africa with transformative, practical literature that inspires self-mastery, mental clarity, financial independence, and spiritual grounding. Every title on our platform is carefully verified for depth and real-world applicability.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#1E90FF]">
              <FiCheck className="text-emerald-500 w-4 h-4" />
              Verified, High-Impact PDF Titles
            </div>
          </Card>

          <Card className="p-7 sm:p-8 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <FiShield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Accessible & Fair</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                We bridge international quality with local accessibility. Transparent KSh pricing with seamless M-PESA (Lipa Na M-PESA) checkout ensures that every motivated reader in Kenya and beyond can access life-changing books without financial hurdles.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <FiCheck className="text-emerald-500 w-4 h-4" />
              Lifetime Ownership · Instant Download
            </div>
          </Card>
        </div>

        {/* Four Pillars */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Four Foundations of Growth
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              We focus exclusively on these four pillars because they cover everything that truly matters for a life well-lived.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((p) => (
              <Card key={p.title} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 font-extrabold text-sm"
                    style={{ backgroundColor: p.bg, color: p.color }}
                  >
                    {p.title.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    to={`/library?category=${encodeURIComponent(p.title)}`}
                    className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                    style={{ color: p.color }}
                  >
                    Browse {p.title} <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Our Core Values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#1E90FF]/10 text-[#1E90FF] flex items-center justify-center flex-shrink-0">
                  <v.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{v.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#1E90FF]/10 via-white to-blue-50 border border-[#1E90FF]/20 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Built for Readers Who Demand Excellence
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
            Join a growing community of focused minds across Africa elevating their potential every day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/library">
              <Button size="md" className="px-7 text-sm font-semibold">
                Explore the Shop
              </Button>
            </Link>
            <a href="mailto:midusab@gmail.com">
              <Button variant="outline" size="md" className="px-7 text-sm font-semibold gap-2">
                <FiMail className="w-4 h-4" />
                Email Our Team
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
