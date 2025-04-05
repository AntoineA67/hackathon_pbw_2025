"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from "react"
import { SiXrp } from "react-icons/si"
import { FaMicrophone } from "react-icons/fa"

export const Greeting = ({isActive, setIsActive} : {isActive:any, setIsActive:any}) => {
  const [showMicrophone, setShowMicrophone] = useState(false)

  const toggleActive = () => {
    setIsActive(!isActive)
  }

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setShowMicrophone(true)

      setTimeout(() => {
        setShowMicrophone(false)
      }, 1000)
    }, 3000)

    return () => clearInterval(iconInterval)
  }, [])
  return (
    <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center items-center">
      {!isActive &&
        <h1 className="relative text-3xl font-bold text-white mb-80">How may I assist you today?</h1>
      }

      <button
          onClick={toggleActive}
          className={`
            absolute flex items-center justify-center w-40 h-40 rounded-full 
            transition-all duration-500 focus:outline-none
            ${!isActive ? "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.7)]" : "bg-emerald-400"}
          `}
          aria-label="AI Assistant"
        >
          {/* Classic Shazam-style animation rings */}
          {isActive ? (
            <>
              <span className="transition-all ease-in-out absolute w-[110%] h-[110%] rounded-full bg-emerald-600/50 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-emerald-600/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-emerald-600/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.4s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-emerald-600/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.8s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-emerald-600/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.2s]"></span>
              <span className="transition-all ease-in-out absolute w-full h-full rounded-full bg-emerald-600/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.6s]"></span>
              <span className="transition-all ease-in-out absolute inset-0 rounded-full bg-gradient-radial from-emerald-300/20 to-transparent"></span>
            </>
            ) : (
            <>
              <span className="absolute w-full h-full rounded-full bg-blue-400/40 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_2s]"></span>
            </>
          )}

          {/* Icon container with heartbeat animation */}
          <div
            className={`
              relative flex items-center justify-center
              ${isActive ? "animate-[pulse_1.5s_ease-in-out_infinite]" : "animate-heartbeat"}
            `}
          >
            {/* Icon switching with transition */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* XRP Icon */}
              <SiXrp
                className={`
                  absolute w-20 h-20 text-white transition-all duration-300
                  ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" : ""}
                  ${showMicrophone ? "opacity-0 scale-90" : "opacity-100 scale-100"}
                `}
              />

              {/* Microphone Icon */}
              <FaMicrophone
                className={`
                  absolute w-16 h-16 text-white transition-all duration-300
                  ${isActive ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]" : ""}
                  ${showMicrophone ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                `}
              />
            </div>
          </div>
        </button>
    </div>
  );
};
