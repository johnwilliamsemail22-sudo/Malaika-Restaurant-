import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowLeft, ArrowRight, Copy, MapPin, MessageCircle, Minus, Phone, Plus, ShoppingBag } from 'lucide-react'
import Lenis from 'lenis'
import StaffDashboard from './StaffDashboard'
import BuildYourPizza from './components/BuildYourPizza'
const BASE = import.meta.env.BASE_URL
const withBase = (p: string) => (p.startsWith("/") ? (BASE.endsWith("/") ? BASE.slice(0, -1) : BASE) + p : p)
import { menuData } from './menuData'
import { menuImageFor } from './menuImages'
import type { MenuCategory } from './menuData'

type Theme = { bg: string; ink: string; muted: string; accent: string }
type Topping = 'Fior di Latte' | 'Prosciutto' | 'Wild Rocket' | 'Spicy Salami' | 'Coast Prawns' | 'Mushrooms' | 'Chilli Honey' | 'Olives'
type Reservation = { name: string; phone: string; date: string; time: string; guests: string; table: string; notes: string }

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
  'Fior di Latte': `${withBase("/images/toppings/fior-di-latte.webp")}`,
  'Prosciutto': `${withBase("/images/toppings/prosciutto.svg")}`,
  'Wild Rocket': `${withBase("/images/toppings/wild-rocket.svg")}`,
  'Spicy Salami': `${withBase("/images/toppings/spicy-salami.svg")}`,
  'Coast Prawns': `${withBase("/images/toppings/coast-prawns.svg")}`,
  'Mushrooms': `${withBase("/images/toppings/mushrooms.svg")}`,
  'Chilli Honey': `${withBase("/images/toppings/chilli-honey.svg")}`,
  'Olives': `${withBase("/images/toppings/olives.svg")}`,
}
const toppingPrices: Record<Topping, number> = {
  'Fior di Latte': 200, 'Prosciutto': 350, 'Wild Rocket': 120, 'Spicy Salami': 300,
  'Coast Prawns': 450, 'Mushrooms': 150, 'Chilli Honey': 100, 'Olives': 120,
}
const availableToppings = Object.keys(toppingPrices) as Topping[];
const assembledBurgerAsset = `${withBase("/images/dishes/burger-assembled.webp")}`

