const STORAGE_KEY = "stonecutter-chat-sessions";
const MAX_SESSIONS = 10;

export interface ChatSession {
  id: string;
  title: string;
  messages: any[]; // UIMessage[] serialized
  createdAt: number;
  updatedAt: number;
}

export interface ChatSessionStore {
  activeId: string;
  sessions: ChatSession[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function titleFromMessages(messages: any[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New conversation";
  const text =
    firstUserMsg.parts?.find((p: any) => p.type === "text")?.text ??
    firstUserMsg.content ??
    "New conversation";
  return text.length > 40 ? text.slice(0, 40) + "..." : text;
}

export function loadStore(): ChatSessionStore {
  if (typeof window === "undefined") {
    return { activeId: "", sessions: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { activeId: "", sessions: [] };
}

function saveStore(store: ChatSessionStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getActiveSession(store: ChatSessionStore): ChatSession | null {
  return store.sessions.find((s) => s.id === store.activeId) ?? null;
}

export function createSession(store: ChatSessionStore): ChatSessionStore {
  const id = generateId();
  const session: ChatSession = {
    id,
    title: "New conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  let sessions = [session, ...store.sessions];
  if (sessions.length > MAX_SESSIONS) {
    sessions = sessions.slice(0, MAX_SESSIONS);
  }

  const next = { activeId: id, sessions };
  saveStore(next);
  return next;
}

export function updateSessionMessages(
  store: ChatSessionStore,
  sessionId: string,
  messages: any[],
): ChatSessionStore {
  const sessions = store.sessions.map((s) => {
    if (s.id !== sessionId) return s;
    return {
      ...s,
      messages,
      title: s.title === "New conversation" ? titleFromMessages(messages) : s.title,
      updatedAt: Date.now(),
    };
  });
  const next = { ...store, sessions };
  saveStore(next);
  return next;
}

export function switchSession(
  store: ChatSessionStore,
  sessionId: string,
): ChatSessionStore {
  const next = { ...store, activeId: sessionId };
  saveStore(next);
  return next;
}

export function deleteSession(
  store: ChatSessionStore,
  sessionId: string,
): ChatSessionStore {
  const sessions = store.sessions.filter((s) => s.id !== sessionId);
  let activeId = store.activeId;
  if (activeId === sessionId) {
    activeId = sessions[0]?.id ?? "";
  }
  const next = { activeId, sessions };
  saveStore(next);
  return next;
}
