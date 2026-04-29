export type LiveApplicationAlertPayload = {
  id?: string;
  studentUid?: string;
  student_uid?: string;
  name?: string;
  student_name?: string;
  createdAt?: string;
  source?: string;
  nonce?: string;
};

const STORAGE_KEY = 'portal:new-application-alert';
const CHANNEL_NAME = 'portal-new-application-alert';

export const emitNewApplicationAlert = (payload: LiveApplicationAlertPayload) => {
  if (typeof window === 'undefined') return;

  const message = {
    ...payload,
    nonce: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    }
  } catch {
    // Ignore broadcast failures and rely on storage fallback.
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
  } catch {
    // Ignore storage failures in private/locked-down contexts.
  }
};

export const subscribeToNewApplicationAlerts = (
  onAlert: (payload: LiveApplicationAlertPayload) => void,
) => {
  if (typeof window === 'undefined') return () => {};
  const seenNonces = new Set<string>();

  const deliver = (payload: LiveApplicationAlertPayload) => {
    const hasKey = Boolean(payload.id || payload.studentUid || payload.student_uid);
    if (!hasKey) return;
    if (payload.nonce) {
      if (seenNonces.has(payload.nonce)) return;
      seenNonces.add(payload.nonce);
    }
    onAlert(payload);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      deliver(JSON.parse(event.newValue) as LiveApplicationAlertPayload);
    } catch {
      // Ignore malformed payloads.
    }
  };

  const handleBroadcast = (event: MessageEvent) => {
    try {
      deliver(event.data as LiveApplicationAlertPayload);
    } catch {
      // Ignore malformed payloads.
    }
  };

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  window.addEventListener('storage', handleStorage);
  channel?.addEventListener('message', handleBroadcast);

  return () => {
    window.removeEventListener('storage', handleStorage);
    channel?.removeEventListener('message', handleBroadcast);
    channel?.close();
  };
};
