import { ALL_ITEMS, itemCategory } from '../src/lib/game/items';
console.log('Total:', ALL_ITEMS.length);

// Тестируем распределение по слотам
const slotCount = new Map<string, number>();
for (const item of ALL_ITEMS) {
  const cat = itemCategory(item.id);
  slotCount.set(cat, (slotCount.get(cat) ?? 0) + 1);
}
for (const [k, v] of slotCount) console.log(k, ':', v);

// Тестируем статы для примера
console.log('\n--- примеры стат ---');
const samples = [
  ALL_ITEMS.find(i => i.name.includes('меч') && i.rarity === 'epic'),
  ALL_ITEMS.find(i => i.name.includes('щит') && i.rarity === 'rare'),
  ALL_ITEMS.find(i => i.name.includes('сапоги') && i.rarity === 'legendary'),
  ALL_ITEMS.find(i => i.name.includes('амулет') && i.rarity === 'uncommon'),
  ALL_ITEMS.find(i => i.name.includes('зелье') && i.rarity === 'common'),
].filter(Boolean);
for (const s of samples) {
  console.log(s!.name, '|', s!.rarity, '|', s!.slot, '|', JSON.stringify(s!.stats));
}
