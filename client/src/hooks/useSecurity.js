import { useEffect } from 'react';
import { useAuth } from '../AuthContext';

export const useAntiLeak = () => {
  useEffect(() => {
    const handleContextmenu = (e) => e.preventDefault();
    const handleSelectStart = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();
    const handleCut = (e) => e.preventDefault();
    const handlePaste = (e) => e.preventDefault();

    // Keydown handler for DevTools
    const handleKeyDown = (e) => {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
        }
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J')) {
            e.preventDefault();
        }
    };

    const handleBeforePrint = (e) => {
       // handled via CSS mostly
    };

    document.addEventListener('contextmenu', handleContextmenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('contextmenu', handleContextmenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
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
      document.body.style.filter = 'none';
    };
  }, []);
};

export const useWatermarkProtection = (elementId) => {
    const { logout, user } = useAuth();

    useEffect(() => {
        if (!user) return; // Don't protect if not logged in

        let observer;
        let checkInterval;

        const startProtection = () => {
            const targetNode = document.getElementById(elementId);

            if (!targetNode) {
                // Not found. In a real app, strict mode might breach here immediately.
                // For robustness against race conditions (React render timing), we'll retry a few times then breach.
                // However, since this effect runs after render, it *should* be there.
                // If it's missing while logged in, that's a problem.

                // Let's give it a grace period of 1s to appear (e.g. animation or loading state)
                // If checking continuously:
                return false;
            }

            const callback = (mutationsList, observer) => {
                for(const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // Check if node removed
                        mutation.removedNodes.forEach(node => {
                            if (node.id === elementId) {
                                handleBreach();
                            }
                        });
                    }
                    if (mutation.type === 'attributes') {
                        // Check if style/class changed to hide it
                        const style = window.getComputedStyle(targetNode);
                        if (style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden') {
                            handleBreach();
                        }
                    }
                }

                checkState();
            };

            observer = new MutationObserver(callback);

            // Watch parent for removal of child, and target for attribute changes
            if (targetNode.parentNode) {
                observer.observe(targetNode.parentNode, { childList: true });
            }
            observer.observe(targetNode, { attributes: true, attributeFilter: ['style', 'class'] });

            return true;
        };

        const checkState = () => {
             const el = document.getElementById(elementId);
             if (!el) {
                 handleBreach();
                 return;
             }
             const style = window.getComputedStyle(el);
             if (style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden') {
                 handleBreach();
             }
        };

        const handleBreach = () => {
            alert('SECURITY BREACH DETECTED: Tampering with security elements. Logging out.');
            logout();
        };

        // Attempt to attach observer. If fail, retry shortly.
        if (!startProtection()) {
             checkInterval = setInterval(() => {
                 if (startProtection()) {
                     clearInterval(checkInterval);
                     checkInterval = setInterval(checkState, 2000); // Also poll periodically just in case
                 } else {
                     // If still missing after multiple retries, we could breach.
                     // For now, let's just keep trying or assume loading.
                 }
             }, 500);
        } else {
             checkInterval = setInterval(checkState, 2000); // Poll strictly
        }

        return () => {
            if (observer) observer.disconnect();
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [elementId, logout, user]);
};
