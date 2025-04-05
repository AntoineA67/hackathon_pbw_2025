"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from "react"
import { SiXrp } from "react-icons/si"
import { FaMicrophone } from "react-icons/fa"

function AIBall({ append, setInput }: { 
  append: (message: { role: 'user' | 'assistant'; content: string }, chatRequestOptions?: any) => Promise<string | null | undefined>;
  setInput: (input: string) => void;
}) {
  const [isActive, setIsActive] = useState(false);
  const [size, setSize] = useState(192); // Default size
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SILENCE_THRESHOLD = -50; // dB
  const SILENCE_DURATION = 1000; // ms

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis for silence detection
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);
      analyser.fftSize = 2048;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const db = 20 * Math.log10(average / 255);

        if (db < SILENCE_THRESHOLD) {
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              stopRecording();
            }, SILENCE_DURATION);
          }
        } else {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }

        if (isRecording) {
          requestAnimationFrame(checkSilence);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("onstop");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/m4a' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.m4a');

        try {
          const response = await fetch('/api/audio/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { text } = await response.json();
            if (text) {
              console.log('transcribed text:', text);
              // Process the transcribed text as a user message
              await append({
                role: 'user',
                content: text
              });
              setInput('');
            }
          }
        } catch (error) {
          console.error('Error processing audio:', error);
        }

        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      checkSilence();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setIsRecording(false);
      setIsActive(false);
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
  };

  const toggleActive = () => {
    if (!isActive) {
      startRecording();
    } else {
      stopRecording();
    }
    setIsActive(!isActive);
  };

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Center of the canvas
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Base radius of the ball
    const radius = Math.min(centerX, centerY) * 0.8;

    // Animation variables
    let hue = 210; // Slightly blueish hue
    let time = 0;
    let particleTime = 0;
    const particles: Particle[] = [];

    // Particle class for the orbiting particles
    class Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      angle: number;
      distance: number;
      hue: number;
      alpha: number;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.distance = radius * (0.6 + Math.random() * 0.3);
        this.x = centerX + Math.cos(this.angle) * this.distance;
        this.y = centerY + Math.sin(this.angle) * this.distance;
        this.size = 1 + Math.random() * 3;
        this.speed = 0.01 + Math.random() * 0.02;
        this.hue = hue + Math.random() * 30 - 15;
        this.alpha = 0.1 + Math.random() * 0.4;
      }

      update() {
        this.angle += this.speed;
        this.x = centerX + Math.cos(this.angle) * this.distance;
        this.y = centerY + Math.sin(this.angle) * this.distance;

        // Fade out particles over time
        this.alpha -= 0.002;
        if (this.alpha <= 0) this.alpha = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
        ctx.fill();
      }

      isDead() {
        return this.alpha <= 0;
      }
    }

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update time
      time += 0.01;
      particleTime += 0.05;

      // Shift hue slowly
      hue = (hue + 0.1) % 360;

      // Draw main sphere with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

      // Gradient colors based on state and time
      const baseHue = isActive ? (hue + 40) % 360 : hue;
      const pulseIntensity = Math.sin(time * 2) * 0.1 + 0.9;
      const pulseRadius = radius * pulseIntensity;

      gradient.addColorStop(0, `hsla(${baseHue}, 80%, 70%, 0.9)`);
      gradient.addColorStop(0.5, `hsla(${baseHue + 20}, 80%, 60%, 0.8)`);
      gradient.addColorStop(1, `hsla(${baseHue + 40}, 80%, 50%, 0.2)`);

      // Draw the main sphere
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add inner glow
      const innerGlow = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      innerGlow.addColorStop(0, `hsla(${baseHue}, 100%, 90%, 0.8)`);
      innerGlow.addColorStop(0.5, `hsla(${baseHue}, 100%, 70%, 0.1)`);
      innerGlow.addColorStop(1, `hsla(${baseHue}, 100%, 60%, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      // Add particles when active
      if (isActive && Math.random() > 0.7) {
        particles.push(new Particle());
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        // Remove dead particles
        if (particles[i].isDead()) {
          particles.splice(i, 1);
        }
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
      <div className="relative items-center justify-center">
        <button
          onClick={toggleActive}
          className="group w-64 h-64 rounded-full focus:outline-none flex items-center justify-center"
          aria-label="AI Assistant"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer transition-all duration-500 ease-in-out z-[1]"
            style={{
              borderRadius: "50%",
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
          {isActive ? (
            <>
              <span className="transition-all ease-in-out absolute w-[110%] h-[110%] rounded-full bg-gradient-to-br from-blue-750 via-slate-900 to-blue-800 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-800 to-blue-800 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-800 to-blue-800 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.4s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-800 to-blue-800 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.8s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-800 to-blue-800 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.2s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-800 to-blue-800 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.6s]"></span>
              <span className="transition-all ease-in-out absolute inset-0 rounded-full bg-gradient-radial from-blue-300/20 to-transparent"></span>
            </>
            ) : (
            <>
              <span className="absolute w-full h-full rounded-full bg-gradient-to-br from-blue-750 via-slate-900 to-blue-800 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_2s]"></span>
            </>
          )}

          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 pointer-events-none
            ${isActive
              ? "opacity-100 animate-pulse"
              : "opacity-0 group-hover:opacity-50"
            }`}
          />
        </button>
      </div>
  );
}

export const Greeting = ({
  isActive,
  setIsActive,
  append,
  setInput
}: {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  append: (message: { role: 'user' | 'assistant'; content: string }, chatRequestOptions?: any) => Promise<string | null | undefined>;
  setInput: (input: string) => void;
}) => {
  const [showMicrophone, setShowMicrophone] = useState(false);

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setShowMicrophone(true);

      setTimeout(() => {
        setShowMicrophone(false);
      }, 1000);
    }, 3000);

    return () => clearInterval(iconInterval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center items-center">
      {!isActive && (
        <h1 className="relative text-3xl font-bold text-white">
          How may I assist you today?
        </h1>
      )}
      <AIBall append={append} setInput={setInput} />
    </div>
  );
};
