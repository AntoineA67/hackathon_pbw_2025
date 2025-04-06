/// <reference types="node" />
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db';
import { contact } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Define the transaction schema
const transactionSchema = z.object({
  amount: z.number().min(0.000001, 'Amount must be at least 0.000001 XRP'),
  recipient: z.string(),
  memo: z.string().max(100, 'Memo must be under 100 characters'),
});

export const sendXRP = tool({
  description: 'Send XRP to a wallet address',
  parameters: transactionSchema,
  execute: async ({ amount, recipient, memo }) => {
    try {
      const validatedData = transactionSchema.parse({
        amount,
        recipient,
        memo,
      });

      // Check if sender wallet exists
      if (!process.env.SENDER_ADDRESS || !process.env.SENDER_SECRET) {
        console.error('Sender wallet not properly configured in environment variables');
        throw new Error('Sender wallet not properly configured in environment variables');
      }
      
      const body = {
        amount: validatedData.amount,
        memo: validatedData.memo,
        destination: validatedData.recipient,
        seed: process.env.SENDER_SECRET,
      }
      console.log('Sending XRP to:', body); 
      const response = await fetch(`${process.env.BACKEND_URL}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API call failed:', error);
        throw new Error(error.error || 'Failed to process transaction');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  },
}); 