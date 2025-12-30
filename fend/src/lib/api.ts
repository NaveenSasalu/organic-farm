//  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

//  export async function fetchProducts() {
//    const res = await fetch(`${API_URL}/api/v1/products`);
//    if (!res.ok) throw new Error("Farm is resting. Try again later.");
//    return res.json();
//  }

//const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://of.kaayaka.in/api/v1";

// export async function apiRequest(endpoint: string, options = {}) {
//   return fetch(`${API_BASE_URL}${endpoint}`, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     },
//   });
// }

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Ensure the endpoint starts with a slash
  const url = `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  // Automatically add Auth token if it exists in localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}
