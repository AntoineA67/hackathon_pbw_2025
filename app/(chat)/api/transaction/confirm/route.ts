// app/api/transaction/confirm/route.ts
import { NextResponse } from 'next/server';
import * as xrpl from 'xrpl';

const WALLET_MAP: Record<string, { address?: string; secret?: string }> = {
  sender: {
    address: process.env.SENDER_WALLET_ADDRESS,
    secret: process.env.SENDER_WALLET_SECRET,
  },
  recipient: {
    address: process.env.RECIPIENT_WALLET_ADDRESS,
    secret: process.env.RECIPIENT_WALLET_SECRET,
  },
};

export async function POST(request: Request) {
  try {
    const { amount, memo } = await request.json();

    if (!amount || !memo) {
      return NextResponse.json(
        { error: 'Amount and memo are required' },
        { status: 400 }
      );
    }

    const senderWallet = WALLET_MAP.sender;
    const recipientWallet = WALLET_MAP.recipient;

    if (!senderWallet.address || !senderWallet.secret) {
      return NextResponse.json(
        { error: 'Sender wallet not configured' },
        { status: 500 }
      );
    }

    if (!recipientWallet.address) {
      return NextResponse.json(
        { error: 'Recipient wallet not configured' },
        { status: 500 }
      );
    }

    const client = new xrpl.Client('wss://s.altnet.rippletest.net:51233');
    await client.connect();

    const wallet = xrpl.Wallet.fromSeed(senderWallet.secret);

    const hexMemo = Buffer.from(memo).toString('hex');

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address,
      Amount: xrpl.xrpToDrops(amount),
      Destination: recipientWallet.address,
      Memos: [
        {
          Memo: {
            MemoData: hexMemo,
          },
        },
      ],
    } as xrpl.Payment;

    console.log("XRPL TX object:", tx);

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    await client.disconnect();

    const hash = signed.hash;
    const explorerUrl = `https://testnet.xrpl.org/transactions/${hash}`;

    return NextResponse.json({
      txHash: hash,
      explorer: explorerUrl,
      status: (result.result.meta as xrpl.TransactionMetadataBase)?.TransactionResult || 'unknown',
    });
  } catch (err: any) {
    console.error('Transaction error:', err);
    return NextResponse.json(
      { error: err.message || 'Transaction failed' },
      { status: 500 }
    );
  }
}
