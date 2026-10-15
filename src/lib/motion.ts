import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const WIDE = "(min-width: 900px)";

let lenis: Lenis | null = null;

// Smooth wheel scrolling, driven by the same ticker as ScrollTrigger so pins and scrubs stay in step.
export function startSmoothScroll() {
  if (!window.matchMedia(MOTION_OK).matches) return () => {};
  const instance = new Lenis();
  lenis = instance;
  instance.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    instance.destroy();
    lenis = null;
  };
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y });
}

// A pinned section sits wherever its pin started, so ask its ScrollTrigger before measuring the element.
export function scrollToSection(id: string) {
  const trigger = ScrollTrigger.getById(id);
  if (trigger) return scrollToY(trigger.start);
  const el = document.getElementById(id);
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
}
