"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const MESSAGES = [
  "Analyse du projet et du contexte...",
  "Rédaction du contexte réglementaire...",
  "Génération des objectifs du mandat...",
  "Rédaction des livrables et hypothèses...",
  "Élaboration de l'échéancier...",
  "Finalisation de l'offre de services...",
]

const circumference = 2 * Math.PI * 36

export default function GeneratingOverlay() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const id = setInterval(() => {
      setVisible(false)
      tid = setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setVisible(true)
      }, 400)
    }, 10000)
    return () => {
      clearInterval(id)
      clearTimeout(tid)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-8 py-16 px-8 min-h-[400px]"
    >
      {/* Animated SVG icon */}
      <motion.div
        animate={{ scale: [0.97, 1.03] }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          {/* Inner fill */}
          <circle cx="40" cy="40" r="36" fill="#F0F4F0" />
          {/* Track */}
          <circle cx="40" cy="40" r="36" stroke="#E0EAE0" strokeWidth="3" />
          {/* Progress — rotated so fill starts from top */}
          <motion.circle
            cx="40" cy="40" r="36"
            stroke="#1A2E1E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * 0.1 }}
            transition={{ duration: 55, ease: "linear" }}
            transform="rotate(-90 40 40)"
          />
          {/* BTH initials */}
          <text
            x="40" y="45"
            textAnchor="middle"
            fill="#1A2E1E"
            fontSize="13"
            fontWeight="bold"
            fontFamily="Calibri, Arial, sans-serif"
          >
            BTH
          </text>
        </svg>
      </motion.div>

      <div className="flex flex-col items-center gap-4">
        {/* Rotating message */}
        <div className="h-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {visible && (
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.4, ease: "easeIn" } }}
                className="text-center"
                style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "15px",
                  color: "#1C1C1C",
                  lineHeight: 1.4,
                  maxWidth: "320px",
                }}
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div
          className="relative rounded-full overflow-hidden"
          style={{ width: "280px", height: "2px", backgroundColor: "#E8EDE8" }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(to right, #C9A96E, #1A2E1E)" }}
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 55, ease: "linear" }}
          />
        </div>

        {/* Sub-text */}
        <p
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "11px",
            color: "#9CA3AF",
            textAlign: "center",
          }}
        >
          Cette opération prend généralement 30 à 60 secondes.
        </p>
      </div>
    </motion.div>
  )
}
