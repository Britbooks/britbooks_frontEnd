export interface CartToastPayload {
  title: string;
  img?: string;
  price?: number;
}

type Listener = (payload: CartToastPayload) => void;
let listeners: Listener[] = [];

export function emitCartToast(payload: CartToastPayload) {
  listeners.forEach((fn) => fn(payload));
}

export function subscribeCartToast(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}
