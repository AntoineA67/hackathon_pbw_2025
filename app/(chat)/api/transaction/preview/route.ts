// app/api/transaction/preview/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

export async function POST(request: Request) {
  try {
    const { memoInput } = await request.json() as { memoInput: string };

    const prompt = `From this input: "${memoInput}", extract:
1. Amount in XRP (number only),
2. Recipient name (Shane, Luc, Florian, or Thomas),
3. A short XRP memo under 100 characters.

Respond ONLY in this JSON format:
{ "amount": 20, "recipient": "Shane", "memo": "Payment for web hosting" }`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = completion.choices[0].message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI.' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response.' },
        { status: 500 }
      );
    }

    const { amount, recipient, memo } = parsed;
    if (!walletMap[recipient]) {
      return NextResponse.json(
        { error: `Recipient "${recipient}" not recognized.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ amount, memo, recipient });
  } catch (error: any) {
    console.error('Preview Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to extract transaction details.' },
      { status: 500 }
    );
  }
}
