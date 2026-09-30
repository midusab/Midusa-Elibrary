import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiCheckCircle } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { success, error } = useToast();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      success('Thank you! Your message has been delivered to support.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 700);
  };

  return (
    <div className="min-h-screen bg-white py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary-50 px-3 py-1 rounded-full">
            Help & Inquiries
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
            Get in Touch With Us
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600">
            Have a question about an eBook, order, or category recommendation? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Direct Channels
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Phone & WhatsApp</h3>
                    <p className="text-slate-600 font-medium">0112478220</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Email Support</h3>
                    <a href="mailto:midusab@gmail.com" className="text-primary hover:underline font-medium">
                      midusab@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center flex-shrink-0">
                    <FiMapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Operating Base</h3>
                    <p className="text-slate-600">Nairobi, Kenya</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <FiClock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Typical response time: within <strong>2 to 4 hours</strong></span>
              </div>
            </Card>
          </div>

          {/* Contact Message Form */}
          <div className="lg:col-span-8">
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Message Received</h3>
                  <p className="text-xs text-slate-600 mb-5 max-w-sm mx-auto">
                    We have received your note and our team will get back to your email shortly.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                    className="text-xs"
                  >
                    Send Another Note
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                    Send Us a Direct Message
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Your name"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="you@domain.com"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Topic or Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="e.g. Order Inquiry / Book Request"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        placeholder="Write your message here..."
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="md"
                      disabled={isSubmitting}
                      className="w-full py-3 text-xs sm:text-sm font-semibold shadow-sm"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
