/**
 * Wrapper around fetch that includes credentials for authentication
 * This ensures cookies are sent with all API requests
 */
export async function fetchWithAuth(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}