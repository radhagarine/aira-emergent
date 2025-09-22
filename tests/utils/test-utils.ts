// tests/utils/test-utils.ts
import { faker } from '@faker-js/faker'
import { BusinessType } from '@/lib/types/database/business.types'

export const createMockBusiness = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  user_id: faker.string.uuid(),
  type: faker.helpers.arrayElement(['restaurant', 'retail', 'service'] as BusinessType[]),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  address: faker.location.streetAddress(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  profile_image: null,
  ...overrides
})

export const createMockRestaurantDetails = (businessId: string, overrides = {}) => ({
  id: faker.string.uuid(),
  business_id: businessId,
  menu_items: 'Sample menu items',
  seating_capacity: faker.number.int({ min: 20, max: 200 }),
  cuisine_type: faker.helpers.arrayElement(['Italian', 'Japanese', 'Indian', 'American']),
  delivery_available: faker.datatype.boolean(),
  takeout_available: faker.datatype.boolean(),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  operating_hours: null,
  agent_instructions: null,
  ai_communication_style: null,
  greeting_message: null,
  special_instructions: null,
  ...overrides
})