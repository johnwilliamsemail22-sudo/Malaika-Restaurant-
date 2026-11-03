const exactDishImages: Record<string, string> = {
  'BRUSCHETTA CRUDO E MANGO': 'https://www.prodottitipicitoscani.it/images/bruschette-con-prosciutto-crudo-mango-e-ricotta-big.jpg',
  'ARANCINA': 'https://www.knuspr.de/cdn-cgi/image/f%3Dauto%2Cw%3D800%2Ch%3D600%2Cfit%3Dcover/https%3A/cdn.knuspr.de/images/meals/large/recipe_1493_1777283285968_cheese-stuffed-arancini_691baa52.jpg',
  'MELANZANE ALLA PARMIGIANA': 'https://mrcuisto.com/assets/images/1746435999552-vpdmemv9.webp',
  'FETTUCCINE CON PANNA, POLLO E FUNGHI': 'https://image.idntimes.com/post/20250924/vecteezy_creamy-fettuccine-alfredo-with-mushrooms-and-chicken-on-a_49506801_fc7308a4-aecd-412e-8815-1deee000cee0.jpeg',
  'SPAGHETTI VONGOLE': 'https://qul.imgix.net/6dc77474-1add-4bfd-9ae7-3b4d3ab15f16/513012_sld.jpg',
  'CHICKEN TIBS': 'https://es.flavelo.com/uploads/recipe/99/pizza-ethiopian-style-fekvo-16x9.webp',
  'PROSCIUTTO COTTO': 'https://objednavkajidla.cz/assets/images/b42ccb01f57eae311937c89c0fc75793/851-600.jpg',
  'QUATTRO STAGIONI': 'https://trattorialapasta.com/cms-data/blog/menu/pizza-quattro-stagioni/image/pizza-quattro-stagioni.jpg',
  'CRUDO E RUCOLA': 'https://resizer.otstatic.com/v2/photos/xlarge/1/24688411.webp',
  'MARGHERITA': 'https://image-worker.mindtrip.ai/image-resize/format%3Dwebp%2Cw%3D720/https%3A/media-cdn.tripadvisor.com/media/photo-o/15/df/77/57/pizza-a-portafoglio-classica.jpg',
  'ORTOLANA': 'https://lkfconcepts.com/cdn/shop/files/PizzaOrtolana05.jpg?v=1745934317',
  'ROMANA': 'https://vecchianapoli.ro/userfiles/0/meniu/pix_med/poza-pizza-romana-437.jpg',
  'TONNO E CIPOLLA': 'https://cdn.tasteatlas.com/images/dishes/06fb0374204f4cf1bc636a4deb517976.jpg?m=facebook',
  'SALAME PICCANTE': 'https://bampizza.nl/cdn/shop/files/Salami.jpg?v=1765552061&width=1445',
  'SALSICCIA E FUNGHI': 'https://cdn.shopify.com/s/files/1/0627/7493/5803/files/kevjes-sausage-and-mushroom-pizza_600x_2ccf5196-e654-48e3-948a-d5cd47e0c2dc_550x.webp?v=1776489398',
  'FOCACCIA AL ROSMARINO': 'https://granothailand.com/cdn/shop/articles/FOCACCIA_ROSEMARY_12b787a1-867c-4fff-8987-1e87d86c73d3.png?v=1761896186',
  'GAMBERI E CALAMARI': 'https://images.deliveryhero.io/image/talabat/MenuItems/Mix_Seafood_Pizza638948222830061509.jpg',
  'ORATA ALLA GRIGLIA': 'https://www.thinkdonna.it/foto/blog/piatto-pronto-orata-griglia-pomodorini-prezzemolo-limone-aglio.jpg',
  'PANNA COTTA': 'https://www.ocado.com/images-v3/eafa5127-d256-497b-9609-4869092accd6/f2548f8e-fdd3-48f1-9e2b-2f0a42e9eee6/800x800.jpg',
  'TIRAMISU': 'https://popmenucloud.com/cdn-cgi/image/width%3D1920%2Cheight%3D1920%2Cformat%3Dauto%2Cfit%3Dscale-down/zgtovjdi/872a5efa-3067-48df-8a2d-4275f2378799.jpg'
}
const normalizeDishName = (name: string) => name.toUpperCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
const fallbackDishImage = (category: string) => /PIZZA|PIZZE|FOCACCIA/i.test(category) ? '/images/dishes/pizza-base.webp' : /PASTA|RISOTTO|RAVIOLI|GNOCCHI/i.test(category) ? '/images/dishes/lobster-ravioli.webp' : /PESCE|FISH|SEAFOOD|CEVICHE/i.test(category) ? '/images/dishes/seafood-salad.webp' : /DOLCI|DESSERT|GELATO/i.test(category) ? '/images/dishes/artisanal-gelato.webp' : /POLLO|CHICKEN|CARNE|BEEF|MANZO|SUINO/i.test(category) ? '/images/dishes/burger-assembled.webp' : '/images/dishes/seafood-salad.webp'
export const menuImageFor = (name: string, category: string) => {
  const normalized = normalizeDishName(name)
  if (normalized.startsWith('FRITTURA DI GAMBERI E CALAMARI')) return fallbackDishImage(category)
  const exact = Object.entries(exactDishImages).find(([key]) => normalized.startsWith(key))
  return exact?.[1] ?? fallbackDishImage(category)
}
