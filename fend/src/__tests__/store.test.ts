import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/store'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: 1,
  name: 'Organic Tomatoes',
  price: 50,
  unit: 'kg',
  stock_qty: 100,
  is_organic: true,
  image_url: null,
  farmer_id: 1,
}

const mockProduct2: Product = {
  id: 2,
  name: 'Fresh Spinach',
  price: 30,
  unit: 'bunch',
  stock_qty: 50,
  is_organic: true,
  image_url: null,
  farmer_id: 1,
}

beforeEach(() => {
  useCartStore.setState({ items: [], isDrawerOpen: false })
})

describe('Cart Store', () => {
  it('addItem adds new product to empty cart', () => {
    useCartStore.getState().addItem(mockProduct)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(1)
    expect(items[0].quantity).toBe(1)
    expect(items[0].name).toBe('Organic Tomatoes')
  })

  it('addItem increments quantity for existing product', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('removeItem removes item by id', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().removeItem(1)
    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(2)
  })

  it('updateQuantity updates to new value', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity(1, 5)
    expect(useCartStore.getState().items[0].quantity).toBe(5)
  })

  it('updateQuantity removes item when qty <= 0', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().updateQuantity(1, 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clearCart empties all items', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('totalPrice calculates correctly for multiple items', () => {
    useCartStore.getState().addItem(mockProduct)   // 50 * 1
    useCartStore.getState().addItem(mockProduct2)  // 30 * 1
    useCartStore.getState().updateQuantity(1, 3)   // 50 * 3 = 150
    expect(useCartStore.getState().totalPrice()).toBe(180) // 150 + 30
  })

  it('totalPrice returns 0 for empty cart', () => {
    expect(useCartStore.getState().totalPrice()).toBe(0)
  })

  it('itemCount sums quantities across items', () => {
    useCartStore.getState().addItem(mockProduct)
    useCartStore.getState().addItem(mockProduct2)
    useCartStore.getState().updateQuantity(1, 3)
    expect(useCartStore.getState().itemCount()).toBe(4) // 3 + 1
  })

  it('itemCount returns 0 for empty cart', () => {
    expect(useCartStore.getState().itemCount()).toBe(0)
  })

  it('toggleDrawer toggles isDrawerOpen boolean', () => {
    expect(useCartStore.getState().isDrawerOpen).toBe(false)
    useCartStore.getState().toggleDrawer()
    expect(useCartStore.getState().isDrawerOpen).toBe(true)
    useCartStore.getState().toggleDrawer()
    expect(useCartStore.getState().isDrawerOpen).toBe(false)
  })

  it('state resets between tests (store isolation)', () => {
    // This test runs after previous tests that added items
    // beforeEach should have reset the state
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().isDrawerOpen).toBe(false)
  })
})
