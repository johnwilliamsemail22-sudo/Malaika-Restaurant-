import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import Lenis from 'lenis'

type Theme = { bg: string; ink: string; muted: string; accent: string }
type Pointer = { x: number; y: number }
type Topping = 'Fresh Basil' | 'Fior di Latte' | 'Extra Chilies'
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

const imageBase = '/manus-storage/async-images/jHaGQJhk20LEUCvS76pbcv/'
const toppingAssets: Record<Topping, string> = {
  'Fresh Basil': '/manus-storage/async-images/N3oDpMFNXQzzlicNpiugGf/image-1.webp',
  'Fior di Latte': '/manus-storage/async-images/N3oDpMFNXQzzlicNpiugGf/image-2.webp',
  'Extra Chilies': '/manus-storage/async-images/N3oDpMFNXQzzlicNpiugGf/image-3.webp',
}

const dishes: Dish[] = [
  { number: '01', kind: 'pizza', kicker: 'Malaika wood-fired', title: 'Margherita Malaika', description: 'Well-rested dough, rich tomato, and a hot open flame doing what it does best.', price: '1,400 KSh', asset: `${imageBase}image-1.webp`, theme: { bg: '#F9F8F6', ink: '#3E2723', muted: '#80746F', accent: '#D96B43' }, menu: [{ name: 'Sauce + sea salt', price: 'included' }, { name: 'Fresh basil', price: '+ 120 KSh' }, { name: 'Fior di Latte', price: '+ 250 KSh' }] },
  { number: '02', kind: 'burger', kicker: 'Charcoal & brioche', title: 'The Malaika Burger', description: 'Grilled beef, bright char, and the kind of brioche that makes you slow down for another bite.', price: '1,650 KSh', asset: `${imageBase}image-2.webp`, theme: { bg: '#0E4C5E', ink: '#F6F0E5', muted: '#A7C0BE', accent: '#D8A46A' }, menu: [{ name: 'Grilled beef + brioche', price: '1,650 KSh' }, { name: 'Charred onion', price: 'included' }, { name: 'Malaika fries', price: '+ 300 KSh' }] },
  { number: '03', kind: 'seafood', kicker: 'Indian Ocean catch', title: 'Seafood Salad', description: 'Citrus, herbs, and the bright edge of the sea, made for long afternoons by the coast.', price: '1,200 KSh', asset: `${imageBase}image-3.webp`, theme: { bg: '#D96B43', ink: '#FFF6EA', muted: '#F2C3A7', accent: '#0E4C5E' }, menu: [{ name: 'Seafood Salad', price: '1,200 KSh' }, { name: 'Grilled Octopus', price: '2,400 KSh' }, { name: 'Citrus catch of the day', price: 'market' }] },
  { number: '04', kind: 'pasta', kicker: 'Handmade pasta', title: 'Lobster Ravioli', description: 'Silk-soft pasta, lobster, and cashew: generous, coastal, and quietly indulgent.', price: '2,600 KSh', asset: `${imageBase}image-4.webp`, theme: { bg: '#FCF3CF', ink: '#3E2723', muted: '#8E8171', accent: '#D96B43' }, menu: [{ name: 'Lobster Ravioli', price: '2,600 KSh' }, { name: 'Prawn Pasta with Cashewnut', price: '2,200 KSh' }, { name: 'Brown butter + lime', price: 'included' }] },
  { number: '05', kind: 'dessert', kicker: 'Last light', title: 'Artisanal Gelato', description: 'A chilled scoop, a soft coffee finish, and the table not quite ready to leave.', price: '600 KSh', asset: `${imageBase}image-5.webp`, theme: { bg: '#2C3E50', ink: '#F7F1E7', muted: '#B7C0C5', accent: '#FCF3CF' }, menu: [{ name: 'Artisanal Gelato', price: '600 KSh' }, { name: 'Classic Tiramisu', price: '900 KSh' }, { name: 'Espresso', price: '350 KSh' }] },
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
  return <span className="topping-visual" aria-hidden="true"><img src={toppingAssets[topping]} alt="" /></span>
}

