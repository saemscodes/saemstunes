import { useEffect, useState } from 'react';

interface AppVersion {
  version: string;
  build?: string;
  date?: string;
}

export default function useAppVersion(): AppVersion | null {
  const [version, setVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          setVersion(data);
        } else {
          setVersion({
            version: import.meta.env.VITE_APP_VERSION || '8.2.0',
            build: import.meta.env.VITE_APP_BUILD || 'dev',
            date: new Date().toISOString()
          });
        }
      } catch {
        setVersion({
          version: import.meta.env.VITE_APP_VERSION || '8.2.0',
          build: import.meta.env.VITE_APP_BUILD || 'dev',
          date: new Date().toISOString()
        });
      }
    };

    fetchVersion();
  }, []);

  return version;
}

export { useAppVersion };
