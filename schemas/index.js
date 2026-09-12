import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Password is too long'),
  role: z.enum(['farmer', 'buyer']).default('farmer'),
  location: z.string().trim().max(200).optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(200, 'Password is too long'),
});

export const listingSchema = z.object({
  cropName: z.string().trim().min(1, 'Crop name is required').max(100),
  quantity: z.coerce.number('Quantity must be a number').positive('Quantity must be positive'),
  unit: z.string().trim().min(1, 'Unit is required').max(30),
  pricePerUnit: z.coerce.number('Price must be a number').positive('Price must be positive'),
  location: z.string().trim().min(1, 'Location is required').max(200),
  contactPhone: z.string().trim().max(20).optional().default(''),
  description: z.string().trim().max(500).optional().default(''),
});

export const offerSchema = z.object({
  quantity: z.coerce.number('Quantity must be a number').positive('Quantity must be positive'),
  proposedPrice: z.coerce.number('Price must be a number').positive('Price must be positive'),
  message: z.string().trim().max(300).optional().default(''),
  authorName: z.string().trim().max(100).optional().default(''),
});

export const reviewSchema = z.object({
  rating: z.coerce.number('Rating must be a number').min(1, 'Rating is required').max(5, 'Rating must be 1-5'),
  comment: z.string().trim().max(500).optional().default(''),
  authorName: z.string().trim().max(100).optional().default(''),
});

export const orderStatusSchema = z.object({
  status: z.enum(['ordered', 'shipped', 'delivered'], 'Invalid status'),
});

export const chatSchema = z.object({
  listingId: z.string().trim().min(1, 'Listing is required'),
  receiverId: z.string().trim().min(1, 'Receiver is required'),
  text: z.string().trim().min(1, 'Message is required').max(1000, 'Message is too long'),
});