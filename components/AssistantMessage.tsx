'use client';

import { useEffect, useRef } from 'react';

interface AssistantMessageProps {
  message: string;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentFilename = useRef<string | null>(null);

  const deleteAudioFile = async (filename: string) => {
    console.log('Attempting to delete audio file:', filename);
    try {
      const response = await fetch('/api/text-to-speech/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete audio file');
      }

      const result = await response.json();
      console.log('Delete response:', result);
    } catch (error) {
      console.error('Error deleting audio file:', error);
    }
  };

  useEffect(() => {
    const readMessage = async () => {
      try {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: message }),
        });

        if (!response.ok) {
          throw new Error('Failed to convert text to speech');
        }

        const { url } = await response.json();
        const filename = url.split('/').pop();
        console.log('Generated audio file:', filename);
        currentFilename.current = filename;
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      } catch (error) {
        console.error('Error reading message:', error);
      }
    };

    readMessage();

    return () => {
      if (currentFilename.current) {
        deleteAudioFile(currentFilename.current);
      }
    };
  }, [message]);

  return (
    <div 
      className="p-4 ml-2 bg-gradient-to-br from-cyan-800/90 to-blue-900/90 text-white rounded-lg" 
      style={{ maxWidth: `${Math.min(600, message.length * 10)}px` }}
    >
      <p className="text-cyan-200/70">{message}</p>
      <audio 
        ref={audioRef} 
        className="hidden"
        onEnded={() => {
          // Delete the audio file after it's finished playing
          if (currentFilename.current) {
            deleteAudioFile(currentFilename.current);
          }
        }}
      />
    </div>
  );
} 