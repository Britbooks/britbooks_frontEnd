export interface AuthPromptPayload {
  message: string;   // e.g. "Sign in to save to your wishlist"
  action?: string;   // e.g. "add to wishlist" (used in modal subtitle)
}

type Listener = (payload: AuthPromptPayload) => void;
let listeners: Listener[] = [];

export function showAuthPrompt(payload: AuthPromptPayload) {
  listeners.forEach((fn) => fn(payload));
}

export function subscribeAuthPrompt(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}
