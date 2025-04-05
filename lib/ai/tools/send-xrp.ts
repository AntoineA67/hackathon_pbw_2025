/// <reference types="node" />
import { tool } from 'ai';
import { z } from 'zod';

// Define the wallet map type
const walletMap: Record<string, { address?: string; secret?: string }> = {
  Shane: {
    address: process.env.WALLET_SHANE_ADDRESS,
    secret: process.env.WALLET_SHANE_SECRET,
  },
  Luc: {
    address: process.env.WALLET_LUC_ADDRESS,
    secret: process.env.WALLET_LUC_SECRET,
  },
  Florian: {
    address: process.env.WALLET_FLORIAN_ADDRESS,
    secret: process.env.WALLET_FLORIAN_SECRET,
  },
  Thomas: {
    address: process.env.WALLET_THOMAS_ADDRESS,
    secret: process.env.WALLET_THOMAS_SECRET,
  },
};

// Define the transaction schema
const transactionSchema = z.object({
  amount: z.number().min(0.000001, 'Amount must be at least 0.000001 XRP'),
  recipient: z.string(),
  memo: z.string().max(100, 'Memo must be under 100 characters'),
});

export const sendXRP = tool({
  description: 'Send XRP to one of the available wallets',
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
      if (!walletMap[recipient]?.address) {
        console.error(`Recipient wallet "${recipient}" not properly configured`);
        throw new Error(`Recipient wallet "${recipient}" not properly configured`);
      }
      
      const body = {
        amount: validatedData.amount,
        memo: validatedData.memo,
        destination: walletMap[validatedData.recipient].address,
        seed: process.env.SENDER_SECRET,
      }
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