import { BedDouble, Car, Receipt, ShoppingBasket, Ticket, UtensilsCrossed, Zap, type LucideIcon } from 'lucide-react'
import type { Category } from '../types'

export const categoryIcon: Record<Category, LucideIcon> = {
  food: UtensilsCrossed,
  lodging: BedDouble,
  transport: Car,
  groceries: ShoppingBasket,
  activities: Ticket,
  utilities: Zap,
  other: Receipt,
}
