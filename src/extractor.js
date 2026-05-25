/**
 * LostArk Bible — DOM Extractor
 * Extracts character data from the LostArk Bible DOM (SvelteKit hydrated)
 * and returns a structured JSON object for use by the renderer.
 */

// =============================================================================
// GEM MAP
// Maps image src IDs to gem name, type, and level
// =============================================================================

const GEM_MAP = {
  // Doomfire (attack/dmg)
  'use_12_102': { name: 'Doomfire', type: 'attack', level: 7 },
  'use_12_103': { name: 'Doomfire', type: 'attack', level: 8 },
  'use_12_104': { name: 'Doomfire', type: 'attack', level: 9 },
  'use_12_105': { name: 'Doomfire', type: 'attack', level: 10 },
  // Blazing (cd/time)
  'use_12_112': { name: 'Blazing', type: 'time', level: 7 },
  'use_12_113': { name: 'Blazing', type: 'time', level: 8 },
  'use_12_114': { name: 'Blazing', type: 'time', level: 9 },
  'use_12_115': { name: 'Blazing', type: 'time', level: 10 },
  // Brilliant (both dmg and cd — same ID per level, type inferred by slot)
  'use_13_51': { name: 'Brilliant', level: 6 },
  'use_13_52': { name: 'Brilliant', level: 7 },
  'use_13_53': { name: 'Brilliant', level: 8 },
  'use_13_54': { name: 'Brilliant', level: 9 },
  'use_13_55': { name: 'Brilliant', level: 10 },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Find an element by searching all elements for a specific text content.
 */
function findByText(text, filter = () => true) {
  return [...document.querySelectorAll('*')]
    .find(el => el instanceof HTMLElement &&
      el.children.length === 0 &&
      el.textContent.trim() === text &&
      filter(el));
}

/**
 * Get gem info from image src.
 */
function getGemFromSrc(src) {
  const key = src?.match(/use_\d+_\d+/)?.[0];
  return key && GEM_MAP[key] ? { ...GEM_MAP[key] } : null;
}

// =============================================================================
// EXTRACTORS
// =============================================================================

/**
 * Extract character info.
 */
function extractCharacter() {
  try {
    const name = document.querySelector('.text-3xl.font-bold')?.textContent.trim();
    const title = document.querySelector('.font-medium.text-neutral-300')?.textContent.trim();
    const pageTitle = document.title; // → "CharName (NA) | lostark.bible"
    const region = pageTitle.match(/\((\w+)\)/)?.[1] || null;

    // Combat Power
    const combatPower = parseFloat(
      document.querySelector('.text-xl.font-semibold')?.textContent.trim() || '0'
    );

    // Level and ilvl — find leaf elements with short numeric text
    const numericEls = [...document.querySelectorAll('*')]
      .filter(el =>
        el instanceof HTMLElement &&
        el.children.length === 0 &&
        el.textContent.trim().match(/^Lv\.\s*\d+$|^\d{3,4}(\.\d+)?$/) &&
        el.textContent.trim().length < 20
      )
      .map(el => el.textContent.trim());

    const level = numericEls.find(t => t.startsWith('Lv.')) || null;
    const ilvl = numericEls.find(t => t.match(/^\d{4}$/)) || null;

    // Guild and Stronghold
    const infoEls = [...document.querySelectorAll('*')]
      .filter(el =>
        el instanceof HTMLElement &&
        el.children.length === 0 &&
        el.textContent.trim().length > 0 &&
        el.textContent.trim().length < 80
      );

    let guild = null;
    let stronghold = null;

    infoEls.forEach(el => {
      const parentText = el.parentElement?.textContent.toLowerCase() || '';
      if (parentText.includes('guild:') && !el.textContent.includes('Guild:')) {
        guild = el.textContent.trim();
      }
      if (parentText.includes('stronghold:') && !el.textContent.includes('Stronghold:')) {
        stronghold = el.textContent.trim();
      }
    });

    return { name, region, title, level, ilvl, combatPower, guild, stronghold };
  } catch (e) {
    console.error('[Extractor] extractCharacter failed:', e);
    return null;
  }
}

/**
 * Extract gear (armor + weapon).
 * Slots: Head(0), Shoulder(2), Chest(4), Pants(6), Gloves(8), Weapon(10)
 */
function extractGear() {
  try {
    const grid = document.querySelector('.equipment-grid');
    if (!grid) return [];

    const items = [...grid.querySelectorAll('.no-row-on-large')];
    const gearIndices = [0, 2, 4, 6, 8, 10];

    return gearIndices.map(i => {
      const item = items[i];
      if (!item) return null;

      const texts = [...item.querySelectorAll('*')]
        .filter(el => el.children.length === 0 && el.textContent.trim().length > 0)
        .map(el => el.textContent.trim())
        .filter(t => t.length < 50);

      // With Adv Hone: [slot, +hone, tier, +advHone, quality, ilvl] (6 elements)
      // Without:       [slot, +hone, tier, quality, ilvl]           (5 elements)
      const hasAdvHone = texts.length >= 6 && texts[3]?.startsWith('+');

      return {
        slot: texts[0],
        hone: parseInt(texts[1]?.replace('+', '') || '0'),
        advHone: hasAdvHone ? parseInt(texts[3]?.replace('+', '') || '0') : null,
        tier: texts[2],
        quality: parseInt(hasAdvHone ? texts[4] : texts[3]),
        ilvl: parseInt(hasAdvHone ? texts[5] : texts[4]),
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('[Extractor] extractGear failed:', e);
    return [];
  }
}

/**
 * Extract accessories (necklace, earrings, rings).
 * Slots: Necklace(1), Earring(3), Earring(5), Ring(7), Ring(9)
 */
function extractAccessories() {
  try {
    const grid = document.querySelector('.equipment-grid');
    if (!grid) return [];

    const items = [...grid.querySelectorAll('.no-row-on-large')];
    const accIndices = [1, 3, 5, 7, 9];

    return accIndices.map(i => {
      const item = items[i];
      if (!item) return null;

      const slot = item.querySelector('.font-semibold')?.textContent.trim();
      const tier = item.querySelector('[title="Tier 4"]')?.textContent.trim();
      const quality = parseInt(item.querySelector('[class*="rounded-full"][class*="border-transparent"]')?.textContent.trim() || '0');
      const enhanceEl = item.querySelector('[title*="+"]');
      const enhanceRaw = enhanceEl?.getAttribute('title') || '';
      const enhanceMatch = enhanceRaw.match(/^(.+?)\s+\+(\d+)$/);
      const enhance = enhanceMatch
        ? { type: enhanceMatch[1], level: parseInt(enhanceMatch[2]) }
        : null;

      const stats = [...item.querySelectorAll('[class*="border-l-2"]')]
        .map(el => {
          const colorMatch = el.className.match(/border-\[#(\w+)\]/);
          const color = colorMatch?.[0];
          const rollQuality = color === 'border-[#EA6811]' ? 'high' : 'mid';
          return {
            name: el.innerText.trim(),
            rollQuality,
          };
        });

      return { slot, tier, quality, enhance, stats };
    }).filter(Boolean);
  } catch (e) {
    console.error('[Extractor] extractAccessories failed:', e);
    return [];
  }
}

/**
 * Extract bracelet.
 */
function extractBracelet() {
  try {
    const braceletEl = findByText('Bracelet');
    if (!braceletEl) return null;

    const container = braceletEl.parentElement.parentElement.parentElement.parentElement;

    const tier = container.querySelector('[title="Tier 4"]')?.textContent.trim() || null;

    const rollsEl = [...container.querySelectorAll('*')]
      .find(el => el.children.length === 0 && el.textContent.includes('rolls remaining'));
    const rollsMatch = rollsEl?.textContent.match(/(\d+)\+(\d+)/);
    const rollsRemaining = rollsMatch ? parseInt(rollsMatch[2]) : 0;

    const stats = [...container.querySelectorAll('.m-1.flex.flex-row.gap-1')]
      .map(el => ({
        text: el.innerText.trim(),
        locked: !!el.querySelector('img[src*="locked"]'),
      }));

    return { tier, rollsRemaining, stats };
  } catch (e) {
    console.error('[Extractor] extractBracelet failed:', e);
    return null;
  }
}

/**
 * Extract stone (ability stone).
 * Stone is always index 11 in the equipment grid.
 */
function extractStone() {
  try {
    const grid = document.querySelector('.equipment-grid');
    if (!grid) return null;

    const stone = [...grid.querySelectorAll('.no-row-on-large')][11];
    if (!stone) return null;

    const tier = stone.querySelector('[title="Tier 4"]')?.textContent.trim() || null;

    const engravings = [...stone.querySelectorAll('[class*="border-l-2"]')]
      .map(el => {
        const colorMatch = el.className.match(/border-\[#(\w+)\]/);
        const color = colorMatch?.[1];
        const rollQuality = color === 'DF18E3' ? 'high' : 'mid';
        const parts = el.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean);
        const name = parts[0];
        const levelMatch = parts[1]?.match(/Lv\.(\d+)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : null;
        return { name, level, rollQuality };
      });

    return { tier, engravings };
  } catch (e) {
    console.error('[Extractor] extractStone failed:', e);
    return null;
  }
}

/**
 * Extract engravings.
 * Uses the second Engravings container (first is inside Combat Power breakdown).
 */
function extractEngravings() {
  try {
    const panels = [...document.querySelectorAll('*')]
      .filter(el => el instanceof HTMLElement &&
        el.children.length === 0 &&
        el.textContent.trim() === 'Engravings');

    if (panels.length < 2) return [];

    const panel = panels[1].parentElement;

    return [...panel.querySelectorAll('.flex.flex-row.items-center.gap-px')]
      .map(el => {
        const name = el.querySelector('[style*="color"]')?.textContent.trim();
        const progress = el.querySelector('.mx-1.text-xs')?.textContent.trim();
        const stoneBonus = el.querySelector('[src*="stone_symbol"] + span')?.textContent.trim() || null;
        return { name, progress, stoneBonus };
      })
      .filter(e => e.name);
  } catch (e) {
    console.error('[Extractor] extractEngravings failed:', e);
    return [];
  }
}

/**
 * Extract gems from the main gems panel.
 */
function extractGems() {
  try {
    const gemsSection = [...document.querySelectorAll('*')]
      .find(el => el instanceof HTMLElement &&
        el.className.includes('justify-between') &&
        el.className.includes('font-bold') &&
        el.textContent.trim().startsWith('Gems'));

    if (!gemsSection) return [];

    const container = gemsSection.parentElement;

    return [...container.querySelectorAll('[data-melt-tooltip-trigger]')]
      .map(el => {
        const skill = el.querySelector('img[alt]:not([alt=""])')?.getAttribute('alt');
        const typeMatch = el.querySelector('img[src*="gemsymbol"]')
          ?.getAttribute('src')?.match(/gemsymbol_(\w+)/);
        const type = typeMatch?.[1] || null;
        const levelText = el.querySelector('.text-xs.font-bold')?.textContent.trim();
        const level = parseInt(levelText?.replace('Lv. ', '') || '0');
        return { skill, type, level };
      })
      .filter(g => g.skill);
  } catch (e) {
    console.error('[Extractor] extractGems failed:', e);
    return [];
  }
}

/**
 * Extract skills with tripods, runes, and equipped gems.
 */
function extractSkills() {
  try {
    const grids = [...document.querySelectorAll('*')]
      .filter(el => el instanceof HTMLElement &&
        el.className.includes('grid') &&
        el.className.includes('h-fit') &&
        el.className.includes('flex-1'));

    const skills = [];

    grids.forEach(grid => {
      const children = [...grid.children];
      for (let i = 0; i < children.length; i += 5) {
        const nameRow = children[i];
        const tripodRow = children[i + 1];
        const runeRow = children[i + 2];
        const gem1Row = children[i + 3];
        const gem2Row = children[i + 4];

        const name = nameRow?.querySelector('.truncate')?.textContent.trim();
        if (!name) continue;

        const level = nameRow?.querySelector('.bg-surface-800')?.textContent.trim();

        const tripodContainer = [...(tripodRow?.querySelectorAll('div') || [])]
          .find(el => el.querySelector('.size-5.rounded-full'));
        const tripods = [...(tripodContainer?.querySelectorAll('.size-5.rounded-full') || [])]
          .map(el => el.textContent.trim());

        const rune = runeRow?.querySelector('[style*="color"]')?.textContent.trim() || null;

        const gems = [gem1Row, gem2Row]
          .map(row => {
            const img = row?.querySelector('.size-6.rounded-sm img');
            if (!img) return null;
            const src = img.getAttribute('src') || '';
            return getGemFromSrc(src);
          })
          .filter(Boolean);

        skills.push({ name, level, tripods, rune, gems });
      }
    });

    return skills;
  } catch (e) {
    console.error('[Extractor] extractSkills failed:', e);
    return [];
  }
}

/**
 * Extract cards and awakening levels.
 */
function extractCards() {
  try {
    const cardsHeader = findByText('Cards');
    if (!cardsHeader) return null;

    const container = cardsHeader.parentElement;

    const sets = [...container.querySelectorAll('.flex.divide-x span')]
      .map(el => el.textContent.trim());

    const cards = [...container.querySelectorAll('[title]')]
      .filter(el => el.getAttribute('title').length > 2)
      .map(el => {
        const leftStyle = el.querySelector('[style*="left"]')?.style.left || '-100%';
        const leftVal = parseFloat(leftStyle) * -1;
        const awakening = Math.max(0, Math.min(5, Math.round(5 - leftVal / 20)));
        return {
          name: el.getAttribute('title'),
          awakening,
        };
      });

    return { sets, cards };
  } catch (e) {
    console.error('[Extractor] extractCards failed:', e);
    return null;
  }
}

/**
 * Extract Ark Passive (Evolution, Enlightenment, Leap).
 */
function extractArkPassive() {
  try {
    const arkSection = [...document.querySelectorAll('*')]
      .find(el => el instanceof HTMLElement &&
        el.className.includes('justify-between') &&
        el.className.includes('font-bold') &&
        el.textContent.trim().startsWith('Ark Passive'));

    if (!arkSection) return null;

    const container = arkSection.parentElement;

    const sectionEls = [...container.querySelectorAll('*')]
      .filter(el => el instanceof HTMLElement &&
        (el.className.includes('text-amber-200') ||
          el.className.includes('text-sky-200') ||
          el.className.includes('text-green-200')) &&
        el.className.includes('font-semibold'));

    const result = {};

    sectionEls.forEach(el => {
      const name = el.textContent.trim().split(' ')[0].toLowerCase();
      const points = parseInt(el.querySelector('span')?.textContent.trim() || '0');

      const passives = [...(el.nextElementSibling?.querySelectorAll('.flex.items-center.gap-2.text-sm') || [])]
        .map(p => ({
          tier: p.querySelector('.rounded-sm.bg-surface-800')?.textContent.trim(),
          name: p.querySelector('.max-w-64')?.textContent.trim(),
        }))
        .filter(p => p.name);

      result[name] = { points, passives };
    });

    return result;
  } catch (e) {
    console.error('[Extractor] extractArkPassive failed:', e);
    return null;
  }
}

/**
 * Extract Ark Grid (cores + bonuses).
 * Returns null if character doesn't have Ark Grid.
 */
function extractArkGrid() {
  try {
    const arkGridHeader = findByText('Ark Grid');
    if (!arkGridHeader) return null;

    const container = arkGridHeader.parentElement;

    const cols = container.querySelectorAll('.grid > div');
    const rightCol = cols[cols.length - 1];

    const cores = [...(rightCol?.querySelectorAll('[data-melt-tooltip-trigger]') || [])]
      .map(el => {
        const name = el.querySelector('font')?.textContent.trim();
        const points = parseInt(el.querySelector('span')?.textContent.trim() || '0');
        const typeImg = el.querySelector('[src*="arkgrid"]');
        const typeText = typeImg?.closest('div')?.textContent.trim().replace(/\s+/g, ' ').trim();
        const type = typeText?.replace(/^\d+\s*\|\s*/, '').trim();
        return { name, points, type };
      })
      .filter(c => c.name);

    const bonuses = [...container.querySelectorAll('.mr-3.ml-2.flex.flex-row.flex-wrap')]
      .map(el => {
        const parts = el.innerText.trim().split('\n');
        const level = parseInt(parts[0]?.replace('Lv. ', '') || '0');
        const bonusText = parts[1] || '';
        const plusIndex = bonusText.lastIndexOf('+');
        const name = bonusText.slice(0, plusIndex).trim();
        const percent = bonusText.slice(plusIndex).trim();
        return { level, name, percent };
      })
      .filter(b => b.name);

    return { cores, bonuses };
  } catch (e) {
    console.error('[Extractor] extractArkGrid failed:', e);
    return null;
  }
}

// =============================================================================
// MAIN EXTRACTOR
// =============================================================================

/**
 * Extract all character data from the LostArk Bible DOM.
 * @returns {Object} Structured character data
 */
function extractCharacterData() {
  console.log('[Extractor] Starting extraction...');

  const data = {
    character: extractCharacter(),
    gear: extractGear(),
    accessories: extractAccessories(),
    bracelet: extractBracelet(),
    stone: extractStone(),
    engravings: extractEngravings(),
    gems: extractGems(),
    skills: extractSkills(),
    cards: extractCards(),
    arkPassive: extractArkPassive(),
    arkGrid: extractArkGrid(),
  };

  console.log('[Extractor] Extraction complete:', data);
  return data;
}
