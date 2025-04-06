"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from "react"
import { SiXrp } from "react-icons/si"
import { FaMicrophone } from "react-icons/fa"

interface AIBallProps {
  size?: number
  idleColor?: string
  activeColor?: string
  onToggle?: (isActive: boolean) => void
}

function AIBall({ size, onToggle, isActive, setIsActive, append, setInput }: any) {
  const [currentSize, setCurrentSize] = useState(size)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)

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
    const newState = !isActive
    if (!isActive)
      startRecording();
    else
      stopRecording();
    setIsActive(newState)
    setCurrentSize(newState ? size * 1.20 : size)
    if (onToggle) onToggle(newState)
  }
  useEffect(() => {
    let frameId: number
    
    const animateLogo = () => {
      setRotation(prev => (prev + 0.1) % 360)
      setScale(1 + Math.sin(Date.now() * 0.002) * 0.05)
      frameId = requestAnimationFrame(animateLogo)
    }
    
    animateLogo()
    
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const radius = Math.min(centerX, centerY) * 0.8
    let time = 0
    
    class Wave {
      points: { x: number; y: number }[]
      color: string
      amplitude: number
      frequency: number
      speed: number
      phase: number
      width: number
      
      constructor(color: string, amplitude: number, frequency: number, speed: number, width: number) {
        this.points = []
        this.color = color
        this.amplitude = amplitude
        this.frequency = frequency
        this.speed = speed
        this.phase = Math.random() * Math.PI * 2
        this.width = width
        
        for (let i = 0; i <= 100; i++) {
          const t = i / 100
          const angle = t * Math.PI * 2
          const x = centerX + Math.cos(angle) * radius * 0.7
          const y = centerY + Math.sin(angle) * radius * 0.7
          this.points.push({ x, y })
        }
      }
      
      update(time: number) {
        for (let i = 0; i <= 100; i++) {
          const t = i / 100
          const angle = t * Math.PI * 2
          const offset = Math.sin(angle * this.frequency + time * 10 + this.phase) * this.amplitude
          const waveRadius = radius * (0.7 + offset * 0.05)
          
          this.points[i] = {
            x: centerX + Math.cos(angle) * waveRadius,
            y: centerY + Math.sin(angle) * waveRadius
          }
        }
      }
      
      draw() {
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        
        for (let i = 1; i <= 100; i++) {
          const p1 = this.points[i - 1]
          const p2 = this.points[i % 100]
          const cpX = (p1.x + p2.x) / 2
          const cpY = (p1.y + p2.y) / 2
          ctx.quadraticCurveTo(p1.x, p1.y, cpX, cpY)
        }
        
        ctx.strokeStyle = this.color
        ctx.lineWidth = this.width
        ctx.stroke()
      }
    }

    const waves = [
      new Wave('rgba(219, 166, 255, 0.3)', 1.0, 2, 0.5, 1.5),
      new Wave('rgba(173, 216, 230, 0.3)', 1.2, 3, 0.3, 1.2),
      new Wave('rgba(255, 182, 193, 0.3)', 0.8, 4, 0.7, 3.0),
      new Wave('rgba(144, 238, 144, 0.3)', 1.5, 5, 0.4, 1.8),
    ]
  
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.01
      const gradient = ctx.createRadialGradient(
        centerX, 
        centerY, 
        0, 
        centerX, 
        centerY, 
        radius
      )
      
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
      gradient.addColorStop(0.3, 'rgba(219, 166, 255, 0.5)')
      gradient.addColorStop(0.7, 'rgba(173, 216, 230, 0.5)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)')

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      const highlightGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, 
        centerY - radius * 0.3, 
        0, 
        centerX, 
        centerY, 
        radius
      )
      
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()
      
      for (const wave of waves) {
        wave.update(time)
        wave.draw()
      }
      
      if (isActive) {
        const pulseSize = radius * (1.05 + Math.sin(time * 3) * 0.02)
        ctx.beginPath()
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(219, 166, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()
        
        for (let i = 0; i < 10; i++) {
          const ringSize = radius * (1.1 + (time * 0.3 + i * 0.33) % 1)
          const opacity = 0.3 * (1 - ((time * 0.3 + i * 0.33) % 1))
          
          ctx.beginPath()
          ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(219, 166, 255, ${opacity})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isActive, size])

  const logoSize = currentSize * 0.25

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={toggleActive}
        className="group rounded-full focus:outline-none flex items-center justify-center"
        aria-label={isActive ? "AI Assistant is active" : "AI Assistant is idle"}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer transition-all duration-500 ease-in-out z-[1]"
          style={{
            borderRadius: "50%",
            width: `${currentSize}px`,
            height: `${currentSize}px`,
          }}
        />
        <div className="absolute inset-0 rounded-full shadow-lg shadow-black/20 -z-10"></div>
      </button>
    </div>
  )
}

export const Greeting = ({ isActive, setIsActive, messagesLength, append, setInput }: {
  isActive: boolean;
  setIsActive: any;
  messagesLength: number;
  append: any;
  setInput: any;
}) => {

  return (
    <div className="max-w-3xl mx-auto size-full flex flex-col justify-start items-center">
      <h1 className={`relative text-2xl font-bold text-white mb-2 ${(isActive || messagesLength) ? "hidden" : ""}`}>
        How may I assist you today?
      </h1>
      <AIBall size={160} isActive={isActive} setIsActive={setIsActive} append={append} setInput={setInput}/>
    </div>
  );
};
