const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').trim()
const API_BASE = RAW_API_BASE.endsWith('/') ? RAW_API_BASE.slice(0, -1) : RAW_API_BASE

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  let fullUrl: string
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    fullUrl = cleanPath
  } else if (API_BASE === '/api' || API_BASE === '') {
    fullUrl = `/api${cleanPath}`
  } else if (API_BASE.endsWith('/api')) {
    fullUrl = `${API_BASE}${cleanPath}`
  } else if (API_BASE.startsWith('http')) {
    fullUrl = `${API_BASE}/api${cleanPath}`
  } else {
    fullUrl = `${API_BASE}${cleanPath}`
  }

  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('pagewoga_token') : null
  const authHeaders: Record<string, string> = storedToken
    ? {
        Authorization: `Bearer ${storedToken}`,
        'x-access-token': storedToken,
        'x-auth-token': storedToken,
      }
    : {}

  let response: Response
  try {
    response = await fetch(fullUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
      ...options,
    })
  } catch (netErr) {
    // If direct cross-origin fetch fails due to CORS or network, fallback through local /api proxy
    if (!fullUrl.startsWith('/api')) {
      try {
        response = await fetch(`/api${cleanPath}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options?.headers,
          },
          ...options,
        })
      } catch (proxyErr) {
        throw new Error(
          `Network error connecting to ${fullUrl}: ${
            netErr instanceof Error ? netErr.message : 'Failed to fetch'
          }`,
          { cause: proxyErr }
        )
      }
    } else {
      throw new Error(
        `Network error connecting to backend: ${
          netErr instanceof Error ? netErr.message : 'Failed to fetch'
        }`,
        { cause: netErr }
      )
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null)
    let errorMessage = errData?.message || errData?.error
    if (errorMessage && typeof errorMessage === 'string') {
      try {
        const parsed = JSON.parse(errorMessage)
        if (Array.isArray(parsed) && parsed[0]?.message) {
          errorMessage = parsed
            .map((item: { path?: string[]; message?: string }) => `${item.path?.join('.') || 'Field'}: ${item.message}`)
            .join(', ')
        }
      } catch {
        // use original string
      }
    }
    throw new Error(errorMessage ?? `Request failed (${response.status})`)
  }

  return response.status === 204 ? (undefined as T) : response.json()
}
