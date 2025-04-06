import { tool } from 'ai';
import { z } from 'zod';

const sendCrossCurrencySchema = z.object({
  iou_amount: z.string(),
  destination: z.string(),
});

export const sendCrossCurrency = tool({
  description: 'Send a cross-currency payment to a recipient',
  parameters: sendCrossCurrencySchema,
  execute: async ({ iou_amount, destination }) => {
    try {
      // Validate input
      sendCrossCurrencySchema.parse({
        iou_amount,
        destination,
	  });
		
		const body = {
          xrp_amount: "1000",
          iou_amount,
          destination,
          iou_currency: "524C555344000000000000000000000000000000",
          iou_issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
          seed: process.env.SENDER_SECRET,
        }

		console.log(body);	
      const response = await fetch(`${process.env.BACKEND_URL}/api/payments/cross`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
		  body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

		const result = await response.json();
		console.log(result);

      return {
        success: true,
		  transactionHash: result.hash,
		balance: result.balance,
        message: 'Cross-currency payment sent successfully',
      };
    } catch (error) {
      console.error('Failed to send cross-currency payment:', error);
      throw error;
    }
  },
}); 