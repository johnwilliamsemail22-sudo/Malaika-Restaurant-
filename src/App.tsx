import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import Lenis from 'lenis'

type Theme = { bg: string; ink: string; muted: string; accent: string }
type Topping = 'Fior di Latte' | 'Prosciutto' | 'Wild Rocket' | 'Spicy Salami' | 'Coast Prawns' | 'Mushrooms' | 'Chilli Honey' | 'Olives'
type Reservation = { name: string; date: string; time: string; guests: string; notes: string }

type Dish = {
  number: string
  kind: 'pizza' | 'burger' | 'seafood' | 'pasta' | 'dessert'
  kicker: string
  title: string
  description: string
  price: string
  asset: string
  theme: Theme
  menu: { name: string; price: string }[]
}

const toppingAssets: Record<Topping, string> = {
  'Fior di Latte': '/images/toppings/fior-di-latte.webp',
  'Prosciutto': '/images/toppings/prosciutto.svg',
  'Wild Rocket': '/images/toppings/wild-rocket.svg',
  'Spicy Salami': '/images/toppings/spicy-salami.svg',
  'Coast Prawns': '/images/toppings/coast-prawns.svg',
  'Mushrooms': '/images/toppings/mushrooms.svg',
  'Chilli Honey': '/images/toppings/chilli-honey.svg',
  'Olives': '/images/toppings/olives.svg',
}
const toppingPrices: Record<Topping, number> = {
  'Fior di Latte': 200, 'Prosciutto': 350, 'Wild Rocket': 120, 'Spicy Salami': 300,
  'Coast Prawns': 450, 'Mushrooms': 150, 'Chilli Honey': 100, 'Olives': 120,
}
const availableToppings = Object.keys(toppingPrices) as Topping[];
const assembledBurgerAsset = '/images/dishes/burger-assembled.webp'

