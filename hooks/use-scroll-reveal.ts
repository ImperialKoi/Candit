"use client"

import { useEffect, useRef, useState } from "react"

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  delay?: number
}

// Changed the generic type of useRef to HTMLDivElement
export function useScrollReveal({ threshold = 0.1, rootMargin = "0px", delay = 0 }: ScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null) // Explicitly set to HTMLDivElement
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      {
        threshold,
        rootMargin,
      },
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, delay])

  return { ref, isVisible }
}
