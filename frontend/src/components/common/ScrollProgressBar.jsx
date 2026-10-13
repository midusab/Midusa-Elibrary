import { useEffect, useState } from 'react';

/**
 * Thin scroll-progress bar pinned to the very top of the viewport.
 * Uses dodger-blue (#1E90FF) consistent with the site palette.
 */
export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, pct));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: '3px',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #1E90FF 0%, #38b6ff 100%)',
        transition: 'width 0.1s linear',
        pointerEvents: 'none',
      }}
    />
  );
}
