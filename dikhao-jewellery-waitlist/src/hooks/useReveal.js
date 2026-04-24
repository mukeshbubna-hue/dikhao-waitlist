import { useEffect } from 'react';

// Adds .is-visible to any element with .reveal when it scrolls into view
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
