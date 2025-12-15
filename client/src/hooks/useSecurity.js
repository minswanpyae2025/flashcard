import { useEffect } from 'react';

export const useAntiLeak = () => {
  useEffect(() => {
    const handleContextmenu = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleCut = (e) => e.preventDefault();
    const handlePaste = (e) => e.preventDefault();

    // Disable printing
    const handleBeforePrint = (e) => {
        // We can't strictly block printing, but we can hide content via CSS media print
        // or try to annoy the user.
        // CSS is the best way: @media print { body { display: none; } }
    };

    document.addEventListener('contextmenu', handleContextmenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextmenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);
};

export const useBlurOnInactive = () => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.filter = 'blur(10px)';
      } else {
        document.body.style.filter = 'none';
      }
    };

    const handleBlur = () => {
        document.body.style.filter = 'blur(10px)';
    };

    const handleFocus = () => {
        document.body.style.filter = 'none';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.body.style.filter = 'none'; // cleanup
    };
  }, []);
};
