import { motion } from 'framer-motion';

/**
 * Framer-motion animated WhatsApp floating action button.
 * Fixed bottom-right, links to wa.me with the business number.
 * Features:
 * - Spring entrance animation
 * - Subtle ambient pulse wave ring
 * - Micro-interactions (hover lift, tap feedback)
 */
export default function WhatsAppButton() {
  const WA_NUMBER = '254112478220'; // 0112478220 → international format

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '24px',
        zIndex: 9000,
      }}
      className="pointer-events-auto"
    >
      {/* Ambient Pulse Ping Beacon */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.4, 1.4],
          opacity: [0.55, 0, 0],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          backgroundColor: '#25D366',
          zIndex: -1,
        }}
      />

      <motion.a
        id="whatsapp-float-btn"
        href={`https://wa.me/${WA_NUMBER}?text=Hi%20MidusaElibrary%2C%20I%20have%20a%20question%20about%20your%20books.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 20,
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          backgroundColor: '#25D366',
          color: '#ffffff',
          borderRadius: '9999px',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
          cursor: 'pointer',
        }}
      >
        {/* Animated WhatsApp SVG Icon */}
        <motion.svg
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeInOut',
          }}
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.22-1.63A12.02 12.02 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.67-.5-5.25-1.44l-.37-.22-3.69.97.99-3.6-.24-.37A9.93 9.93 0 0 1 2 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22 12c0 5.51-4.49 10-10 10zm5.47-7.45c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.16 8.16 0 0 1-2.4-1.48 9.02 9.02 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.24-.24-.59-.49-.51-.68-.52l-.58-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.46 1.06 2.87 1.2 3.07.15.2 2.08 3.18 5.05 4.46.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.19-.57-.34z" />
        </motion.svg>
      </motion.a>
    </div>
  );
}
