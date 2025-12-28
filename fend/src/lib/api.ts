const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/api/v1/products`);
  if (!res.ok) throw new Error("Farm is resting. Try again later.");
  return res.json();
}
