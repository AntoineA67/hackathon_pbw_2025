/// <reference types="node" />
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '../../db';
import { contact } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Define the transaction schema
const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be at least $0.01'),
  recipient: z.string(),
  memo: z.string().max(100, 'Memo must be under 100 characters'),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
});

export const sendCheck = tool({
  description: 'Send a check to a wallet address',
  parameters: transactionSchema,
  execute: async ({ amount, recipient, memo, invoiceId }) => {
    try {
      const validatedData = transactionSchema.parse({
        amount,
        recipient,
        memo,
        invoiceId,
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
        invoice_id: validatedData.invoiceId,
        seed: process.env.SENDER_SECRET,
      }
      console.log('Sending check to:', body);
      const response = await fetch(`${process.env.BACKEND_URL}/api/payments/checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API call failed:', error);
        throw new Error(error.error || 'Failed to process check');
      }

      const result = await response.json();
      console.log('Check sent successfully:', result);
      return result;
    } catch (error) {
      console.error('Check sending failed:', error);
      throw error;
    }
  },
}); 