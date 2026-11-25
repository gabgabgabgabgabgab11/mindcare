/** Share duplicate auth-event loads; cache only successful results per session. */
export function createAccountLoader<T>(fetchAccount: () => Promise<T>) {
  let version = 0;
  let loaded: { key: string; value: T } | null = null;
  let pending: { key: string; promise: Promise<T> } | null = null;
  return {
    isLoaded: (key: string) => loaded?.key === key,
    clear() { version++; loaded = null; pending = null; },
    load(key: string, force = false): Promise<T> {
      if (pending?.key === key) return pending.promise;
      if (!force && loaded?.key === key) return Promise.resolve(loaded.value);
      const currentVersion = ++version;
      const promise = fetchAccount().then((value) => {
        if (currentVersion === version) loaded = { key, value };
        return value;
      }).finally(() => {
        if (currentVersion === version) pending = null;
      });
      pending = { key, promise };
      return promise;
    },
  };
}
