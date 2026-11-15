import { useEffect, useRef, useState } from "react";

import { BuddyFigure } from "@/components/buddy";
import type { TourStep } from "@/lib/tour";
import { cn } from "@/lib/utils";

export type TourCardProps = {
  step: TourStep;
  // Which step this is, counted from 0, and how many there are.
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
};

// what each step points at on the page, and where the card goes.
// One entry per step of TOUR_STEPS, in the same order.
type Focus = {
  // The thing the step talks about. The first match that is on screen wins.
  selector: string;
  // A second thing to ring, when the step compares two.
  also?: string;
  // The side of the focus the card sits on, when there is room.
  side: "top" | "bottom";
  // Which edge of the focus the card lines up with.
  align: "center" | "end";
};

const SKY = 'svg[aria-label^="Terrain horizon"]';
const FOCUS: Focus[] = [
  { selector: "li[data-site-id]", side: "bottom", align: "end" },
  {
    selector: 'li[data-site-id="shackleton-ridge"]',
    also: 'li[data-site-id="shackleton-shadow"]',
    side: "bottom",
    align: "end",
  },
  { selector: SKY, side: "top", align: "center" },
  { selector: 'header ul button[aria-pressed="true"]', side: "bottom", align: "center" },
  { selector: SKY, side: "top", align: "center" },
];

type Box = { left: number; top: number; width: number; height: number };
type Place = {
  x: number;
  y: number;
  side: "top" | "bottom";
  arrowX: number;
  ring: Box;
  alsoRing: Box | null;
};

const GAP = 16;
const EDGE = 8;
// Room kept on the card's left for the buddy.
const BUDDY_ROOM = 64;

function firstOnScreen(selector: string): DOMRect | null {
  for (const element of document.querySelectorAll(selector)) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }
  }
  return null;
}

function boxOf(rect: DOMRect): Box {
  return {
    left: Math.round(rect.left) - 4,
    top: Math.round(rect.top) - 4,
    width: Math.round(rect.width) + 8,
    height: Math.round(rect.height) + 8,
  };
}

function placeFor(focus: Focus, card: HTMLElement): Place | null {
  // Below lg the card stays docked at the bottom, as before.
  if (window.innerWidth < 1024) {
    return null;
  }
  const rect = firstOnScreen(focus.selector);
  if (rect === null) {
    return null;
  }
  const cardWidth = card.offsetWidth;
  const cardHeight = card.offsetHeight;

  let side = focus.side;
  const below = rect.bottom + GAP;
  const above = rect.top - GAP - cardHeight;
  if (side === "bottom" && below + cardHeight > window.innerHeight - EDGE && above >= EDGE) {
    side = "top";
  }
  if (side === "top" && above < EDGE) {
    side = "bottom";
  }
  const y = side === "bottom" ? below : above;

  let x = focus.align === "end" ? rect.right - cardWidth : rect.left + rect.width / 2 - cardWidth / 2;
  x = Math.max(EDGE + BUDDY_ROOM, Math.min(window.innerWidth - cardWidth - EDGE, x));

  const pointAt = focus.align === "end" ? rect.right - 48 : rect.left + rect.width / 2;
  const arrowX = Math.max(24, Math.min(cardWidth - 24, pointAt - x));

  const alsoRect = focus.also !== undefined ? firstOnScreen(focus.also) : null;
  return {
    x: Math.round(x),
    y: Math.round(y),
    side,
    arrowX: Math.round(arrowX),
    ring: boxOf(rect),
    alsoRing: alsoRect !== null ? boxOf(alsoRect) : null,
  };
}

// the tour guide. A small astronaut that bobs, blinks, waves, hops on
// each step and looks towards the thing the card points at.
function Buddy({
  stepIndex,
  looksUp,
  isOnTop,
}: {
  stepIndex: number;
  looksUp: boolean;
  // True when the card floats above what it points at. The buddy then stands
  // on the card's top edge, over dimmed parts of the page, and not beside the
  // card, where it would cover the lit part.
  isOnTop: boolean;
}) {
  // The step it first stood on. It hops when the step changes, not when it
  // arrives: the opening has just flown it here.
  const [firstStep] = useState(stepIndex);
  return (
    <div
      aria-hidden="true"
      // Below lg it stands inside the card, in the gap between the buttons and
      // the dots, so it covers nothing in the list behind the card.
      className={cn(
        "pointer-events-none absolute max-lg:bottom-3 max-lg:left-44 max-lg:w-9 lg:w-14",
        isOnTop ? "lg:-top-[3.6rem] lg:left-2" : "lg:bottom-0 lg:-left-[3.75rem]",
      )}
    >
      <div key={stepIndex} className={stepIndex !== firstStep ? "buddy-hop" : undefined}>
        <BuddyFigure looksUp={looksUp} isGreeting={false} />
      </div>
    </div>
  );
}

