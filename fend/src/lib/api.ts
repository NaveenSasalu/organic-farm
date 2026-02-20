// 1. Define Base URLs for different contexts
// Browser (client-side): use localhost or production URL
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://of.kaayaka.in/api/v1";
// Server-side (Docker/K8s): use internal service name
const SERVER_API_URL =
  process.env.INTERNAL_API_URL || "http://backend:8000/api/v1";

// 2. Helper to determine if we are running on the server or browser
const IS_SERVER = typeof window === "undefined";

// Use appropriate URL based on context
export const API_BASE_URL = IS_SERVER ? SERVER_API_URL : CLIENT_API_URL;

export async function fetchProducts(page: number = 1, pageSize: number = 100) {
  // Use the context-aware API URL with pagination params
  const fetchUrl = `${IS_SERVER ? SERVER_API_URL : CLIENT_API_URL}/products/public/?page=${page}&page_size=${pageSize}`;

  try {
    const res = await fetch(fetchUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Fetch failed with status: ${res.status}`);
      throw new Error("Farm is resting. Try again later.");
    }

    const data = await res.json();

    // Handle paginated response - extract items array
    if (data && data.items) {
      return data.items;
    }

    // Fallback for non-paginated response (backward compatibility)
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchProducts error:", error);
    return [];
  }
}

// Paginated fetch that returns full response with metadata
export async function fetchProductsPaginated(page: number = 1, pageSize: number = 20) {
  const fetchUrl = `${IS_SERVER ? SERVER_API_URL : CLIENT_API_URL}/products/public/?page=${page}&page_size=${pageSize}`;

  try {
    const res = await fetch(fetchUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    return await res.json();
  } catch (error) {
    console.error("fetchProductsPaginated error:", error);
    return { items: [], total: 0, page: 1, page_size: pageSize, total_pages: 0 };
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  // 1. Get token safely
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 2. Build headers dynamically
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // 3. ONLY add Authorization if token is a non-empty string and not "null"
  if (token && token !== "null" && token !== "undefined") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 4. Default Content-Type for JSON (unless sending FormData)
  if (!(options.body instanceof URLSearchParams) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle common auth errors globally
  if (response.status === 401) {
    localStorage.removeItem("token");
    // window.location.href = '/login'; // Optional: auto-redirect on expiry
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }

  return response.json();
}
