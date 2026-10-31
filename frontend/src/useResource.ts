import { useEffect, useState } from "react";
export default function useResource<T>(url: string, refresh: number) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
    url: string;
  }>({ data: null, error: null, loading: true, url });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: null, loading: true, url });
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          let detail = `Request failed (${response.status})`;
          try {
            const body = await response.json();
            detail = typeof body.detail === "string" ? body.detail : detail;
          } catch {
            /* HTTP error body may not be JSON. */
          }
          throw new Error(detail);
        }
        return response.json() as Promise<T>;
      })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ data, error: null, loading: false, url });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted)
          setState({ data: null, error: error.message, loading: false, url });
      });
    return () => controller.abort();
  }, [url, refresh]);
  return state.url === url
    ? state
    : { data: null, error: null, loading: true, url };
}
