import { ProductDoc } from '../lib/types'
import { Timestamp } from 'firebase/firestore'

const now = Timestamp.now()

export const seedProducts: Omit<ProductDoc, 'createdAt'>[] & { createdAt?: Timestamp }[] = [
  // Dairy
  { barcode: '8901234560001', name: 'Milk 500ml', category: 'Dairy', price: 28, mrp: 30, unit: '500ml', stock: 120, emoji: '🥛', active: true },
  { barcode: '8901234560002', name: 'Toned Milk 1L', category: 'Dairy', price: 52, mrp: 56, unit: '1L', stock: 80, emoji: '🥛', active: true },
  { barcode: '8901234560003', name: 'Curd 400g', category: 'Dairy', price: 38, mrp: 42, unit: '400g', stock: 60, emoji: '🫙', active: true },
  { barcode: '8901234560004', name: 'Butter 100g', category: 'Dairy', price: 52, mrp: 58, unit: '100g', stock: 40, emoji: '🧈', active: true },
  { barcode: '8901234560005', name: 'Paneer 200g', category: 'Dairy', price: 78, mrp: 85, unit: '200g', stock: 30, emoji: '🧀', active: true },
  { barcode: '8901234560006', name: 'Cheese Slices', category: 'Dairy', price: 95, mrp: 105, unit: 'pack', stock: 25, emoji: '🧀', active: true },
  { barcode: '8901234560007', name: 'Ghee 500ml', category: 'Dairy', price: 285, mrp: 310, unit: '500ml', stock: 20, emoji: '🫙', active: true },
  { barcode: '8901234560008', name: 'Buttermilk 200ml', category: 'Dairy', price: 15, mrp: 18, unit: '200ml', stock: 50, emoji: '🥛', active: true },
  // Fruits
  { barcode: '8901234561001', name: 'Apple', category: 'Fruits', price: 180, mrp: 200, unit: 'kg', stock: 30, emoji: '🍎', active: true },
  { barcode: '8901234561002', name: 'Banana (Dozen)', category: 'Fruits', price: 45, mrp: 50, unit: 'dozen', stock: 40, emoji: '🍌', active: true },
  { barcode: '8901234561003', name: 'Orange', category: 'Fruits', price: 100, mrp: 120, unit: 'kg', stock: 35, emoji: '🍊', active: true },
  { barcode: '8901234561004', name: 'Grapes', category: 'Fruits', price: 120, mrp: 140, unit: 'kg', stock: 25, emoji: '🍇', active: true },
  { barcode: '8901234561005', name: 'Mango', category: 'Fruits', price: 150, mrp: 180, unit: 'kg', stock: 20, emoji: '🥭', active: true },
  { barcode: '8901234561006', name: 'Pomegranate', category: 'Fruits', price: 200, mrp: 230, unit: 'kg', stock: 15, emoji: '🍎', active: true },
  { barcode: '8901234561007', name: 'Watermelon', category: 'Fruits', price: 40, mrp: 50, unit: 'piece', stock: 10, emoji: '🍉', active: true },
  { barcode: '8901234561008', name: 'Papaya', category: 'Fruits', price: 60, mrp: 70, unit: 'piece', stock: 15, emoji: '🍈', active: true },
  // Vegetables
  { barcode: '8901234562001', name: 'Tomato', category: 'Vegetables', price: 40, mrp: 45, unit: 'kg', stock: 60, emoji: '🍅', active: true },
  { barcode: '8901234562002', name: 'Onion', category: 'Vegetables', price: 35, mrp: 40, unit: 'kg', stock: 100, emoji: '🧅', active: true },
  { barcode: '8901234562003', name: 'Potato', category: 'Vegetables', price: 30, mrp: 35, unit: 'kg', stock: 120, emoji: '🥔', active: true },
  { barcode: '8901234562004', name: 'Carrot', category: 'Vegetables', price: 50, mrp: 55, unit: 'kg', stock: 45, emoji: '🥕', active: true },
  { barcode: '8901234562005', name: 'Brinjal', category: 'Vegetables', price: 45, mrp: 50, unit: 'kg', stock: 35, emoji: '🍆', active: true },
  { barcode: '8901234562006', name: 'Ladies Finger', category: 'Vegetables', price: 55, mrp: 60, unit: 'kg', stock: 30, emoji: '🥒', active: true },
  { barcode: '8901234562007', name: 'Cabbage', category: 'Vegetables', price: 35, mrp: 40, unit: 'piece', stock: 25, emoji: '🥬', active: true },
  { barcode: '8901234562008', name: 'Cauliflower', category: 'Vegetables', price: 40, mrp: 45, unit: 'piece', stock: 20, emoji: '🥦', active: true },
  { barcode: '8901234562009', name: 'Green Chilli', category: 'Vegetables', price: 20, mrp: 25, unit: '100g', stock: 50, emoji: '🌶️', active: true },
  { barcode: '8901234562010', name: 'Coriander Bunch', category: 'Vegetables', price: 10, mrp: 12, unit: 'bunch', stock: 60, emoji: '🌿', active: true },
  { barcode: '8901234562011', name: 'Spinach Bunch', category: 'Vegetables', price: 15, mrp: 18, unit: 'bunch', stock: 40, emoji: '🥬', active: true },
  // Staples
  { barcode: '8901234563001', name: 'Rice 5kg', category: 'Staples', price: 280, mrp: 310, unit: '5kg', stock: 50, emoji: '🌾', active: true },
  { barcode: '8901234563002', name: 'Wheat Flour 5kg', category: 'Staples', price: 220, mrp: 240, unit: '5kg', stock: 45, emoji: '🌾', active: true },
  { barcode: '8901234563003', name: 'Toor Dal 1kg', category: 'Staples', price: 148, mrp: 165, unit: '1kg', stock: 60, emoji: '🫘', active: true },
  { barcode: '8901234563004', name: 'Sugar 1kg', category: 'Staples', price: 45, mrp: 50, unit: '1kg', stock: 80, emoji: '🍬', active: true },
  { barcode: '8901234563005', name: 'Salt 1kg', category: 'Staples', price: 20, mrp: 22, unit: '1kg', stock: 100, emoji: '🧂', active: true },
  { barcode: '8901234563006', name: 'Sunflower Oil 1L', category: 'Staples', price: 140, mrp: 158, unit: '1L', stock: 40, emoji: '🫙', active: true },
  { barcode: '8901234563007', name: 'Tea Powder 250g', category: 'Staples', price: 98, mrp: 110, unit: '250g', stock: 55, emoji: '🍵', active: true },
  { barcode: '8901234563008', name: 'Coffee Powder 200g', category: 'Staples', price: 185, mrp: 200, unit: '200g', stock: 30, emoji: '☕', active: true },
  // Snacks & Others
  { barcode: '8901234564001', name: 'Biscuits', category: 'Snacks', price: 30, mrp: 35, unit: 'pack', stock: 80, emoji: '🍪', active: true },
  { barcode: '8901234564002', name: 'Bread', category: 'Snacks', price: 42, mrp: 48, unit: 'loaf', stock: 40, emoji: '🍞', active: true },
  { barcode: '8901234564003', name: 'Eggs (6 pack)', category: 'Snacks', price: 58, mrp: 65, unit: '6 pcs', stock: 50, emoji: '🥚', active: true },
  { barcode: '8901234564004', name: 'Instant Noodles', category: 'Snacks', price: 25, mrp: 28, unit: 'pack', stock: 100, emoji: '🍜', active: true },
  { barcode: '8901234564005', name: 'Chips', category: 'Snacks', price: 20, mrp: 22, unit: 'pack', stock: 90, emoji: '🥔', active: true },
  { barcode: '8901234564006', name: 'Chocolate Bar', category: 'Snacks', price: 55, mrp: 60, unit: 'piece', stock: 60, emoji: '🍫', active: true },
  { barcode: '8901234564007', name: 'Soft Drink 750ml', category: 'Snacks', price: 42, mrp: 48, unit: '750ml', stock: 70, emoji: '🥤', active: true },
  { barcode: '8901234565001', name: 'Detergent 1kg', category: 'Household', price: 110, mrp: 125, unit: '1kg', stock: 35, emoji: '🧴', active: true },
  { barcode: '8901234565002', name: 'Soap', category: 'Household', price: 38, mrp: 42, unit: 'piece', stock: 60, emoji: '🧼', active: true },
  { barcode: '8901234565003', name: 'Toothpaste', category: 'Household', price: 85, mrp: 95, unit: 'tube', stock: 45, emoji: '🪥', active: true },
]

