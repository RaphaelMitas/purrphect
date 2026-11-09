import Storage from "expo-sqlite/kv-store";

export function storedState<T>(key: string, parse: (raw: string | null) => T) {
  const listeners = new Set<() => void>();
  let state: T | undefined;

  const read = (): T => {
    if (state === undefined) {
      let raw: string | null = null;
      try {
        raw = Storage.getItemSync(key);
      } catch {}
      state = parse(raw);
    }
    return state;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const update = (change: (state: T) => T) => {
    const next = change(read());
    try {
      Storage.setItemSync(key, JSON.stringify(next));
    } catch (error) {
      console.error(error);
    }
    state = next;
    for (const listener of listeners) listener();
  };

  return { read, subscribe, update };
}
