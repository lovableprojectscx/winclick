import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * fetch with a hard 12-second timeout.
 * Supabase-js has NO default timeout — if the server stalls, the request
 * hangs forever keeping React Query isLoading=true indefinitely.
 * We forward the existing signal (so Supabase can still cancel on unmount)
 * AND add our own timeout signal.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new DOMException("Timeout", "AbortError")), 12_000);

  // Forward abort from Supabase's own controller so component-unmount cancels still work
  init?.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  auth: {
    // Disable auto token refresh to prevent silent hanging sessions
    // from blocking the auth init when the network is unreachable
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
  },
});
