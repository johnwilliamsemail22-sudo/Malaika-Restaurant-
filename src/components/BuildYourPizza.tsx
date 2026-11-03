import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, Flame, Minus, Plus } from "lucide-react";

const BASE = import.meta.env.BASE_URL
const withBase = (p: string) => (p.startsWith("/") ? (BASE.endsWith("/") ? BASE.slice(0, -1) : BASE) + p : p);

// Vendored assets (no network dependency, instant animations)
const baseImage = `${withBase("/images/pizza/base.webp")}`;
const bakedImage = `${withBase("/images/pizza/baked.webp")}`;
const cheeseMeltImage = `${withBase("/images/pizza/cheese.webp")}`;
const toppingDropUrl = `${withBase("/audio/topping-drop.mp3")}`;
const ovenIgnitionUrl = `${withBase("/audio/oven-ignition.mp3")}`;
const fireVideoUrl = `${withBase("/oven-fire-loop.mp4")}`;

type ToppingId =
  | "chicken" | "corn" | "datterino" | "mozzarella" | "pineapple"
  | "anchovies" | "capers" | "sausage" | "mushrooms" | "olives"
  | "tuna" | "coldcuts" | "importedCheese" | "seafood";

type PlacedTopping = {
  id: number;
  kind: ToppingId;
  batch: number;
  x: number;
  y: number;
  rotation: number;
  width: number;
  shadowX: number;
  shadowY: number;
  dropOffset: number;
};

type Point = { x: number; y: number };
type AddToppingOptions = { point?: Point; origin?: Point; widthScale?: number; count?: number };
type ToppingFlight = {
  id: number;
  kind: ToppingId;
  from: Point;
  to: Point;
  spin: number;
  delay: number;
  batchFinal: boolean;
  placement: PlacedTopping;
};

type Topping = {
  id: ToppingId;
  name: string;
  priceKes: number;
  piecesPerTap: number;
  image: string;
  width: number;
  maxBatches: number;
};

// Every SAPORI extra topping, exact menu prices, each mapped to a sprite.
const TOPPINGS: Topping[] = [
  { id: "chicken", name: "Chicken", priceKes: 300, piecesPerTap: 9, image: `${withBase("/images/pizza/t-chicken.webp")}`, width: 21, maxBatches: 2 },
  { id: "corn", name: "Corn", priceKes: 300, piecesPerTap: 10, image: `${withBase("/images/pizza/t-corn.webp")}`, width: 17, maxBatches: 2 },
  { id: "datterino", name: "Datterino tomatoes", priceKes: 300, piecesPerTap: 8, image: `${withBase("/images/pizza/t-tomato.webp")}`, width: 20, maxBatches: 2 },
  { id: "mozzarella", name: "Mozzarella", priceKes: 300, piecesPerTap: 10, image: `${withBase("/images/pizza/t-mozz-shreds.webp")}`, width: 21, maxBatches: 2 },
  { id: "pineapple", name: "Pineapple", priceKes: 300, piecesPerTap: 9, image: `${withBase("/images/pizza/t-pineapple.webp")}`, width: 19, maxBatches: 2 },
  { id: "anchovies", name: "Anchovies", priceKes: 400, piecesPerTap: 8, image: `${withBase("/images/pizza/t-anchovy.webp")}`, width: 18, maxBatches: 2 },
  { id: "capers", name: "Capers", priceKes: 400, piecesPerTap: 12, image: `${withBase("/images/pizza/t-capers.webp")}`, width: 14, maxBatches: 2 },
  { id: "sausage", name: "Italian sausage", priceKes: 400, piecesPerTap: 10, image: `${withBase("/images/pizza/t-salami.webp")}`, width: 20, maxBatches: 2 },
  { id: "mushrooms", name: "Mushrooms", priceKes: 400, piecesPerTap: 9, image: `${withBase("/images/pizza/t-mushroom.webp")}`, width: 20, maxBatches: 2 },
  { id: "olives", name: "Olives", priceKes: 400, piecesPerTap: 12, image: `${withBase("/images/pizza/t-olive.webp")}`, width: 15, maxBatches: 2 },
  { id: "tuna", name: "Tuna", priceKes: 400, piecesPerTap: 9, image: `${withBase("/images/pizza/t-tuna.webp")}`, width: 20, maxBatches: 2 },
  { id: "coldcuts", name: "Imported cold cuts", priceKes: 700, piecesPerTap: 8, image: `${withBase("/images/pizza/t-prosciutto.webp")}`, width: 23, maxBatches: 2 },
  { id: "importedCheese", name: "Imported cheese", priceKes: 700, piecesPerTap: 9, image: `${withBase("/images/pizza/t-mozz.webp")}`, width: 20, maxBatches: 2 },
  { id: "seafood", name: "Seafood", priceKes: 700, piecesPerTap: 9, image: `${withBase("/images/pizza/t-prawn.webp")}`, width: 20, maxBatches: 2 },
];

