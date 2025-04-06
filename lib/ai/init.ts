import { initializeContacts } from './contacts';

export async function initializeAI() {
  try {
    await initializeContacts();
    console.log('AI initialization complete');
  } catch (error) {
    console.error('Failed to initialize AI:', error);
  }
} 