const dishes: Dish[] = [
  { number: '01', kind: 'pizza', kicker: 'Italian favourites', title: 'Wood-Fired Pizza', description: 'Slow-fermented dough, rich tomato, creamy mozzarella and fresh toppings, baked until beautifully golden.', price: 'KSh 1,200', asset: `${withBase("/images/dishes/pizza-base.webp")}`, theme: { bg: '#FAF6EE', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Margherita', price: 'KSh 450' }, { name: 'Spicy Salami', price: 'KSh 950' }, { name: 'Coast Prawn', price: 'KSh 1,350' }] },
  { number: '02', kind: 'dessert', kicker: 'Coffee & pastries', title: 'Coffee & Daily Bakes', description: 'A beautifully pulled espresso, creamy cappuccino and fresh pastries for slow Malindi mornings.', price: 'KSh 850', asset: `${withBase("/images/dishes/artisanal-gelato.webp")}`, theme: { bg: '#F1E7D7', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Espresso & Cappuccino', price: 'KSh 550' }, { name: 'Iced Coffee', price: 'KSh 700' }, { name: 'Fresh pastries', price: 'KSh 350' }] },
  { number: '03', kind: 'seafood', kicker: 'A little sfizio', title: 'Mozzarella Tomato Samosas', description: 'A much-loved savoury bite with melted mozzarella and tomato — a signature worth coming back for.', price: 'KSh 1,100', asset: `${withBase("/images/dishes/seafood-salad.webp")}`, theme: { bg: '#E9D6C1', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Mozzarella & tomato samosas', price: 'KSh 1,400' }, { name: 'Piadina Romagnola', price: 'KSh 1,250' }, { name: 'Fresh juices', price: 'KSh 1,300' }] },
  { number: '04', kind: 'pasta', kicker: 'Italian pasta', title: 'Ravioli & Tagliatelle', description: 'Comforting Italian pasta favourites, from delicate ravioli to generous plates of tagliatelle and gnocchi.', price: 'KSh 650', asset: `${withBase("/images/dishes/lobster-ravioli.webp")}`, theme: { bg: '#FAF0D9', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Spinach Ravioli', price: 'KSh 500' }, { name: 'Tagliatelle', price: 'KSh 400' }, { name: 'Gnocchi al pomodoro', price: 'KSh 600' }] },
  { number: '05', kind: 'dessert', kicker: 'Something sweet', title: 'Italian Desserts', description: 'Finish with a little sweetness, from classic tiramisu to a chilled scoop of gelato.', price: 'KSh 700', asset: `${withBase("/images/dishes/artisanal-gelato.webp")}`, theme: { bg: '#E8E4D9', ink: '#321B14', muted: '#806E64', accent: '#9A4B32' }, menu: [{ name: 'Classic Tiramisu', price: 'KSh 700' }, { name: 'Artisanal Gelato', price: 'KSh 700' }, { name: 'Daily sweet bakes', price: 'KSh 400' }] },
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
  const [showFullMenu, setShowFullMenu] = useState(false)
  const [pizzaToppings, setPizzaToppings] = useState<{ topping: Topping; id: number; x: number; y: number; flyX: number; flyY: number; size: number; rotation: number }[]>([])
  const [pizzaInstructions, setPizzaInstructions] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [burgerOpen, setBurgerOpen] = useState(false)
  const [orderLocationDish, setOrderLocationDish] = useState<Dish | null>(null)
  const [customPizzaCheckout, setCustomPizzaCheckout] = useState<{ name: string; total: number; details: string } | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedOrderItem, setSelectedOrderItem] = useState('')
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; name: string; item: string; total: number } | null>(null)
  const [showStaff, setShowStaff] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [cartOrders, setCartOrders] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('sapori-orders') || '[]') } catch { return [] } })
  const [flyingToCart, setFlyingToCart] = useState(false)
  const [flyToCartDot, setFlyToCartDot] = useState(false)
  const [staffOrders, setStaffOrders] = useState<any[]>([])
  const [reservation, setReservation] = useState<Reservation>({ name: '', phone: '', date: '', time: '', guests: '2', table: '', notes: '' })
  const [reservationSubmitted, setReservationSubmitted] = useState(false)
  const [showPizzaBuilder, setShowPizzaBuilder] = useState(false)
  const [menuCart, setMenuCart] = useState<Record<string, { item: MenuCategory['items'][number]; category: string; qty: number }>>(() => { try { return JSON.parse(localStorage.getItem('sapori-menu-cart') || '{}') } catch { return {} } })
  const [toastMsg, setToastMsg] = useState('')
  const [optionTarget, setOptionTarget] = useState<{ item: MenuCategory['items'][number]; category: string } | null>(null)
  const [cartName, setCartName] = useState(() => localStorage.getItem('sapori-cart-name') || '')
  const [cartPhone, setCartPhone] = useState(() => localStorage.getItem('sapori-cart-phone') || '')
  const [activeCategory, setActiveCategory] = useState(0)
  const [showMenuCart, setShowMenuCart] = useState(false)
  const menuSectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const menuNavRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<number | null>(null)

  const menuCartCount = Object.values(menuCart).reduce((sum, line) => sum + line.qty, 0)
  const menuCartTotal = Object.values(menuCart).reduce((sum, line) => sum + line.qty * line.item.price, 0)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2400)
  }

  const persistMenuCart = (next: Record<string, { item: MenuCategory['items'][number]; category: string; qty: number }>) => {
    setMenuCart(next)
    localStorage.setItem('sapori-menu-cart', JSON.stringify(next))
  }

  const addToMenuCart = (item: MenuCategory['items'][number], category: string, qty = 1) => {
    const key = `${category}::${item.name}`
    const current = menuCart[key]
    persistMenuCart({ ...menuCart, [key]: { item, category, qty: (current?.qty ?? 0) + qty } })
    showToast(`${item.name} added`)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const stepMenuCart = (key: string, delta: number) => {
    const line = menuCart[key]
    if (!line) return
    const next = { ...menuCart }
    const qty = line.qty + delta
    if (qty <= 0) delete next[key]
    else next[key] = { ...line, qty }
    persistMenuCart(next)
  }

  // Items that open an option sheet before adding (THM "See options" behavior)
  const menuOptions = (item: MenuCategory['items'][number]): { label: string; choices: string[] } | null => {
    const n = item.name.toUpperCase()
    if (n.startsWith('QUENELLE')) return { label: 'Flavour', choices: ['Vanilla', 'Chocolate', 'Strawberry'] }
    if (n.startsWith('FILETTO ALLA GRIGLIA')) return { label: 'Doneness', choices: ['Rare', 'Medium rare', 'Medium', 'Well done'] }
    if (n.startsWith('FILETTO CON FUNGHI')) return { label: 'Doneness', choices: ['Rare', 'Medium rare', 'Medium', 'Well done'] }
    if (n.startsWith('RED WINE (DRY) - GLASS')) return { label: 'Serving', choices: ['Glass 150 ml', '1/4 carafe', '1/2 carafe'] }
    if (n.startsWith('WHITE WINE') && n.includes('GLASS')) return { label: 'Serving', choices: ['Dry glass', 'Sweet glass', 'Sparkling glass', '1/4 carafe', '1/2 carafe'] }
    return null
  }

  const menuTap = (item: MenuCategory['items'][number], category: string) => {
    const opts = menuOptions(item)
    if (opts) setOptionTarget({ item, category })
    else addToMenuCart(item, category)
  }

  const scrollToCategory = (category: string) => {
    const section = menuSectionRefs.current[category]
    if (!section) return
    const y = section.getBoundingClientRect().top + window.scrollY - 118
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  useEffect(() => {
    if (!showFullMenu) return
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        const category = (entry.target as HTMLElement).dataset.category
        if (category) {
          const index = menuData.findIndex((c) => c.category === category)
          if (index >= 0) setActiveCategory(index)
        }
      }
    }, { rootMargin: '-38% 0px -55% 0px' })
    for (const section of Object.values(menuSectionRefs.current)) if (section) observer.observe(section)
    return () => observer.disconnect()
  }, [showFullMenu])

  const activeDish = dishes[activeIndex]
  const orderText = useMemo(() => {
    const additions = pizzaToppings.length ? ` with ${Array.from(new Set(pizzaToppings.map(({ topping }) => topping))).map((topping) => `${topping} (+${toppingPrices[topping]} KSh)`).join(', ')}` : ''
    const extraTotal = Array.from(new Set(pizzaToppings.map((item) => item.topping))).reduce((sum, topping) => sum + toppingPrices[topping], 0)
    const notes = pizzaInstructions.trim() ? ` Special instructions: ${pizzaInstructions.trim()}.` : ''
    return `Hello SAPORI, I would like to enquire about ${activeDish.title}.${notes} Please confirm availability.`
  }, [activeDish.title, pizzaToppings, pizzaInstructions])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(media.matches)
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    const touchDevice = window.matchMedia('(pointer: coarse)').matches
    let lenis: Lenis | null = null
    let frame = 0
    if (!media.matches && !touchDevice) {
      lenis = new Lenis({ duration: 1.35, lerp: .075, smoothWheel: true, syncTouch: false, wheelMultiplier: .8, touchMultiplier: .85 })
      const raf = (time: number) => { lenis?.raf(time); frame = window.requestAnimationFrame(raf) }
      frame = window.requestAnimationFrame(raf)
    }
    return () => { media.removeEventListener('change', onChange); if (frame) window.cancelAnimationFrame(frame); lenis?.destroy() }
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.intro, .menu-header, .dish-slide, .reservation, .closing, .footer'))
    targets.forEach((element) => element.classList.add('motion-reveal'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
    targets.forEach((element, index) => { if (element.classList.contains('dish-slide')) element.style.setProperty('--reveal-delay', `${(index % 5) * 55}ms`); observer.observe(element) })
    return () => observer.disconnect()
  }, [reducedMotion])



  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.sf-topbar')
    if (!header) return
    let frame = 0
    const update = () => { header.classList.toggle('is-scrolled', window.scrollY > 24); frame = 0 }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true }); update()
    return () => { window.removeEventListener('scroll', onScroll); if (frame) window.cancelAnimationFrame(frame) }
  }, [])

  useEffect(() => {
    if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return
    const cursor = document.querySelector<HTMLElement>('.sf-cursor')
    if (!cursor) return
    let x = -100, y = -100, targetX = -100, targetY = -100, frame = 0
    const move = (event: PointerEvent) => { targetX = event.clientX; targetY = event.clientY; cursor.classList.add('is-visible') }
    const tick = () => { x += (targetX - x) * .19; y += (targetY - y) * .19; cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; frame = window.requestAnimationFrame(tick) }
    const over = (event: PointerEvent) => { const target = event.target as HTMLElement | null; cursor.classList.toggle('is-hovering', !!target?.closest('a, button, .dish-art, .sf-hero-photo-card, .sf-float-card')); cursor.classList.toggle('is-ordering', !!target?.closest('.sf-order, .sf-primary-button, .whatsapp-button')) }
    const leave = () => cursor.classList.remove('is-visible')
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerover', over, { passive: true }); document.documentElement.addEventListener('pointerleave', leave); frame = window.requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); document.documentElement.removeEventListener('pointerleave', leave); window.cancelAnimationFrame(frame) }
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return
    const cursor = document.querySelector<HTMLElement>('.sf-cursor')
    if (!cursor) return
    let x = -100, y = -100, targetX = -100, targetY = -100, frame = 0
    const move = (event: PointerEvent) => { targetX = event.clientX; targetY = event.clientY; cursor.classList.add('is-visible') }
    const tick = () => { x += (targetX - x) * .19; y += (targetY - y) * .19; cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; frame = window.requestAnimationFrame(tick) }
    const over = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      cursor.classList.toggle('is-hovering', !!target?.closest('a, button, .dish-art, .sf-hero-photo-card, .sf-float-card'))
      cursor.classList.toggle('is-ordering', !!target?.closest('.sf-order, .sf-primary-button, .whatsapp-button'))
    }
    const leave = () => cursor.classList.remove('is-visible')
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerover', over, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave); frame = window.requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); document.documentElement.removeEventListener('pointerleave', leave); window.cancelAnimationFrame(frame) }
  }, [reducedMotion])

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
  const openDishOrder = (dish: Dish, itemName = dish.menu[0]?.name ?? dish.title) => { setCustomerName(''); setCustomerPhone(''); setSelectedOrderItem(itemName); setOrderSuccess(null); setCustomPizzaCheckout(null); setOrderLocationDish(dish) }
  const submitDishOrder = () => {
    if (!customerName.trim() || !customerPhone.trim() || (!orderLocationDish && !customPizzaCheckout)) return
    const customPizza = customPizzaCheckout
    const dishItem = orderLocationDish?.menu.find((entry) => entry.name === selectedOrderItem) ?? orderLocationDish?.menu[0]
    const itemName = customPizza?.name ?? dishItem?.name ?? ''
    const total = customPizza?.total ?? (Number(dishItem?.price.replace(/[^0-9.]/g, '')) || 0)
    const price = customPizza ? `KSh ${total.toLocaleString('en-KE')}` : dishItem?.price ?? `KSh ${total.toLocaleString('en-KE')}`
    const id = `SP${Date.now().toString().slice(-6)}`
    const order = { id, customerName: customerName.trim(), customerPhone: customerPhone.trim(), phone: customerPhone.trim(), item: itemName, category: customPizza ? 'Custom pizza' : orderLocationDish?.title ?? 'Menu order', price, total, status: 'New', type: 'Pickup', notes: customPizza?.details ?? '', details: customPizza?.details ? customPizza.details.split(', ').filter(Boolean) : [itemName], createdAt: new Date().toISOString() }
    const current = JSON.parse(localStorage.getItem('sapori-orders') || '[]')
    const updated = [order, ...current]
    localStorage.setItem('sapori-orders', JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('sapori-order', { detail: order }))
    setStaffOrders(updated)
    setCartOrders(updated)
    setFlyToCartDot(true)
    window.setTimeout(() => setFlyToCartDot(false), 900)
    setFlyingToCart(true)
    window.setTimeout(() => { setFlyingToCart(false); setOrderLocationDish(null); setCustomPizzaCheckout(null); setOrderSuccess({ id, name: customerName.trim(), item: itemName, total }) }, 950)
  }
  const addCustomPizzaToCart = (pizza: { name: string; total: number; details: string }) => {
    setCustomerName('')
    setCustomerPhone('')
    setOrderSuccess(null)
    setOrderLocationDish(null)
    setCustomPizzaCheckout(pizza)
    setShowPizzaBuilder(false)
  }
  const openWhatsApp = (message = orderText) => {
    const currentY = window.scrollY; const url = `https://wa.me/254715048268?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer'); window.requestAnimationFrame(() => window.scrollTo({ top: currentY, behavior: 'auto' }))
  }
  const updateReservation = (field: keyof Reservation, value: string) => setReservation((current) => ({ ...current, [field]: value }))
  const submitReservation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const request = { ...reservation, reference: 'RS-' + Date.now().toString().slice(-6), submittedAt: new Date().toISOString(), status: 'Reserved' }
    try {
      const saved = JSON.parse(localStorage.getItem('sapori-reservations') || '[]')
      localStorage.setItem('sapori-reservations', JSON.stringify([request, ...saved]))
      const tables = JSON.parse(localStorage.getItem('sapori-tables') || 'null') || Array.from({ length: 12 }, (_, index) => ({ number: index + 1, status: 'Available' }))
      localStorage.setItem('sapori-tables', JSON.stringify(tables.map((table: any) => String(table.number) === reservation.table ? { ...table, status: 'Reserved' } : table)))
      window.dispatchEvent(new CustomEvent('sapori-reservation', { detail: request }))
    } catch (error) { console.error('Could not save reservation request', error) }
    setReservationSubmitted(true)
  }
  const handleDishPointer = (event: React.PointerEvent<HTMLElement>) => { const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--pointer-x', String((event.clientX - rect.left) / rect.width - .5)); event.currentTarget.style.setProperty('--pointer-y', String((event.clientY - rect.top) / rect.height - .5)) }
  const resetDishPointer = (event: React.PointerEvent<HTMLElement>) => { event.currentTarget.style.setProperty('--pointer-x', '0'); event.currentTarget.style.setProperty('--pointer-y', '0') }

  return (
    <main className="site-shell" style={{ backgroundColor: activeDish.theme.bg }}>
      <div className="sf-cursor" aria-hidden="true"><span>VIEW</span></div>
      <header className="topbar sf-topbar">
        <a className="wordmark sf-wordmark" href="#top" aria-label="sapori home">sapori<span>·</span></a>
        <div className="topbar-right">
          <a className="toplink" href="#menu">Menu</a>
          <button className="top-order sf-order" type="button" onClick={() => { setCartOrders(JSON.parse(localStorage.getItem('sapori-orders') || '[]')); setShowCart(true) }}>Order Now</button>
          <button className="sf-cart-button" type="button" aria-label="Open order cart and tracking" onClick={() => { setCartOrders(JSON.parse(localStorage.getItem('sapori-orders') || '[]')); setShowCart(true) }}><ShoppingBag size={19}/><span>{cartOrders.length}</span></button>
        </div>
      </header>
      <section className="sf-hero" id="top" aria-labelledby="hero-title">
        <div className="sf-hero-copy">
          <p className="sf-kicker">ITALIAN CUISINE · ETHIOPIAN FLAVOURS · MALINDI</p>
          <h1 id="hero-title">sapori</h1>
          <p className="sf-hero-ranking">#1 restaurant in Malindi</p>
          <p className="sf-hero-subtitle">Discover contemporary Italian cuisine with a distinctive Ethiopian touch, warm hospitality and relaxed open-air dining beneath Malindi’s majestic baobab trees.</p>
          <div className="sf-hero-actions"><button className="sf-primary-button" type="button" onClick={scrollToReservation}>Reserve a Table</button><button className="sf-secondary-button" type="button" onClick={() => { setShowFullMenu(true); window.setTimeout(() => document.getElementById("menu")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }), 40) }}>Explore Menu</button></div>
        </div>
        <div className="sf-hero-photo-card">
          <img src={`${BASE}images/restaurant-real.jpg`} alt="The SAPORI garden at dusk: candle-lit tables beneath the baobab trees" width="1200" height="900" fetchPriority="high" />
          <div className="sf-float-card sf-float-coffee"><span>☕</span><small>MADE WITH CARE</small><strong>Italian Coffee</strong></div>
          <div className="sf-float-card sf-float-pasta"><span>🍝</span><small>FAVOURITE FLAVOURS</small><strong>Fresh Pasta</strong></div>
        </div>
      </section>

      <section className="intro" aria-labelledby="intro-title">
        <div className="intro-mark" aria-hidden="true">L</div>
        <div className="intro-copy"><p className="eyebrow">Welcome to SAPORI</p><h2 id="intro-title">Italian flavour.<br /><em>Coastal soul.</em></h2><p className="intro-body">Thoughtfully prepared Italian favourites and vibrant Ethiopian flavours, served with genuine hospitality on Lamu Road in Malindi. Settle in beneath the baobab trees and enjoy good food and good company.</p></div>
        <div className="intro-location"><MapPin size={16} strokeWidth={1.5} /><span>Lamu Road, after the Casino<br />Towards Mambrui, Malindi</span></div>
      </section>

      <section className={`menu-stage sf-menu-stage ${showFullMenu ? 'sf-full-menu-open' : ''}`} id="menu" aria-labelledby="menu-title">
        {!showFullMenu ? <>
          <div className="menu-header sf-menu-heading">
            <div><p className="eyebrow">The flavours of SAPORI</p><h2 id="menu-title">Made to be <em>savoured.</em></h2><p className="sf-menu-intro">A little something for every appetite. Explore our favourites, one delicious chapter at a time.</p></div>
            <button className="sf-all-menu-button" type="button" onClick={() => setShowFullMenu(true)}>Explore all menu <ArrowRight size={17} /></button>
          </div>
          <div className="sf-glass-carousel-shell" onMouseEnter={(event) => event.currentTarget.classList.add('is-paused')} onMouseLeave={(event) => event.currentTarget.classList.remove('is-paused')}>
            <div className="sf-glass-carousel" ref={carouselRef} onScroll={handleCarouselScroll} aria-label="SAPORI menu categories">
              {dishes.map((dish, index) => <article className={`sf-menu-glass-card ${activeIndex===index?'is-active':''}`} key={dish.number} onClick={() => setActiveIndex(index)}>
                <div className="sf-card-topline"><span>CHAPTER {dish.number}</span><span className="sf-card-spark">✳</span></div>
                <div className="sf-card-image"><img src={dish.asset} alt={dish.title} loading="lazy" decoding="async" /></div>
                <div className="sf-card-content"><p className="sf-card-kicker">{dish.kicker}</p><h3>{dish.title}</h3><p className="sf-card-description">{dish.description}</p>
                  <ul>{dish.menu.map((item) => <li key={item.name}><span>{item.name}</span><span>{item.price}</span><button className="sf-item-order" type="button" onClick={() => openDishOrder(dish, item.name)}>Order <ArrowRight size={13}/></button></li>)}</ul>
                  <button className="sf-card-order sf-primary-button" type="button" onClick={(event) => { event.stopPropagation(); openDishOrder(dish) }}><span>Order Now</span><span className="sf-card-order-price">{dish.price}</span></button>{dish.kind === 'pizza' && <button className="sf-build-pizza-button" type="button" onClick={(event) => { event.stopPropagation(); setShowPizzaBuilder(true) }}>🍕 Build your own pizza <ArrowRight size={15}/></button>}
                </div>
              </article>)}
            </div>
            <div className="sf-carousel-controls"><button type="button" aria-label="Previous menu category" disabled={activeIndex===0} onClick={() => scrollToDish(Math.max(0,activeIndex-1))}><ArrowLeft size={17}/></button><div className="sf-carousel-progress"><span style={{width:`${((activeIndex+1)/dishes.length)*100}%`}} /></div><span className="sf-carousel-count">0{activeIndex+1} / 0{dishes.length}</span><button type="button" aria-label="Next menu category" disabled={activeIndex===dishes.length-1} onClick={() => scrollToDish(Math.min(dishes.length-1,activeIndex+1))}><ArrowRight size={17}/></button></div>
            <p className="sf-swipe-hint">Swipe or use the arrows to discover more <span>↔</span></p>
          </div>
          <div className="sf-menu-bottom-cta"><span>Looking for something specific?</span><button type="button" onClick={() => setShowFullMenu(true)}>See the complete menu <ArrowRight size={16}/></button></div>
        </> : <>
          <div className="sf-full-menu-heading">
            <button className="sf-back-menu" type="button" onClick={() => setShowFullMenu(false)}><ArrowLeft size={16}/> Back to the experience</button>
            <p className="eyebrow">Welcome · SAPORI, Malindi</p><h2 id="menu-title">The full <em>menu.</em></h2>
            <p>Explore the complete SAPORI menu. Every item and price is from the restaurant menu.</p>
            <button className="sf-build-pizza-button sf-full-menu-pizza-cta" type="button" onClick={() => setShowPizzaBuilder(true)}>🍕 Build your own pizza <ArrowRight size={15}/></button>
          </div>
          <div className="sapori-menu-chips" ref={menuNavRef} aria-label="Menu sections">
            {menuData.map((category) => (
              <button
                key={category.category}
                type="button"
                className={`sapori-chip ${menuData[activeCategory]?.category === category.category ? 'is-active' : ''}`}
                onClick={() => scrollToCategory(category.category)}
              >
                {(() => {
                  let label = category.category.includes('|') ? category.category.split('|')[0].trim() : category.category
                  if (label.length > 24 && category.category.includes('|')) label = category.category.split('|')[1].trim()
                  label = label.replace('BIMONTHLY SPECIALS', 'SPECIALS')
                  return label
                })()}
              </button>
            ))}
          </div>
          <div className="sapori-real-menu">
            {menuData.map((category, categoryIndex) => {
              const compact = /BEV|DRINK|COFFEE|WINE|COCKTAIL|WATER/i.test(category.category)
              return <section className={`sapori-menu-category ${compact ? 'is-compact' : ''}`} key={category.category} data-category={category.category} ref={(el) => { menuSectionRefs.current[category.category] = el }}>
                <header><span>{String(categoryIndex + 1).padStart(2, '0')}</span><h3>{category.category}</h3><i>{category.items.length} items</i></header>
                <div className="sapori-menu-items">
                  {category.items.map((item, itemIndex) => {
                    const key = `${category.category}::${item.name}`
                    const qty = menuCart[key]?.qty ?? 0
                    const hasOptions = menuOptions(item) != null
                    const isExtraTopping = /EXTRA TOPPING|^DATTERINO TOMATOES$/i.test(item.name)
                    if (isExtraTopping) return null
                    return <article className="sapori-menu-item" key={item.name + itemIndex}>
                      {!compact && <div className="sapori-menu-item-photo"><img src={menuImageFor(item.name, category.category)} alt={item.name} loading="lazy" decoding="async" /></div>}
                      <div className="sapori-menu-item-copy"><h4>{item.name}</h4>{item.description && <p>{item.description}</p>}<strong>KSh {item.price.toLocaleString('en-KE')}</strong></div>
                      {qty === 0 ? (
                        <button
                          type="button"
                          className="sapori-add-button"
                          aria-label={hasOptions ? `Choose options for ${item.name}` : `Add ${item.name}`}
                          onClick={(event) => { const b = event.currentTarget; b.classList.remove('did-pop'); void b.offsetWidth; b.classList.add('did-pop'); menuTap(item, category.category) }}
                        >
                          {hasOptions ? <span className="sapori-add-label">Options</span> : <Plus size={17} strokeWidth={2.6} />}
                        </button>
                      ) : (
                        <div className="sapori-stepper">
                          <button type="button" aria-label={`One less ${item.name}`} onClick={() => stepMenuCart(key, -1)}>−</button>
                          <span>{qty}</span>
                          <button type="button" aria-label={`One more ${item.name}`} onClick={() => { addToMenuCart(item, category.category); }}><Plus size={14} strokeWidth={2.8} /></button>
                        </div>
                      )}
                    </article>
                  })}
                </div>
              </section>
            })}
          </div>
        </>}
      </section>

      <section className="reservation" id="reserve" aria-labelledby="reserve-title"><div className="reservation-intro"><p className="eyebrow">A seat by the garden</p><h2 id="reserve-title">Reserve<br /><em>your table.</em></h2><p>Tell us when you are coming. We will confirm the best table for your evening on WhatsApp.</p></div><form className="reservation-form" onSubmit={submitReservation}>
<label>Name<input required value={reservation.name} onChange={(event) => updateReservation('name', event.target.value)} placeholder="Your name" /></label>
<label>Phone number<input required type="tel" value={reservation.phone} onChange={(event) => updateReservation('phone', event.target.value)} placeholder="+254..." /></label>
<div className="form-row"><label>Date<input required type="date" min={new Date().toISOString().slice(0,10)} value={reservation.date} onChange={(event) => updateReservation('date', event.target.value)} /></label><label>Time<input required type="time" value={reservation.time} onChange={(event) => updateReservation('time', event.target.value)} /></label></div>
<label>Guests<select value={reservation.guests} onChange={(event) => updateReservation('guests', event.target.value)}>{['1', '2', '3', '4', '5', '6+'].map((count) => <option key={count} value={count}>{count} guest{count === '1' ? '' : 's'}</option>)}</select></label>
<label>Choose your table<select required value={reservation.table} onChange={(event) => updateReservation('table', event.target.value)}><option value="">Select an available table</option>{Array.from({length:12},(_,index)=>String(index+1)).map((number)=>{const tables=JSON.parse(localStorage.getItem('sapori-tables')||'null')||Array.from({length:12},(_,index)=>({number:index+1,status:'Available'}));const booked=JSON.parse(localStorage.getItem('sapori-reservations')||'[]').some((booking:any)=>String(booking.table)===number&&booking.date===reservation.date&&booking.status!=='Cancelled');const status=tables.find((table:any)=>String(table.number)===number)?.status||'Available';const available=status!=='Reserved'&&!booked;return <option key={number} value={number} disabled={!available}>Table {number} · {available?'Available':'Reserved'}</option>})}</select></label>
<label>Notes <span>(optional)</span><textarea rows={3} value={reservation.notes} onChange={(event) => updateReservation('notes', event.target.value)} placeholder="A birthday, a favourite table, anything we should know" /></label>
<button className="whatsapp-button reservation-submit" type="submit"><MessageCircle size={17} strokeWidth={1.8} /> Send reservation request</button></form>{reservationSubmitted && <div className="sf-order-modal-backdrop" role="presentation"><section className="sf-order-modal sf-order-success" role="dialog" aria-modal="true" aria-labelledby="sf-reservation-success-title"><div className="sf-reservation-check" aria-hidden="true">✓</div><p className="eyebrow">REQUEST RECEIVED</p><h2 id="sf-reservation-success-title">Thank you, <em>{reservation.name}.</em></h2><p>Your reservation request has been received. Your request is for Table {reservation.table} on {reservation.date} at {reservation.time} for {reservation.guests} guest{reservation.guests === "1" ? "" : "s"}. We have your phone number: {reservation.phone}.</p><p>We’ll get back to you to confirm whether your table is available. Your table is not confirmed yet.</p><button className="sf-done-button" type="button" onClick={() => { setReservationSubmitted(false); setReservation({ name: "", phone: "", date: "", time: "", guests: "2", table: "", notes: "" }) }}>Done</button></section></div>}</section>

      <section className="closing" aria-labelledby="closing-title"><div className="closing-quote"><p className="eyebrow">After the last course</p><h2 id="closing-title">Leave a little<br /><em>room for wonder.</em></h2></div><div className="closing-aside"><p><span className="sf-live-dot" aria-hidden="true"></span>Open daily from 12 noon to 10 PM. Walk-ins are welcome; contact us on WhatsApp to enquire or reserve your table.</p><button className="whatsapp-button" type="button" onClick={scrollToReservation}><MessageCircle size={17} strokeWidth={1.8} /> Reserve a table</button></div></section>
      {showPizzaBuilder && <div className="sf-pizza-builder-overlay"><BuildYourPizza onAddToCart={addCustomPizzaToCart} onClose={() => setShowPizzaBuilder(false)} /></div>}
      {flyingToCart && <div className="sf-fly-to-cart" aria-hidden="true"><ShoppingBag size={25}/><span>Added to your orders</span></div>}
      {flyToCartDot && <div className="sf-fly-dot" aria-hidden="true"><ShoppingBag size={22} strokeWidth={2}/></div>}
      {flyToCartDot && <div className="sf-fly-dot" aria-hidden="true"><ShoppingBag size={22} strokeWidth={2}/></div>}
      {showCart && <div className="sf-order-modal-backdrop" role="presentation" onClick={() => setShowCart(false)}><section className="sf-order-modal sf-cart-modal" role="dialog" aria-modal="true" aria-labelledby="sf-cart-title" onClick={(event) => event.stopPropagation()}><button className="sf-order-modal-close" type="button" aria-label="Close cart" onClick={() => setShowCart(false)}>×</button><p className="eyebrow">SAPORI · PICKUP ORDERS</p><h2 id="sf-cart-title">Your <em>orders.</em></h2><p>Your order references are saved on this device, so you can return after refreshing.</p>{cartOrders.length === 0 ? <div className="sf-cart-empty"><ShoppingBag size={30}/><p>Your cart is waiting for something delicious.</p><button className="whatsapp-button" type="button" onClick={() => { setShowCart(false); setShowFullMenu(true); document.getElementById("menu")?.scrollIntoView({behavior:"smooth"}) }}>Explore menu</button></div> : <div className="sf-cart-orders">{cartOrders.map((order:any) => <article className="sf-cart-order" key={order.id}><div className="sf-cart-order-top"><span>ORDER {order.id}</span><strong>{order.status || 'New'}</strong></div><h3>{order.item}</h3><p>{order.customerName} · Pickup · KSh {Number(order.total || 0).toLocaleString('en-KE')}</p><div className="sf-order-progress"><span className="done"><i/>Received</span><span className={(['Cooking','Ready'].includes(order.status)) ? 'done' : ''}><i/>Preparing</span><span className={order.status === 'Ready' ? 'done' : ''}><i/>Ready for pickup</span></div><small>Keep your order number: {order.id}</small></article>)}</div>}<button className="sf-done-button" type="button" onClick={() => setShowCart(false)}>Close</button></section></div>}
      {(orderLocationDish || customPizzaCheckout) && <div className="sf-order-modal-backdrop" role="presentation" onClick={() => { setOrderLocationDish(null); setCustomPizzaCheckout(null) }}><section className="sf-order-modal" role="dialog" aria-modal="true" aria-labelledby="sf-order-modal-title" onClick={(event) => event.stopPropagation()}><button className="sf-order-modal-close" type="button" aria-label="Close" onClick={() => { setOrderLocationDish(null); setCustomPizzaCheckout(null) }}>×</button><p className="eyebrow">SAPORI · PICKUP ONLY</p><h2 id="sf-order-modal-title">Place your <em>order.</em></h2><p>Order online and collect your food fresh from SAPORI. We do not offer delivery.</p><label htmlFor="sf-order-item">Your selection</label>{customPizzaCheckout ? <div className="sf-order-selection"><strong>{customPizzaCheckout.name}</strong><span>KSh {customPizzaCheckout.total.toLocaleString('en-KE')}</span></div> : <select id="sf-order-item" value={selectedOrderItem} onChange={(event) => setSelectedOrderItem(event.target.value)}>{orderLocationDish?.menu.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.price}</option>)}</select>}<label htmlFor="sf-customer-name">Your name</label><input id="sf-customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Name for collection" autoFocus /><label htmlFor="sf-customer-phone">Phone number</label><input id="sf-customer-phone" type="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="+254..." /><div className="sf-pickup-note"><MapPin size={16}/> Collection from SAPORI, Malindi.</div><button className="whatsapp-button" type="button" disabled={!customerName.trim() || !customerPhone.trim()} onClick={submitDishOrder}>Place pickup order <ArrowRight size={16}/></button></section></div>}
      {orderSuccess && (() => {
        const code = orderSuccess.id
        return <div className="sf-order-modal-backdrop" role="presentation">
          <section className="sf-order-modal sf-order-success" role="dialog" aria-modal="true" aria-labelledby="sf-order-success-title">
            <div className="sf-reservation-check sf-success-pop" aria-hidden="true">✓</div>
            <p className="eyebrow">ORDER RECEIVED · PICKUP</p>
            <h2 id="sf-order-success-title">We got your order, <em>{orderSuccess.name}!</em></h2>
            <p>Our kitchen is on it. We will call you to let you know when it is ready, then you can come pick it up.</p>
            <div className="sf-order-code-box">
              <div>
                <span>YOUR PICKUP CODE</span>
                <strong>{code}</strong>
              </div>
              <button
                type="button"
                className="sf-copy-code"
                aria-label={`Copy pickup code ${code}`}
                onClick={(event) => {
                  navigator.clipboard?.writeText(code).then(() => {
                    const b = event.currentTarget
                    b.classList.add('copied')
                    const label = b.querySelector('span')
                    if (label) { label.textContent = 'Copied!'; window.setTimeout(() => { label.textContent = 'Copy'; b.classList.remove('copied') }, 1600) }
                  })
                }}
              >
                <Copy size={15} strokeWidth={2.2} aria-hidden="true" />
                <span>Copy</span>
              </button>
            </div>
            <p className="sf-code-warning"><AlertCircle size={15} strokeWidth={2.1} /> Bring this code with you. It is how we find your order at the counter.</p>
            <p className="sf-contact-label">Questions or changes? Reach the SAPORI hotline:</p>
            <div className="sf-contact-row">
              <a className="sf-contact-btn call" href="tel:+254715048268"><Phone size={17} strokeWidth={2}/> Call · +254 715 048 268</a>
              <a className="sf-contact-btn wa" href="https://wa.me/254715048268?text=${encodeURIComponent('Hello SAPORI, about order ')}{encodeURIComponent('Hello SAPORI, about order ' + code)}" target="_blank" rel="noreferrer"><MessageCircle size={17} strokeWidth={2}/> WhatsApp us</a>
            </div>
            <button className="sf-done-button" type="button" onClick={() => setOrderSuccess(null)}>Done</button>
          </section>
        </div>
      })()}
      {toastMsg && <div className="sf-toast" role="status">{toastMsg}</div>}
      {menuCartCount > 0 && !showMenuCart && !showPizzaBuilder && !orderLocationDish && (
        <button type="button" className="sf-menu-cartbar" onClick={() => setShowMenuCart(true)}>
          <ShoppingBag size={19} strokeWidth={2.1} />
          <span>Your order · {menuCartCount} item{menuCartCount === 1 ? '' : 's'}</span>
          <b>KSh {menuCartTotal.toLocaleString('en-KE')}</b>
        </button>
      )}
      {optionTarget && (() => {
        const opts = menuOptions(optionTarget.item)!
        return <div className="sf-order-modal-backdrop" role="presentation" onClick={() => setOptionTarget(null)}>
          <section className="sf-order-modal sf-options-sheet" role="dialog" aria-modal="true" aria-labelledby="sf-options-title" onClick={(event) => event.stopPropagation()}>
            <button className="sf-order-modal-close" type="button" aria-label="Close" onClick={() => setOptionTarget(null)}>×</button>
            <p className="eyebrow">SAPORI · CHOOSE</p>
            <h2 id="sf-options-title">{optionTarget.item.name.split('(')[0].trim()}</h2>
            {optionTarget.item.description && <p className="sf-options-desc">{optionTarget.item.description}</p>}
            <div className="sf-options-group">
              <span className="sf-options-label">{opts.label}</span>
              <div className="sf-options-choices">
                {opts.choices.map((choice) => (
                  <button key={choice} type="button" className="sf-option-pill" onClick={() => {
                    const labelled = { ...optionTarget.item, name: `${optionTarget.item.name} · ${choice}` }
                    addToMenuCart(labelled, optionTarget.category)
                    setOptionTarget(null)
                  }}>{choice}</button>
                ))}
              </div>
            </div>
          </section>
        </div>
      })()}
      {showMenuCart && (
        <div className="sf-order-modal-backdrop" role="presentation" onClick={() => setShowMenuCart(false)}>
          <section className="sf-order-modal sf-menu-cart" role="dialog" aria-modal="true" aria-labelledby="sf-menucart-title" onClick={(event) => event.stopPropagation()}>
            <button className="sf-order-modal-close" type="button" aria-label="Close cart" onClick={() => setShowMenuCart(false)}>×</button>
            <p className="eyebrow">SAPORI · PICKUP ORDER</p>
            <h2 id="sf-menucart-title">Your <em>order.</em></h2>
            <div className="sf-menu-cart-lines">
              {Object.entries(menuCart).map(([key, line]) => (
                <div className="sf-menu-cart-line" key={key}>
                  <div><b>{line.item.name}</b><span>{line.category.split('|')[0].trim()}</span></div>
                  <div className="sapori-stepper">
                    <button type="button" aria-label="One less" onClick={() => stepMenuCart(key, -1)}><Minus size={13} strokeWidth={2.8} /></button>
                    <span>{line.qty}</span>
                    <button type="button" aria-label="One more" onClick={() => { addToMenuCart(line.item, line.category, 0); persistMenuCart({ ...menuCart, [key]: { ...line, qty: line.qty + 1 } }) }}><Plus size={13} strokeWidth={2.8} /></button>
                  </div>
                  <b className="sf-line-total">KSh {(line.qty * line.item.price).toLocaleString('en-KE')}</b>
                </div>
              ))}
            </div>
            <div className="sf-menu-cart-total"><span>Total</span><b>KSh {menuCartTotal.toLocaleString('en-KE')}</b></div>
            <label htmlFor="sf-cartc-name">Your name</label>
            <input id="sf-cartc-name" value={cartName} onChange={(event) => { setCartName(event.target.value); localStorage.setItem('sapori-cart-name', event.target.value) }} placeholder="Name for collection" />
            <label htmlFor="sf-cartc-phone">Phone number</label>
            <input id="sf-cartc-phone" type="tel" value={cartPhone} onChange={(event) => { setCartPhone(event.target.value); localStorage.setItem('sapori-cart-phone', event.target.value) }} placeholder="+254..." />
            <div className="sf-pickup-note"><MapPin size={16}/> Collection from SAPORI, Malindi. Pay on pickup.</div>
            <button
              className="whatsapp-button"
              type="button"
              disabled={!cartName.trim() || !cartPhone.trim()}
              onClick={() => {
                const lines = Object.values(menuCart)
                const summary = lines.map((line) => `${line.qty} × ${line.item.name} (KSh ${(line.qty * line.item.price).toLocaleString('en-KE')})`).join('\n')
                const id = `SP${Date.now().toString().slice(-6)}`
                const order = { id, customerName: cartName.trim(), customerPhone: cartPhone.trim(), item: lines.map((l) => `${l.qty}x ${l.item.name}`).join(', '), category: 'Menu order', total: menuCartTotal, status: 'New', type: 'Pickup', createdAt: new Date().toISOString() }
                const current = JSON.parse(localStorage.getItem('sapori-orders') || '[]')
                const updated = [order, ...current]
                localStorage.setItem('sapori-orders', JSON.stringify(updated))
                window.dispatchEvent(new CustomEvent('sapori-order', { detail: order }))
                setStaffOrders(updated); setCartOrders(updated)
                const message = `Hello SAPORI, order ${id}:\n${summary}\nTotal: KSh ${menuCartTotal.toLocaleString('en-KE')}\nName: ${cartName.trim()}\nPhone: ${cartPhone.trim()}\nPickup`
                window.open(`https://wa.me/254715048268?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
                setFlyToCartDot(true)
    window.setTimeout(() => setFlyToCartDot(false), 900)
                persistMenuCart({})
                setShowMenuCart(false)
                setOrderSuccess({ id, name: cartName.trim(), item: `${lines.length} items`, total: menuCartTotal })
              }}
            >Place pickup order <ArrowRight size={16} /></button>
            <p className="sf-cart-hint">We confirm every order on WhatsApp before the kitchen starts.</p>
          </section>
        </div>
      )}
      {showStaff && <StaffDashboard onClose={() => setShowStaff(false)} />}
      <footer className="footer"><a className="wordmark footer-mark" href="#top">sapori<span>·</span></a><div className="footer-meta"><span>Lamu Road, after the Casino, towards Mambrui</span><span>Italian cuisine · Ethiopian flavours · Good company</span><span>© 2026 SAPORI</span><button className="sf-staff-entry" type="button" onClick={() => { setStaffOrders(JSON.parse(localStorage.getItem('sapori-orders') || '[]')); setShowStaff(true) }}>Staff order desk ↗</button></div><a className="footer-top" href="#top">Back to top <ArrowDown size={15} /></a></footer>
    </main>
  )
}

export default App
