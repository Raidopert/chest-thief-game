import { ALL_ITEMS, ITEMS_BY_RARITY, TOTAL_ITEMS } from '../src/lib/game/items';
console.log('Total items:', TOTAL_ITEMS);
for (const [r, items] of Object.entries(ITEMS_BY_RARITY)) {
  console.log(r, items.length, '| first:', items[0]?.name, '| last:', items[items.length-1]?.name);
}
