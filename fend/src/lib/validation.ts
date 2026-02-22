// ============================================
// Client-side Validation Utilities
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (matches backend requirements)
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

// Checkout form validation
export function validateCheckoutForm(data: {
  customer_name: string;
  customer_email: string;
  address: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Name validation
  const name = data.customer_name.trim();
  if (!name) {
    errors.customer_name = "Name is required";
  } else if (name.length < 2) {
    errors.customer_name = "Name must be at least 2 characters";
  } else if (name.length > 100) {
    errors.customer_name = "Name must be less than 100 characters";
  }

  // Email validation
  const email = data.customer_email.trim();
  if (!email) {
    errors.customer_email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.customer_email = "Please enter a valid email address";
  }

  // Address validation
  const address = data.address.trim();
  if (!address) {
    errors.address = "Address is required";
  } else if (address.length < 10) {
    errors.address = "Please enter a complete address (at least 10 characters)";
  } else if (address.length > 500) {
    errors.address = "Address must be less than 500 characters";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Product form validation
export function validateProductForm(data: {
  name: string;
  price: number;
  stock_qty: number;
  unit: string;
  farmer_id: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = "Product name is required";
  } else if (data.name.length > 100) {
    errors.name = "Name must be less than 100 characters";
  }

  if (data.price < 0) {
    errors.price = "Price cannot be negative";
  } else if (data.price > 100000) {
    errors.price = "Price seems too high";
  }

  if (data.stock_qty < 0) {
    errors.stock_qty = "Stock cannot be negative";
  } else if (data.stock_qty > 10000) {
    errors.stock_qty = "Stock quantity seems too high";
  }

  if (!data.unit.trim()) {
    errors.unit = "Unit is required";
  }

  if (!data.farmer_id || data.farmer_id <= 0) {
    errors.farmer_id = "Please select a farmer";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Farmer form validation
export function validateFarmerForm(data: {
  name: string;
  email: string;
  password: string;
  location: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!data.location.trim()) {
    errors.location = "Location is required";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Image URL validation and sanitization
const ALLOWED_IMAGE_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "of.kaayaka.in",
  "mnio.kaayaka.in",
  "placehold.co",
  "via.placeholder.com",
  "minio",
  "organic-farm-minio",
];

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Check if domain is allowed (or is a relative URL)
    const hostname = parsed.hostname;
    const isAllowed = ALLOWED_IMAGE_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    return isAllowed;
  } catch {
    // If URL parsing fails, check if it's a relative path
    return url.startsWith("/");
  }
}

export function sanitizeImageUrl(url: string | null | undefined, fallback: string = "/placeholder-produce.png"): string {
  if (!url) return fallback;

  // Allow relative URLs
  if (url.startsWith("/")) return url;

  // Validate external URLs
  if (isValidImageUrl(url)) return url;

  return fallback;
}

// Quantity validation
export function validateQuantity(quantity: number, maxStock: number = 1000): string | null {
  if (!Number.isInteger(quantity)) {
    return "Quantity must be a whole number";
  }
  if (quantity < 1) {
    return "Quantity must be at least 1";
  }
  if (quantity > maxStock) {
    return `Maximum quantity is ${maxStock}`;
  }
  return null;
}

// Order ID validation (prevent enumeration by requiring valid format)
export function isValidOrderId(id: string): boolean {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId > 0 && numId < 10000000;
}
