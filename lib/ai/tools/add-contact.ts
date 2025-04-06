/// <reference types="node" />
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db';
import { contact } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Define the contact schema
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

export const addContact = tool({
  description: 'Add a new contact to the database',
  parameters: contactSchema,
  execute: async ({ firstName, lastName, email, walletAddress }) => {
    try {
      const validatedData = contactSchema.parse({
        firstName,
        lastName,
        email,
        walletAddress,
      });

      // Check if contact with same wallet address already exists
      const existingContact = await db
        .select()
        .from(contact)
        .where(eq(contact.walletAddress, validatedData.walletAddress))
        .limit(1);

      if (existingContact.length > 0) {
        throw new Error('A contact with this wallet address already exists');
      }

      // Insert new contact
      const [newContact] = await db
        .insert(contact)
        .values({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          walletAddress: validatedData.walletAddress,
        })
        .returning();

      return {
        success: true,
        contact: newContact,
        message: 'Contact added successfully',
      };
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  },
}); 