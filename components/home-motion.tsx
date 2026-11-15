"use client";

// The parts of the homepage's motion that need a script. The page itself is
// drawn on the server; this finds its hm- classes and adds: the name of a site
// under the pointer, a day marker on the year ribbon, a glow on the doors,
// reveals on scroll, a progress bar, the tilt of the relief and the stars.
// With reduced motion only the first three run.

import { useEffect, useRef } from "react";

export type HomeMotionProps = {
  // The year the ribbon shows, and its hours of Sun and of Earth for each day.
  year: number;
  sunHours: number[];
  earthHours: number[];
};

type Star = { x: number; y: number; radius: number; phase: number; speed: number };

export function HomeMotion({ year, sunHours, earthHours }: HomeMotionProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".hm-root");
    const bar = barRef.current;
    const tip = tipRef.current;
    if (root === null || bar === null || tip === null) {
      return;
    }
    // One signal removes every listener when the page is left.
    const stop = new AbortController();
    const signal = stop.signal;

    function placeTip(x: number, y: number) {
      if (tip === null) return;
      const half = tip.offsetWidth / 2 + 8;
      tip.style.left = Math.min(window.innerWidth - half, Math.max(half, x)) + "px";
      tip.style.top = y + "px";
      tip.classList.add("on");
    }
    function hideTip() {
      tip?.classList.remove("on");
    }

    // The name of the site under the pointer or the keyboard focus. The
    // browser's own tooltip would say the same thing a second time.
    for (const site of root.querySelectorAll<SVGAElement>(".hm-site")) {
      site.querySelector("title")?.remove();
      const show = () => {
        const dot = site.querySelector(".hm-dot");
        if (dot === null) return;
        const box = dot.getBoundingClientRect();
        tip.textContent = site.dataset.name ?? "";
        placeTip(box.left + box.width / 2, box.top);
      };
      site.addEventListener("pointerenter", show, { signal });
      site.addEventListener("focus", show, { signal });
      site.addEventListener("pointerleave", hideTip, { signal });
      site.addEventListener("blur", hideTip, { signal });
    }

    // The year ribbon: the day under the pointer, with its hours.
    const chart = root.querySelector<HTMLElement>(".hm-chart");
    const scrub = root.querySelector<HTMLElement>(".hm-scrub");
    const dayFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    if (chart !== null && scrub !== null) {
      chart.addEventListener(
        "pointermove",
        (event) => {
          const box = chart.getBoundingClientRect();
          const dayCount = sunHours.length;
          const day = Math.min(
            dayCount - 1,
            Math.max(0, Math.floor(((event.clientX - box.left) / box.width) * dayCount)),
          );
          scrub.style.transform = `translateX(${((day + 0.5) / dayCount) * box.width}px)`;
          scrub.style.opacity = "1";
          const sun = document.createElement("span");
          sun.className = "text-power";
          sun.textContent = `Sun ${sunHours[day]} h`;
          const earth = document.createElement("span");
          earth.className = "text-comms";
          earth.textContent = `Earth ${earthHours[day]} h`;
          tip.replaceChildren(`${dayFormat.format(new Date(Date.UTC(year, 0, 1 + day)))} ${year}`, sun, earth);
          placeTip(event.clientX, box.top);
        },
        { signal },
      );
      chart.addEventListener(
        "pointerleave",
        () => {
          scrub.style.opacity = "0";
          hideTip();
        },
        { signal },
      );
    }

    // The doors: the glow follows the pointer.
    for (const card of root.querySelectorAll<HTMLElement>(".hm-card")) {
      card.addEventListener(
        "pointermove",
        (event) => {
          const box = card.getBoundingClientRect();
          card.style.setProperty("--mx", event.clientX - box.left + "px");
          card.style.setProperty("--my", event.clientY - box.top + "px");
        },
        { signal },
      );
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => stop.abort();
    }
    root.classList.add("hm-js");

    // The two totals count up when the ribbon comes into view.
    function countUp(element: HTMLElement) {
      const end = Number(element.dataset.count);
      const startedAt = performance.now();
      function step(now: number) {
        const part = Math.min(1, (now - startedAt) / 1800);
        const eased = 1 - Math.pow(1 - part, 4);
        element.textContent = Math.round(end * eased).toLocaleString("en-US");
        if (part < 1 && !signal.aborted) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // Reveal anything whose top has come into, or already passed, the window.
    let pending = [...root.querySelectorAll<HTMLElement>("[data-reveal], .hm-strip")];
    function reveal() {
      pending = pending.filter((element) => {
        if (element.getBoundingClientRect().top > window.innerHeight * 0.9) return true;
        element.classList.add("in");
        if (element.classList.contains("hm-strip")) {
          element.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        }
        return false;
      });
    }

    // Progress bar, the relief drifting with the scroll, and its tilt towards
    // the pointer. The tilt is for wide screens with a real pointer.
    const tilt = root.querySelector<HTMLElement>(".hm-tilt");
    const hero = root.querySelector<HTMLElement>(".hm-hero");
    const isWide = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    let tiltX = 0;
    let tiltY = 0;
    let isQueued = false;
    function frame() {
      isQueued = false;
      reveal();
      const scrollRoom = document.documentElement.scrollHeight - window.innerHeight;
      if (bar !== null) {
        bar.style.transform = `scaleX(${scrollRoom > 0 ? window.scrollY / scrollRoom : 0})`;
      }
      if (tilt !== null) {
        const drift = Math.min(window.scrollY, 900);
        tilt.style.transform = `perspective(1400px) translateY(${drift * 0.1}px) scale(${1 + drift * 0.00012}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }
    }
    function queue() {
      if (!isQueued) {
        isQueued = true;
        requestAnimationFrame(frame);
      }
    }
    window.addEventListener("scroll", queue, { passive: true, signal });
    window.addEventListener("resize", queue, { signal });
    if (hero !== null) {
      hero.addEventListener(
        "pointermove",
        (event) => {
          if (!isWide.matches) return;
          const box = hero.getBoundingClientRect();
          tiltY = ((event.clientX - box.left) / box.width - 0.5) * 7;
          tiltX = -((event.clientY - box.top) / box.height - 0.5) * 7;
          queue();
        },
        { signal },
      );
      hero.addEventListener(
        "pointerleave",
        () => {
          tiltX = 0;
          tiltY = 0;
          queue();
        },
        { signal },
      );
    }
    frame();

    // Stars behind the hero, with a shooting star now and then. They only
    // draw while the hero is on screen.
    const canvas = root.querySelector<HTMLCanvasElement>(".hm-stars");
    const context = canvas?.getContext("2d") ?? null;
    let watcher: IntersectionObserver | null = null;
    if (canvas !== null && context !== null && hero !== null) {
      let stars: Star[] = [];
      let width = 0;
      let height = 0;
      let isRunning = false;
      let shot: { x: number; y: number; startedAt: number } | null = null;
      let nextShotAt = 3000;
      const size = () => {
        const density = Math.min(window.devicePixelRatio || 1, 2);
        width = hero.clientWidth;
        height = hero.clientHeight;
        canvas.width = width * density;
        canvas.height = height * density;
        context.setTransform(density, 0, 0, density, 0, 0);
        stars = Array.from({ length: Math.round((width * height) / 6500) }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.1 + 0.3,
          phase: Math.random() * 6.28,
          speed: Math.random() * 0.0012 + 0.0004,
        }));
      };
      const draw = (now: number) => {
        if (!isRunning || signal.aborted) return;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#f2f2f2";
        for (const star of stars) {
          context.globalAlpha = 0.15 + 0.6 * Math.abs(Math.sin(now * star.speed + star.phase));
          context.beginPath();
          context.arc(star.x, star.y, star.radius, 0, 6.28);
          context.fill();
        }
        if (shot === null && now > nextShotAt) {
          shot = { x: Math.random() * width * 0.5, y: Math.random() * height * 0.4, startedAt: now };
        }
        if (shot !== null) {
          const part = (now - shot.startedAt) / 900;
          if (part >= 1) {
            shot = null;
            nextShotAt = now + 5000 + Math.random() * 6000;
          } else {
            const x = shot.x + part * 320;
            const y = shot.y + part * 120;
            const trail = context.createLinearGradient(x - 90, y - 34, x, y);
            trail.addColorStop(0, "rgba(242,242,242,0)");
            trail.addColorStop(1, "rgba(242,242,242,0.9)");
            context.globalAlpha = Math.sin(part * Math.PI);
            context.strokeStyle = trail;
            context.lineWidth = 1.2;
            context.beginPath();
            context.moveTo(x - 90, y - 34);
            context.lineTo(x, y);
            context.stroke();
          }
        }
        requestAnimationFrame(draw);
      };
      size();
      window.addEventListener("resize", size, { signal });
      watcher = new IntersectionObserver(([entry]) => {
        const wasRunning = isRunning;
        isRunning = entry.isIntersecting;
        if (isRunning && !wasRunning) requestAnimationFrame(draw);
      });
      watcher.observe(hero);
    }

    return () => {
      stop.abort();
      watcher?.disconnect();
      root.classList.remove("hm-js");
    };
  }, [year, sunHours, earthHours]);

  return (
    <>
      <div ref={barRef} aria-hidden="true" className="hm-progress" />
      <div ref={tipRef} role="tooltip" className="hm-tip" />
    </>
  );
}
