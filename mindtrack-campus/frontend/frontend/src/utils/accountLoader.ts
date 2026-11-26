/** Retry only transient failures; never retry an authorization rejection. */
export async function retryAccountRequest<T>(
  request: () => Promise<T>,
  wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await request(); } catch (error) {
      const failure = error as { response?: { status?: number }; code?: string };
      const status = failure?.response?.status;
      const transient = status === 408 || status === 429 || (status !== undefined && status >= 500) ||
        (!status && ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(failure?.code ?? ''));
      if (!transient || attempt >= 2) throw error;
      await wait(750 * (attempt + 1));
    }
  }
}

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
