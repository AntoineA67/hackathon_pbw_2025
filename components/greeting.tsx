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

function AIBall({ 
  size = 160, 
  onToggle
}: AIBallProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentSize, setCurrentSize] = useState(size)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)

  const toggleActive = () => {
    const newState = !isActive
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

export const Greeting = ({
  isActive,
}: {
  isActive: boolean;
  setInput: (input: string) => void;
}) => {

  return (
    <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center items-center">
      {!isActive && (
        <h1 className="relative text-2xl font-bold text-white mb-2">
          How may I assist you today?
        </h1>
      )}
      <AIBall />
    </div>
  );
};
