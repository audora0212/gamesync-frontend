/* global self */
// Fallback service worker without importScripts to avoid external CDN blocking
// We handle background pushes via the standard 'push' event.

const handledMessageIds = new Set();

self.addEventListener('push', (event) => {
  if (!event) return;
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // if JSON parse fails, try raw text
    const text = event.data ? event.data.text() : '';
    payload = { data: { title: 'GameSync 알림', body: text } };
  }

  const dataObj = payload.data || payload; // support both {data:{...}} and flat {...}
  const mid = dataObj && (dataObj.messageId || dataObj.mid) || null;
  if (mid && handledMessageIds.has(mid)) return;
  if (mid) handledMessageIds.add(mid);

  const titleFromPayload = (payload.notification && payload.notification.title) || undefined;
  let title = dataObj.title || titleFromPayload || 'GameSync 알림';
  let body = dataObj.body  || (payload.notification && payload.notification.body)  || '';

  // If payload contains JSON string, prefer friendly text over raw JSON
  try {
    if (typeof dataObj.payload === 'string' && dataObj.payload.trim().startsWith('{')) {
      const p = JSON.parse(dataObj.payload);
      const kind = p.kind;
      if (kind === 'friend_request') {
        const fromNickname = p.fromNickname || '상대방';
        if (!titleFromPayload && !dataObj.title) title = '친구 요청';
        body = `${fromNickname} 님이 친구 요청을 보냈어요.\n친구패널에서 수락/거절할 수 있어요`;
      } else if (kind === 'server_invite') {
        const fromNickname = p.fromNickname || '상대방';
        const serverName = p.serverName || '';
        if (!titleFromPayload && !dataObj.title) title = '서버 초대';
        body = `${fromNickname} → ${serverName}`;
      } else if (kind === 'party') {
        const fromNickname = p.fromNickname || p.userNickname || p.nickname || '상대방';
        const serverName = p.serverName || '서버';
        const partyName = p.partyName || p.title || p.name || p.gameName || '';
        if (!titleFromPayload && !dataObj.title) title = '파티 모집';
        body = partyName
          ? `${fromNickname} 님이 ${serverName} 서버에서 ${partyName} 파티를 모집했어요`
          : `${fromNickname} 님이 ${serverName} 서버에서 파티를 모집했어요`;
      }
    }
  } catch {}

  // Simple fallback for PARTY notifications when no body supplied
  if ((!body || body === '') && dataObj.type === 'PARTY') {
    body = '새 파티 모집 알림이 도착했습니다.';
  }

  const options = {
    body,
    data: dataObj || {},
    icon: '/logo_round.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
  // 초대/친구요청 감지 시 열린 클라이언트에 메시지 전송 (모바일 앱에서 새로고침 유도)
  try {
    const raw = (dataObj && dataObj.payload) || undefined;
    let kind = undefined;
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      try { kind = JSON.parse(raw).kind } catch {}
    }
    if (kind === 'server_invite' || kind === 'friend_request') {
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            try { client.postMessage({ type: 'REFRESH_ON_INVITE' }) } catch {}
          })
        })
      )
    }
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // 우선순위: payload.data.url → notification.data.url → 기본 경로
  let targetUrl = '/notifications';
  try {
    const d = event.notification && event.notification.data || {};
    if (d && typeof d.url === 'string' && d.url.length > 0) {
      targetUrl = d.url;
    }
  } catch {}
  try {
    if (event && event.notification && event.notification.data && event.notification.data.url) {
      targetUrl = event.notification.data.url;
    }
  } catch {}
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});


