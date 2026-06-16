import type { BrowserInfo } from './types';

interface NavigatorUADataBrand {
  brand: string;
  version: string;
}

interface NavigatorUAData {
  brands?: NavigatorUADataBrand[];
  platform?: string;
}

export async function getBrowserInfo(): Promise<BrowserInfo> {
  const nav = navigator as Navigator & { userAgentData?: NavigatorUAData };
  const uaData = nav.userAgentData;
  let brand = 'Chrome';
  let browserVersion = chrome.runtime.getManifest().version;

  if (uaData?.brands?.length) {
    const realBrand = uaData.brands.find(
      (b: NavigatorUADataBrand) =>
        !b.brand.includes('Chromium') && !b.brand.includes('Not'),
    );
    if (realBrand) {
      brand = realBrand.brand;
      browserVersion = realBrand.version;
    }
  }

  return {
    brand,
    browserVersion,
    os: uaData?.platform ?? navigator.platform,
    osVersion: navigator.userAgent,
    cookies: navigator.cookieEnabled,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution:
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0',
  };
}
