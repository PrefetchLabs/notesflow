import { useEffect, useState } from 'react';

interface DeviceFingerprint {
  fingerprint: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
}

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);

  useEffect(() => {
    const generateFingerprint = () => {
      const components = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.hardwareConcurrency || 0,
        navigator.maxTouchPoints || 0,
      ];

      // Create a simple hash from components
      const hash = components.join('|');
      const fingerprintHash = btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

      const deviceInfo: DeviceFingerprint = {
        fingerprint: fingerprintHash,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
      };

      setFingerprint(deviceInfo);
      
      // Register device with backend
      registerDevice(deviceInfo);
    };

    generateFingerprint();
  }, []);

  const registerDevice = async (deviceInfo: DeviceFingerprint) => {
    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceInfo),
      });
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  return fingerprint;
}