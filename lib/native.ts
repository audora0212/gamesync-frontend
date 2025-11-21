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
    const url: string | null = res?.url ?? null;
    if (!url) return null;
    // 이미 처리한 런치 URL이면 무시 (Preferences에 최종 처리된 값 저장)
    const Preferences: any = getPlugin('Preferences');
    if (Preferences && typeof Preferences.get === 'function') {
      try {
        const prev = await Preferences.get({ key: 'last_launch_url_processed' });
        if (prev?.value && prev.value === url) {
          return null;
        }
      } catch {}
    }
    return url;
  } catch {
    return null;
  }
}

export async function clearLaunchUrl() {
  try {
    if (!(await isNative())) return;
    const App: any = getPlugin('App');
    // 현재 런치 URL을 조회하여 "처리 완료"로 마킹 (다음부터 무시)
    if (App && typeof App.getLaunchUrl === 'function') {
      const Preferences: any = getPlugin('Preferences');
      try {
        const res = await App.getLaunchUrl();
        const url: string | null = res?.url ?? null;
        if (Preferences && typeof Preferences.set === 'function') {
          await Preferences.set({ key: 'last_launch_url_processed', value: url || 'NONE' });
        }
      } catch {
        if (Preferences && typeof Preferences.set === 'function') {
          await Preferences.set({ key: 'last_launch_url_processed', value: 'NONE' });
        }
      }
    }
  } catch {}
}

export async function markLaunchUrlProcessed(url: string) {
  try {
    if (!(await isNative())) return;
    const Preferences: any = getPlugin('Preferences');
    if (Preferences && typeof Preferences.set === 'function') {
      await Preferences.set({ key: 'last_launch_url_processed', value: url || 'CLEARED' });
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
  
  // Use @capacitor-firebase/messaging plugin
  const FCM: any = getPlugin('FirebaseMessaging');
  if (FCM && typeof FCM.requestPermissions === 'function') {
    try {
      // Request permissions first
      const permissionResult = await FCM.requestPermissions();
      console.log('FCM permission result:', permissionResult);
      
      // Get FCM token
      const tokenResult = await FCM.getToken();
      console.log('FCM token result:', tokenResult);
      
      if (tokenResult && typeof tokenResult.token === 'string' && tokenResult.token.length > 0) {
        return tokenResult.token as string; // FCM token
      }
    } catch (error) {
      console.error('FCM registration error:', error);
    }
  }
  
  // Fallback to PushNotifications for permission request only
  try {
    const Push: any = getPlugin('PushNotifications');
    if (Push) {
      const perm = await Push.checkPermissions();
      if (perm?.receive !== 'granted') {
        await Push.requestPermissions();
      }
    }
  } catch (error) {
    console.error('Push permission error:', error);
  }
  
  return null;
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


// Listen when a native notification is tapped by the user
export async function onNativeNotificationOpen(callback: (data: any) => void) {
  if (!(await isNative())) return () => {};
  // Prefer FirebaseMessaging plugin if available
  const FM: any = getPlugin('FirebaseMessaging');
  if (FM && typeof FM.addListener === 'function') {
    try {
      const sub = await FM.addListener('notificationOpened', (event: any) => {
        try { callback(event?.notification?.data) } catch {}
      });
      return () => { try { sub?.remove?.() } catch {} };
    } catch {}
  }
  // Fallback to PushNotifications plugin
  const Push: any = getPlugin('PushNotifications');
  if (Push && typeof Push.addListener === 'function') {
    try {
      const sub = await Push.addListener('pushNotificationActionPerformed', (action: any) => {
        try { callback(action?.notification?.data) } catch {}
      });
      return () => { try { sub?.remove?.() } catch {} };
    } catch {}
  }
  return () => {};
}


