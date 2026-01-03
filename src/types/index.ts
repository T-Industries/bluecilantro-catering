import { Prisma } from '@prisma/client'

// Menu types
export type MenuCategory = {
  id: string
  name: string
  displayOrder: number
  active: boolean
  items?: MenuItem[]
}

export type MenuItem = {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number | Prisma.Decimal
  pricingType: 'fixed' | 'per_person'
  servesCount: number | null
  imageUrl: string | null
  active: boolean
  displayOrder: number
}

// Cart types
export type CartItem = {
  menuItemId: string
  name: string
  price: number
  pricingType: 'fixed' | 'per_person'
  quantity: number
  guestCount?: number
  notes?: string
  imageUrl?: string
}

// Package cart item for selection packages
export type PackageCartItemSelection = {
  id: string // Unique cart item ID
  type: 'package_selection'
  packageId: string
  packageName: string
  tierId: string
  tierName: string
  tierPrice: number
  guestCount: number
  selections: {
    categoryId: string
    categoryName: string
    items: { id: string; name: string }[]
  }[]
  upgrades: {
    id: string
    name: string
    pricePerPerson: number
  }[]
  total: number
  notes?: string
}

// Package cart item for quantity/fixed packages
export type PackageCartItemQuantity = {
  id: string // Unique cart item ID
  type: 'package_quantity' | 'package_fixed'
  packageId: string
  packageName: string
  itemId: string
  itemName: string
  tierId?: string
  tierName?: string
  quantity: number
  unitPrice: number
  total: number
  notes?: string
}

export type PackageCartItem = PackageCartItemSelection | PackageCartItemQuantity

export type Cart = {
  items: CartItem[]
  fulfillmentType: 'delivery' | 'pickup'
  scheduledDate: string
  scheduledTime: string
  notes?: string
}

// Order types
export type OrderStatus = 'new' | 'confirmed' | 'completed' | 'cancelled'

export type Order = {
  id: string
  status: OrderStatus
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string | null
  fulfillmentType: 'delivery' | 'pickup'
  scheduledDate: Date | string
  scheduledTime: string
  subtotal: number | Prisma.Decimal
  deliveryFee: number | Prisma.Decimal
  total: number | Prisma.Decimal
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
  items?: OrderItem[]
}

export type OrderItem = {
  id: string
  orderId: string
  menuItemId: string | null
  itemName: string
  itemPrice: number | Prisma.Decimal
  pricingType: string
  quantity: number
  guestCount: number | null
  lineTotal: number | Prisma.Decimal
  notes: string | null
}

// Settings type
export type Settings = {
  notification_email: string
  delivery_fee: string
  min_order_amount: string
  lead_time_hours: string
  business_name: string
  business_phone: string
  business_address: string
  send_customer_confirmation: string
}

// API response types
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
