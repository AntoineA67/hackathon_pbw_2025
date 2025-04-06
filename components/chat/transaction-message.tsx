import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

interface TransactionMessageProps {
  content: string;
  className?: string;
}

export function TransactionMessage({ content, className }: TransactionMessageProps) {
  try {
    // Try to parse the content as JSON first (for tool results)
    const data = JSON.parse(content);
    if (data.hash && data.balance) {
      const explorerLink = `https://testnet.xrpl.org/transactions/${data.hash}/detailed`;
      
      return (
        <Card className={cn(
          "w-full max-w-2xl border-green-500/20 bg-green-500/5",
          className
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <div className="size-2 rounded-full bg-green-500" />
              Transaction Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm">{data.hash}</span>
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
              <ExternalLink className="size-4" />
            </Link>
          </CardContent>
        </Card>
      );
    }
  } catch (e) {
    // If parsing as JSON fails, treat it as regular text content
    return <Markdown>{content}</Markdown>;
  }

  // If we get here, it means the content wasn't a valid JSON with hash and balance
  return <Markdown>{content}</Markdown>;
} 