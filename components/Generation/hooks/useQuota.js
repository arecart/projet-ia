// hooks/useQuota.js
import { useState, useEffect } from 'react';

export const useQuota = (selectedProvider) => {
  const [quotaInfo, setQuotaInfo] = useState({
    current: 0,
    max: 0,
    remaining: 0,
  });

  const refreshQuota = async () => {
    try {
      // On passe le provider en query paramètre
      const response = await fetch(`/api/quota?provider=${selectedProvider}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du quota');
      const data = await response.json();
      setQuotaInfo(data);
    } catch (error) {
      console.error('Erreur de quota:', error);
    }
  };

  useEffect(() => {
    if (selectedProvider) {
      refreshQuota();
      const interval = setInterval(refreshQuota, 60000);
      return () => clearInterval(interval);
    }
  }, [selectedProvider]);

  return { quotaInfo, setQuotaInfo, refreshQuota };
};
