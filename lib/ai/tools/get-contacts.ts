/// <reference types="node" />
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db';
import { contact } from '../../db/schema';

// Define the schema for the tool (no parameters needed)
const getContactsSchema = z.object({});

export const getContacts = tool({
  description: 'Get the list of available contacts from the database',
  parameters: getContactsSchema,
  execute: async () => {
    try {
      const contacts = await db
        .select({
          firstName: contact.firstName,
          lastName: contact.lastName,
          walletAddress: contact.walletAddress
        })
        .from(contact)
        .limit(10);

      return {
        contacts: contacts.map(c => ({
          name: `${c.firstName} ${c.lastName}`,
          walletAddress: c.walletAddress
        }))
      };
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw error;
    }
  },
}); 