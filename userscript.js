// ==UserScript==
// @name         LostArk Bible — Custom UI
// @namespace    https://github.com/shibiri1/lostark-bible-ui
// @version      0.1.0
// @description  Custom UI overlay for LostArk Bible — extracts character data and renders custom frontend
// @author       shibiri1
// @match        https://lostark.bible/character/*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // =============================================================================
  // ASSETS URL
  // This is the base URL for all assets stored in the GitHub repository.
  // All images (class art, backgrounds, spec icons, gear, weapons) are served
  // through jsDelivr CDN for fast and reliable delivery.
  // =============================================================================

  const ASSETS_URL = 'https://cdn.jsdelivr.net/gh/shibiri1/lostark-bible-ui@main/assets';

  // =============================================================================
  // SUPPORT SPECS
  // This list defines which specs are support-type.
  // It is used to set character.isSupport = true/false after spec detection.
  // The UI can use this flag to change visual elements (colors, layout, etc.)
  // =============================================================================

  const SUPPORT_SPECS = ['Blessed Aura', 'Desperate Salvation', 'Full Bloom', 'Liberator'];

  // =============================================================================
  // GEM MAP
  // This section is responsible for identifying gems equipped on skills.
  // It works by matching the image src found in the skills grid against known
  // gem IDs. Each entry maps a src pattern to the gem name, type and level.
  // Types: 'attack' (Doomfire) = damage gem | 'time' (Blazing) = cooldown gem
  // Brilliant gems don't have a type in the src — type is inferred by slot.
  // =============================================================================

  const GEM_MAP = {
    'use_12_102': { name: 'Doomfire', type: 'attack', level: 7 },
    'use_12_103': { name: 'Doomfire', type: 'attack', level: 8 },
    'use_12_104': { name: 'Doomfire', type: 'attack', level: 9 },
    'use_12_105': { name: 'Doomfire', type: 'attack', level: 10 },
    'use_12_112': { name: 'Blazing',  type: 'time',   level: 7 },
    'use_12_113': { name: 'Blazing',  type: 'time',   level: 8 },
    'use_12_114': { name: 'Blazing',  type: 'time',   level: 9 },
    'use_12_115': { name: 'Blazing',  type: 'time',   level: 10 },
    'use_13_51':  { name: 'Brilliant', level: 6 },
    'use_13_52':  { name: 'Brilliant', level: 7 },
    'use_13_53':  { name: 'Brilliant', level: 8 },
    'use_13_54':  { name: 'Brilliant', level: 9 },
    'use_13_55':  { name: 'Brilliant', level: 10 },
  };

  // =============================================================================
  // ARCHETYPE MAP
  // This section maps each class to its archetype group.
  // It is used by the renderer to build the correct asset path for the
  // class background vector: Art_Background/Archetype_ClassName.png
  // =============================================================================

  const ARCHETYPE_MAP = {
    'Berserker': 'Warrior',    'Paladin': 'Warrior',     'Gunlancer': 'Warrior',
    'Destroyer': 'Warrior',    'Slayer': 'Warrior',       'Valkyrie': 'Warrior',
    'Striker': 'Martial',      'Wardancer': 'Martial',    'Scrapper': 'Martial',
    'Soulfist': 'Martial',     'Glaivier': 'Martial',     'Breaker': 'Martial',
    'Gunslinger': 'Gunner',    'Deadeye': 'Gunner',       'Artillerist': 'Gunner',
    'Machinist': 'Gunner',     'Sharpshooter': 'Gunner',
    'Bard': 'Mage',            'Sorceress': 'Mage',       'Arcanist': 'Mage',
    'Summoner': 'Mage',
    'Shadowhunter': 'Assassin','Deathblade': 'Assassin',  'Reaper': 'Assassin',
    'Souleater': 'Assassin',
    'Artist': 'Specialist',    'Aeromancer': 'Specialist','Wildsoul': 'Specialist',
    'Guardianknight': 'Guardian',
  };

  // =============================================================================
  // ARMOR TYPE MAP
  // This section maps each class to its armor set prefix.
  // It is used by the renderer to find the correct gear icon in the Armor_Gear folder.
  // The prefix matches the beginning of the gear file names stored in the repo.
  // Example: Paladin uses 'Elegia-Heavy', so it looks for Elegia-Heavy-xxx_Head.png
  // =============================================================================

  const ARMOR_TYPE_MAP = {
    // Robe — Thalassar-Regalia
    'Bard': 'Thalassar-Regalia',       'Sorceress': 'Thalassar-Regalia',
    'Summoner': 'Thalassar-Regalia',   'Arcanist': 'Thalassar-Regalia',
    'Artist': 'Thalassar-Regalia',     'Aeromancer': 'Thalassar-Regalia',
    'Wildsoul': 'Thalassar-Regalia',
    // Light Armor — Vesper-Noble-Leather
    'Wardancer': 'Vesper-Noble-Leather',   'Scrapper': 'Vesper-Noble-Leather',
    'Soulfist': 'Vesper-Noble-Leather',    'Glaivier': 'Vesper-Noble-Leather',
    'Striker': 'Vesper-Noble-Leather',     'Breaker': 'Vesper-Noble-Leather',
    'Deathblade': 'Vesper-Noble-Leather',  'Shadowhunter': 'Vesper-Noble-Leather',
    'Reaper': 'Vesper-Noble-Leather',      'Souleater': 'Vesper-Noble-Leather',
    'Gunslinger': 'Vesper-Noble-Leather',  'Deadeye': 'Vesper-Noble-Leather',
    'Sharpshooter': 'Vesper-Noble-Leather','Machinist': 'Vesper-Noble-Leather',
    // Heavy Armor — Elegia-Heavy
    'Berserker': 'Elegia-Heavy',    'Destroyer': 'Elegia-Heavy',
    'Gunlancer': 'Elegia-Heavy',    'Paladin': 'Elegia-Heavy',
    'Slayer': 'Elegia-Heavy',       'Valkyrie': 'Elegia-Heavy',
    'Guardianknight': 'Elegia-Heavy','Artillerist': 'Elegia-Heavy',
  };

  // =============================================================================
  // WEAPON MAP
  // This section maps each spec to its weapon type identifier.
  // It is used by the renderer to find the correct weapon icon in Art_Weapons folder.
  // File naming convention: WeaponName_Type.png (e.g. Ironclad-Blade_Greatsword.png)
  // The renderer searches for a file ending with _Type.png
  // When two specs from different classes share the same spec name (e.g. Esoteric Skill
  // Enhancement exists in both Striker and Wardancer), the key uses ClassName_SpecName.
  // F = Female model | M = Male model | 1 = alternate color variation
  // NOTE: Some classes are still pending weapon assets (marked below)
  // =============================================================================

  const WEAPON_MAP = {
    // Berserker
    'Mayhem': 'Greatsword',                'Berserker Technique': 'Greatsword',
    // Paladin
    'Judgement': 'Sword',                  'Blessed Aura': 'Sword',
    // Destroyer
    'Rage Hammer': 'Greathammer',          'Gravity Training': 'Greathammer',
    // Slayer
    'Punisher': 'Slasher',                 'Predator': 'Slasher',
    // Valkyrie
    'Shining Knight': 'Rapier',            'Liberator': 'Rapier',
    // Striker (Male fists — 2 color variations)
    'Striker_Esoteric Skill Enhancement': 'FistM', 'Deathblow': 'FistM1',
    // Wardancer (Female fists — 2 color variations)
    'First Intention': 'FistF',            'Wardancer_Esoteric Skill Enhancement': 'FistF1',
    // Scrapper (shares female fist assets with Wardancer)
    'Shock Training': 'FistF',             'Ultimate Skill: Taijutsu': 'FistF1',
    // Breaker (shares male fist assets with Striker)
    'Brawl King Storm': 'FistM',           "Asura's Path": 'FistM1',
    // Glaivier
    'Pinnacle': 'Spear',                   'Control': 'Spear1',
    // Gunslinger
    'Peacemaker': 'Carabina',              'Time to Hunt': 'Rifle',
    // Deadeye
    'Enhanced Weapon': 'Carabine',         'Pistoleer': 'Siderarms',
    // Artillerist
    'Barrage Enhancement': 'Launcher',     'Firepower Enhancement': 'Launcher',
    // Sharpshooter
    'Death Strike': 'Bow',                 'Loyal Companion': 'Bow',
    // Sorceress
    'Igniter': 'Staff',                    'Reflux': 'Staff',
    // Arcanist
    'Order of the Emperor': 'Oracle',      "Empress's Grace": 'Oracle',
    // Summoner
    'Master Summoner': 'MBlunt',           'Communication Overflow': 'MBlunt',
    // Deathblade
    'Surge': 'Swords',                     'Remaining Energy': 'Swords',
    // Reaper
    'Lunar Voice': 'Shaper',               'Hunger': 'Shaper',
    // Souleater
    'Full Moon Harvester': 'Soulrender',   "Night's Edge": 'Soulrender',
    // Guardianknight
    'Hellfire Successor': 'Polearm',       'Dreadful Roar': 'Polearm',
    // PENDING — no weapon asset found yet:
    // Gunlancer: Combat Readiness / Lone Knight
    // Soulfist: Robust Spirit / Energy Overflow
    // Machinist: Evolutionary Legacy / Arthetinean Skill
    // Bard: Desperate Salvation / True Courage
    // Shadowhunter: Demonic Impulse / Perfect Suppression
    // Artist: Full Bloom / Recurrence
    // Aeromancer: Wind Fury / Drizzle
    // Wildsoul: Ferality / Phantom Beast Spirit
  };

  // This function resolves weapon type handling class+spec conflicts.
  // It first tries a compound key (ClassName_SpecName) to handle cases where
  // two classes share the same spec name but use different weapon assets.
  function getWeaponType(className, spec) {
    return WEAPON_MAP[`${className}_${spec}`] || WEAPON_MAP[spec] || null;
  }

  // =============================================================================
  // SPEC MAP
  // This section is responsible for detecting which spec a character is playing.
  // It works by reading the Enlightenment section of the Ark Passive and matching
  // the invested nodes against known spec node lists for each class.
  // Each spec has 4 unique Enlightenment nodes — if 2 or more match, that is the spec.
  // This approach is reliable because players can only invest in one spec line.
  // =============================================================================

  const SPEC_MAP = {
    'Berserker': {
      'Mayhem': ['Mayhem', 'Restore Fury', 'Cold Fury', 'Dark Enhancement'],
      'Berserker Technique': ['Brawn', 'Invigoration', 'Burst Enhancement', 'Berserker Technique'],
    },
    'Paladin': {
      'Blessed Aura': ['Holy Protection', 'Blessed Aura', 'Goodly Grace', 'Divine Liberation'],
      'Judgement': ['Divine Knight', 'Piety Training', 'Judgement', 'Blessing of Judgement'],
    },
    'Gunlancer': {
      'Lone Knight': ['Lone Knight', 'Sophistication', 'Gunlance Training', 'Vanguard', 'Roar'],
      'Combat Readiness': ['Impregnable Fortress', 'Combat Readiness', 'Skilled Tactician', 'Vanguard Mindset'],
    },
    'Destroyer': {
      'Rage Hammer': ['Gravity Armor', 'Sharp Hammer', 'Rage Hammer', 'Gravity Release'],
      'Gravity Training': ['Gravity Shock', 'Gravity Charge', 'Gravity Training', 'New Core'],
    },
    'Slayer': {
      'Punisher': ['Unwavering', 'Strength', 'Punisher', 'Unstoppable Fury'],
      'Predator': ['Endless Fury', 'Predator', 'Wrath', 'Intensifying Fury'],
    },
    'Valkyrie': {
      'Shining Knight': ['Shining Knight', 'Sword Training', 'Holy Sword Unleashed', 'Trinity'],
      'Liberator': ['Liberator', 'Vitality', 'Divine Plan', 'Wings of Freedom'],
    },
    'Striker': {
      'Esoteric Skill Enhancement': ['Esoteric Flurry', 'Untouchable', 'Esoteric Skill Focus', 'Flurry Enhancement'],
      'Deathblow': ['Deathblow I', 'Orb Bonus', 'Deathblow II', "Orb's Blessing"],
    },
    'Wardancer': {
      'First Intention': ['Powerful Taijutsu', 'Energy Recovery', 'First Intention', 'Esoteric Origin'],
      'Esoteric Skill Enhancement': ['Powerful Esoteric Skill', 'Orb Bonus', 'Esoteric Skill Enhancement', 'Circulate'],
    },
    'Scrapper': {
      'Ultimate Skill: Taijutsu': ['Stamina Recovery', 'Tenacity Recovery', 'Ultimate Skill: Taijutsu', 'Earth Rend'],
      'Shock Training': ['Enhanced Speed', 'Shock Recovery', 'Shock Training', 'Shock Release'],
    },
    'Soulfist': {
      'Energy Overflow': ['Energy Overflow', 'Energy Forbiddance', 'Energy Overflow II', 'Energy Explosion'],
      'Robust Spirit': ['Robust Spirit', 'Energy Activation', 'Hyper Enhancement', 'Limit Break'],
    },
    'Glaivier': {
      'Control': ['Control', 'Flurry Move', 'Flurry Enhancement', 'Yeon-Style Technique'],
      'Pinnacle': ['Pinnacle I', 'Pinnacle II', 'Pinnacle III', 'Yeon-Style Encore'],
    },
    'Breaker': {
      'Brawl King Storm': ['Brawl King Storm', 'Hypogastric Breathing', 'Brawl King Twelve Form: Falling Blossoms Enhancement', 'Brawl King Twelve Form: Violent Waves'],
      "Asura's Path": ["Asura's Wrath", 'Lethal Fist', 'Asura Iron Body', 'Trance'],
    },
    'Gunslinger': {
      'Time to Hunt': ['Time to Hunt', 'Rifle Cooling', 'Rifle Expertise', 'Dead Center'],
      'Peacemaker': ['Peacemaker: Handgun', 'Peacemaker: Shotgun', 'Peacemaker: Rifle', 'Pacifist'],
    },
    'Deadeye': {
      'Enhanced Weapon': ['Tactical Bullet', 'Ammo Supplement', 'Precision Shot Training', 'Strategic Garb'],
      'Pistoleer': ['Pistoleer', 'Fancy Footwork', 'Handgun Enhancement', 'Secret Weapon'],
    },
    'Artillerist': {
      'Barrage Enhancement': ['Barrage Enhancement', 'Barrage Charge', 'Barrage Output Enhancement', 'Summon A.C.T'],
      'Firepower Enhancement': ['Firepower Enhancement', 'Sustained Firepower', 'Overheat', 'Barrage Attack'],
    },
    'Machinist': {
      'Evolutionary Legacy': ['Evolutionary Legacy', 'Oversync', 'Combat Mode', 'Zero Mode'],
      'Arthetinean Skill': ['Arthetinean Skill', 'Drone Defense System', 'Skill Upgrade', 'Enchanted Core'],
    },
    'Sharpshooter': {
      'Death Strike': ['Death Strike', 'Hawk Meter Recovery', 'Final Mark', 'Silverhawk Assault'],
      'Loyal Companion': ['Loyal Companion', 'Hawk Support', 'Storm Mark', 'Storm Hunter'],
    },
    'Bard': {
      'Desperate Salvation': ['Perfect Harmony', 'Desperate Salvation', 'Serenade of Amplification', 'Serenade of Secrets'],
      'True Courage': ['True Courage', 'Hymn: Tempest', 'Maestro', 'Stormfield'],
    },
    'Sorceress': {
      'Igniter': ['Igniter', "Igniter's Ember", 'Ignite', 'Magick Cycle'],
      'Reflux': ['Reflux', 'Reflux Energy', 'Reflux Enhancement', 'Magick Charge'],
    },
    'Arcanist': {
      "Empress's Grace": ['Grace of the Empress', 'Scheme of the Empress', 'Banquet of the Empress', 'Whispers of the Empress'],
      'Order of the Emperor': ['Order of the Emperor', 'Gift of the Emperor', 'Feast of the Emperor', 'Another Emperor'],
    },
    'Summoner': {
      'Communication Overflow': ['Communication Overflow', 'Cleverness', "Elemental's Harmony", 'Elemental Burst'],
      'Master Summoner': ['Master Summoner', 'Mind Concentration', 'Ancient Strength', 'Ancient Blessing'],
    },
    'Shadowhunter': {
      'Demonic Impulse': ['Demon Impulse', 'Instinct Enhancement', 'Chaos Enhancement', 'Execution Ceremony'],
      'Perfect Suppression': ['Perfect Suppression', 'Shadowburst Control', 'Weapon Training', 'Storm Grinding'],
    },
    'Deathblade': {
      'Surge': ['Surge Enhancement', 'Orb Compression', 'Limit Break', 'Sword Spirit Compression'],
      'Remaining Energy': ['Swift Strike', 'Remaining Energy', 'Firm Will', 'Extreme Body Movement'],
    },
    'Reaper': {
      'Lunar Voice': ['Lunar Moon', 'Ghost Dancer', 'Follow the Shadow', 'Vital Point Secured'],
      'Hunger': ['Smell of Blood', 'Starvation', 'Hunger', 'Slaughterer'],
    },
    'Souleater': {
      'Full Moon Harvester': ['Soul Affinity', 'Full Moon Harvester', 'Execution Enhancement', 'Soul Resonance'],
      "Night's Edge": ["Night's Edge", 'Death Refinement', 'Broken Edge', 'Soul Decapitation'],
    },
    'Artist': {
      'Full Bloom': ['Setting Moon', 'Full Bloom', 'Blessing of the Soon', 'Paint: Combat Technique'],
      'Recurrence': ['Recurrence', 'Rising Moon', 'Lunar Blessing', 'Paint: Shattering Strike'],
    },
    'Aeromancer': {
      'Wind Fury': ['Wind Fury', 'Ventilation', 'Swiftness', 'Space Cleave'],
      'Drizzle': ['Drizzle', 'Rain Shield', 'Sunny Day', 'Dazzling Days'],
    },
    'Wildsoul': {
      'Ferality': ['Ferality', 'Awakened Potential', 'Wild Impulse', 'Hunter Instinct'],
      'Phantom Beast Spirit': ['Phantom Beast Awakening', 'Vigor', 'Phantom Beast Spirit', 'Agile Gait'],
    },
    'Guardianknight': {
      'Hellfire Successor': ['Hellfire Successor', 'Awoken Strength', 'Power Control', 'Complete Fusion'],
      'Dreadful Roar': ['Dreadful Roar', 'Complete Combustion', 'Rousing Shout', 'Transcend Limit'],
    },
  };

  // This function is responsible for detecting the active spec of a character.
  // It works by reading all Enlightenment passive names already extracted from the DOM
  // and counting how many match each spec's known node list.
  // A spec is confirmed when 2 or more of its nodes are found in the character's passive list.
  function detectSpec(className, arkPassive) {
    if (!className || !arkPassive?.enlightenment?.passives) return null;
    const specData = SPEC_MAP[className];
    if (!specData) return null;
    const passiveNames = arkPassive.enlightenment.passives.map(p => p.name);
    const matches = Object.entries(specData).map(([spec, nodes]) => ({
      spec,
      count: nodes.filter(node =>
        passiveNames.some(p => p.toLowerCase().includes(node.toLowerCase()))
      ).length,
    }));
    const best = matches.sort((a, b) => b.count - a.count)[0];
    return best && best.count >= 2 ? best.spec : null;
  }

  // =============================================================================
  // HELPERS
  // Utility functions used by multiple extractors.
  // findByText — finds the first DOM element that contains exactly the given text
  // getGemFromSrc — resolves a gem image src to its gem data using GEM_MAP
  // =============================================================================

  function findByText(text) {
    return [...document.querySelectorAll('*')]
      .find(el => el instanceof HTMLElement &&
        el.children.length === 0 &&
        el.textContent.trim() === text);
  }

  function getGemFromSrc(src) {
    const key = src?.match(/use_\d+_\d+/)?.[0];
    return key && GEM_MAP[key] ? { ...GEM_MAP[key] } : null;
  }

  // =============================================================================
  // EXTRACTOR — CHARACTER INFO
  // This section is responsible for feeding the character header data to the new UI.
  // It works by reading the hydrated SvelteKit DOM elements that contain the character
  // name, title, region, server and class from the badge elements at the top of the page.
  // Combat power color is used to determine if the character is a support or DPS.
  // Guild and stronghold are found by checking the parent text of leaf elements.
  // =============================================================================

  function extractCharacter() {
    try {
      const name = document.querySelector('.text-3xl.font-bold')?.textContent.trim();
      const title = document.querySelector('.font-medium.text-neutral-300')?.textContent.trim();
      const badges = [...document.querySelectorAll('.rounded-sm.bg-neutral-900.px-2.py-1.text-sm')]
        .map(el => el.textContent.trim());
      const region = badges[0] || null;
      const server = badges[1] || null;
      const className = badges[2] || null;
      const combatPowerEl = document.querySelector('.text-xl.font-semibold');
      const combatPower = parseFloat(combatPowerEl?.textContent.trim() || '0');
      const combatPowerColor = combatPowerEl?.className.includes('text-green-400') ? 'support' : 'dps';

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
  // EXTRACTOR — GEAR
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
  // EXTRACTOR — ACCESSORIES
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
          .map(el => ({
            name: el.innerText.trim(),
            rollQuality: el.className.includes('#EA6811') ? 'high' : 'mid',
          }));
        return { slot, tier, quality, enhance, stats };
      }).filter(Boolean);
    } catch (e) {
      console.error('[Extractor] extractAccessories failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR — BRACELET
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
        .map(el => ({ text: el.innerText.trim(), locked: !!el.querySelector('img[src*="locked"]') }));
      return { tier, rollsRemaining, stats };
    } catch (e) {
      console.error('[Extractor] extractBracelet failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR — STONE
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
          return { name: parts[0], level: levelMatch ? parseInt(levelMatch[1]) : null, rollQuality };
        });
      return { tier, engravings };
    } catch (e) {
      console.error('[Extractor] extractStone failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR — ENGRAVINGS
  // This section is responsible for feeding the engraving data to the new UI.
  // It works by finding the second Engravings container in the DOM — the first one
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
        .map(el => ({
          name: el.querySelector('[style*="color"]')?.textContent.trim(),
          progress: el.querySelector('.mx-1.text-xs')?.textContent.trim(),
          stoneBonus: el.querySelector('[src*="stone_symbol"] + span')?.textContent.trim() || null,
        }))
        .filter(e => e.name);
    } catch (e) {
      console.error('[Extractor] extractEngravings failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR — GEMS
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
  // EXTRACTOR — SKILLS
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
          const nameRow = children[i];
          const tripodRow = children[i + 1];
          const runeRow = children[i + 2];
          const gem1Row = children[i + 3];
          const gem2Row = children[i + 4];
          const name = nameRow?.querySelector('.truncate')?.textContent.trim();
          if (!name) continue;
          const level = nameRow?.querySelector('.bg-surface-800')?.textContent.trim();
          const tripodContainer = [...(tripodRow?.querySelectorAll('div') || [])].find(el => el.querySelector('.size-5.rounded-full'));
          const tripods = [...(tripodContainer?.querySelectorAll('.size-5.rounded-full') || [])].map(el => el.textContent.trim());
          const rune = runeRow?.querySelector('[style*="color"]')?.textContent.trim() || null;
          const gems = [gem1Row, gem2Row].map(row => {
            const img = row?.querySelector('.size-6.rounded-sm img');
            if (!img) return null;
            return getGemFromSrc(img.getAttribute('src') || '');
          }).filter(Boolean);
          skills.push({ name, level, tripods, rune, gems });
        }
      });
      return skills;
    } catch (e) {
      console.error('[Extractor] extractSkills failed:', e);
      return [];
    }
  }

  // =============================================================================
  // EXTRACTOR — CARDS
  // This section is responsible for feeding the card data to the new UI.
  // It works by finding the Cards section header and reading the active set names
  // and each card's name and awakening level.
  // Awakening level (0-5) is calculated from the CSS left property of the progress bar:
  //   left: -0%  = 5/5 (fully awakened)
  //   left: -20% = 4/5
  //   left: -80% = 1/5
  //   left: -100% = 0/5 (not awakened)
  // =============================================================================

  function extractCards() {
    try {
      const cardsHeader = findByText('Cards');
      if (!cardsHeader) return null;
      const container = cardsHeader.parentElement;
      const sets = [...container.querySelectorAll('.flex.divide-x span')].map(el => el.textContent.trim());
      const cards = [...container.querySelectorAll('[title]')]
        .filter(el => el.getAttribute('title').length > 2)
        .map(el => {
          const leftStyle = el.querySelector('[style*="left"]')?.style.left || '-100%';
          const awakening = Math.max(0, Math.min(5, Math.round(5 - (parseFloat(leftStyle) * -1) / 20)));
          return { name: el.getAttribute('title'), awakening };
        });
      return { sets, cards };
    } catch (e) {
      console.error('[Extractor] extractCards failed:', e);
      return null;
    }
  }

  // =============================================================================
  // EXTRACTOR — ARK PASSIVE
  // This section is responsible for feeding the Ark Passive data to the new UI.
  // It works by finding the Ark Passive section and reading the 3 subsections:
  // Evolution, Enlightenment and Leap — each with their total points invested
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

  // =============================================================================
  // EXTRACTOR — ARK GRID
  // This section is responsible for feeding the Ark Grid data to the new UI.
  // It works by finding the Ark Grid section and reading the right column list
  // which contains each core (skill + points + gem type: Order/Chaos Sun/Moon/Star)
  // and the bonus lines accumulated from gem lapidation (level + name + percent).
  // Ark Grid is optional — returns null if the character does not have it yet.
  // =============================================================================

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
  // EXTRACTOR — COMBAT POWER BREAKDOWN
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
  // armorType and weaponType — all needed by the renderer for asset loading.
  // =============================================================================

  function extractCharacterData() {
    console.log('[LostArk UI] Extracting character data...');
    const character = extractCharacter();
    const arkPassive = extractArkPassive();

    if (character) {
      character.spec = detectSpec(character.class, arkPassive);
      character.isSupport = SUPPORT_SPECS.includes(character.spec);
      character.archetype = ARCHETYPE_MAP[character.class] || null;
      character.armorType = ARMOR_TYPE_MAP[character.class] || null;
      character.weaponType = getWeaponType(character.class, character.spec);
    }

    const data = {
      character,
      gear: extractGear(),
      accessories: extractAccessories(),
      bracelet: extractBracelet(),
      stone: extractStone(),
      engravings: extractEngravings(),
      gems: extractGems(),
      skills: extractSkills(),
      cards: extractCards(),
      arkPassive,
      arkGrid: extractArkGrid(),
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
  // This is a skeleton — connect to the mockup HTML elements as sections are completed.
  // =============================================================================

  function renderUI(data) {
    console.log('[LostArk UI] Rendering UI with data:', data);
    // Asset path examples (uncomment and connect to mockup elements):
    // const characterArt = `${ASSETS_URL}/Art_Class/BG_${data.character.class}.png`;
    // const classVector  = `${ASSETS_URL}/Art_Background/${data.character.archetype}_${data.character.class}.png`;
    // const specIcon     = `${ASSETS_URL}/Art_Specs/${data.character.class}_${data.character.spec?.replace(/ /g, '_')}.png`;
    // const weaponIcon   = `${ASSETS_URL}/Art_Weapons/${data.character.weaponType}.png`;
    // TODO: connect each data field to the corresponding mockup HTML element
  }

  // =============================================================================
  // INIT — DOM READY + SVELTE NAVIGATION DETECTION
  // This section is responsible for starting the extraction at the right time.
  // waitForDOM waits for the equipment-grid element which only appears after
  // SvelteKit has finished hydrating the character page.
  // The MutationObserver detects when the user navigates to another character
  // via the Roster tab (SvelteKit client-side navigation — no page reload).
  // When a URL change is detected, init() is called again after a short delay
  // to allow the new page content to fully render before re-extracting.
  // =============================================================================

  function waitForDOM(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeout);
    });
  }

  async function init() {
    console.log('[LostArk UI] Initializing...');
    try {
      await waitForDOM('.equipment-grid');
      await new Promise(r => setTimeout(r, 500));
      const data = extractCharacterData();
      if (!data.character) {
        console.warn('[LostArk UI] Could not extract character data.');
        return;
      }
      renderUI(data);
    } catch (err) {
      console.error('[LostArk UI] Init failed:', err);
    }
  }

  // Detect SvelteKit client-side navigation (character switching via Roster tab)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('[LostArk UI] URL changed, re-initializing...');
      setTimeout(init, 1000);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Start
  init();

})();
