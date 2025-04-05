// app/api/transaction/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import xrpl from 'xrpl';

export async function POST(request: Request) {
  try {
    const { memoInput, walletRole } = await request.json();

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create the prompt for the chat completions API
    const prompt = `Generate a short (under 100 characters) XRP payment memo for this input: "${memoInput}". Only return the memo.`;

    // Call the Chat Completions API using the OpenAI package
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    let memo: string = completion.choices[0].message?.content?.trim() || '';
    if (memo.length > 100) {
      memo = memo.slice(0, 97) + '...';
    }

    // Connect to XRPL Testnet and select wallets based on role
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    const isSender = walletRole === 'sender';
    const secret = isSender ? process.env.SENDER_SECRET : process.env.RECEIVER_SECRET;
    const address = isSender ? process.env.SENDER_ADDRESS : process.env.RECEIVER_ADDRESS;
    const destination = isSender ? process.env.RECEIVER_ADDRESS : process.env.SENDER_ADDRESS;

    if (!secret || !address || !destination) {
      return NextResponse.json(
        { error: 'Missing wallet configuration in environment variables.' },
        { status: 500 }
      );
    }

    const wallet = xrpl.Wallet.fromSeed(secret);

    // Create the XRP payment transaction
    const tx = {
      TransactionType: "Payment",
      Account: address,
      Amount: xrpl.xrpToDrops("10"), // sending 10 XRP; adjust if needed
      Destination: destination,
      Memos: [{
        Memo: {
          MemoData: Buffer.from(memo).toString('hex')
        }
      }]
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const txHash = signed.hash;
    const explorerUrl = `https://testnet.xrpl.org/transactions/${txHash}`;

    return NextResponse.json({
      memo,
      txHash,
      explorer: explorerUrl,
      status: result.result.meta.TransactionResult,
    });
  } catch (error: any) {
    console.error('Transaction Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to generate memo or send transaction.' },
      { status: 500 }
    );
  }
}
