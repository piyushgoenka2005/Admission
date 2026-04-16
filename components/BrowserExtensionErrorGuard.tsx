'use client';

import { useEffect } from 'react';

const METAMASK_EXTENSION_ID = 'nkbihfbeogaeaoehlefnkodbefgpgknn';

function isMetaMaskExtensionError(message: string, stack: string): boolean {
  const combined = `${message}\n${stack}`.toLowerCase();

  return (
    combined.includes('metamask') ||
    combined.includes('failed to connect to metamask') ||
    combined.includes(`chrome-extension://${METAMASK_EXTENSION_ID}`)
  );
}

export function BrowserExtensionErrorGuard() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason instanceof Error
            ? reason.message
            : String(reason ?? '');
      const stack = reason instanceof Error ? reason.stack ?? '' : '';

      if (isMetaMaskExtensionError(message, stack)) {
        event.preventDefault();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message ?? '';
      const stack = event.error instanceof Error ? event.error.stack ?? '' : '';

      if (isMetaMaskExtensionError(message, stack)) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return null;
}