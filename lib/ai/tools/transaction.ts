import { z } from 'zod';
import { tool } from 'ai';

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
  recipient: z.enum(['Shane', 'Luc', 'Florian', 'Thomas']),
  memo: z.string().max(100, 'Memo must be under 100 characters'),
  sender: z.enum(['Shane', 'Luc', 'Florian', 'Thomas']),
});

export const sendXRP = tool({
  description: 'Send XRP to one of the available wallets',
  parameters: transactionSchema,
  execute: async ({ amount, recipient, memo, sender }) => {
    console.log('Starting transaction with params:', { amount, recipient, memo, sender });
    try {
      // Validate the transaction data
      console.log('Validating transaction data...');
      const validatedData = transactionSchema.parse({
        amount,
        recipient,
        memo,
        sender,
      });
      console.log('Validation successful:', validatedData);

      // Check if sender and recipient wallets exist
      console.log('Checking wallet configurations...');
      if (!walletMap[sender]?.address || !walletMap[sender]?.secret) {
        console.error(`Sender wallet "${sender}" not properly configured`);
        throw new Error(`Sender wallet "${sender}" not properly configured`);
      }
      if (!walletMap[recipient]?.address) {
        console.error(`Recipient wallet "${recipient}" not properly configured`);
        throw new Error(`Recipient wallet "${recipient}" not properly configured`);
      }
      console.log('Wallet configurations OK');

      // Make the API call to confirm the transaction
      console.log('Making API call to confirm transaction...');
      const response = await fetch('/api/transaction/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: validatedData.amount,
          memo: validatedData.memo,
          recipient: validatedData.recipient,
          sender: validatedData.sender,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API call failed:', error);
        throw new Error(error.error || 'Failed to process transaction');
      }

      const result = await response.json();
      console.log('Transaction successful:', result);
      return {
        success: true,
        txHash: result.txHash,
        explorer: result.explorer,
        status: result.status,
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
}); 