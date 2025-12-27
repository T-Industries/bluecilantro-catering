import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user (password must be set on first login)
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'gpwc@bluecilantro.ca' },
    update: {},
    create: {
      email: 'gpwc@bluecilantro.ca',
      mustSetPassword: true,
    },
  })
  console.log('Created admin user:', adminUser.email)

  // Create default settings
  const defaultSettings = [
    { key: 'notification_email', value: 'gpwc@bluecilantro.ca' },
    { key: 'delivery_fee', value: '25.00' },
    { key: 'min_order_amount', value: '0' },
    { key: 'lead_time_hours', value: '24' },
    { key: 'business_name', value: 'BlueCilantro' },
    { key: 'business_phone', value: '' },
    { key: 'business_address', value: '' },
    { key: 'send_customer_confirmation', value: 'false' },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('Created default settings')

  // Create default menu categories
  const categories = [
    { name: 'Appetizers', displayOrder: 1 },
    { name: 'Mains', displayOrder: 2 },
    { name: 'Desserts', displayOrder: 3 },
    { name: 'Beverages', displayOrder: 4 },
    { name: 'Packages', displayOrder: 5 },
  ]

  for (const category of categories) {
    await prisma.menuCategory.upsert({
      where: { id: category.name.toLowerCase() },
      update: {},
      create: {
        id: category.name.toLowerCase(),
        name: category.name,
        displayOrder: category.displayOrder,
        active: true,
      },
    })
  }
  console.log('Created menu categories')

  // Create sample menu items
  const sampleItems = [
    {
      categoryId: 'appetizers',
      name: 'Vegetable Samosas',
      description: 'Crispy pastry filled with spiced potatoes and peas',
      price: 12.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
      displayOrder: 1,
    },
    {
      categoryId: 'appetizers',
      name: 'Chicken Tikka',
      description: 'Tender chicken marinated in yogurt and spices',
      price: 15.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
      displayOrder: 2,
    },
    {
      categoryId: 'mains',
      name: 'Butter Chicken',
      description: 'Creamy tomato-based curry with tender chicken',
      price: 18.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
      displayOrder: 1,
    },
    {
      categoryId: 'mains',
      name: 'Vegetable Biryani',
      description: 'Fragrant basmati rice with mixed vegetables and aromatic spices',
      price: 16.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
      displayOrder: 2,
    },
    {
      categoryId: 'desserts',
      name: 'Gulab Jamun',
      description: 'Sweet milk dumplings in rose-flavored syrup',
      price: 8.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1666190094762-2e0cb92d2c2d?w=400',
      displayOrder: 1,
    },
    {
      categoryId: 'beverages',
      name: 'Mango Lassi',
      description: 'Refreshing yogurt drink with mango',
      price: 5.99,
      pricingType: 'fixed',
      imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400',
      displayOrder: 1,
    },
    {
      categoryId: 'packages',
      name: 'Classic Catering Package',
      description: 'Includes appetizers, choice of 2 mains, rice, naan, and dessert. Perfect for gatherings.',
      price: 35.00,
      pricingType: 'per_person',
      servesCount: 10,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
      displayOrder: 1,
    },
  ]

  for (const item of sampleItems) {
    await prisma.menuItem.create({
      data: item,
    })
  }
  console.log('Created sample menu items')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
