'use client'

const API_BASE_URL = '/api'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  })

  if (response.status === 401) {
    // Handle unauthorized - let the client handle auth
    return null
  }

  return response
} 