const SIZES = [
  { id: "S", priceKes: 900, diameter: "Small" },
  { id: "M", priceKes: 1000, diameter: "Medium" },
  { id: "L", priceKes: 1100, diameter: "Large" },
] as const;

type SizeId = (typeof SIZES)[number]["id"];

type PointerSession = {
  kind: ToppingId;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  dragging: boolean;
  overStage: boolean;
  timer: number;
  lastSprinkleAt: number;
  lastSprinkleX: number;
  lastSprinkleY: number;
  sprinkled: boolean;
};

const SPRING_STIFFNESS = 400;
const SPRING_DAMPING = 25;
const BASE_PRICE_KES = 1600; // tomato sauce + mozzarella base
const BATCH_PIECE_SCALE = 1.35;

function playOneShot(sound: HTMLAudioElement | null) {
  if (!sound) return;
  sound.pause();
  sound.currentTime = 0;
  void sound.play().catch(() => undefined);
}

function playNextOneShot(pool: HTMLAudioElement[], cursor: { current: number }) {
  if (pool.length === 0) return;
  const sound = pool[cursor.current % pool.length];
  if (!sound) return;
  cursor.current = (cursor.current + 1) % pool.length;
  playOneShot(sound);
}

function formatPrice(shillings: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(shillings)}`;
}

let placementIdSequence = 0;

function makePlacement(kind: ToppingId, x: number, y: number, batch = 0, widthScale = 1, dropOffset = 42): PlacedTopping {
  const topping = TOPPINGS.find((item) => item.id === kind)!;
  return {
    id: ++placementIdSequence,
    kind,
    batch,
    x,
    y,
    rotation: Math.round(Math.random() * 30 - 15),
    width: topping.width * (0.9 + Math.random() * 0.2) * widthScale,
    shadowX: Math.round(Math.random() * 2),
    shadowY: 2 + Math.round(Math.random() * 4),
    dropOffset,
  };
}

function randomSaucePoint() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * 31;
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

function randomSauceScatter(count: number) {
  const rotation = Math.random() * Math.PI * 2;
  const sector = (Math.PI * 2) / count;
  return Array.from({ length: count }, (_, index) => {
    const angle = rotation + sector * index + (Math.random() - 0.5) * sector * 0.28;
    const radius = Math.sqrt(0.08 + Math.random() * 0.84) * 31;
    return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  });
}

function isPointOnPizza(stage: HTMLDivElement | null, clientX: number, clientY: number) {
  if (!stage) return false;
  const rect = stage.getBoundingClientRect();
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  return Math.hypot((nx - 0.5) * 2, (ny - 0.5) * 2) <= 0.91;
}

function jigglePizza(stage: HTMLDivElement | null) {
  if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stage.animate(
    [
      { transform: "translateZ(0) scale(1)" },
      { transform: "translateZ(0) scale(1.035)" },
      { transform: "translateZ(0) scale(.99)" },
      { transform: "translateZ(0) scale(1)" },
    ],
    { duration: 260, easing: "cubic-bezier(.2,.8,.35,1.3)" },
  );
}

// A landed piece: drops in from above with a damped spring, squash on landing.
function DroppedIngredient({ placement, baked }: { placement: PlacedTopping; baked: boolean }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const topping = TOPPINGS.find((item) => item.id === placement.kind)!;

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      image.style.transform = `translate3d(-50%, -50%, 0) rotate(${placement.rotation}deg)`;
      image.style.opacity = "1";
      return;
    }

    const started = performance.now();
    let previous = started;
    let displacement = -placement.dropOffset;
    let velocity = 0;
    let frame = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 1 / 30);
      previous = now;
      velocity += (-SPRING_STIFFNESS * displacement - SPRING_DAMPING * velocity) * delta;
      displacement += velocity * delta;
      const settled = Math.abs(displacement) < 0.12 && Math.abs(velocity) < 0.55;
      if (settled) displacement = 0;
      const squash = settled ? 1 : 1 - Math.min(0.14, Math.abs(displacement) / 300);
      image.style.transform = `translate3d(-50%, -50%, 0) translate3d(0, ${displacement.toFixed(2)}px, 0) scale(${squash.toFixed(3)}) rotate(${placement.rotation}deg)`;
      image.style.opacity = String(Math.min(1, (now - started) / 100));
      if (!settled) frame = requestAnimationFrame(animate);
      else image.style.opacity = "1";
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [placement]);

  return (
    <img
      ref={imageRef}
      src={baked && placement.kind !== "mozzarella" ? topping.image.replace(".webp", "-c.webp") : topping.image}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pizza-builder__dropped-ingredient"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        filter: `drop-shadow(${placement.shadowX}px ${placement.shadowY}px 3px rgb(0 0 0 / .36))`,
        transform: `translate3d(-50%, -50%, 0) translate3d(0, -${placement.dropOffset}px, 0) scale(.86) rotate(${placement.rotation}deg)`,
        opacity: 0,
      }}
    />
  );
}

// A piece in flight: arcs from the topping button onto the pizza.
function FlyingTopping({ flight, onLand }: { flight: ToppingFlight; onLand: (id: number) => void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const onLandRef = useRef(onLand);
  onLandRef.current = onLand;
  const topping = TOPPINGS.find((item) => item.id === flight.kind)!;

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onLandRef.current(flight.id);
      return;
    }

    let started = 0;
    const duration = 350;
    const arcHeight = 40 + Math.random() * 18;
    const sideArc = (Math.random() - 0.5) * 22;
    let frame = 0;
    let timer = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const spring = 1 - Math.exp(-7.4 * progress) * Math.cos(8.4 * progress);
      const travel = Math.max(0, Math.min(1.08, spring));
      const arc = Math.sin(Math.PI * progress);
      const x = flight.from.x + (flight.to.x - flight.from.x) * travel + sideArc * arc;
      const y = flight.from.y + (flight.to.y - flight.from.y) * travel - arcHeight * arc;
      const scale = progress === 1 ? 1 : 0.18 + 0.82 * progress + 0.62 * arc;
      const rotation =
        progress === 1
          ? flight.placement.rotation
          : flight.spin * arc + flight.placement.rotation * progress;
      image.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(1)}deg)`;
      image.style.opacity = String(Math.min(1, progress * 5));

      if (progress < 1) frame = requestAnimationFrame(animate);
      else onLandRef.current(flight.id);
    };

    const start = () => {
      started = performance.now();
      frame = requestAnimationFrame(animate);
    };
    if (flight.delay > 0) timer = window.setTimeout(start, flight.delay);
    else start();
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [flight]);

  return (
    <img
      ref={imageRef}
      src={topping.image}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pizza-builder__flying-topping"
      style={{
        transform: `translate3d(${flight.from.x}px, ${flight.from.y}px, 0) translate(-50%, -50%) scale(.18)`,
      }}
    />
  );
}

