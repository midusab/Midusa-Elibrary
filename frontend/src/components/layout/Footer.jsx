import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center mb-4">
              <img src="/src/assets/logo.jpg" alt="MidusaElibrary" className="h-10 w-10 rounded-full" />
              <span className="ml-2 text-xl font-bold text-primary">MidusaElibrary</span>
            </div>
            <p className="text-slate-400 mb-4">
              Get Your Best eBooks Today. Elevate Your Knowledge with our curated collection of premium digital resources.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <FiFacebook className="w-6 h-6" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <FiTwitter className="w-6 h-6" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <FiInstagram className="w-6 h-6" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2 }}
                href="#"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <FiLinkedin className="w-6 h-6" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Home</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Library</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Categories</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Catalog & Content */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Catalog & Content</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Programming</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Business</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Finance</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Psychology</a></li>
              <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Self Development</a></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <FiPhone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-slate-400">0112478220</span>
              </li>
              <li className="flex items-start space-x-3">
                <FiMail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <a href="mailto:midusab@gmail.com" className="text-slate-400 hover:text-primary transition-colors">
                  midusab@gmail.com
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <FiMapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-slate-400">Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
            <p className="text-slate-400 text-sm">
              © {currentYear} MidusaElibrary. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">Terms & Conditions</a>
              <a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-primary text-sm transition-colors">FAQ</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
