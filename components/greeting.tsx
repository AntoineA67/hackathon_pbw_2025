"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from "react"
import { SiXrp } from "react-icons/si"
import { FaMicrophone } from "react-icons/fa"

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

  const SILENCE_THRESHOLD = -50;
  const SILENCE_DURATION = 1000;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

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
        setIsActive(false);
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

    let hue = isActive ? 200 : 220
    let time = 0
    let particleTime = 0
    const particles: Particle[] = []
    
    class Particle {
      x: number
      y: number
      size: number
      speed: number
      angle: number
      distance: number
      hue: number
      alpha: number

      constructor() {
        this.angle = Math.random() * Math.PI * 2
        this.distance = radius * (0.6 + Math.random() * 0.3)
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance
        this.size = 1 + Math.random() * 3
        this.speed = 0.01 + Math.random() * 0.02
        this.hue = hue + Math.random() * 30 - 15
        this.alpha = 0.1 + Math.random() * 0.4
      }

      update() {
        this.angle += this.speed
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance

        // Fade out particles over time
        this.alpha -= 0.002
        if (this.alpha <= 0) this.alpha = 0
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`
        ctx.fill()
      }

      isDead() {
        return this.alpha <= 0
      }
    }
  
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update time
      time += 0.01
      particleTime += 0.05

      // Shift hue slowly - use different ranges for active/inactive
      const targetHue = isActive ? 160 : 220 // More teal when active, more blue when inactive
      hue += (targetHue - hue) * 0.01 // Smooth transition between states

      // Draw main sphere with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)

      // Gradient colors based on state and time
      const baseHue = hue
      const pulseIntensity = Math.sin(time * 2) * 0.1 + 0.9
      const pulseRadius = radius * pulseIntensity

      // More gold/amber tones when active, blue when inactive
      const saturation = isActive ? "90%" : "80%"
      const lightness = isActive ? "65%" : "60%"

      gradient.addColorStop(0, `hsla(${baseHue}, ${saturation}, ${lightness}, 0.9)`)
      gradient.addColorStop(0.5, `hsla(${baseHue + 10}, 85%, 55%, 0.8)`)
      gradient.addColorStop(1, `hsla(${baseHue + 20}, 90%, 45%, 0.2)`)

      // Draw the main sphere
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Add inner glow
      const innerGlow = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius,
      )

      // Add a gold/amber highlight for blockchain feel
      const glowHue = isActive ? baseHue - 30 : baseHue + 10
      innerGlow.addColorStop(0, `hsla(${glowHue}, 100%, 85%, 0.8)`)
      innerGlow.addColorStop(0.5, `hsla(${glowHue}, 100%, 70%, 0.1)`)
      innerGlow.addColorStop(1, `hsla(${glowHue}, 100%, 60%, 0)`)

      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = innerGlow
      ctx.fill()

      // Add particles when active
      if (isActive && Math.random() > 0.7) {
        particles.push(new Particle())
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update()
        particles[i].draw()

        // Remove dead particles
        if (particles[i].isDead()) {
          particles.splice(i, 1)
        }
      }

      // Draw subtle wave patterns
      const waveCount = 3
      for (let i = 0; i < waveCount; i++) {
        const waveRadius = radius * (0.85 + Math.sin(time + i) * 0.05)
        const waveWidth = 2

        ctx.beginPath()
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${baseHue + i * 15}, 85%, 65%, 0.2)`
        ctx.lineWidth = waveWidth
        ctx.stroke()
      }

      // Continue animation
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
    <div className="w-full mx-auto size-full flex flex-col justify-start items-center">
      <h1 className={`relative text-2xl font-bold text-white mb-2 ${(isActive || messagesLength) ? "text-transparent" : ""}`}>
        How may I assist you today?
      </h1>
      <AIBall size={160} isActive={isActive} setIsActive={setIsActive} append={append} setInput={setInput}/>
    </div>
  );
};
