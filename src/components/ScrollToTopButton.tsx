import { useState, useEffect } from 'react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollY = window.scrollY;

      // Show only when page is taller than 2 viewports and user has scrolled past first viewport
      setVisible(pageHeight > viewportHeight * 2 && scrollY > viewportHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check on mount in case page is already scrolled
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 active:bg-blue-700 transition-opacity duration-300 z-50"
      aria-label="Scroll to top"
    >
      <i className="fa fa-arrow-up text-lg"></i>
    </button>
  );
}
