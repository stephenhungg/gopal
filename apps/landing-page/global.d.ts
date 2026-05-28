import type gsap from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

declare global {
  interface Window {
    gsap?: typeof gsap;
    ScrollTrigger?: typeof ScrollTrigger;
    lenis?: unknown;
  }
}

export {};
