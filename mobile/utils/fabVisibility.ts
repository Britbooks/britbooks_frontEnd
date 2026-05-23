type Listener = (visible: boolean) => void;
let listeners: Listener[] = [];

export function setFabVisible(visible: boolean) {
  listeners.forEach((fn) => fn(visible));
}

export function subscribeFabVisible(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((f) => f !== fn); };
}
