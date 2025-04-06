'use client';

import { useEffect, useRef } from 'react';

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

  // useEffect(() => {
  //   const readMessage = async () => {
  //     try {
  //       const response = await fetch('/api/text-to-speech', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ text: message }),
  //       });

  //       if (!response.ok) {
  //         console.warn('Text-to-speech conversion failed, continuing without audio');
  //         return;
  //       }

  //       const { url } = await response.json();
  //       const filename = url.split('/').pop();
  //       currentFilename.current = filename;
        
  //       if (audioRef.current) {
  //         audioRef.current.src = url;
  //         audioRef.current.play().catch(error => {
  //           console.warn('Failed to play audio:', error);
  //         });
  //       }
  //     } catch (error) {
  //       console.warn('Error in text-to-speech process:', error);
  //     }
  //   };

    // readMessage();

  //   return () => {
  //     if (currentFilename.current) {
  //       deleteAudioFile(currentFilename.current);
  //     }
  //   };
  // }, [message]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="text-gray-800">{message}</p>
      <audio 
        ref={audioRef} 
        className="hidden"
        onEnded={() => {
          if (currentFilename.current) {
            deleteAudioFile(currentFilename.current);
          }
        }}
      />
    </div>
  );
} 