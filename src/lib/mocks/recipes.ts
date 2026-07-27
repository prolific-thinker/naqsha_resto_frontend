/**
 * KDS-1 · prep/recipe cards shown at the station. Keyed by a lowercase
 * item-name substring. In production these come from the ERPNext BOM
 * (operations + items) for the menu item — see docs/BACKEND_DOCTYPE_REQUIREMENTS.md.
 */
const RECIPES: { match: string; steps: string[] }[] = [
  { match: 'karahi', steps: ['Sear chicken on high', 'Add tomato + ginger', 'Reduce 6 min', 'Finish with green chilli'] },
  { match: 'handi', steps: ['Bhuno onions', 'Add chicken + yoghurt', 'Simmer covered 8 min', 'Cream + coriander'] },
  { match: 'tikka', steps: ['Skewer marinated pieces', 'Grill 4 min/side', 'Baste with butter', 'Rest 1 min'] },
  { match: 'boti', steps: ['Thread malai boti', 'Char over coal', 'Turn once at 3 min', 'Brush cream'] },
  { match: 'seekh', steps: ['Portion mince 90g', 'Shape on skewer', 'Grill turning often', 'Check core temp'] },
  { match: 'kabab', steps: ['Portion mince', 'Shape on skewer', 'Grill turning often', 'Check core temp'] },
  { match: 'chai', steps: ['Boil water + tea', 'Add milk + sugar', 'Bring to rolling boil', 'Strain to cup'] },
  { match: 'karak', steps: ['Boil water + tea', 'Add milk + sugar', 'Bring to rolling boil', 'Strain to cup'] },
  { match: 'cappuccino', steps: ['Pull double shot', 'Steam milk to 65°C', 'Pour micro-foam', '1cm foam cap'] },
  { match: 'lemonade', steps: ['Muddle mint', 'Add lemon + syrup', 'Top soda + ice', 'Stir gently'] },
  { match: 'naan', steps: ['Roll dough', 'Slap in tandoor', 'Bake 90s', 'Brush butter'] },
];

/** Return prep steps for an item name, or an empty array if none is defined. */
export function prepFor(itemName: string): string[] {
  const n = itemName.toLowerCase();
  return RECIPES.find((r) => n.includes(r.match))?.steps ?? [];
}
