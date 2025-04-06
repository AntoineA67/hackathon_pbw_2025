import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TransactionMessageProps {
  content: string;
  className?: string;
}

export function TransactionMessage({ content, className }: TransactionMessageProps) {
  // Extract the transaction details from the content
  const lines = content.split('\n');
  const transactionLine = lines.find(line => line.includes('sending') && line.includes('XRP'));
  const jsonLine = lines.find(line => line.includes('"hash"') && line.includes('"balance"'));

  if (!jsonLine) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  let data;
  try {
    // Clean the JSON line by removing any non-JSON content
    const cleanJsonLine = jsonLine.trim();
    data = JSON.parse(cleanJsonLine);
  } catch (e) {
    console.error('Failed to parse transaction JSON:', e);
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  if (!data.hash || !data.balance) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const explorerLink = `https://xrpscan.com/tx/${data.hash}`;
  
  return (
    <div className="w-full">
      <Card className={cn(
        "w-full max-w-2xl border-green-500/20 bg-green-500/5",
        className
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-500">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Transaction Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {transactionLine && (
              <div className="text-sm text-muted-foreground">
                {transactionLine}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-sm break-all">{data.hash}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Remaining Balance</span>
              <span className="font-mono text-sm">{data.balance} XRP</span>
            </div>
          </div>
          <Link
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-500 hover:underline"
          >
            View transaction details
            <ExternalLink className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
} 