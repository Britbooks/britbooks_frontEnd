export interface WishlistToastPayload {
  title: string;
  img?: string;
}

type Listener = (payload: WishlistToastPayload) => void;
let listeners: Listener[] = [];

export function emitWishlistToast(payload: WishlistToastPayload) {
  listeners.forEach((fn) => fn(payload));
}

export function subscribeWishlistToast(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}