const dishes: Dish[] = [
  { number: '01', kind: 'pizza', kicker: 'Italian favourites', title: 'Wood-Fired Pizza', description: 'Slow-fermented dough, rich tomato, creamy mozzarella and fresh toppings, baked until beautifully golden.', price: 'Ask us', asset: '/images/dishes/pizza-base.webp', theme: { bg: '#FAF6EE', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Margherita', price: 'Ask us' }, { name: 'Spicy Salami', price: 'Ask us' }, { name: 'Coast Prawn', price: 'Ask us' }] },
  { number: '02', kind: 'dessert', kicker: 'Coffee & pastries', title: 'Coffee & Daily Bakes', description: 'A beautifully pulled espresso, creamy cappuccino and fresh pastries for slow Malindi mornings.', price: 'Ask us', asset: '/images/dishes/artisanal-gelato.webp', theme: { bg: '#F1E7D7', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Espresso & Cappuccino', price: 'Ask us' }, { name: 'Iced Coffee', price: 'Ask us' }, { name: 'Fresh pastries', price: 'Daily' }] },
  { number: '03', kind: 'seafood', kicker: 'A little sfizio', title: 'Mozzarella Tomato Samosas', description: 'A much-loved savoury bite with melted mozzarella and tomato — a signature worth coming back for.', price: 'Ask us', asset: '/images/dishes/seafood-salad.webp', theme: { bg: '#E9D6C1', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Mozzarella & tomato samosas', price: 'Ask us' }, { name: 'Piadina Romagnola', price: 'Ask us' }, { name: 'Fresh juices', price: 'Ask us' }] },
  { number: '04', kind: 'pasta', kicker: 'Italian pasta', title: 'Ravioli & Tagliatelle', description: 'Comforting Italian pasta favourites, from delicate ravioli to generous plates of tagliatelle and gnocchi.', price: 'Ask us', asset: '/images/dishes/lobster-ravioli.webp', theme: { bg: '#FAF0D9', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Spinach Ravioli', price: 'Ask us' }, { name: 'Tagliatelle', price: 'Ask us' }, { name: 'Gnocchi al pomodoro', price: 'Ask us' }] },
  { number: '05', kind: 'dessert', kicker: 'Something sweet', title: 'Italian Desserts', description: 'Finish with a little sweetness, from classic tiramisu to a chilled scoop of gelato.', price: 'Ask us', asset: '/images/dishes/artisanal-gelato.webp', theme: { bg: '#E8E4D9', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Classic Tiramisu', price: 'Ask us' }, { name: 'Artisanal Gelato', price: 'Ask us' }, { name: 'Daily sweet bakes', price: 'Daily' }] },
]

const themes = dishes.map((dish) => dish.theme.bg)

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) }
}

function mixColor(a: string, b: string, amount: number) {
  const first = hexToRgb(a); const second = hexToRgb(b)
  const mix = (key: 'r' | 'g' | 'b') => Math.round(first[key] + (second[key] - first[key]) * amount)
  return `rgb(${mix('r')}, ${mix('g')}, ${mix('b')})`
}

function ToppingVisual({ topping }: { topping: Topping }) {
  const slug = topping.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return <span className={`topping-visual topping-visual-${slug}`} aria-hidden="true"><img src={toppingAssets[topping]} alt="" width="512" height="512" loading="lazy" decoding="async" /></span>
}

function App() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const pizzaStageRef = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number | null>(null)
  const lastTouchAtRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pizzaToppings, setPizzaToppings] = useState<{ topping: Topping; id: number; x: number; y: number; flyX: number; flyY: number; size: number; rotation: number }[]>([])
  const [pizzaInstructions, setPizzaInstructions] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [reservation, setReservation] = useState<Reservation>({ name: '', date: '', time: '', guests: '2', notes: '' })

  const activeDish = dishes[activeIndex]
  const orderText = useMemo(() => {
    const additions = pizzaToppings.length ? ` with ${Array.from(new Set(pizzaToppings.map(({ topping }) => topping))).map((topping) => `${topping} (+${toppingPrices[topping]} KSh)`).join(', ')}` : ''
    const extraTotal = Array.from(new Set(pizzaToppings.map((item) => item.topping))).reduce((sum, topping) => sum + toppingPrices[topping], 0)
    const notes = pizzaInstructions.trim() ? ` Special instructions: ${pizzaInstructions.trim()}.` : ''
    return `Hello Lo Sfizio, I would like to enquire about ${activeDish.title}.${notes} Please confirm availability.`
  }, [activeDish.title, pizzaToppings, pizzaInstructions])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    const touchDevice = window.matchMedia('(pointer: coarse)').matches
    if (!media.matches && !touchDevice) {
      const lenis = new Lenis({ duration: 1.35, lerp: .075, smoothWheel: true, syncTouch: false, wheelMultiplier: .8, touchMultiplier: .85 })
      let frame = 0
      const raf = (time: number) => { lenis.raf(time); frame = window.requestAnimationFrame(raf) }
      frame = window.requestAnimationFrame(raf)
      return () => { media.removeEventListener('change', onChange); window.cancelAnimationFrame(frame); lenis.destroy() }
    }
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--page-bg', activeDish.theme.bg)
    document.documentElement.style.setProperty('--page-ink', activeDish.theme.ink)
    document.documentElement.style.setProperty('--page-muted', activeDish.theme.muted)
    document.documentElement.style.setProperty('--page-accent', activeDish.theme.accent)
  }, [activeDish])

  useEffect(() => {
    if (activeIndex !== 1 || reducedMotion) {
      setBurgerOpen(false)
      return
    }
    setBurgerOpen(true)
    const settleTimer = window.setTimeout(() => setBurgerOpen(false), 1550)
    return () => window.clearTimeout(settleTimer)
  }, [activeIndex, reducedMotion])

  const handleCarouselScroll = () => {
    const carousel = carouselRef.current
    if (!carousel || scrollRafRef.current) return
    scrollRafRef.current = window.requestAnimationFrame(() => {
      const slides = Array.from(carousel.children) as HTMLElement[]
      const center = carousel.scrollLeft + carousel.clientWidth / 2
      let closest = 0; let closestDistance = Number.POSITIVE_INFINITY
      slides.forEach((slide, index) => { const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center); if (distance < closestDistance) { closestDistance = distance; closest = index } })
      const progress = Math.max(0, Math.min(dishes.length - 1, carousel.scrollLeft / Math.max(1, carousel.clientWidth * .9)))
      const lower = Math.floor(progress); const upper = Math.min(dishes.length - 1, lower + 1)
      document.documentElement.style.setProperty('--page-bg', mixColor(themes[lower], themes[upper], progress - lower))
      if (closest !== activeIndex) setActiveIndex(closest)
      scrollRafRef.current = null
    })
  }

  const scrollToDish = (index: number) => {
    const carousel = carouselRef.current; const slide = carousel?.children[index] as HTMLElement | undefined
    if (!carousel || !slide) return
    carousel.scrollTo({ left: slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const scrollToReservation = () => document.getElementById('reserve')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  const [lastAddedTopping, setLastAddedTopping] = useState<Topping | null>(null)
  const toggleTopping = (topping: Topping, button: HTMLButtonElement) => {
    const selected = pizzaToppings.some(({ topping: current }) => current === topping)
    if (selected) {
      setPizzaToppings((current) => current.filter(({ topping: currentTopping }) => currentTopping !== topping))
      setLastAddedTopping(null)
      return
    }
    // Each selected ingredient scatters several pieces across the sauce, not one small sticker.
    const spots = [
      { x: 32, y: 31 }, { x: 50, y: 27 }, { x: 66, y: 34 }, { x: 39, y: 44 },
      { x: 57, y: 45 }, { x: 72, y: 50 }, { x: 28, y: 56 }, { x: 46, y: 60 },
      { x: 62, y: 66 }, { x: 38, y: 72 }, { x: 54, y: 37 }, { x: 25, y: 43 },
      { x: 70, y: 39 }, { x: 49, y: 75 }, { x: 34, y: 64 }, { x: 61, y: 53 }
    ]
    const used = new Set(pizzaToppings.map((item) => `${item.x}-${item.y}`))
    const available = spots.filter((spot) => !used.has(`${spot.x}-${spot.y}`))
    const stageRect = pizzaStageRef.current?.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    const newPieces = (available.length ? available : spots).sort(() => Math.random() - .5).slice(0, 4).map((spot, index) => {
      const targetX = stageRect ? stageRect.left + stageRect.width * spot.x / 100 : buttonRect.left + buttonRect.width / 2
      const targetY = stageRect ? stageRect.top + stageRect.height * spot.y / 100 : buttonRect.top
      return {
        topping,
        id: Date.now() + Math.random() + index,
        ...spot,
        flyX: buttonRect.left + buttonRect.width / 2 - targetX,
        flyY: buttonRect.top + buttonRect.height / 2 - targetY,
        size: 0.82 + Math.random() * 0.42,
        rotation: Math.round(Math.random() * 50 - 25)
      }
    })
    setPizzaToppings((current) => [...current, ...newPieces])
    setLastAddedTopping(topping)
  }
  const openWhatsApp = (message = orderText) => {
    const currentY = window.scrollY; const url = `https://wa.me/254791419131?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer'); window.requestAnimationFrame(() => window.scrollTo({ top: currentY, behavior: 'auto' }))
  }
  const updateReservation = (field: keyof Reservation, value: string) => setReservation((current) => ({ ...current, [field]: value }))
  const submitReservation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = `Hello Lo Sfizio, I would like to enquire about a table reservation. Name: ${reservation.name}. Date: ${reservation.date}. Time: ${reservation.time}. Guests: ${reservation.guests}.${reservation.notes ? ` Notes: ${reservation.notes}.` : ''} Please confirm availability.`
    openWhatsApp(message)
  }
  const handleDishPointer = (event: React.PointerEvent<HTMLElement>) => { const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--pointer-x', String((event.clientX - rect.left) / rect.width - .5)); event.currentTarget.style.setProperty('--pointer-y', String((event.clientY - rect.top) / rect.height - .5)) }
  const resetDishPointer = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty('--pointer-x', '0'); event.currentTarget.style.setProperty('--pointer-y', '0') }

  return (
    <main className="site-shell" style={{ backgroundColor: activeDish.theme.bg }}>
      <header className="topbar sf-topbar">
        <a className="wordmark sf-wordmark" href="#top" aria-label="Lo Sfizio home">Lo Sfizio<span>·</span></a>
        <div className="topbar-right"><a className="toplink" href="#menu">Menu</a><a className="top-order sf-order" href="#reserve">Order Now</a><button className="sf-menu-toggle" type="button"       <section className="sf-hero" id="top" aria-labelledby="hero-title">
        <div className="sf-hero-copy">
          <p className="sf-kicker">ITALIAN COFFEE · FOOD · GOOD COMPANY · MALINDI</p>
          <h1 id="hero-title">Lo Sfizio</h1>
          <p className="sf-hero-subtitle">A little taste of Italy, a warm welcome by the coast. Enjoy beautifully made coffee, Italian favourites, fresh pastries and the pleasure of taking your time.</p>
          <div className="sf-hero-actions"><a className="sf-primary-button" href="#menu">Order Now</a><a className="sf-secondary-button" href="#menu">View Menu</a></div>
        </div>
        <div className="sf-hero-photo-card">
          <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1800&q=88" alt="Warm, welcoming café interior" width="1800" height="1200" fetchPriority="high" />
          <div className="sf-float-card sf-float-coffee"><span>☕</span><small>MADE WITH CARE</small><strong>Italian Coffee</strong></div>
          <div className="sf-float-card sf-float-pasta"><span>🍝</span><small>FAVOURITE FLAVOURS</small><strong>Fresh Pasta</strong></div>
        </div>
      </section>

      <section className="intro" aria-labelledby="intro-title">
        <div className="intro-mark" aria-hidden="true">M</div>
        <div className="intro-copy"><p className="eyebrow">A table near the tide</p><h2 id="intro-title">Come for the <em>light.</em><br />Stay for the fire.</h2><p className="intro-body">Lo Sfizio is an open-air restaurant shaped by Malindi's generous rhythms. Fire, tide, and good company set the pace.</p></div>
        <div className="intro-location"><MapPin size={16} strokeWidth={1.5} /><span>Malindi, Kenya<br />Malindi, Kenya</span></div>
      </section>

      <section className="menu-stage" id="menu" aria-labelledby="menu-title">
        <div className="menu-header"><div><p className="eyebrow">The menu / 05 chapters</p><h2 id="menu-title">The <em>menu.</em></h2></div></div>
        <div className="carousel-wrap">
          <div className="dish-carousel" ref={carouselRef} onScroll={handleCarouselScroll} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); scrollToDish(Math.min(dishes.length - 1, activeIndex + 1)) }; if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToDish(Math.max(0, activeIndex - 1)) } }} aria-label="Lo Sfizio menu dishes">
            {dishes.map((dish, index) => (
              <article className={`dish-slide dish-${dish.kind} ${activeIndex === index ? 'is-active' : ''} ${dish.kind === 'burger' && burgerOpen ? 'burger-open' : ''}`} key={dish.number} style={{ '--pointer-x': 0, '--pointer-y': 0 } as React.CSSProperties} onPointerMove={dish.kind === 'burger' || dish.kind === 'seafood' ? handleDishPointer : undefined} onPointerLeave={dish.kind === 'burger' || dish.kind === 'seafood' ? resetDishPointer : undefined}>
                <div className="slide-index">{dish.number} <span>/</span> 05</div>
                <div className="slide-copy"><p className="eyebrow">{dish.kicker}</p><p className="slide-description">{dish.description}</p></div>
                <div className="dish-art" aria-hidden="true">{dish.kind === 'pizza' ? <div className="pizza-stage" ref={pizzaStageRef}><img src={dish.asset} alt="" width="1024" height="1024" fetchPriority="high" decoding="async" /><div className="topping-rain">{pizzaToppings.map(({ topping, id, x, y, flyX, flyY, size, rotation }) => <span className="dropped-topping" key={id} style={{ left: `${x}%`, top: `${y}%`, '--fly-x': `${flyX}px`, '--fly-y': `${flyY}px`, '--piece-scale': size ?? 1, '--piece-rotation': `${rotation ?? 0}deg` } as React.CSSProperties}><ToppingVisual topping={topping} /></span>)}</div></div> : dish.kind === 'burger' ? <><img className="burger-image burger-exploded" src={dish.asset} alt="" width="1024" height="1024" loading="lazy" decoding="async" /><img className="burger-image burger-assembled" src={assembledBurgerAsset} alt="" width="1024" height="1024" loading="lazy" decoding="async" /></> : <img src={dish.asset} alt="" width="1024" height="1024" loading="lazy" decoding="async" />}</div>
                {dish.kind === 'burger' && <div className="burger-interaction"><button type="button" className="micro-toggle" onClick={() => setBurgerOpen((value) => !value)}>{burgerOpen ? 'Close the stack' : 'Open the stack'}</button><div className="burger-inside"><span>Charcoal beef</span><span>Aged cheddar</span><span>Charred onion</span><span>House sauce</span></div></div>}
                {(dish.kind === 'seafood' || dish.kind === 'burger') && <div className="pointer-orb" aria-hidden="true" />}
                {dish.kind === 'pizza' && <div className="pizza-controls"><div className="pizza-controls-heading"><span className="pizza-controls-label">Build your pizza</span><span className="pizza-extra-total">+{Array.from(new Set(pizzaToppings.map((item) => item.topping))).reduce((sum, topping) => sum + toppingPrices[topping], 0)} KSh</span></div><div className="topping-tray">{availableToppings.map((topping) => { const selected = pizzaToppings.some(({ topping: current }) => current === topping); return <button className={`topping-button ${selected ? 'is-selected' : ''}`} type="button" key={topping} aria-pressed={selected} onClick={(event) => toggleTopping(topping, event.currentTarget)}><ToppingVisual topping={topping} /><span className="topping-name">{topping}</span><span className="topping-price">+{toppingPrices[topping]} KSh</span></button> })}</div><textarea className="pizza-instructions" rows={2} value={pizzaInstructions} onChange={(event) => setPizzaInstructions(event.target.value)} placeholder="Special instructions (optional)" aria-label="Special instructions for your pizza" /><span className="pizza-count" aria-live="polite">{lastAddedTopping ? `${lastAddedTopping} added` : pizzaToppings.length ? 'Tap a selected topping to remove it' : 'Choose your toppings'}</span></div>}
                <div className="slide-footer"><div className="dish-nameplate"><span>{dish.kicker}</span><strong>{dish.title}</strong></div><div className="slide-menu-list">{dish.menu.map((item) => <div className="menu-line" key={item.name}><span>{item.name}</span><span>{item.price}</span></div>)}</div><button className="whatsapp-button" type="button" onClick={() => openWhatsApp(dish.kind === 'pizza' ? orderText : `Hello Lo Sfizio, I would like to order ${dish.title}. ${dish.menu.map((item) => `${item.name} (${item.price})`).join('; ')} Please confirm availability.`)}><MessageCircle size={17} strokeWidth={1.8} /> Order now · {dish.price}</button></div>
              </article>
            ))}
          </div>
          <div className="edge-fade edge-fade-left" aria-hidden="true" /><div className="edge-fade edge-fade-right" aria-hidden="true" />
          <div className="carousel-arrows" aria-label="Browse menu dishes"><button className="dish-arrow dish-arrow-prev" type="button" aria-label="Previous dish" disabled={activeIndex === 0} onClick={() => scrollToDish(Math.max(0, activeIndex - 1))}><span aria-hidden="true">‹</span></button><span className="carousel-hint">Explore the menu</span><button className="dish-arrow dish-arrow-next" type="button" aria-label="Next dish" disabled={activeIndex === dishes.length - 1} onClick={() => scrollToDish(Math.min(dishes.length - 1, activeIndex + 1))}><span aria-hidden="true">›</span></button></div>
        </div>
      </section>

      <section className="reservation" id="reserve" aria-labelledby="reserve-title"><div className="reservation-intro"><p className="eyebrow">A seat by the garden</p><h2 id="reserve-title">Reserve<br /><em>your table.</em></h2><p>Tell us when you are coming. We will confirm the best table for your evening on WhatsApp.</p></div><form className="reservation-form" onSubmit={submitReservation}><label>Name<input required value={reservation.name} onChange={(event) => updateReservation('name', event.target.value)} placeholder="Your name" /></label><div className="form-row"><label>Date<input required type="date" value={reservation.date} onChange={(event) => updateReservation('date', event.target.value)} /></label><label>Time<input required type="time" value={reservation.time} onChange={(event) => updateReservation('time', event.target.value)} /></label></div><label>Guests<select value={reservation.guests} onChange={(event) => updateReservation('guests', event.target.value)}>{['1', '2', '3', '4', '5', '6+'].map((count) => <option key={count} value={count}>{count} guest{count === '1' ? '' : 's'}</option>)}</select></label><label>Notes <span>(optional)</span><textarea rows={3} value={reservation.notes} onChange={(event) => updateReservation('notes', event.target.value)} placeholder="A birthday, a favourite table, anything we should know" /></label><button className="whatsapp-button reservation-submit" type="submit"><MessageCircle size={17} strokeWidth={1.8} /> Continue to WhatsApp</button></form></section>

      <section className="closing" aria-labelledby="closing-title"><div className="closing-quote"><p className="eyebrow">After the last course</p><h2 id="closing-title">Leave a little<br /><em>room for wonder.</em></h2></div><div className="closing-aside"><p>Open daily from noon until the tide turns. Walk-ins are welcome; for the best table, send a note ahead.</p><button className="whatsapp-button" type="button" onClick={scrollToReservation}><MessageCircle size={17} strokeWidth={1.8} /> Reserve a table</button></div></section>
      <footer className="footer"><a className="wordmark footer-mark" href="#top"><span>M</span>ALAiKA</a><div className="footer-meta"><span>Silver Sand Road, Malindi</span><span>12° 11′ S / 40° 07′ E</span><span>© 2026 Lo Sfizio</span></div><a className="footer-top" href="#top">Back to top <ArrowDown size={15} /></a></footer>
    </main>
  )
}

export default App
