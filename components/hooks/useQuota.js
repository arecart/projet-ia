'use client';
import { useState, useEffect } from 'react';

function useQuota(userId, selectedModel) {
  const [quotaInfo, setQuotaInfo] = useState({
    current: 0,
    max: 1000000,
    remaining: 1000000,
    longCurrent: 0,
    longMax: 10,
    longRemaining: 10,
  });

  const refreshQuota = async () => {
    try {
      const response = await fetch(`/api/quota?userId=${userId}&model=${selectedModel}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du quota');
      const data = await response.json();
      setQuotaInfo({
        current: data.current,
        max: data.max,
        remaining: data.remaining,
        longCurrent: data.longCurrent,
        longMax: data.longMax,
        longRemaining: data.longRemaining,
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    if (userId) {
      refreshQuota();
      const interval = setInterval(refreshQuota, 60000);
      return () => clearInterval(interval);
    }
  }, [userId, selectedModel]);

  return { quotaInfo, refreshQuota };
}

export default useQuota;
