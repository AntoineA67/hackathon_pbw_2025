import { db } from '../db';
import { contact } from '../db/schema';

export async function getContactsList() {
  try {
    const contacts = await db
      .select({
        firstName: contact.firstName,
        lastName: contact.lastName,
        walletAddress: contact.walletAddress
      })
      .from(contact)
      .limit(10);

    return contacts.map(c => `${c.firstName} ${c.lastName} (${c.walletAddress})`).join('\n');
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return '';
  }
}

// This will be populated when the app starts
let cachedContactsList = '';

export async function initializeContacts() {
  cachedContactsList = await getContactsList();
}

export function getCachedContacts() {
  return cachedContactsList;
} 