export const seedCustomers = [
  {
    phone: '9000000001', name: 'Priya Sharma', totalVisits: 18, totalSpent: 4200, points: 420,
    tier: 'Gold', isLoyal: true, visitStreakWeeks: 5, isDemo: true,
  },
  {
    phone: '9000000002', name: 'Rahul Verma', totalVisits: 10, totalSpent: 2800, points: 280,
    tier: 'Silver', isLoyal: true, visitStreakWeeks: 3, isDemo: true,
  },
  {
    phone: '9000000003', name: 'Anita Patel', totalVisits: 5, totalSpent: 900, points: 90,
    tier: 'Bronze', isLoyal: false, visitStreakWeeks: 1, isDemo: true,
  },
  {
    phone: '9000000004', name: 'Suresh Kumar', totalVisits: 3, totalSpent: 600, points: 60,
    tier: 'Bronze', isLoyal: false, visitStreakWeeks: 0, isDemo: true,
  },
  {
    phone: '9000000005', name: 'Meena Rao', totalVisits: 8, totalSpent: 1700, points: 170,
    tier: 'Silver', isLoyal: true, visitStreakWeeks: 2, isDemo: true,
  },
  {
    phone: '9000000006', name: 'Karthik Nair', totalVisits: 1, totalSpent: 150, points: 15,
    tier: 'Bronze', isLoyal: false, visitStreakWeeks: 0, isDemo: true,
  },
]

export const seedCoupons = [
  {
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minBill: 200,
    maxDiscount: 100,
    audience: 'all',
    customerPhone: '',
    usageLimit: 1000,
    usedCount: 23,
    active: true,
    createdBy: 'admin',
    description: '10% off on orders above ₹200',
  },
  {
    code: 'LOYAL50',
    type: 'flat',
    value: 50,
    minBill: 500,
    maxDiscount: 50,
    audience: 'loyal',
    customerPhone: '',
    usageLimit: 500,
    usedCount: 11,
    active: true,
    createdBy: 'admin',
    description: 'Flat ₹50 off for loyal customers',
  },
  {
    code: 'WEEKEND5',
    type: 'percent',
    value: 5,
    minBill: 0,
    maxDiscount: 0,
    audience: 'all',
    customerPhone: '',
    usageLimit: 0,
    usedCount: 7,
    active: true,
    createdBy: 'admin',
    description: '5% off on all purchases',
  },
]
