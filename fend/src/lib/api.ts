//const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://of.kaayaka.in/api/v1";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/products/`);
  if (!res.ok) throw new Error("Farm is resting. Try again later.");
  return res.json();
}

// export async function fetchProducts() {
//   try {
//     // 1. apiRequest returns the actual DATA (e.g., an array of products)
//     // not the "Response" object.
//     const products = await apiRequest("/products", {
//       method: "GET",
//     });

//     // chaged to return json
//     return products.json();
//   } catch (err: any) {
//     // 2. The error thrown here comes from the 'throw' inside apiRequest
//     console.error("Fetch error:", err.message);
//     throw err; // Re-throw so the UI component can show an error state
//   }
// }

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

// export async function apiRequest(endpoint: string, options: RequestInit = {}) {
//   // Ensure the endpoint starts with a slash
//   const url = `${API_BASE_URL}${
//     endpoint.startsWith("/") ? endpoint : `/${endpoint}`
//   }`;

//   // Automatically add Auth token if it exists in localStorage
//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const defaultHeaders = {
//     "Content-Type": "application/json",
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };

//   const response = await fetch(url, {
//     ...options,
//     headers: {
//       ...defaultHeaders,
//       ...options.headers,
//     },
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.detail || `API Error: ${response.status}`);
//   }

//   return response.json();
// }
