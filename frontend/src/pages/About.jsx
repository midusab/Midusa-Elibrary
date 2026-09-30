import { motion } from 'framer-motion';
import { FiBookOpen, FiTarget, FiUsers, FiAward } from 'react-icons/fi';
import Card from '../components/ui/Card';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
            About MidusaElibrary
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto px-2">
            Your gateway to unlimited knowledge and personal growth
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 sm:mb-16"
        >
          <Card className="p-6 sm:p-8 text-center border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              At MidusaElibrary, we believe that knowledge should be accessible to everyone. 
              Our mission is to provide a curated collection of high-quality eBooks that empower 
              individuals to learn, grow, and achieve their goals. We're committed to delivering 
              exceptional reading experiences and fostering a community of lifelong learners.
            </p>
          </Card>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-10 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8 text-center tracking-tight">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: FiBookOpen,
                title: 'Quality Content',
                description: 'Curated eBooks from trusted authors and publishers'
              },
              {
                icon: FiTarget,
                title: 'Accessibility',
                description: 'Making knowledge available to everyone, everywhere'
              },
              {
                icon: FiUsers,
                title: 'Community',
                description: 'Building a network of passionate learners'
              },
              {
                icon: FiAward,
                title: 'Excellence',
                description: 'Delivering the best reading experience possible'
              }
            ].map((value, index) => (
              <Card key={value.title} className="p-5 sm:p-6 text-center border border-slate-100 dark:border-slate-800">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-primary mb-4">
                  <value.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 sm:p-8 border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 text-center tracking-tight">
              Our Story
            </h2>
            <div className="max-w-3xl mx-auto space-y-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                MidusaElibrary was founded with a simple yet powerful vision: to create a digital 
                library that combines the convenience of modern technology with the timeless value 
                of quality literature. We recognized that in an age of information overload, finding 
                truly valuable educational resources was becoming increasingly difficult.
              </p>
              <p>
                Our team of passionate readers, educators, and technologists came together to build 
                a platform that would not only host books but would curate, organize, and present 
                them in a way that makes learning enjoyable and effective. We partner with leading 
                authors, publishers, and educational institutions to bring you the best content 
                available.
              </p>
              <p>
                Today, MidusaElibrary serves thousands of readers worldwide, offering a diverse 
                collection of eBooks across business, technology, psychology, finance, and personal 
                development. We're constantly expanding our library and improving our platform to 
                better serve our growing community of learners.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
