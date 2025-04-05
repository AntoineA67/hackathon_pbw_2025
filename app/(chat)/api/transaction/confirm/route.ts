// app/api/transaction/confirm/route.ts
import { NextResponse } from 'next/server';
import xrpl from 'xrpl';

export const walletMap: Record<string, { address?: string; secret?: string }> = {
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
    const body = await request.json() as { amount: number | string; memo: string; recipient: string; sender: string };
    let { amount, memo, recipient, sender } = body;

    // Ensure amount is a valid string representing a number.
    amount = typeof amount === 'number' || typeof amount === 'string' ? String(amount) : '';
    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: 'Amount must be a valid number.' },
        { status: 400 }
      );
    }

    // Sanitize memo
    let cleanMemo: string;
    if (typeof memo === 'string') {
      cleanMemo = memo.trim();
    } else if (typeof memo === 'object') {
      cleanMemo = JSON.stringify(memo);
    } else if (memo === undefined || memo === null) {
      cleanMemo = 'No memo provided';
    } else {
      cleanMemo = String(memo);
    }
    if (cleanMemo.length > 100) {
      cleanMemo = cleanMemo.slice(0, 97) + '...';
    }

    // Encode memo as hex
    let hexMemo: string;
    try {
      hexMemo = Buffer.from(cleanMemo, 'utf8').toString('hex');
    } catch (e: any) {
      console.error("Buffer.from failed:", e.message);
      hexMemo = Buffer.from("Fallback memo", 'utf8').toString('hex');
    }

    if (!recipient || !sender) {
      return NextResponse.json(
        { error: 'Recipient and sender are required.' },
        { status: 400 }
      );
    }

    const senderWallet = walletMap[sender];
    const recipientWallet = walletMap[recipient];
    if (!senderWallet || !recipientWallet) {
      return NextResponse.json(
        { error: 'Sender or recipient wallet not found.' },
        { status: 400 }
      );
    }

    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    const wallet = xrpl.Wallet.fromSeed(senderWallet.secret!);

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address!,
      Amount: xrpl.xrpToDrops(amount),
      Destination: recipientWallet.address!,
      Memos: [
        {
          Memo: {
            MemoData: hexMemo,
          },
        },
      ],
    };

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
      status: result.result.meta.TransactionResult,
    });
  } catch (err: any) {
    console.error('Confirm Error:', err?.data || err?.message || err);
    return NextResponse.json(
      { error: 'Transaction failed.' },
      { status: 500 }
    );
  }
}
