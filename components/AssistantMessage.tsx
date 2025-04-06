'use client';

import { useEffect, useRef } from 'react';
import { Markdown } from './markdown';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AssistantMessageProps {
  message: string;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentFilename = useRef<string | null>(null);

  const deleteAudioFile = async (filename: string) => {
    try {
      const response = await fetch('/api/text-to-speech/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        console.warn('Failed to delete audio file:', filename);
      }
    } catch (error) {
      console.warn('Error deleting audio file:', error);
    }
  };

  try {
    // Try to parse the message as JSON to handle tool results
    const data = JSON.parse(message);
    
    // Handle getContacts result
    if (data.contacts) {
      return (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Contacts Found:</h3>
          <ul className="space-y-2">
            {data.contacts.map((contact: { name: string; walletAddress: string }, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <span className="font-medium">{contact.name}</span>
                <span className="text-gray-600">({contact.walletAddress})</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Handle transaction result
    if (data.hash && data.balance) {
      const explorerLink = `https://testnet.xrpl.org/transactions/${data.hash}/detailed`;
      
      return (
        <Card className="w-full max-w-2xl border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-500">
              <div className="h-2 w-2 rounded-full bg-green-500" />
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
              <ExternalLink className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      );
    }
  } catch (e) {
    // If parsing as JSON fails, treat it as regular text content
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <Markdown>{message}</Markdown>
      </div>
    );
  }

  // If we get here, it means the message wasn't a valid JSON
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <Markdown>{message}</Markdown>
    </div>
  );
} 