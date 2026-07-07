// ============================================================================
// 04-extractor.js -- LostArk Bible Custom UI
// All DOM-scraping functions (extractGear, extractAccessories, extractBracelet,
// extractStone, extractEngravings, extractGems, extractSkills, extractArkPassive,
// extractArkGrid + hoverCapture, extractCombatPowerBreakdown). This is the layer
// expected to shrink over time as parsePayload() (SSR payload, separate project)
// takes over fields one at a time -- see Claude_B.log for current payload coverage.
// Depends on: 02-maps.js (GEM_MAP via getGemFromSrc), 03-utils.js (findByText,
// detectSpec, detectEsther, etc.), 00-payload-parser.js (extractRawPayload,
// parsePayload -- must load BEFORE this file).
//
// PAYLOAD INTEGRATION STATUS:
// - gear:  payload-first, DOM fallback. Validated against real payload data.
//          No color/tier concerns -- gear cards don't have roll-quality colors.
// - stone: payload-first for structure (name/level/tier), DOM fallback. Color
//          is NOT taken from payload or DOM -- it's computed via
//          STONE_LEVEL_COLOR (02-maps.js) keyed by invested node count.
// - engravings: payload-first, DOM fallback. `grade` from payload is
//          confirmed reliable -- color resolved via ENGRAVING_GRADE_COLOR
//          (02-maps.js), NOT via payload's own domColor field (which is
//          progress-based, not rarity-based, and doesn't match what this
//          skin wants to display).
// - gems:  payload-first, DOM fallback. Field names/values fully compatible,
//          no gaps.
// - arkPassive: payload-first, DOM fallback. Computed ONCE early in
//          extractCharacterData() (before spec detection) so detectSpec()
//          and the final `arkPassive` field always read the same source --
//          never DOM for one and payload for the other. `iconUrl` per node
//          is always null from payload (known gap, same as skill icons).
// - accessories, bracelet: DOM-ONLY, by decision. Roll-quality colors for
//          these two domains must match the live site exactly, and the color
//          calculation logic differs between payload's resolveStat()/
//          resolveBraceletEffect() and what the site actually renders (see
//          project notes on STAT_TIER_COLOR palette investigation). Rather
//          than reconcile two color systems, colors stay 100% DOM-bypass for
//          these two -- parsePayload().accessories/.bracelet are computed but
//          intentionally UNUSED here.
// - skills, cards, arkGrid, combatPowerBreakdown: still DOM-only, payload
//          integration pending. Known gaps: skill/rune icon URLs, ark grid
//          gem/core icon+color, card art+awakening all resolve to null in
//          the payload and must stay DOM/bypass-based.
// ============================================================================

  // PAYLOAD_MAPS: loaded once per page load via GM_getResourceText (synchronous,
  // no network call -- Tampermonkey downloads maps.json when the script itself
  // is installed/updated, keyed off @version in loader.user.js). Falls back to
  // null (triggering DOM extraction) if the resource isn't available for any
  // reason -- e.g. running outside Tampermonkey, or @resource not declared.
  const PAYLOAD_MAPS = (function() {
    try {
      var text = (typeof GM_getResourceText === 'function') ? GM_getResourceText('mapsData') : null;
      return text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn('[Extractor] Could not load maps.json resource -- payload extraction disabled, using DOM only.', e);
      return null;
    }
  })();

  // =============================================================================
  // EXTRACTOR -- CHARACTER INFO
  // This section is responsible for feeding the character header data to the new UI.
  // It works by reading the hydrated SvelteKit DOM elements that contain the character
  // name, title, region, server and class from the badge elements at the top of the page.
  // Combat power color is used to determine if the character is a support or DPS.
  // Guild and stronghold are found by checking the parent text of leaf elements.
  // =============================================================================

  async function extractCharacter() {
    try {
      const name = document.querySelector('.text-3xl.font-bold')?.textContent.trim();
      const title = document.querySelector('.font-medium.text-neutral-300')?.textContent.trim();
      const badges = [...document.querySelectorAll('.rounded-sm.bg-neutral-900.px-2.py-1.text-sm')]
        .map(el => el.textContent.trim());
      const region = badges[0] || null;
      const server = badges[1] || null;
      const className = badges[2] || null;
      const combatPowerEl = document.querySelector('.text-green-400.text-xl') || document.querySelector('.text-red-400.text-xl') || document.querySelector('.cursor-default.text-xl');
      const combatPower = parseFloat((combatPowerEl?.textContent.trim() || '0').replace(/[^0-9.]/g, ''));
      const combatPowerColor = combatPowerEl?.className.includes('text-green-400') ? 'support' : 'dps';
      const currentCP = null; // captured separately after render

      let guild = null;
      let stronghold = null;
      [...document.querySelectorAll('*')]
        .filter(el => el instanceof HTMLElement && el.children.length === 0 && el.textContent.trim().length < 80)
        .forEach(el => {
          const parentText = el.parentElement?.textContent.toLowerCase() || '';
          if (parentText.includes('guild:') && !el.textContent.includes('Guild:')) guild = el.textContent.trim();
          if (parentText.includes('stronghold:') && !el.textContent.includes('Stronghold:')) stronghold = el.textContent.trim();
        });

      const numericEls = [...document.querySelectorAll('*')]
        .filter(el => el instanceof HTMLElement && el.children.length === 0 &&
          el.textContent.trim().match(/^Lv\.\s*\d+$|^\d{4}(\.\d+)?$/) &&
          el.textContent.trim().length < 20)
        .map(el => el.textContent.trim());
      const level = numericEls.find(t => t.startsWith('Lv.')) || null;
      const ilvl = numericEls.find(t => t.match(/^\d{4}$/)) || null;

      return { name, region, server, class: className, title, level, ilvl, combatPower, combatPowerColor, guild, stronghold };
    } catch (e) {
      console.error('[Extractor] extractCharacter failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR -- GEAR
  // This section is responsible for feeding the gear data to the new UI.
  // It works by reading the equipment-grid container which holds all gear slots
  // at fixed indices: Head(0), Shoulder(2), Chest(4), Pants(6), Gloves(8), Weapon(10).
  // Each slot returns: slot name, hone level, advanced hone (if present), tier, quality, ilvl.
  // Advanced hone is detected when the slot has 6 text elements instead of 5.
  // =============================================================================

  function extractGear() {
    try {
      const grid = document.querySelector('.equipment-grid');
      if (!grid) return [];
      const items = [...grid.querySelectorAll('.no-row-on-large')];
      return [0, 2, 4, 6, 8, 10].map(i => {
        const item = items[i];
        if (!item) return null;
        const texts = [...item.querySelectorAll('*')]
          .filter(el => el.children.length === 0 && el.textContent.trim().length > 0)
          .map(el => el.textContent.trim())
          .filter(t => t.length < 50);
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

  // =============================================================================
  // EXTRACTOR -- ACCESSORIES
  // This section is responsible for feeding the accessory data to the new UI.
  // It works by reading the equipment-grid at fixed indices for accessories:
  // Necklace(1), Earring(3), Earring(5), Ring(7), Ring(9).
  // Each accessory returns: slot, tier, quality, enhance type+level, and stat lines.
  // Stat lines include the full name and roll quality (high = orange, mid = blue)
  // based on the border color class found on each stat element.
  // =============================================================================

  function extractAccessories() {
    try {
      const grid = document.querySelector('.equipment-grid');
      if (!grid) return [];
      const items = [...grid.querySelectorAll('.no-row-on-large')];
      return [1, 3, 5, 7, 9].map(i => {
        const item = items[i];
        if (!item) return null;
        const slot = item.querySelector('.font-semibold')?.textContent.trim();
        const tier = item.querySelector('[title="Tier 4"]')?.textContent.trim();
        const quality = parseInt(item.querySelector('[class*="rounded-full"][class*="border-transparent"]')?.textContent.trim() || '0');
        const enhanceRaw = item.querySelector('[title*="+"]')?.getAttribute('title') || '';
        const enhanceMatch = enhanceRaw.match(/^(.+?)\s+\+(\d+)$/);
        const enhance = enhanceMatch ? { type: enhanceMatch[1], level: parseInt(enhanceMatch[2]) } : null;
        const stats = [...item.querySelectorAll('[class*="border-l-2"]')]
          .map(el => {
            const cls = el.className;
            const rollQuality = cls.includes('EA6811') ? 'high' : cls.includes('DF18E3') ? 'mid' : 'low';
            const valEl = [...el.querySelectorAll('span')].find(s => s.style.color);
            return { name: el.innerText.trim(), rollQuality, domColor: valEl?.style.color || null };
          });
        return { slot, tier, quality, enhance, stats };
      }).filter(Boolean);
    } catch (e) {
      console.error('[Extractor] extractAccessories failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR -- BRACELET
  // This section is responsible for feeding the bracelet data to the new UI.
  // It works by finding the Bracelet label in the DOM and navigating up to its
  // container, then reading each stat line. Each stat includes its full text and
  // whether it is locked (locked stats cannot be rerolled).
  // Rolls remaining is parsed from the "0+3 rolls remaining" text format.
  // =============================================================================

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
          html: el.innerHTML,
          text: el.innerText.trim(),
          locked: !!el.querySelector('img[src*="locked"]'),
        }));
      return { tier, rollsRemaining, stats };
    } catch (e) {
      console.error('[Extractor] extractBracelet failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR -- STONE
  // This section is responsible for feeding the ability stone data to the new UI.
  // It works by reading index 11 of the equipment-grid which always holds the stone.
  // Each engraving on the stone is read from border-l-2 elements.
  // Roll quality is determined by the border color: purple = high, blue = mid.
  // =============================================================================

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
          const rollQuality = colorMatch?.[1] === 'DF18E3' ? 'high' : 'mid';
          const parts = el.innerText.trim().split('\n').map(s => s.trim()).filter(Boolean);
          const levelMatch = parts[1]?.match(/Lv\.(\d+)/);
          const gradeIconUrl = el.querySelector('img[src*="emoticon"]')?.src || el.querySelector('img[src*="engrave"]')?.src || null;
          return { name: parts[0], level: levelMatch ? parseInt(levelMatch[1]) : null, rollQuality, gradeIconUrl };
        });
      return { tier, engravings };
    } catch (e) {
      console.error('[Extractor] extractStone failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR -- ENGRAVINGS
  // This section is responsible for feeding the engraving data to the new UI.
  // It works by finding the second Engravings container in the DOM -- the first one
  // belongs to the Combat Power breakdown section and must be skipped.
  // Each engraving returns its name, book progress (x/20), and stone bonus (+3/+2).
  // The stone bonus is a separate additional effect, not added to the progress count.
  // =============================================================================

  function extractEngravings() {
    try {
      const panels = [...document.querySelectorAll('*')]
        .filter(el => el instanceof HTMLElement && el.children.length === 0 && el.textContent.trim() === 'Engravings');
      if (panels.length < 2) return [];
      const panel = panels[1].parentElement;
      return [...panel.querySelectorAll('.flex.flex-row.items-center.gap-px')]
        .map(el => {
          var colorEl = el.querySelector('[style*="color"]');
          return {
            name: colorEl?.textContent.trim(),
            domColor: colorEl?.style.color || null,
            progress: el.querySelector('.mx-1.text-xs')?.textContent.trim(),
            stoneBonus: el.querySelector('[src*="stone_symbol"] + span')?.textContent.trim() || null,
            gradeIconUrl: el.querySelector('img[src*="emoticon"]')?.src || el.querySelector('img[src*="engrave"]')?.src || null,
            stoneIconUrl: el.querySelector('img[src*="stone_symbol"]')?.src || null,
          };
        })
        .filter(e => e.name);
    } catch (e) {
      console.error('[Extractor] extractEngravings failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR -- GEMS
  // This section is responsible for feeding the gems panel data to the new UI.
  // It works by finding the Gems section header and reading all tooltip trigger
  // elements inside it. Each gem returns the skill it is socketed to, its type
  // (attack or time/cooldown) from the gem symbol image src, and its level.
  // =============================================================================

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
          const typeMatch = el.querySelector('img[src*="gemsymbol"]')?.getAttribute('src')?.match(/gemsymbol_(\w+)/);
          const level = parseInt(el.querySelector('.text-xs.font-bold')?.textContent.replace('Lv. ', '') || '0');
          return { skill, type: typeMatch?.[1] || null, level };
        })
        .filter(g => g.skill);
    } catch (e) {
      console.error('[Extractor] extractGems failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR -- SKILLS
  // This section is responsible for feeding the skills data to the new UI.
  // It works by finding all skill grid containers (there are 2, each holding 4 skills).
  // Each skill occupies 5 consecutive children in the grid:
  //   [0] name + level row
  //   [1] tripod numbers row
  //   [2] rune row
  //   [3] gem slot 1 (attack gem)
  //   [4] gem slot 2 (time/cooldown gem)
  // Gem images are resolved using GEM_MAP via the image src pattern.
  // =============================================================================


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
          const nameRow   = children[i];
          const tripodRow = children[i+1];
          const runeRow   = children[i+2];
          const gem1Row   = children[i+3];
          const gem2Row   = children[i+4];

          const name = nameRow?.querySelector('.truncate')?.textContent.trim();
          if (!name) continue;

          const level   = parseInt(nameRow?.querySelector('.bg-surface-800')?.textContent.replace('Lv. ','') || '0');
          const iconUrl = nameRow?.querySelector('img[alt]')?.src || null;
          const runeText    = runeRow?.textContent.trim() || '';
          const rune        = runeText === 'No rune' ? null : (runeText || null);
          const runeIconUrl = runeRow?.querySelector('img')?.src || null;
          // Rune rarity color: same bypass pattern as ark grid gem/core --
          // the site renders rarity as a gradient on the slot element that
          // wraps the icon (img[class*="h-full"]), not a mappable ID.
          const runeSlotEl = runeRow?.querySelector('img[class*="h-full"]')?.parentElement;
          const runeBg = runeSlotEl?.getAttribute('style') || '';
          const runeColorMatches = runeBg.match(/#[0-9a-fA-F]{6}/g);
          const runeRarityColor = runeColorMatches ? runeColorMatches[runeColorMatches.length-1] : null;

          // Tripods: string like "332" → parse to array of {number, color}
          // tier 1=blue, tier 2=green, tier 3=gold (by position in string)
          const TRIPOD_COLORS = ['blue','green','gold'];
          const tripodStr = tripodRow?.textContent.trim() || '';
          const tripods = tripodStr.split('').map(function(ch, ti) {
            var n = parseInt(ch);
            return isNaN(n) ? null : { number: n, color: TRIPOD_COLORS[ti] || 'blue' };
          }).filter(Boolean);

          // Gems via GEM_MAP -- icon displayed using our CDR/DMG symbols
          const gems = [gem1Row, gem2Row].map(row => {
            const img = row?.querySelector('.size-6.rounded-sm img');
            if (!img) return null;
            const src = img.src || '';
            const key = src.match(/use_\d+_\d+/)?.[0];
            const mapped = key && GEM_MAP[key] ? GEM_MAP[key] : null;
            return mapped ? { type: mapped.type, level: mapped.level, src } : null;
          }).filter(Boolean);

          skills.push({ name, level, iconUrl, tripods, rune, runeIconUrl, runeRarityColor, gems });
        }
      });
      return skills;
    } catch(e) {
      console.error('[Extractor] extractSkills failed:', e);
      return [];
    }
  }


    function extractCards() {
    try {
      // Find cards by img src pattern -- works regardless of DOM structure
      const cardImgs = [...document.querySelectorAll('img')]
        .filter(img => /card_(epic|legend|rare|normal|uncommon)/.test(img.src));
      if (!cardImgs.length) return null;

      // Container is grandparent of first card img
      const container = cardImgs[0]?.parentElement?.parentElement;
      if (!container) return null;

      // Sets text from nearby "Cards" header
      const cardsHeader = [...document.querySelectorAll('*')]
        .find(el => typeof el.className === 'string' && el.className.includes('font-bold') && el.textContent.trim() === 'Cards');
      const sets = [...(cardsHeader?.parentElement?.querySelectorAll('.flex.divide-x span')||[])].map(el => el.textContent.trim());

      const GRADE_MAP = { tooltip1:'uncommon', tooltip2:'rare', tooltip3:'epic', tooltip4:'legendary' };

      const cards = [...container.children].map(el => {
        const name = el.getAttribute('title') || '';
        if (!name || name.length < 2) return null;

        const allImgs = [...el.querySelectorAll('img')];
        const artUrl = allImgs.find(img => /card_(epic|legend|rare|normal|uncommon)/.test(img.src))?.src || null;
        const gradeKey = (allImgs.find(img => img.src.includes('grade'))?.src || '').match(/tooltip(\d)/)?.[0];
        const grade = GRADE_MAP[gradeKey] || 'legendary';

        // Full bypass: capture awakening container HTML directly from site
        const awakeContainer = [...el.querySelectorAll('*')].find(
          e => typeof e.className === 'string' && e.className.includes('aspect-') && e.className.includes('overflow-hidden')
        );
        const awakeHtml = awakeContainer ? awakeContainer.outerHTML : '';

        return { name, grade, artUrl, awakeHtml };
      }).filter(Boolean);

      return { sets, cards };
    } catch (e) {
      console.error('[Extractor] extractCards failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR -- ARK PASSIVE
  // This section is responsible for feeding the Ark Passive data to the new UI.
  // It works by finding the Ark Passive section and reading the 3 subsections:
  // Evolution, Enlightenment and Leap -- each with their total points invested
  // and the list of passive nodes unlocked (tier + name).
  // NOTE: The Enlightenment data is also used by detectSpec() to determine the
  // character's active spec. extractArkPassive() is called once and reused.
  // =============================================================================

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
            el.className.includes('text-sky-200') || el.className.includes('text-sky-300') ||
            el.className.includes('text-green-200') || el.className.includes('text-lime-300')) &&
          el.className.includes('font-semibold'));
      const result = {};
      sectionEls.forEach(el => {
        const name = el.textContent.trim().split(' ')[0].toLowerCase();
        const points = parseInt(el.querySelector('span')?.textContent.trim() || '0');
        const passives = [...(el.nextElementSibling?.querySelectorAll('.flex.items-center.gap-2.text-sm') || [])]
          .map(p => ({
            tier: p.querySelector('.rounded-sm.bg-surface-800')?.textContent.trim(),
            name: p.querySelector('.max-w-64')?.textContent.trim(),
            iconUrl: p.querySelector('img')?.src || null,
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

  // =============================================================================
  // EXTRACTOR -- ARK GRID
  // This section is responsible for feeding the Ark Grid data to the new UI.
  // It works by finding the Ark Grid section and reading the right column list
  // which contains each core (skill + points + gem type: Order/Chaos Sun/Moon/Star)
  // and the bonus lines accumulated from gem lapidation (level + name + percent).
  // Ark Grid is optional -- returns null if the character does not have it yet.
  // =============================================================================

  // Helper: simulate hover and capture tooltip with polling retry
  function hoverCapture(el) {
    return new Promise(function(resolve) {
      ['pointerenter','mouseover','mouseenter'].forEach(function(evt) {
        el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true }));
      });
      var attempts = 0;
      var maxAttempts = 20; // 20 * 100ms = 2s max wait
      var interval = setInterval(function() {
        attempts++;
        var tooltip = [...document.querySelectorAll('*')]
          .find(function(t) {
            return typeof t.className === 'string' &&
              t.className.includes('z-50') &&
              t.className.includes('rounded-lg') &&
              t.className.includes('bg-neutral-800') &&
              t.textContent.includes('Willpower') &&
              t.textContent.length < 500;
          });
        if (tooltip || attempts >= maxAttempts) {
          clearInterval(interval);
          var text = tooltip?.innerText || '';
          var iconUrl = tooltip?.querySelector('img[src*="use_"]')?.src || null;
          ['pointerleave','mouseout','mouseleave'].forEach(function(evt) {
            el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true }));
          });
          setTimeout(function() { resolve({ text, iconUrl }); }, 100);
        }
      }, 100);
    });
  }

  async function extractArkGrid() {
    try {
      const arkGridHeader = findByText('Ark Grid');
      if (!arkGridHeader) return null;
      const container = arkGridHeader.parentElement;
      const gridContent = container.children[1];
      const leftCol  = gridContent?.children[0];
      const rightCol = gridContent?.children[1];
      const inner    = leftCol?.children[0];

      // Right col: cores list
      const coreEls = [...(rightCol?.querySelectorAll('[data-melt-tooltip-trigger]') || [])];
      const cores = coreEls.map(el => {
        const name = el.querySelector('font')?.textContent.trim();
        const points = parseInt(el.querySelector('span')?.textContent.trim() || '0');
        const gemImg = el.querySelector('img[class*="h-full"]');
        const gemIconUrl = gemImg?.src || null;
        const allImgs = [...el.querySelectorAll('img')];
        const typeImg = allImgs.find(i => i.src.includes('emoticon_arkgrid'));
        const typeIconUrl = typeImg?.src || null;
        const typeFromImg = typeImg?.src.match(/emoticon_arkgrid_(.+)\.png/)?.[1]
          ?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || null;
        const type = typeFromImg || '';
        const coreSlotEl = el.querySelector('img[class*="h-full"]')?.parentElement;
          const coreBg = coreSlotEl?.getAttribute('style') || '';
          const coreColors = coreBg.match(/#[0-9a-fA-F]{6}/g);
          const coreRarityColor = coreColors ? coreColors[coreColors.length-1] : null;
          return { name, points, type, gemIconUrl, typeIconUrl, rarityColor: coreRarityColor, gems: [] };
      }).filter(c => c.name);

      // Wait for page to be fully ready before starting hover simulation
      await new Promise(function(r){ setTimeout(r, 500); });

      // Left col groups: one per core, triggers 1-4 are gems
      const groups = [...(inner?.children || [])];
      for (let gi = 0; gi < Math.min(groups.length, cores.length); gi++) {
        const triggers = [...groups[gi].querySelectorAll('[data-melt-tooltip-trigger]')];
        const gemTriggers = triggers.slice(1); // skip first (core itself)
        for (const trigger of gemTriggers) {
          // Wait for any previous tooltip to fully dismiss
          await new Promise(function(r){ setTimeout(r, 150); });
          // Scroll element into view before hover to ensure it's in viewport
          trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
          await new Promise(function(r){ setTimeout(r, 50); });
          const { text, iconUrl } = await hoverCapture(trigger);
          if (!text) continue;
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          const gemName = lines[0] || '';
          const wpLine  = lines.find(l => l.match(/^\d/)) || '';
          const willpower = wpLine.split(' ')[0] || '';
          const ptLine  = lines.find(l => l.toLowerCase().includes('points:'));
          const ptIdx   = ptLine ? lines.indexOf(ptLine) : -1;
          const orderPoints = ptIdx >= 0 ? (lines[ptIdx + 1] || '') : '';
          const gemIconUrl = iconUrl || trigger.querySelector('img[class*="h-full"]')?.src || null;
          const slotEl2 = trigger.querySelector('img[class*="h-full"]')?.parentElement;
          const bgStyle2 = slotEl2?.getAttribute('style') || '';
          const colorMatches2 = bgStyle2.match(/#[0-9a-fA-F]{6}/g);
          const rarityColor2 = colorMatches2 ? colorMatches2[colorMatches2.length-1] : null;
          cores[gi].gems.push({ name: gemName, willpower, orderPoints, gemIconUrl, rarityColor: rarityColor2 });
        }
      }

      const bonuses = [...container.querySelectorAll('.mr-3.ml-2.flex.flex-row.flex-wrap')]
        .map(el => {
          const parts = el.innerText.trim().split('\n');
          const level = parseInt(parts[0]?.replace('Lv. ', '') || '0');
          const bonusText = parts[1] || '';
          const plusIndex = bonusText.lastIndexOf('+');
          return {
            level,
            name: bonusText.slice(0, plusIndex).trim(),
            percent: bonusText.slice(plusIndex).trim(),
          };
        })
        .filter(b => b.name);
      return { cores, bonuses };
    } catch (e) {
      console.error('[Extractor] extractArkGrid failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR -- COMBAT POWER BREAKDOWN
  // This section is responsible for feeding the combat power breakdown to the new UI.
  // It works by finding all green percentage elements on the page and pairing each
  // with its label from the previous sibling element.
  // Returns an object mapping system name to its % contribution.
  // =============================================================================

  function extractCombatPowerBreakdown() {
    try {
      const items = [...document.querySelectorAll('.text-green-400')]
        .map(el => ({
          label: el.closest('div')?.previousElementSibling?.textContent.trim(),
          value: el.textContent.trim(),
        }))
        .filter(b => b.label && b.label.length < 30);
      const breakdown = {};
      items.forEach(({ label, value }) => { breakdown[label] = value; });
      return breakdown;
    } catch (e) {
      console.error('[Extractor] extractCombatPowerBreakdown failed:', e);
      return {};
    }
  }

  // =============================================================================
  // MAIN EXTRACTOR
  // This is the main orchestrator that calls all individual extractors and
  // assembles the final data object consumed by the renderer.
  // extractArkPassive() is called first and reused for spec detection to avoid
  // reading the DOM twice for the same data.
  // After extraction, character is enriched with: spec, isSupport, archetype,
  // armorType and weaponType -- all needed by the renderer for asset loading.
  // =============================================================================

  async function extractCharacterData() {
    console.log('[LostArk UI] Extracting character data...');
    const character = await extractCharacter();

    // Payload parsed FIRST, before ark passive / spec detection -- this
    // guarantees detectSpec() and the final `arkPassive` field always read
    // from the SAME source (both DOM or both payload), never mixed.
    let payloadParsed = null;
    if (PAYLOAD_MAPS) {
      try {
        const raw = extractRawPayload();
        payloadParsed = parsePayload(raw, PAYLOAD_MAPS);
      } catch (e) {
        console.warn('[Extractor] Payload extraction failed -- falling back to DOM.', e);
      }
    }

    const arkPassive = payloadParsed ? payloadParsed.arkPassive : extractArkPassive();

    if (character) {
      character.spec = detectSpec(character.class, arkPassive);
      character.isSupport = SUPPORT_SPECS.includes(character.spec);
      character.archetype = ARCHETYPE_MAP[character.class] || null;
      character.armorType = ARMOR_TYPE_MAP[character.class] || null;
      character.weaponType = getWeaponType(character.class, character.spec);
    }

    const data = {
      character,
      gear:        payloadParsed ? payloadParsed.gear : extractGear(),
      accessories: extractAccessories(), // DOM-only: roll-quality color must match live site bypass, not payload-computed tier
      bracelet:    extractBracelet(),    // DOM-only: same reason as accessories
      stone:       payloadParsed ? payloadParsed.stone : extractStone(),
      engravings: payloadParsed
        ? (function() {
            // grade is confirmed reliable from payload -- resolve color here
            // (skin-owned lookup, per project convention: extractor passes
            // through raw data, 02-maps.js owns the grade->color table).
            // gradeIconUrl/stoneIconUrl aren't in the payload (no icon
            // resolution there), so we run the DOM extractor too, just to
            // source those two icon fields, matched by array index -- payload
            // order and on-site display order were validated to match
            // (see project notes: 5-engraving test case, exact name-order match).
            const domEngravings = extractEngravings();
            return payloadParsed.engravings.map(function(e, i) {
              const domMatch = domEngravings[i] || {};
              return Object.assign({}, e, {
                domColor:     ENGRAVING_GRADE_COLOR[e.grade] || null,
                gradeIconUrl: domMatch.gradeIconUrl || null,
                stoneIconUrl: domMatch.stoneIconUrl || null,
              });
            });
          })()
        : extractEngravings(),
      gems: payloadParsed ? payloadParsed.gems : extractGems(),
      skills: extractSkills(),
      cards: extractCards(),
      arkPassive: payloadParsed
        ? (function() {
            // Same icon-merge strategy as engravings: payload has no iconUrl,
            // DOM extractor does. Matched by index WITHIN each tree
            // (evolution/enlightenment/leap), since node order within a tree
            // should match the on-site display order for that tree.
            const domArkPassive = extractArkPassive() || {};
            const trees = ['evolution', 'enlightenment', 'leap'];
            const merged = {};
            trees.forEach(function(tree) {
              const payloadTree = (arkPassive || {})[tree] || { points: 0, passives: [] };
              const domTree = domArkPassive[tree] || { passives: [] };
              merged[tree] = {
                points: payloadTree.points,
                passives: payloadTree.passives.map(function(p, i) {
                  const domMatch = domTree.passives[i] || {};
                  return Object.assign({}, p, { iconUrl: domMatch.iconUrl || null });
                }),
              };
            });
            return merged;
          })()
        : arkPassive,
      arkGrid: await extractArkGrid(),
      combatPowerBreakdown: extractCombatPowerBreakdown(),
    };

    console.log('[LostArk UI] Extraction complete:', data);
    return data;
  }

  // =============================================================================
  // RENDERER
  // This section is responsible for taking the extracted data and injecting it
  // into the custom UI (mockup HTML).
  // Asset paths are built using ASSETS_URL + folder structure + file naming conventions.
  // This is a skeleton -- connect to the mockup HTML elements as sections are completed.
  // =============================================================================
