// components/ClientLayout.js
'use client';
import { useEffect, useState } from 'react';

export default function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <body className={`${mounted ? 'dynamic-background' : ''} min-h-screen text-white`}>
      {children}
    </body>
  );
}
