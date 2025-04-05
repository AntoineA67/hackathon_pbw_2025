"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from "react"
import { SiXrp } from "react-icons/si"


export const Greeting = () => {
  const [isActive, setIsActive] = useState(false)

  const toggleActive = () => {
    setIsActive(!isActive)
  }
  return (
    // <div
    //   key="overview"
    //   className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    // >
    //   <motion.div
    //     initial={{ opacity: 0, y: 10 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     exit={{ opacity: 0, y: 10 }}
    //     transition={{ delay: 0.5 }}
    //     className="text-2xl font-semibold"
    //   >
    //     Hello there!
    //   </motion.div>
    //   <motion.div
    //     initial={{ opacity: 0, y: 10 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     exit={{ opacity: 0, y: 10 }}
    //     transition={{ delay: 0.6 }}
    //     className="text-2xl text-zinc-500"
    //   >
    //     How can I help you today?
    //   </motion.div>
    // </div>
    <div className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-white mb-8">How may I assist you today?</h1>

      <button
        onClick={toggleActive}
        className={
          `
          relative flex items-center justify-center w-36 h-36 rounded-full
          transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 bg-blue-600 hover:bg-blue-500
          ${isActive ? "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.7)]" : "bg-blue-600 hover:bg-blue-500"}
          `
        }
        aria-label="AI Assistant"
      >
        <SiXrp className={`w-16 h-16 text-white transition-all duration-2000 animate-pulse`} />

      </button>
    </div>
  );
};
