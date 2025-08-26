// Client-only helpers to interact with Capacitor when running inside the hybrid app

function getCap(): any | null {
  const w = typeof window !== 'undefined' ? (window as any) : null;
  return w && w.Capacitor ? w.Capacitor : null;
}

function getPlugin<T = any>(name: string): T | null {
  const Cap = getCap();
  if (!Cap) return null;
  // Try direct plugin accessor first (Capacitor v6 proxies)
  if (Cap[name]) return Cap[name] as T;
  // Fallback to legacy Plugins container
  if (Cap.Plugins && Cap.Plugins[name]) return Cap.Plugins[name] as T;
  return null;
}

export async function isNative(): Promise<boolean> {
  const Cap = getCap();
  return !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
}

export async function getPlatform(): Promise<'ios' | 'android' | 'web'> {
  const Cap = getCap();
  if (Cap && typeof Cap.getPlatform === 'function') return Cap.getPlatform() as 'ios' | 'android' | 'web';
  return 'web';
}

export async function onAppUrlOpen(callback: (url: string) => void) {
  if (!(await isNative())) return () => {};
  const App: any = getPlugin('App');
  if (!App || typeof App.addListener !== 'function') return () => {};
  const sub = await App.addListener('appUrlOpen', (data: any) => {
    if (data?.url) callback(data.url);
  });
  return () => sub?.remove?.();
}

export async function getLaunchUrl(): Promise<string | null> {
  try {
    if (!(await isNative())) return null;
    const App: any = getPlugin('App');
    if (!App || typeof App.getLaunchUrl !== 'function') return null;
    const res = await App.getLaunchUrl();
    return res?.url ?? null;
  } catch {
    return null;
  }
}

export async function clearLaunchUrl() {
  try {
    if (!(await isNative())) return;
    const App: any = getPlugin('App');
    // Launch URL을 클리어하는 방법 - 빈 문자열로 설정
    if (App && typeof App.getLaunchUrl === 'function') {
      // Capacitor doesn't have a direct clear method, but we can work around it
      // by setting a flag in storage that the launch URL has been processed
      const Preferences: any = getPlugin('Preferences');
      if (Preferences) {
        await Preferences.set({ key: 'launch_url_processed', value: 'true' });
      }
    }
  } catch {}
}

export async function onAppStateChange(callback: (isActive: boolean) => void) {
  if (!(await isNative())) return () => {};
  const App: any = getPlugin('App');
  if (!App || typeof App.addListener !== 'function') return () => {};
  const sub = await App.addListener('appStateChange', (state: any) => {
    try { callback(!!state?.isActive); } catch {}
  });
  return () => sub?.remove?.();
}

export async function openExternal(url: string) {
  if (!(await isNative())) {
    window.location.href = url;
    return;
  }
  const Browser: any = getPlugin('Browser');
  if (Browser && typeof Browser.open === 'function') {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
  } else {
    window.location.href = url;
  }
}

// OAuth 로그인을 위한 인앱 브라우저 열기
export async function openOAuthInBrowser(url: string) {
  const Browser: any = getPlugin('Browser');
  if (Browser && typeof Browser.open === 'function') {
    // OAuth 로그인용 인앱 브라우저 열기
    await Browser.open({ 
      url, 
      presentationStyle: 'pagesheet', // iOS에서 모달 스타일로 열기
      windowName: '_self' // 같은 창에서 열기
    });
    return true;
  }
  return false;
}

// 인앱 브라우저 닫기
export async function closeBrowser() {
  const Browser: any = getPlugin('Browser');
  if (Browser && typeof Browser.close === 'function') {
    try {
      await Browser.close();
      return true;
    } catch (err) {
      console.error('Failed to close browser:', err);
    }
  }
  return false;
}

export async function registerNativePush(): Promise<string | null> {
  if (!(await isNative())) return null;
  // Prefer Firebase Messaging for FCM registration token on iOS/Android
  const FCM: any = getPlugin('FirebaseMessaging');
  if (FCM && typeof FCM.requestPermissions === 'function') {
    try {
      await FCM.requestPermissions();
      const res = await FCM.getToken();
      if (res && typeof res.token === 'string' && res.token.length > 0) {
        return res.token as string; // FCM token
      }
    } catch {}
  }
  const Push: any = getPlugin('PushNotifications');
  if (!Push) return null;
  try {
    const perm = await Push.checkPermissions();
    if (perm?.receive === 'denied') {
      const req = await Push.requestPermissions();
      if (req?.receive !== 'granted') return null;
    }
    return await new Promise<string | null>(async (resolve) => {
      const regSub = await Push.addListener('registration', (token: any) => {
        resolve(token?.value ?? null);
        regSub?.remove?.();
      });
      const errSub = await Push.addListener('registrationError', () => {
        resolve(null);
        errSub?.remove?.();
      });
      await Push.register();
    });
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string) {
  const S: any = getPlugin('SecureStoragePlugin');
  if (!S) return;
  try { await S.set({ key, value }); } catch {}
}

export async function secureGet(key: string): Promise<string | null> {
  const S: any = getPlugin('SecureStoragePlugin');
  if (!S) return null;
  try {
    const v = await S.get({ key });
    return v?.value ?? null;
  } catch {
    return null;
  }
}

export async function secureRemove(key: string) {
  const S: any = getPlugin('SecureStoragePlugin');
  if (!S) return;
  try { await S.remove({ key }); } catch {}
}