// the opening, played once when the tour starts, from lg up.
// in: it rises from the bottom of the window, small, then flies at the viewer.
// eyes: so close that its visor fills the window; the eyes look left, then right.
// back: it pulls away to the middle. hi: it floats there, waves, says hi.
// go: it flies in an arc to its place by the card. done: the card shows.
type Intro = "in" | "eyes" | "back" | "hi" | "go" | "done";
// How big it is while it floats in the middle.
const FLOAT_SCALE = 2.2;

// the goodbye, played when the last step's Finish is pressed.
// rise: it lifts off from the card and comes closer. info: it points people
// to the About page. bye: it waves. away: it flies off, and the tour closes.
type Outro = "rise" | "info" | "bye" | "away";
// How big it is while it says goodbye.
const NEAR_SCALE = 2.8;
// The middle of the visor inside the 56 px wide figure. Everything turns and
// grows round this point, so the eyes stay in the middle of the window.
const VISOR_X = 28;
const VISOR_Y = 24.9;

// Puts the middle of the visor at (x, y) on the screen.
function introTransform(x: number, y: number, scale: number, turnDeg: number): string {
  return `translate(${x - VISOR_X}px, ${y - VISOR_Y}px) rotate(${turnDeg}deg) scale(${scale})`;
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The card that tells the guided tour, one step at a time.
// from lg up it floats next to the thing the step talks about, with an
// arrow pointing at it and a ring around it, and glides there on each step.
// Below lg it stays docked just above the tab bar, as before.
// On each step the title and the text fade in: their key is the step number,
// so React draws them afresh and the fade plays again.
export function TourCard({ step, stepIndex, stepCount, onBack, onNext, onClose }: TourCardProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stepCount - 1;

  const cardRef = useRef<HTMLElement>(null);
  // undefined until the first measure, null when docked.
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  // False for the first placement, so the card appears in place instead of
  // flying in from the corner.
  const [glides, setGlides] = useState(false);

  // Follow the focus every frame: the page changes under the tour (a step
  // picks a site and a month, the list scrolls, the window resizes).
  useEffect(() => {
    let frame = 0;
    let lastKey = "";
    function follow() {
      const card = cardRef.current;
      if (card !== null) {
        const next = placeFor(FOCUS[stepIndex], card);
        const key = JSON.stringify(next);
        if (key !== lastKey) {
          lastKey = key;
          setPlace(next);
        }
      }
      frame = requestAnimationFrame(follow);
    }
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [stepIndex]);

  useEffect(() => {
    if (place !== undefined && !glides) {
      const frame = requestAnimationFrame(() => setGlides(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [place, glides]);

  // The opening is skipped below lg and for people who ask for less motion.
  // The card is only drawn in the browser, after a click or on "?tour=1".
  const [intro, setIntro] = useState<Intro>(() =>
    window.innerWidth >= 1024 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "in" : "done",
  );
  const playsIntro = useRef(intro !== "done");
  const [lookX, setLookX] = useState(0);
  // The end of the opening overlaps the start of the tour: the card fades in
  // and the jet fades out while the buddy is still on its way.
  const [isCardEarly, setIsCardEarly] = useState(false);
  const [isFlameOut, setIsFlameOut] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  // The newest place, for the last leg of the opening.
  const placeRef = useRef<Place | null | undefined>(undefined);
  useEffect(() => {
    placeRef.current = place;
  }, [place]);

  useEffect(() => {
    const buddy = introRef.current;
    if (!playsIntro.current || buddy === null) {
      return;
    }
    let isCancelled = false;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;
    const floatY = midY - 30;
    // Close enough for the visor to fill the window: it is 23.6 by 14.9 px at scale 1.
    const closeScale = Math.max(window.innerWidth / 23.6, window.innerHeight / 14.9) * 1.4;

    async function play(figure: HTMLDivElement) {
      // Up from under the window, far away and small, then straight at the
      // viewer. It climbs first and grows later, so it reads as coming closer.
      setIntro("in");
      setLookX(0);
      setIsCardEarly(false);
      setIsFlameOut(false);
      const startScale = 0.6;
      const arrive: Keyframe[] = [];
      for (let index = 0; index <= 20; index += 1) {
        const part = index / 20;
        const climb = Math.min(1, part / 0.6);
        const climbEased = 1 - Math.pow(1 - climb, 3);
        const y = window.innerHeight + 70 + (midY - window.innerHeight - 70) * climbEased;
        const x = midX + 46 * Math.sin(part * Math.PI * 2) * (1 - part);
        const scale = startScale * Math.pow(closeScale / startScale, Math.pow(part, 1.8));
        arrive.push({ transform: introTransform(x, y, scale, 10 * Math.sin(part * Math.PI * 2) * (1 - part)) });
      }
      await figure.animate(arrive, { duration: 1700, easing: "cubic-bezier(0.4, 0, 0.25, 1)", fill: "forwards" })
        .finished;
      if (isCancelled) return;

      setIntro("eyes");
      await pause(350);
      if (isCancelled) return;
      setLookX(-1);
      await pause(750);
      if (isCancelled) return;
      setLookX(1);
      await pause(900);
      if (isCancelled) return;
      setLookX(0);
      await pause(550);
      if (isCancelled) return;

      // Pull back. The size shrinks by the same ratio each step, which reads
      // as moving away at a steady speed instead of a zoom that slams to a stop.
      setIntro("back");
      const back: Keyframe[] = [];
      for (let index = 0; index <= 16; index += 1) {
        const part = index / 16;
        const scale = closeScale * Math.pow(FLOAT_SCALE / closeScale, part);
        back.push({ transform: introTransform(midX, midY + (floatY - midY) * part, scale, 0) });
      }
      await figure.animate(back, { duration: 1200, easing: "cubic-bezier(0.45, 0, 0.2, 1)", fill: "forwards" })
        .finished;
      if (isCancelled) return;

      setIntro("hi");
      await pause(1900);
      if (isCancelled) return;

      // To where the buddy stands by the card: its bottom left corner.
      setIntro("go");
      const target = placeRef.current;
      const card = cardRef.current;
      let endX = window.innerWidth - 450;
      let endY = window.innerHeight - 65;
      if (target !== null && target !== undefined && card !== null) {
        endX = target.x - 58 + VISOR_X;
        endY = target.y + card.offsetHeight - 67 + VISOR_Y;
      }
      // The flight: a short wind-up the other way, then an arc that leans into
      // the turn, speeds up, slows down, and shrinks to the size it keeps.
      const lean = endX < midX ? -1 : 1;
      const bendX = (midX + endX) / 2;
      const bendY = Math.min(floatY, endY) - 150;
      const flight: Keyframe[] = [
        { transform: introTransform(midX, floatY, FLOAT_SCALE, 0) },
        { transform: introTransform(midX - lean * 20, floatY + 16, FLOAT_SCALE * 1.05, -lean * 9), offset: 0.16 },
      ];
      for (let index = 1; index <= 16; index += 1) {
        const part = index / 16;
        const eased = part * part * (3 - 2 * part);
        const rest = 1 - eased;
        flight.push({
          transform: introTransform(
            rest * rest * midX + 2 * rest * eased * bendX + eased * eased * endX,
            rest * rest * floatY + 2 * rest * eased * bendY + eased * eased * endY,
            FLOAT_SCALE + (1 - FLOAT_SCALE) * eased,
            lean * 24 * Math.sin(Math.PI * eased),
          ),
          offset: 0.16 + 0.84 * part,
        });
      }
      const landing = figure.animate(flight, { duration: 1500, easing: "linear", fill: "forwards" });
      // The tour starts before the opening ends, so one hands over to the other.
      await pause(800);
      if (isCancelled) return;
      setIsCardEarly(true);
      await pause(250);
      if (isCancelled) return;
      setIsFlameOut(true);
      await landing.finished;
      if (isCancelled) return;
      setIntro("done");
    }

    // A cancelled animation rejects its promise: that is the tour closing.
    play(buddy).catch(() => {});
    return () => {
      isCancelled = true;
      for (const animation of buddy.getAnimations()) {
        animation.cancel();
      }
    };
  }, []);

  const [isLeaving, setIsLeaving] = useState(false);
  const [outro, setOutro] = useState<Outro>("rise");
  // The newest onClose: the page passes a new function on every draw.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const buddy = introRef.current;
    if (!isLeaving || buddy === null) {
      return;
    }
    let isCancelled = false;
    const midX = window.innerWidth / 2;
    const nearY = window.innerHeight / 2 - 10;

    async function leave(figure: HTMLDivElement) {
      setOutro("rise");
      setIsFlameOut(false);
      // From where it stands by the card, in an arc to the middle, growing.
      const target = placeRef.current;
      const card = cardRef.current;
      let fromX = midX;
      let fromY = nearY;
      if (target !== null && target !== undefined && card !== null) {
        fromX = target.x - 58 + VISOR_X;
        fromY = target.y + card.offsetHeight - 67 + VISOR_Y;
      }
      const lean = midX < fromX ? -1 : 1;
      const bendX = (fromX + midX) / 2;
      const bendY = Math.min(fromY, nearY) - 90;
      const rise: Keyframe[] = [];
      for (let index = 0; index <= 16; index += 1) {
        const part = index / 16;
        const eased = part * part * (3 - 2 * part);
        const rest = 1 - eased;
        rise.push({
          opacity: 1,
          transform: introTransform(
            rest * rest * fromX + 2 * rest * eased * bendX + eased * eased * midX,
            rest * rest * fromY + 2 * rest * eased * bendY + eased * eased * nearY,
            1 + (NEAR_SCALE - 1) * eased,
            lean * 16 * Math.sin(Math.PI * eased),
          ),
        });
      }
      await figure.animate(rise, { duration: 1300, easing: "linear", fill: "forwards" }).finished;
      if (isCancelled) return;

      setOutro("info");
      await pause(3800);
      if (isCancelled) return;
      setOutro("bye");
      await pause(1600);
      if (isCancelled) return;

      // Away: a short dip the other way, then a long sweep right and up, off
      // the window. It speeds up as it goes and shrinks by the same ratio each
      // step, so it reads as flying into the distance.
      setOutro("away");
      const endX = window.innerWidth + 140;
      const endY = -160;
      const sweepX = midX + (endX - midX) * 0.6;
      const sweepY = nearY + 70;
      const away: Keyframe[] = [
        { opacity: 1, transform: introTransform(midX, nearY, NEAR_SCALE, 0) },
        { opacity: 1, transform: introTransform(midX - 26, nearY + 12, NEAR_SCALE * 1.04, -9), offset: 0.14 },
      ];
      for (let index = 1; index <= 18; index += 1) {
        const part = index / 18;
        const eased = Math.pow(part, 1.7);
        const rest = 1 - eased;
        away.push({
          opacity: part < 0.7 ? 1 : 1 - (part - 0.7) / 0.3,
          transform: introTransform(
            rest * rest * midX + 2 * rest * eased * sweepX + eased * eased * endX,
            rest * rest * nearY + 2 * rest * eased * sweepY + eased * eased * endY,
            NEAR_SCALE * Math.pow(0.12 / NEAR_SCALE, eased),
            24 * Math.sin(Math.PI * Math.min(1, eased * 1.3)),
          ),
          offset: 0.14 + 0.86 * part,
        });
      }
      await figure.animate(away, { duration: 1900, easing: "linear", fill: "forwards" }).finished;
      if (isCancelled) return;
      closeRef.current();
    }

    // A cancelled animation rejects its promise: that is the tour closing early.
    leave(buddy).catch(() => {});
    return () => {
      isCancelled = true;
      for (const animation of buddy.getAnimations()) {
        animation.cancel();
      }
    };
  }, [isLeaving]);

  // Finish plays the goodbye where the card floats and motion is welcome.
  // Anywhere else, and on the cross or Escape, the tour just closes.
  function finish() {
    const canPlay =
      place !== null &&
      place !== undefined &&
      intro === "done" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canPlay) {
      onClose();
      return;
    }
    setIsLeaving(true);
  }

  const floats = place !== null && place !== undefined;
  const isShown = place !== undefined && (intro === "done" || isCardEarly);

  // A hidden button cannot take the focus, so Next takes it when the card shows.
  useEffect(() => {
    if (isShown) {
      nextRef.current?.focus();
    }
  }, [isShown]);

  return (
    <>
      {(intro !== "done" || isLeaving) && (
        <div
          ref={introRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-50 w-14"
          // Off screen until the first frame of the opening.
          style={{ transform: "translate(-200px, -200px)", transformOrigin: `${VISOR_X}px ${VISOR_Y}px` }}
        >
          <div
            className={
              intro === "hi" || (isLeaving && (outro === "info" || outro === "bye")) ? "buddy-float" : undefined
            }
          >
            <BuddyFigure
              looksUp={false}
              isGreeting={intro === "hi" || (isLeaving && outro === "bye")}
              lookX={lookX}
              isStill={isLeaving ? outro === "rise" || outro === "away" : intro !== "hi"}
              hasFlame={intro !== "eyes"}
              isFlameOut={isFlameOut}
            />
          </div>
          {intro === "hi" && (
            <span className="buddy-pop absolute -top-3 left-[88%] rounded-full rounded-bl-none bg-bright px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-background">
              Hi, I&apos;m Selini!
            </span>
          )}
        </div>
      )}

      {isLeaving && (outro === "info" || outro === "bye") && (
        <p
          key={outro}
          role="status"
          className="buddy-pop fixed z-50 max-w-[15rem] rounded-2xl rounded-bl-none bg-bright px-4 py-2.5 text-sm font-medium text-background shadow-xl"
          style={{ left: "calc(50% + 5.5rem)", bottom: "calc(50% + 3.5rem)" }}
        >
          {outro === "info" ? "If you need more information visit the About page!" : "Bye!"}
        </p>
      )}

      {floats && isShown && !isLeaving && (
        <>
          <div
            aria-hidden="true"
            className="tour-ring tour-card-in pointer-events-none fixed z-30 rounded-md border-2 border-power"
            style={place.ring}
          />
          {place.alsoRing !== null && (
            <div
              aria-hidden="true"
              className="pointer-events-none fixed z-30 rounded-md border-2 border-dashed border-comms"
              style={place.alsoRing}
            />
          )}
        </>
      )}

      <aside
        ref={cardRef}
        aria-label="Guided tour"
        aria-live="polite"
        inert={isLeaving}
        style={{
          transform: floats ? `translate(${place.x}px, ${place.y}px)` : undefined,
          opacity: isLeaving ? 0 : undefined,
          transition: isLeaving ? "opacity 400ms ease-out" : undefined,
        }}
        className={cn(
          "fixed z-40 flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-2 rounded-lg border-2 border-bright bg-panel px-4 py-3 text-sm shadow-xl",
          floats ? "top-0 left-0" : "right-3 bottom-[4.25rem] lg:bottom-3",
          // The fade starts when the card shows, not while it waits for the opening.
          // A floating card has its own fade: tw-animate's also animates the
          // transform from zero, which would slide the card in from the corner.
          isShown && floats && "tour-card-in",
          isShown && !floats && "animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none",
          floats && glides && "transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          !isShown && "invisible",
        )}
      >
        {/* The arrow: a small square turned 45 degrees, half under the border. */}
        {floats && (
          <span
            aria-hidden="true"
            style={{ left: place.arrowX - 7 }}
            className={cn(
              "absolute size-3.5 rotate-45 border-bright bg-panel transition-[left] duration-500 motion-reduce:transition-none",
              place.side === "bottom" ? "-top-[9px] border-t-2 border-l-2" : "-bottom-[9px] border-r-2 border-b-2",
            )}
          />
        )}

        {isShown && intro === "done" && !isLeaving && (
          <Buddy
            stepIndex={stepIndex}
            looksUp={!floats || place.side === "bottom"}
            isOnTop={floats && place.side === "top"}
          />
        )}

        <div className="flex items-baseline gap-3">
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {stepIndex + 1} of {stepCount}
          </p>
          <h2
            key={stepIndex}
            className="animate-in fade-in duration-300 font-medium text-bright motion-reduce:animate-none"
          >
            {step.title}
          </h2>
          <button
            type="button"
            aria-label="Close the tour"
            onClick={onClose}
            // On a narrow screen the padding makes the cross easier to hit with a
            // thumb. The negative margins take the same space back, so nothing moves.
            className="-my-2 -mr-2 ml-auto rounded-sm p-2 text-base leading-none text-muted-foreground hover:text-bright lg:my-0 lg:mr-0 lg:px-1 lg:py-0"
          >
            ×
          </button>
        </div>

        <p
          key={stepIndex}
          className="animate-in fade-in duration-300 leading-relaxed text-foreground motion-reduce:animate-none"
        >
          {step.text}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            // min-h-10 makes the buttons 40 px tall on a narrow screen, big enough for a thumb.
            className="min-h-10 rounded-md bg-neither px-3 py-1 text-bright disabled:opacity-40 lg:min-h-0"
          >
            Back
          </button>
          {/* One button for Next and Finish, so the keyboard focus stays on it
              through the last step. It takes the focus when the tour opens: the
              header button that opened the tour is dimmed and cannot keep it. */}
          <button
            type="button"
            ref={nextRef}
            onClick={isLast ? finish : onNext}
            className="min-h-10 rounded-md bg-bright px-3 py-1 font-medium text-background lg:min-h-0"
          >
            {isLast ? "Finish" : "Next"}
          </button>
          {/* Progress dots. */}
          <span aria-hidden="true" className="ml-auto flex gap-1.5">
            {Array.from({ length: stepCount }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  index === stepIndex ? "w-4 bg-power" : "w-1.5 bg-line",
                )}
              />
            ))}
          </span>
        </div>
      </aside>
    </>
  );
}
