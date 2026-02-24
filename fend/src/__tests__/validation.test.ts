import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  validatePassword,
  validateCheckoutForm,
  validateProductForm,
  validateFarmerForm,
  isValidImageUrl,
  sanitizeImageUrl,
  validateQuantity,
  isValidOrderId,
} from '@/lib/validation'

// ─── isValidEmail ──────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })
})

// ─── validatePassword ──────────────────────────────────────

describe('validatePassword', () => {
  it('returns null for a valid password', () => {
    expect(validatePassword('StrongPass1')).toBeNull()
  })

  it('rejects password shorter than 8 chars', () => {
    expect(validatePassword('Abc1')).not.toBeNull()
  })

  it('rejects password without uppercase', () => {
    expect(validatePassword('lowercase1')).not.toBeNull()
  })

  it('rejects password without lowercase', () => {
    expect(validatePassword('UPPERCASE1')).not.toBeNull()
  })

  it('rejects password without digit', () => {
    expect(validatePassword('NoDigitsHere')).not.toBeNull()
  })

  it('accepts password with exactly 8 chars', () => {
    expect(validatePassword('Abcdefg1')).toBeNull()
  })
})

// ─── validateCheckoutForm ──────────────────────────────────

describe('validateCheckoutForm', () => {
  const validData = {
    customer_name: 'John Doe',
    customer_email: 'john@test.com',
    address: '123 Main Street, City, State 12345',
  }

  it('returns valid for correct data', () => {
    const result = validateCheckoutForm(validData)
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('rejects empty name', () => {
    const result = validateCheckoutForm({ ...validData, customer_name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.customer_name).toBeDefined()
  })

  it('rejects name shorter than 2 chars', () => {
    const result = validateCheckoutForm({ ...validData, customer_name: 'A' })
    expect(result.valid).toBe(false)
    expect(result.errors.customer_name).toBeDefined()
  })

  it('rejects name longer than 100 chars', () => {
    const result = validateCheckoutForm({ ...validData, customer_name: 'A'.repeat(101) })
    expect(result.valid).toBe(false)
    expect(result.errors.customer_name).toBeDefined()
  })

  it('rejects empty email', () => {
    const result = validateCheckoutForm({ ...validData, customer_email: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.customer_email).toBeDefined()
  })

  it('rejects invalid email', () => {
    const result = validateCheckoutForm({ ...validData, customer_email: 'not-an-email' })
    expect(result.valid).toBe(false)
    expect(result.errors.customer_email).toBeDefined()
  })

  it('rejects empty address', () => {
    const result = validateCheckoutForm({ ...validData, address: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.address).toBeDefined()
  })

  it('rejects address shorter than 10 chars', () => {
    const result = validateCheckoutForm({ ...validData, address: 'Short' })
    expect(result.valid).toBe(false)
    expect(result.errors.address).toBeDefined()
  })

  it('rejects address longer than 500 chars', () => {
    const result = validateCheckoutForm({ ...validData, address: 'A'.repeat(501) })
    expect(result.valid).toBe(false)
    expect(result.errors.address).toBeDefined()
  })
})

// ─── validateProductForm ───────────────────────────────────

describe('validateProductForm', () => {
  const validProduct = {
    name: 'Organic Tomatoes',
    price: 50,
    stock_qty: 100,
    unit: 'kg',
    farmer_id: 1,
  }

  it('returns valid for correct data', () => {
    const result = validateProductForm(validProduct)
    expect(result.valid).toBe(true)
  })

  it('rejects empty name', () => {
    const result = validateProductForm({ ...validProduct, name: '  ' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('rejects negative price', () => {
    const result = validateProductForm({ ...validProduct, price: -10 })
    expect(result.valid).toBe(false)
    expect(result.errors.price).toBeDefined()
  })

  it('rejects price above 100000', () => {
    const result = validateProductForm({ ...validProduct, price: 100001 })
    expect(result.valid).toBe(false)
    expect(result.errors.price).toBeDefined()
  })

  it('rejects negative stock', () => {
    const result = validateProductForm({ ...validProduct, stock_qty: -1 })
    expect(result.valid).toBe(false)
    expect(result.errors.stock_qty).toBeDefined()
  })

  it('rejects stock above 10000', () => {
    const result = validateProductForm({ ...validProduct, stock_qty: 10001 })
    expect(result.valid).toBe(false)
    expect(result.errors.stock_qty).toBeDefined()
  })

  it('rejects empty unit', () => {
    const result = validateProductForm({ ...validProduct, unit: '  ' })
    expect(result.valid).toBe(false)
    expect(result.errors.unit).toBeDefined()
  })

  it('rejects missing farmer_id', () => {
    const result = validateProductForm({ ...validProduct, farmer_id: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors.farmer_id).toBeDefined()
  })
})

// ─── validateFarmerForm ────────────────────────────────────

describe('validateFarmerForm', () => {
  const validFarmer = {
    name: 'Test Farmer',
    email: 'farmer@test.com',
    password: 'StrongPass1',
    location: 'Farm Valley',
  }

  it('returns valid for correct data', () => {
    const result = validateFarmerForm(validFarmer)
    expect(result.valid).toBe(true)
  })

  it('rejects empty name', () => {
    const result = validateFarmerForm({ ...validFarmer, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('rejects name shorter than 2 chars', () => {
    const result = validateFarmerForm({ ...validFarmer, name: 'A' })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('rejects invalid email', () => {
    const result = validateFarmerForm({ ...validFarmer, email: 'bad-email' })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBeDefined()
  })

  it('rejects weak password', () => {
    const result = validateFarmerForm({ ...validFarmer, password: 'weak' })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBeDefined()
  })

  it('rejects empty location', () => {
    const result = validateFarmerForm({ ...validFarmer, location: '  ' })
    expect(result.valid).toBe(false)
    expect(result.errors.location).toBeDefined()
  })
})

// ─── isValidImageUrl ───────────────────────────────────────

describe('isValidImageUrl', () => {
  it('accepts URL on mnio.kaayaka.in', () => {
    expect(isValidImageUrl('https://mnio.kaayaka.in/bucket/img.jpg')).toBe(true)
  })

  it('accepts URL on localhost', () => {
    expect(isValidImageUrl('http://localhost:9000/bucket/img.jpg')).toBe(true)
  })

  it('rejects URL on disallowed domain', () => {
    expect(isValidImageUrl('https://evil.com/img.jpg')).toBe(false)
  })

  it('rejects javascript: protocol', () => {
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidImageUrl(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidImageUrl(undefined)).toBe(false)
  })

  it('accepts relative URL starting with /', () => {
    expect(isValidImageUrl('/images/produce.png')).toBe(true)
  })
})

// ─── sanitizeImageUrl ──────────────────────────────────────

describe('sanitizeImageUrl', () => {
  it('passes through valid URL', () => {
    const url = 'https://mnio.kaayaka.in/bucket/img.jpg'
    expect(sanitizeImageUrl(url)).toBe(url)
  })

  it('returns fallback for invalid URL', () => {
    expect(sanitizeImageUrl('https://evil.com/img.jpg')).toBe('/placeholder-produce.png')
  })

  it('returns fallback for null', () => {
    expect(sanitizeImageUrl(null)).toBe('/placeholder-produce.png')
  })

  it('passes through relative URL', () => {
    expect(sanitizeImageUrl('/images/local.png')).toBe('/images/local.png')
  })
})

// ─── validateQuantity ──────────────────────────────────────

describe('validateQuantity', () => {
  it('returns null for valid quantity', () => {
    expect(validateQuantity(5, 100)).toBeNull()
  })

  it('rejects zero quantity', () => {
    expect(validateQuantity(0)).not.toBeNull()
  })

  it('rejects negative quantity', () => {
    expect(validateQuantity(-1)).not.toBeNull()
  })

  it('rejects quantity exceeding max', () => {
    expect(validateQuantity(101, 100)).not.toBeNull()
  })

  it('rejects non-integer quantity', () => {
    expect(validateQuantity(2.5)).not.toBeNull()
  })
})

// ─── isValidOrderId ────────────────────────────────────────

describe('isValidOrderId', () => {
  it('accepts valid order id', () => {
    expect(isValidOrderId('123')).toBe(true)
  })

  it('rejects zero', () => {
    expect(isValidOrderId('0')).toBe(false)
  })

  it('rejects negative id', () => {
    expect(isValidOrderId('-1')).toBe(false)
  })

  it('rejects non-numeric string', () => {
    expect(isValidOrderId('abc')).toBe(false)
  })

  it('rejects id >= 10000000', () => {
    expect(isValidOrderId('10000000')).toBe(false)
  })
})
