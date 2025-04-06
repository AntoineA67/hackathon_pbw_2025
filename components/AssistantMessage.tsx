'use client';

import { useRef, useState, useEffect } from 'react';
import { Markdown } from './markdown';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react"
import Link from "next/link";

interface AssistantMessageProps {
  message: string;
  setInput: any;
  status?: 'streaming' | 'complete';
}

export function AssistantMessage({ message, setInput, status = 'complete' }: AssistantMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentFilename = useRef<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  //  useEffect(() => {
  //   const readMessage = async () => {
  //     // Only generate TTS if the message is complete
  //     if (status !== 'complete') return;
      
  //     try {
  //       const response = await fetch('/api/text-to-speech', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ text: message }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to convert text to speech');
  //       }

  //       const { url } = await response.json();
  //       const filename = url.split('/').pop();
  //       console.log('Generated audio file:', filename);
  //       currentFilename.current = filename;
        
  //       if (audioRef.current) {
  //         audioRef.current.src = url;
  //         audioRef.current.play();
  //       }
  //     } catch (error) {
  //       console.error('Error reading message:', error);
  //     }
  //   };

  //   readMessage();

  //   return () => {
  //     if (currentFilename.current) {
  //       deleteAudioFile(currentFilename.current);
  //     }
  //   };
  // }, [message, status]);
  
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
      const getInitials = (name: string) => {
        return name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      }
      const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      }
      const truncateAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      }
      return (
        <div className="p-4 ml-2 bg-gradient-to-br from-cyan-800/90 to-blue-900/90 text-white rounded-lg w-full sm:w-[80%] md:w-[70%] lg:w-[60%] shadow-lg shadow-green/50">
          <h3 className="text-emerald-500 font-semibold mb-2">Contacts Found:</h3>

          {/* Enhanced Contacts Widget */}
          <div className="overflow-hidden rounded-xl border border-cyan-700/30 bg-gradient-to-br from-cyan-900/80 to-blue-950/80">
            {/* Widget Header - simplified on mobile */}
            <div className="bg-gradient-to-r from-cyan-800 to-blue-800 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="bg-cyan-600 rounded-full p-1">
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-cyan-100 font-semibold text-xs sm:text-sm">Select Recipient</h3>
              </div>
              <span className="bg-cyan-700/50 text-cyan-100 text-xs px-2 py-0.5 rounded-full">
                {data.contacts.length} Found
              </span>
            </div>

            {/* Widget Content - improved for small screens */}
            <div className="p-2 sm:p-3">
              <ul className="space-y-2">
                {data.contacts.map((contact:any, index:number) => (
                  <li
                    key={index}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-blue-800/20 transition-colors"
                  >
                    {/* Contact Avatar - smaller on mobile */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-medium">
                      {getInitials(contact.name)}
                    </div>

                    {/* Contact Info - better wrapping behavior */}
                    <div className="flex-1 min-w-0 mr-auto">
                      <p className="font-medium text-white text-sm sm:text-base">{contact.name}</p>
                      <div className="flex items-center gap-1 text-xs text-cyan-300">
                        <svg
                          className="h-3 w-3 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="truncate">{truncateAddress(contact.walletAddress)}</span>
                      </div>
                    </div>

                    {/* Action Buttons - always visible */}
                    <div className="flex gap-1 shrink-0 ml-auto">
                      <button
                        onClick={() => copyToClipboard(contact.walletAddress, index)}
                        className="p-1.5 rounded-full hover:bg-cyan-700/50 transition-colors text-cyan-300 hover:text-white"
                        title="Copy address"
                      >
                        {copiedIndex === index ? (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        className="p-1.5 rounded-full hover:bg-cyan-700/50 transition-colors text-cyan-300 hover:text-white"
                        title="Send"
                        onClick={() => {
                          setInput(`Send the amount to ${contact.walletAddress}`)
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }

    // Handle transaction result
    if (data.hash && data.balance) {
      const explorerLink = `https://testnet.xrpl.org/transactions/${data.hash}`;
      
      return (
        <div className="p-4 bg-gradient-to-br from-cyan-800/90 to-blue-900/90 text-white rounded-lg w-full shadow-lg shadow-green-500/30">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-cyan-800 to-blue-800 px-4 py-3 rounded-t-lg flex items-center gap-2">
            <div className="bg-emerald-600 rounded-full p-1">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-emerald-300 font-semibold">Transaction Successful</h3>
          </div>
    
          {/* Card Content */}
          <div className="p-4 bg-gradient-to-br from-cyan-900/80 to-blue-950/80 rounded-b-lg border border-cyan-700/30">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300">Transaction ID</span>
                  <span className="font-mono text-xs text-white">{data.hash}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300">Remaining Balance</span>
                  <span className="font-mono text-xs text-white">{data.balance} XRP</span>
                </div>
              </div>
    
              <Link
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View transaction details
                <ExternalLink className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )
    }
  } catch (e) {
    // If parsing as JSON fails, treat it as regular text content
    return (
      <div 
        className="p-4 ml-2 bg-gradient-to-br from-cyan-800/90 to-blue-900/90 text-white rounded-lg"
      >
        <Markdown>{message}</Markdown>
      </div>
    );
  }

  // If we get here, it means the message wasn't a valid JSON
  const data = JSON.parse(message);
  const explorerLink = `https://testnet.xrpl.org/transactions/${data.transactionHash}/detailed`;
  return (
    <>
        <div className="p-4 bg-gradient-to-br from-cyan-800/90 to-blue-900/90 text-white rounded-lg w-full shadow-lg shadow-green-500/30">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-blue-800 px-4 py-3 rounded-t-lg flex items-center gap-2">
          <div className="bg-emerald-600 rounded-full p-1">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-emerald-300 font-semibold">{data?.message || "Cross-currency payment sent successfully"}</h3>
        </div>

        {/* Card Content */}
        <div className="p-4 bg-gradient-to-br from-cyan-900/80 to-blue-950/80 rounded-b-lg border border-cyan-700/30">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-300">Transaction ID</span>
                <span className="font-mono text-xs text-white">{data?.transactionHash || "F862A7774F5BDAFEDA7426BF973B5CB8BE93C2A99D5FC26127241E67DEC3D048"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-300">Remaining Balance</span>
                <span className="font-mono text-xs text-white">{data?.balance || "19.892404 XRP"} XRP</span>
              </div>
            </div>

            <Link
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View transaction details
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </div>
      </div>
      <audio 
        ref={audioRef} 
        className="hidden"
        onEnded={() => {
          if (currentFilename.current) {
            deleteAudioFile(currentFilename.current);
          }
        }}
      />
    </>
  );
} 