// A batch lifting off (remove): rises and fades, then disappears.
function LiftingTopping({ placement, onGone }: { placement: PlacedTopping; onGone: (id: number) => void }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const onGoneRef = useRef(onGone);
  onGoneRef.current = onGone;
  const topping = TOPPINGS.find((item) => item.id === placement.kind)!;

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onGoneRef.current(placement.id);
      return;
    }
    const animation = image.animate(
      [
        { opacity: 1, transform: `translate3d(-50%, -50%, 0) rotate(${placement.rotation}deg) scale(1)` },
        { opacity: 0, transform: `translate3d(-50%, -85%, 0) rotate(${placement.rotation + 24}deg) scale(1.18)` },
      ],
      { duration: 260, easing: "cubic-bezier(.4,0,.6,1)" },
    );
    animation.onfinish = () => onGoneRef.current(placement.id);
    return () => animation.cancel();
  }, [placement]);

  return (
    <img
      ref={imageRef}
      src={topping.image}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pizza-builder__dropped-ingredient"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        filter: `drop-shadow(${placement.shadowX}px ${placement.shadowY}px 3px rgb(0 0 0 / .36))`,
      }}
    />
  );
}

export default function BuildYourPizza({
  onAddToCart,
  onClose,
}: {
  onAddToCart: (order: { name: string; total: number; details: string }) => void;
  onClose: () => void;
}) {
  const [size, setSize] = useState<SizeId>("L");
  const [placed, setPlaced] = useState<PlacedTopping[]>([]);
  const [flights, setFlights] = useState<ToppingFlight[]>([]);
  const [lifting, setLifting] = useState<PlacedTopping[]>([]);
  const [visiblePrice, setVisiblePrice] = useState(BASE_PRICE_KES);
  const [firing, setFiring] = useState(false);
  const [fired, setFired] = useState(false);
  const [baked, setBaked] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [dragKind, setDragKind] = useState<ToppingId | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchCounters, setBatchCounters] = useState<Record<ToppingId, number>>(
    TOPPINGS.reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {} as Record<ToppingId, number>),
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const fireVideoRef = useRef<HTMLVideoElement>(null);
  const dragImageRef = useRef<HTMLImageElement>(null);
  const pointerRef = useRef<PointerSession | null>(null);
  const orderTimerRef = useRef<number | null>(null);
  const toppingAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const toppingAudioCursorRef = useRef(0);
  const ignitionAudioRef = useRef<HTMLAudioElement | null>(null);
  const displayedPriceRef = useRef(BASE_PRICE_KES);
  const addToppingRef = useRef<(kind: ToppingId, options?: AddToppingOptions) => void>(() => undefined);

  useEffect(() => {
    const dropSounds = Array.from({ length: 3 }, () => {
      const sound = new Audio(toppingDropUrl);
      sound.preload = "auto";
      sound.volume = 0.52;
      return sound;
    });
    const ignitionSound = new Audio(ovenIgnitionUrl);
    ignitionSound.preload = "auto";
    ignitionSound.volume = 0.68;
    toppingAudioPoolRef.current = dropSounds;
    ignitionAudioRef.current = ignitionSound;
    return () => {
      dropSounds.forEach((sound) => sound.pause());
      ignitionSound.pause();
      toppingAudioPoolRef.current = [];
      ignitionAudioRef.current = null;
    };
  }, []);

  const basePrice = SIZES.find((candidate) => candidate.id === size)!.priceKes;
  const totalPrice =
    basePrice +
    TOPPINGS.reduce((sum, topping) => {
      const batches = batchCounters[topping.id] ?? 0;
      return sum + batches * topping.priceKes;
    }, 0);

  const counts = TOPPINGS.reduce<Record<ToppingId, number>>(
    (result, topping) => {
      result[topping.id] = placed.filter((piece) => piece.kind === topping.id).length;
      return result;
    },
    TOPPINGS.reduce((acc, t) => ({ ...acc, [t.id]: 0 }), {} as Record<ToppingId, number>),
  );

  const addTopping = (kind: ToppingId, options: AddToppingOptions = {}) => {
    if (firing) return;
    if (fired) {
      setFired(false);
      setBaked(false);
    }
    const topping = TOPPINGS.find((item) => item.id === kind)!;
    const currentBatch = batchCounters[kind] ?? 0;
    if (currentBatch >= topping.maxBatches) return;

    const count = options.count ?? 1;
    const points = count > 1 ? randomSauceScatter(count) : [options.point ?? randomSaucePoint()];
    const widthScale = options.widthScale ?? (count > 1 ? BATCH_PIECE_SCALE : 1);
    const placements = points.map((point) => makePlacement(kind, point.x, point.y, currentBatch, widthScale, options.origin ? 7 : 42));
    const stageRect = stageRef.current?.getBoundingClientRect();
    const origin = options.origin;
    setBatchCounters((current) => ({ ...current, [kind]: currentBatch + 1 }));

    if (origin && stageRect) {
      const burst = placements.flatMap((placement, index) => {
        const point = points[index];
        if (!point) return [];
        return [
          {
            id: placement.id,
            kind,
            from: origin,
            to: {
              x: stageRect.left + (stageRect.width * point.x) / 100,
              y: stageRect.top + (stageRect.height * point.y) / 100,
            },
            spin: (Math.random() < 0.5 ? -1 : 1) * (45 + Math.random() * 45),
            delay: index * 48 + Math.random() * 24,
            batchFinal: index === placements.length - 1,
            placement,
          },
        ];
      });
      setFlights((current) => [...current, ...burst]);
      return;
    }

    setPlaced((current) => [...current, ...placements]);
    jigglePizza(stageRef.current);
  };
  addToppingRef.current = addTopping;

  // Remove the most recent batch of a topping: pieces lift off.
  const removeBatch = (kind: ToppingId) => {
    if (firing || flights.length > 0) return;
    const currentBatch = batchCounters[kind] ?? 0;
    if (currentBatch <= 0) return;
    setBatchCounters((current) => ({ ...current, [kind]: currentBatch - 1 }));
    const pieces = placed.filter((piece) => piece.kind === kind && piece.batch === currentBatch - 1);
    if (pieces.length) {
      setLifting((current) => [...current, ...pieces]);
      setPlaced((current) => current.filter((piece) => !pieces.includes(piece)));
      if (fired) {
        setFired(false);
        setBaked(false);
      }
    }
  };

  const distinctToppings = TOPPINGS.filter((topping) => (batchCounters[topping.id] ?? 0) > 0).length;
  const helperText =
    distinctToppings >= 3
      ? "Looking good. Fire it"
      : (batchCounters.mozzarella ?? 0) >= 2
        ? "Extra cheese"
        : distinctToppings > 0
          ? "A little more? Drag or tap to add"
          : "Tap a topping or press and drag it onto the pizza";

  useEffect(() => {
    let frame = 0;
    const from = displayedPriceRef.current;
    const start = performance.now();
    const duration = 460;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round(from + (totalPrice - from) * eased);
      displayedPriceRef.current = value;
      setVisiblePrice(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [totalPrice]);

  useEffect(() => {
    const video = fireVideoRef.current;
    if (!video) return;
    if (firing) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
  }, [firing]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = pointerRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      current.x = event.clientX;
      current.y = event.clientY;
      if (!current.dragging) {
        const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
        if (distance > 12) {
          window.clearTimeout(current.timer);
          pointerRef.current = null;
        }
        return;
      }

      event.preventDefault();
      if (dragImageRef.current) {
        dragImageRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      }
      const over = isPointOnPizza(stageRef.current, event.clientX, event.clientY);
      if (over !== current.overStage) {
        current.overStage = over;
        setDragOver(over);
      }

      if (current.kind === "mozzarella" && over) {
        const now = performance.now();
        const distance = Math.hypot(event.clientX - current.lastSprinkleX, event.clientY - current.lastSprinkleY);
        if (!current.sprinkled || (now - current.lastSprinkleAt >= 125 && distance >= 12)) {
          const rect = stageRef.current?.getBoundingClientRect();
          if (rect) {
            addToppingRef.current(current.kind, {
              point: {
                x: ((event.clientX - rect.left) / rect.width) * 100,
                y: ((event.clientY - rect.top) / rect.height) * 100,
              },
              widthScale: 0.58,
            });
            current.lastSprinkleAt = now;
            current.lastSprinkleX = event.clientX;
            current.lastSprinkleY = event.clientY;
            current.sprinkled = true;
          }
        }
      }
    };

    const finish = (event: PointerEvent) => {
      const current = pointerRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      window.clearTimeout(current.timer);
      pointerRef.current = null;
      if (current.dragging && isPointOnPizza(stageRef.current, event.clientX, event.clientY)) {
        const rect = stageRef.current!.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        if (current.kind !== "mozzarella" || !current.sprinkled) {
          addToppingRef.current(current.kind, { point: { x, y } });
        }
        playNextOneShot(toppingAudioPoolRef.current, toppingAudioCursorRef);
        if (current.kind === "mozzarella") window.setTimeout(() => navigator.vibrate?.(10), 0);
      } else if (!current.dragging) {
        const topping = TOPPINGS.find((item) => item.id === current.kind)!;
        addToppingRef.current(current.kind, {
          origin: { x: current.originX, y: current.originY },
          count: topping.piecesPerTap,
        });
      }
      setDragKind(null);
      setDragOver(false);
    };

    const cancel = (event: PointerEvent) => {
      const current = pointerRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      window.clearTimeout(current.timer);
      pointerRef.current = null;
      setDragKind(null);
      setDragOver(false);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      if (pointerRef.current) window.clearTimeout(pointerRef.current.timer);
    };
  }, []);

  useEffect(() => {
    if (!firing) return;
    setCountdown(8);
    let remaining = 8;
    orderTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 4) setBaked(true);
      if (remaining <= 0) {
        if (orderTimerRef.current !== null) window.clearInterval(orderTimerRef.current);
        orderTimerRef.current = null;
        // Lock in the baked state before the oven/fire overlay disappears.
        setBaked(true);
        setFiring(false);
        setFired(true);
      }
    }, 1000);
    return () => {
      if (orderTimerRef.current !== null) window.clearInterval(orderTimerRef.current);
      orderTimerRef.current = null;
    };
  }, [firing]);

  useEffect(
    () => () => {
      if (orderTimerRef.current !== null) window.clearInterval(orderTimerRef.current);
    },
    [],
  );

  const startPress = (kind: ToppingId, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const topping = TOPPINGS.find((item) => item.id === kind)!;
    if ((batchCounters[kind] ?? 0) >= topping.maxBatches) return;
    const orb = event.currentTarget.querySelector(".pizza-builder__topping-orb")?.getBoundingClientRect();
    const current: PointerSession = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: orb ? orb.left + orb.width / 2 : event.clientX,
      originY: orb ? orb.top + orb.height / 2 : event.clientY,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      overStage: false,
      timer: 0,
      lastSprinkleAt: 0,
      lastSprinkleX: event.clientX,
      lastSprinkleY: event.clientY,
      sprinkled: false,
    };
    current.timer = window.setTimeout(() => {
      if (pointerRef.current !== current) return;
      current.dragging = true;
      setDragKind(kind);
      if (dragImageRef.current) {
        dragImageRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      }
      if (typeof navigator !== "undefined") navigator.vibrate?.(12);
    }, 170);
    pointerRef.current = current;
  };

  const beginFire = () => {
    if (firing || fired || flights.length > 0) return;
    setFired(false);
    playOneShot(ignitionAudioRef.current);
    setFiring(true);
  };

  const toppingSummary = TOPPINGS.filter((topping) => (batchCounters[topping.id] ?? 0) > 0)
    .map((topping) => `${topping.name} x${batchCounters[topping.id]}`)
    .join(", ");
  const placeCustomPizzaOrder = () => {
    const description = `${size} SAPORI custom pizza${toppingSummary ? " — " + toppingSummary : ""}`;
    onAddToCart({ name: description, total: totalPrice, details: toppingSummary });
  };
  const status = firing
    ? "Wood fire, 8 seconds"
    : fired
      ? "Oven's hot. Your pizza is ready to send."
      : helperText;

  return (
    <section id="build" className="pizza-builder" data-firing={firing} data-drop-ready={dragOver}>
      <div className="pizza-builder__shell">
        <header className="pizza-builder__header">
          <button type="button" className="pizza-builder__back" aria-label="Back to the menu" onClick={onClose}>
            <ArrowLeft size={21} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <h2 className="pizza-builder__title">Build your SAPORI pizza</h2>
          <div className="pizza-builder__sizes" role="group" aria-label="Choose pizza size">
            {SIZES.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                disabled={firing || flights.length > 0}
                aria-pressed={size === candidate.id}
                aria-label={`${candidate.diameter} size`}
                onClick={() => {
                  setSize(candidate.id);
                  setFired(false);
                  setBaked(false);
                }}
                className="pizza-builder__size"
                data-active={size === candidate.id}
              >
                {candidate.id}
              </button>
            ))}
          </div>
        </header>

        <div className="pizza-builder__stage-area">
          <div className="pizza-builder__stage-frame" data-size={size}>
            <div className="pizza-builder__fire-ring" aria-hidden="true" />
            <div ref={stageRef} className="pizza-builder__pizza-stage" data-drop-ready={dragOver} data-baked={baked} data-finished={fired}>
              <img
                src={baked ? bakedImage : baseImage}
                alt="Pizza dough spread with glossy tomato sauce"
                className="pizza-builder__base"
                data-baked={baked}
                draggable={false}
              />
              {baked && (
                <img src={cheeseMeltImage} alt="" aria-hidden="true" draggable={false} className="pizza-builder__cheese-melt" />
              )}
              {placed
                .filter((piece) => !flights.some((flight) => flight.id === piece.id))
                .map((piece) => (
                  <DroppedIngredient key={piece.id} placement={piece} baked={baked} />
                ))}
              {firing && (
                <div className="pizza-builder__countdown" aria-live="polite" aria-label={`${countdown} seconds remaining`}>
                  <span className="pizza-builder__countdown-ring" />
                  <span>{countdown}</span>
                </div>
              )}
            </div>
          </div>
          <p className="pizza-builder__status" aria-live="polite">
            {firing && <span className="pizza-builder__status-dot" aria-hidden="true" />}
            {status}
          </p>
        </div>

        <div className="pizza-builder__dock">
          <div className="pizza-builder__dock-heading">
            <span className="pizza-builder__dock-title">Toppings</span>
            <span className="pizza-builder__dock-hint">Tap a handful · drag one · − to remove</span>
          </div>
          <div className="pizza-builder__topping-row" aria-label="Pizza toppings">
            {TOPPINGS.map((topping) => {
              const batches = batchCounters[topping.id] ?? 0;
              const maxed = batches >= topping.maxBatches;
              return (
                <div className="pizza-builder__topping-cell" key={topping.id}>
                  <button
                    type="button"
                    disabled={firing || maxed}
                    aria-label={`${topping.name}, ${formatPrice(topping.priceKes)}. Tap to add a handful, or hold and drag to place one.${batches ? ` Added ${batches}.` : ""}`}
                    aria-pressed={batches > 0}
                    className="pizza-builder__topping"
                    data-maxed={maxed}
                    onPointerDown={(event) => startPress(topping.id, event)}
                    onContextMenu={(event) => event.preventDefault()}
                    onClick={(event) => {
                      if (event.detail !== 0) return;
                      const orb = event.currentTarget.querySelector(".pizza-builder__topping-orb")?.getBoundingClientRect();
                      const origin = orb ? { x: orb.left + orb.width / 2, y: orb.top + orb.height / 2 } : undefined;
                      addTopping(topping.id, origin ? { origin, count: topping.piecesPerTap } : { count: topping.piecesPerTap });
                    }}
                  >
                    <span className="pizza-builder__topping-orb" data-picked={batches > 0}>
                      <img src={topping.image} alt="" draggable={false} />
                      {batches > 0 && <span className="pizza-builder__count-badge">+{batches}</span>}
                      {batches === 0 && (
                        <span className="pizza-builder__add-mark">
                          <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="pizza-builder__topping-name">{topping.name}</span>
                    <span className="pizza-builder__topping-price">
                      <span>+{formatPrice(topping.priceKes)}</span>
                      <span className="pizza-builder__topping-batch">
                        {topping.piecesPerTap} pcs · tap {batches}/{topping.maxBatches}
                      </span>
                    </span>
                  </button>
                  {batches > 0 && (
                    <button
                      type="button"
                      className="pizza-builder__remove-batch"
                      aria-label={`Remove one handful of ${topping.name}`}
                      disabled={firing}
                      onClick={() => removeBatch(topping.id)}
                    >
                      <Minus size={13} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <footer className="pizza-builder__footer">
          {firing ? (
            <button type="button" className="pizza-builder__fire-button" disabled aria-live="polite">
              <span className="pizza-builder__button-label">
                <span className="pizza-builder__spinner" />
                Firing at 480°
              </span>
              <span className="pizza-builder__button-price">{formatPrice(visiblePrice)}</span>
            </button>
          ) : fired ? (
            <button type="button" onClick={placeCustomPizzaOrder} className="pizza-builder__fire-button">
              <span className="pizza-builder__button-label">
                <Flame size={18} strokeWidth={2.3} aria-hidden="true" />
                Send to kitchen
              </span>
              <span className="pizza-builder__button-price">{formatPrice(visiblePrice)}</span>
            </button>
          ) : (
            <button type="button" className="pizza-builder__fire-button" onClick={beginFire} disabled={flights.length > 0}>
              <span className="pizza-builder__button-label">
                <Flame size={18} strokeWidth={2.3} aria-hidden="true" />
                Fire it
              </span>
              <span className="pizza-builder__button-price">{formatPrice(visiblePrice)}</span>
            </button>
          )}
          <span className="pizza-builder__footer-note">Made for the wood fire. Finished your way.</span>
        </footer>
      </div>

      <div className="pizza-builder__fire-backdrop" aria-hidden="true">
        <video
          ref={fireVideoRef}
          className="pizza-builder__fire-video"
          src={fireVideoUrl}
          autoPlay={firing}
          loop
          muted
          playsInline
          preload={firing ? "auto" : "none"}
        />
      </div>
      {flights.map((flight) => (
        <FlyingTopping
          key={flight.id}
          flight={flight}
          onLand={(id) => {
            setFlights((current) => current.filter((item) => item.id !== id));
            setPlaced((current) => [...current, flight.placement]);
            playNextOneShot(toppingAudioPoolRef.current, toppingAudioCursorRef);
            if (flight.batchFinal) jigglePizza(stageRef.current);
          }}
        />
      ))}
      {lifting.map((piece) => (
        <LiftingTopping
          key={piece.id}
          placement={piece}
          onGone={(id) => setLifting((current) => current.filter((item) => item.id !== id))}
        />
      ))}

      {dragKind && (
        <img
          ref={dragImageRef}
          src={TOPPINGS.find((topping) => topping.id === dragKind)!.image}
          className="pizza-builder__drag-preview"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
    </section>
  );
}
