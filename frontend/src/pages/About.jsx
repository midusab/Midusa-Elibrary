import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiTarget, FiUsers, FiAward, FiShield, FiArrowRight, FiCheck } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Cardimg from '../assets/hero2.jpg'
import Button from '../components/ui/Button';
import { CATEGORIES } from '../constants/categories';
import CategoryIcon from '../components/ui/CategoryIcon';

export default function About() {
  return (
    <div className="min-h-screen bg-white py-10 sm:py-16 bg-cover bg-fixed bg-center bg-no-repeat overflow-hidden"  style={{
          backgroundImage: `url(${Cardimg})`,
        }} >
         
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full">
            Our Purpose & Vision
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-3 tracking-tight">
            Curating Knowledge That Matters
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
            MidusaElibrary is built to cut through digital noise. We provide high-impact eBooks in four essential disciplines that shape character, intellect, wealth, and faith.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 " 
         
        >
          <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between"
          >
            <div >
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-5"
             >
                <FiTarget className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Our Mission
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To equip readers with transformative, practical literature that inspires self-mastery, mental fortitude, financial sovereignty, and spiritual grounding. Every title on our platform is carefully verified for clarity and depth.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-primary">
              <FiCheck className="mr-1.5 text-emerald-500" />
              Verified Digital Formats (PDF/EPUB)
            </div>
          </Card>

          <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mb-5">
                <FiShield className="w-6 h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Accessible & Fair
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We bridge international quality with local accessibility in Kenya and beyond. Transparent pricing in Kenyan Shillings (KSh) with seamless M-PESA and card checkouts ensures everyone can access life-changing books without hurdles.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-primary">
              <FiCheck className="mr-1.5 text-emerald-500" />
              Lifetime Ownership & Instant Download
            </div>
          </Card>
        </div>

        {/* 4 Pillars Section */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              The Four Foundations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Why we strictly focus on these four categories
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/** {CATEGORIES.map((cat) => (
              <Card key={cat.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                    <CategoryIcon slug={cat.slug} className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/library?category=${encodeURIComponent(cat.name)}`}
                    className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1"
                  >
                    <span>Browse {cat.name}</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}*/}
          </div>
        </div>

        {/* Values Section */}
        <div className="p-8 sm:p-10 rounded-2xl liquid-glass border border-white/80 shadow-sm text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Built for Readers Who Demand Excellence
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6">
            Join a growing network of focused minds across Africa elevating their potential daily.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/library">
              <Button size="md" className="px-6 text-xs sm:text-sm font-semibold">
                Explore Full Library
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="md" className="px-6 text-xs sm:text-sm font-semibold">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