function App() {
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pizzaToppings, setPizzaToppings] = useState<{ topping: Topping; id: number }[]>([])
  const [pointer, setPointer] = useState<Pointer>({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [reservation, setReservation] = useState<Reservation>({ name: '', date: '', time: '', guests: '2', notes: '' })

  const activeDish = dishes[activeIndex]
  const orderText = useMemo(() => {
    const additions = pizzaToppings.length ? ` with ${pizzaToppings.map(({ topping }) => topping).join(', ')}` : ''
    return `Hello Malaika, I would like to order ${activeDish.title}${additions}. Please confirm availability.`
  }, [activeDish.title, pizzaToppings])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    if (!media.matches) {
      const lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: true })
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
  const addTopping = (topping: Topping) => { setPizzaToppings((current) => [...current, { topping, id: Date.now() + Math.random() }]) }
  const openWhatsApp = (message = orderText) => {
    const currentY = window.scrollY; const url = `https://wa.me/254700000000?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer'); window.requestAnimationFrame(() => window.scrollTo({ top: currentY, behavior: 'auto' }))
  }
  const updateReservation = (field: keyof Reservation, value: string) => setReservation((current) => ({ ...current, [field]: value }))
  const submitReservation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = `Hello Malaika, I would like to reserve a table. Name: ${reservation.name}. Date: ${reservation.date}. Time: ${reservation.time}. Guests: ${reservation.guests}.${reservation.notes ? ` Notes: ${reservation.notes}.` : ''} Please confirm availability.`
    openWhatsApp(message)
  }
  const handleDishPointer = (event: React.PointerEvent<HTMLElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setPointer({ x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 }) }

  return (
    <main className="site-shell" style={{ backgroundColor: activeDish.theme.bg }}>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Malaika home"><span>M</span>ALAiKA</a>
        <div className="topbar-right"><a className="toplink" href="#menu">The menu</a><button className="top-order liquid-glass" type="button" onClick={scrollToReservation}>Reserve a table</button></div>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <img className="hero-image" src="/images/malaika-room.webp" alt="The leafy open-air dining room at Malaika Restaurant in Malindi" />
        <div className="hero-scrim" />
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow"><span className="eyebrow-line" /> Malindi, Kenya</p>
          <h1 id="hero-title">The coast,<br /><em>at its best.</em></h1>
          <div className="hero-bottomline"><p>Wood fire, Indian Ocean produce,<br />and long tables on Silver Sand Road.</p><div className="hero-actions"><a className="hero-cta hero-cta-light" href="#menu">See menu <ArrowDown size={15} strokeWidth={1.8} /></a><button className="hero-cta liquid-glass" type="button" onClick={scrollToReservation}>Reserve a table <ArrowDown size={15} strokeWidth={1.8} /></button></div></div>
        </div>
        <div className="hero-index" aria-hidden="true">01 <span>/</span> 05</div>
      </section>

      <section className="intro" aria-labelledby="intro-title">
        <div className="intro-mark" aria-hidden="true">M</div>
        <div className="intro-copy"><p className="eyebrow">A table near the tide</p><h2 id="intro-title">Come for the <em>light.</em><br />Stay for the fire.</h2><p className="intro-body">Malaika is an open-air restaurant shaped by Malindi's generous rhythms. Fire, tide, and good company set the pace.</p></div>
        <div className="intro-location"><MapPin size={16} strokeWidth={1.5} /><span>Silver Sand Road<br />Malindi, Kenya</span></div>
      </section>

      <section className="menu-stage" id="menu" aria-labelledby="menu-title">
        <div className="menu-header"><div><p className="eyebrow">The menu / 05 chapters</p><h2 id="menu-title">The <em>menu.</em></h2></div></div>
        <div className="carousel-wrap">
          <div className="dish-carousel" ref={carouselRef} onScroll={handleCarouselScroll} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); scrollToDish(Math.min(dishes.length - 1, activeIndex + 1)) }; if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToDish(Math.max(0, activeIndex - 1)) } }} aria-label="Malaika menu dishes">
            {dishes.map((dish, index) => (
              <article className={`dish-slide dish-${dish.kind} ${activeIndex === index ? 'is-active' : ''} ${dish.kind === 'burger' && burgerOpen ? 'burger-open' : ''}`} key={dish.number} style={{ '--pointer-x': pointer.x, '--pointer-y': pointer.y } as React.CSSProperties} onPointerMove={dish.kind === 'burger' || dish.kind === 'seafood' ? handleDishPointer : undefined} onPointerLeave={dish.kind === 'burger' || dish.kind === 'seafood' ? () => setPointer({ x: 0, y: 0 }) : undefined}>
                <div className="slide-index">{dish.number} <span>/</span> 05</div>
                <div className="slide-copy"><p className="eyebrow">{dish.kicker}</p><p className="slide-description">{dish.description}</p></div>
                <div className="dish-art" aria-hidden="true"><img src={dish.asset} alt="" />{dish.kind === 'pizza' && <div className="topping-rain">{pizzaToppings.map(({ topping, id }, toppingIndex) => <span className={`dropped-topping topping-${toppingIndex % 3}`} key={id}><ToppingVisual topping={topping} /></span>)}</div>}</div>
                {dish.kind === 'burger' && <div className="burger-interaction"><button type="button" className="micro-toggle" onClick={() => setBurgerOpen((value) => !value)}>{burgerOpen ? 'Close the stack' : 'Open the stack'}</button><div className="burger-inside"><span>Charcoal beef</span><span>Aged cheddar</span><span>Charred onion</span><span>House sauce</span></div></div>}
                {(dish.kind === 'seafood' || dish.kind === 'burger') && <div className="pointer-orb" aria-hidden="true" />}
                {dish.kind === 'pizza' && <div className="pizza-controls"><span className="pizza-controls-label">Add to the pizza</span><div className="topping-tray">{(['Fresh Basil', 'Fior di Latte', 'Extra Chilies'] as Topping[]).map((topping) => <button className="topping-button" type="button" key={topping} onClick={() => addTopping(topping)}><ToppingVisual topping={topping} /><span>{topping}</span></button>)}</div><span className="pizza-count">{pizzaToppings.length ? `${pizzaToppings.length} added` : 'Choose a topping'}</span></div>}
                <div className="slide-footer"><div className="dish-nameplate"><span>{dish.kicker}</span><strong>{dish.title}</strong></div><div className="slide-menu-list">{dish.menu.map((item) => <div className="menu-line" key={item.name}><span>{item.name}</span><span>{item.price}</span></div>)}</div><button className="whatsapp-button" type="button" onClick={() => openWhatsApp(`Hello Malaika, I would like to order ${dish.title}. ${dish.menu.map((item) => `${item.name} (${item.price})`).join('; ')} Please confirm availability.`)}><MessageCircle size={17} strokeWidth={1.8} /> Order now · {dish.price}</button></div>
              </article>
            ))}
          </div>
          <div className="edge-fade edge-fade-left" aria-hidden="true" /><div className="edge-fade edge-fade-right" aria-hidden="true" />
          <div className="carousel-arrows"><button type="button" aria-label="Previous dish" onClick={() => scrollToDish(Math.max(0, activeIndex - 1))}><ArrowLeft size={18} strokeWidth={1.5} /></button><div className="carousel-progress"><span style={{ width: `${((activeIndex + 1) / dishes.length) * 100}%` }} /></div><button type="button" aria-label="Next dish" onClick={() => scrollToDish(Math.min(dishes.length - 1, activeIndex + 1))}><ArrowRight size={18} strokeWidth={1.5} /></button></div>
        </div>
      </section>

      <section className="reservation" id="reserve" aria-labelledby="reserve-title"><div className="reservation-intro"><p className="eyebrow">A seat by the garden</p><h2 id="reserve-title">Reserve<br /><em>your table.</em></h2><p>Tell us when you are coming. We will confirm the best table for your evening on WhatsApp.</p></div><form className="reservation-form" onSubmit={submitReservation}><label>Name<input required value={reservation.name} onChange={(event) => updateReservation('name', event.target.value)} placeholder="Your name" /></label><div className="form-row"><label>Date<input required type="date" value={reservation.date} onChange={(event) => updateReservation('date', event.target.value)} /></label><label>Time<input required type="time" value={reservation.time} onChange={(event) => updateReservation('time', event.target.value)} /></label></div><label>Guests<select value={reservation.guests} onChange={(event) => updateReservation('guests', event.target.value)}>{['1', '2', '3', '4', '5', '6+'].map((count) => <option key={count} value={count}>{count} guest{count === '1' ? '' : 's'}</option>)}</select></label><label>Notes <span>(optional)</span><textarea rows={3} value={reservation.notes} onChange={(event) => updateReservation('notes', event.target.value)} placeholder="A birthday, a favourite table, anything we should know" /></label><button className="whatsapp-button reservation-submit" type="submit"><MessageCircle size={17} strokeWidth={1.8} /> Continue to WhatsApp</button></form></section>

      <section className="closing" aria-labelledby="closing-title"><div className="closing-quote"><p className="eyebrow">After the last course</p><h2 id="closing-title">Leave a little<br /><em>room for wonder.</em></h2></div><div className="closing-aside"><p>Open daily from noon until the tide turns. Walk-ins are welcome; for the best table, send a note ahead.</p><button className="whatsapp-button" type="button" onClick={scrollToReservation}><MessageCircle size={17} strokeWidth={1.8} /> Reserve a table</button></div></section>
      <footer className="footer"><a className="wordmark footer-mark" href="#top"><span>M</span>ALAiKA</a><div className="footer-meta"><span>Silver Sand Road, Malindi</span><span>12° 11′ S / 40° 07′ E</span><span>© 2026 Malaika</span></div><a className="footer-top" href="#top">Back to top <ArrowDown size={15} /></a></footer>
    </main>
  )
}

export default App
