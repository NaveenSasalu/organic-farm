// 1. Define a solid Base URL with HTTPS enforcement
export const API_BASE_URL = "https://of.kaayaka.in/api/v1";

// 2. Helper to determine if we are running on the server (K8s pod) or browser
const IS_SERVER = typeof window === "undefined";

export async function fetchProducts() {
  // 3. INTERNAL NETWORKING (Optional but faster):
  // If on server, talk to the backend service directly via K8s DNS
  const fetchUrl = IS_SERVER
    ? "http://farm-backend:8000/api/v1/products/all"
    : `${API_BASE_URL}/products/all`;

  try {
    const res = await fetch(fetchUrl, {
      // 4. CACHE CONTROL:
      // 'no-store' ensures the Home Page doesn't show old data from the build cache
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
    return data;

    // 5. Data Integrity: Ensure we always return an array
    // return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchProducts error:", error);
    return []; // Return empty array so the UI doesn't crash
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
