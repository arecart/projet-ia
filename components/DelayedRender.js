'use client';
import { useEffect, useState } from 'react';

export default function DelayedRender({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="fixed-glass-morphism">Chargement...</div>;
  }

  return children;
}
