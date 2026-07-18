import type { MenuCategory, MenuItem } from '@/types/domain';

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-coffee', name: 'Coffee & hot', count: 14, station: 'drinks' },
  { id: 'cat-cold', name: 'Cold drinks', count: 9, station: 'drinks' },
  { id: 'cat-breakfast', name: 'Breakfast', count: 12, station: 'main' },
  { id: 'cat-sandwiches', name: 'Sandwiches', count: 8, station: 'main' },
  { id: 'cat-mains', name: 'Mains', count: 18, station: 'main' },
  { id: 'cat-bbq', name: 'BBQ & grill', count: 11, station: 'bbq' },
  { id: 'cat-sides', name: 'Sides', count: 7, station: 'main' },
  { id: 'cat-desserts', name: 'Desserts', count: 6, station: 'main' },
];

export const MENU_ITEMS: MenuItem[] = [
  // Coffee & hot → drinks
  { id: 'itm-cappuccino', name: 'Cappuccino', description: 'Double shot, 6 oz', price: 480, station: 'drinks', categoryId: 'cat-coffee' },
  { id: 'itm-latte', name: 'Café latte', description: 'Double shot, 8 oz', price: 520, station: 'drinks', categoryId: 'cat-coffee' },
  { id: 'itm-espresso', name: 'Espresso', description: 'Single shot', price: 320, station: 'drinks', categoryId: 'cat-coffee' },
  { id: 'itm-karak', name: 'Karak chai', description: 'Cardamom, milk', price: 250, station: 'drinks', categoryId: 'cat-coffee' },
  { id: 'itm-turkish', name: 'Turkish coffee', description: 'Cezve, unfiltered', price: 550, station: 'drinks', categoryId: 'cat-coffee' },
  {
    id: 'itm-matcha',
    name: 'Matcha latte',
    description: 'Ceremonial grade, oat milk',
    price: 620,
    station: 'drinks',
    categoryId: 'cat-coffee',
    outOfStock: true,
    outOfStockReason: 'Out of stock — matcha powder',
  },

  // Cold drinks → drinks
  { id: 'itm-iced-americano', name: 'Iced americano', description: 'Double shot over ice', price: 420, station: 'drinks', categoryId: 'cat-cold' },
  { id: 'itm-mint-lemonade', name: 'Mint lemonade', description: 'Fresh mint, lime', price: 230, station: 'drinks', categoryId: 'cat-cold' },
  { id: 'itm-fresh-lime', name: 'Fresh lime soda', description: 'Sweet or salted', price: 200, station: 'drinks', categoryId: 'cat-cold' },
  { id: 'itm-mango-lassi', name: 'Mango lassi', description: 'Seasonal, thick', price: 320, station: 'drinks', categoryId: 'cat-cold' },

  // Breakfast → main
  { id: 'itm-halwa-puri', name: 'Halwa puri', description: 'Two puri, channa, halwa', price: 480, station: 'main', categoryId: 'cat-breakfast' },
  { id: 'itm-anda-paratha', name: 'Anda paratha', description: 'Egg, flaky paratha', price: 360, station: 'main', categoryId: 'cat-breakfast' },
  { id: 'itm-omelette', name: 'Masala omelette', description: 'Three egg, chillies', price: 320, station: 'main', categoryId: 'cat-breakfast' },

  // Sandwiches → main
  { id: 'itm-club', name: 'Club sandwich', description: 'Triple decker, fries', price: 620, station: 'main', categoryId: 'cat-sandwiches' },
  { id: 'itm-grilled-chicken', name: 'Grilled chicken sandwich', description: 'Ciabatta, slaw', price: 680, station: 'main', categoryId: 'cat-sandwiches' },

  // Mains → main
  { id: 'itm-chicken-karahi', name: 'Chicken karahi', description: 'Half kg, bone-in', price: 1180, station: 'main', categoryId: 'cat-mains' },
  { id: 'itm-chicken-handi', name: 'Chicken handi', description: 'Creamy, boneless', price: 890, station: 'main', categoryId: 'cat-mains' },
  { id: 'itm-biryani', name: 'Chicken biryani', description: 'Single plate, raita', price: 560, station: 'main', categoryId: 'cat-mains' },
  { id: 'itm-daal-fry', name: 'Daal fry', description: 'Tarka, coriander', price: 380, station: 'main', categoryId: 'cat-mains' },
  { id: 'itm-naan', name: 'Naan', description: 'Tandoor, plain', price: 40, station: 'main', categoryId: 'cat-mains' },
  { id: 'itm-raita', name: 'Raita', description: 'Mint, cucumber', price: 120, station: 'main', categoryId: 'cat-mains' },

  // BBQ & grill → bbq
  { id: 'itm-chicken-tikka', name: 'Chicken tikka', description: 'Half plate, 4 pcs', price: 890, station: 'bbq', categoryId: 'cat-bbq' },
  { id: 'itm-beef-bihari', name: 'Beef bihari', description: 'Skewers, 3 pcs', price: 1140, station: 'bbq', categoryId: 'cat-bbq' },
  { id: 'itm-seekh-kebab', name: 'Seekh kebab', description: 'Beef, 4 sticks', price: 980, station: 'bbq', categoryId: 'cat-bbq' },
  { id: 'itm-malai-boti', name: 'Malai boti', description: 'Chicken, 6 pcs', price: 920, station: 'bbq', categoryId: 'cat-bbq' },

  // Sides → main
  { id: 'itm-fries', name: 'Masala fries', description: 'Crisp, chaat masala', price: 280, station: 'main', categoryId: 'cat-sides' },
  { id: 'itm-salad', name: 'Kachumber salad', description: 'Onion, tomato, lime', price: 220, station: 'main', categoryId: 'cat-sides' },

  // Desserts → main
  { id: 'itm-gulab-jamun', name: 'Gulab jamun', description: 'Two pieces, warm', price: 340, station: 'main', categoryId: 'cat-desserts' },
  { id: 'itm-cheesecake', name: 'Cheesecake', description: 'Baked, seasonal fruit', price: 480, station: 'main', categoryId: 'cat-desserts' },
];
