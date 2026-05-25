/**
 * LostArk — Spec Detection Map
 * Maps class names to their two specs and the 4 Enlightenment nodes of each.
 * Detection logic: if 2+ nodes of a spec appear in the character's Enlightenment, that's their spec.
 */

const SPEC_MAP = {

  // ============================================================
  // WARRIOR
  // ============================================================

  'Berserker': {
    'Mayhem': [
      'Mayhem',
      'Restore Fury',
      'Cold Fury',
      'Dark Enhancement',
    ],
    'Berserker Technique': [
      'Brawn',
      'Invigoration',
      'Burst Enhancement',
      'Berserker Technique',
    ],
  },

  'Paladin': {
    'Blessed Aura': [
      'Holy Protection',
      'Blessed Aura',
      'Goodly Grace',
      'Divine Liberation',
    ],
    'Judgement': [
      'Divine Knight',
      'Piety Training',
      'Judgement',
      'Blessing of Judgement',
    ],
  },

  'Gunlancer': {
    'Lone Knight': [
      'Lone Knight',
      'Sophistication',
      'Gunlance Training',
      'Vanguard',
      'Roar',
    ],
    'Combat Readiness': [
      'Impregnable Fortress',
      'Combat Readiness',
      'Skilled Tactician',
      'Vanguard Mindset',
    ],
  },

  'Destroyer': {
    'Rage Hammer': [
      'Gravity Armor',
      'Sharp Hammer',
      'Rage Hammer',
      'Gravity Release',
    ],
    'Gravity Training': [
      'Gravity Shock',
      'Gravity Charge',
      'Gravity Training',
      'New Core',
    ],
  },

  'Slayer': {
    'Punisher': [
      'Unwavering',
      'Strength',
      'Punisher',
      'Unstoppable Fury',
    ],
    'Predator': [
      'Endless Fury',
      'Predator',
      'Wrath',
      'Intensifying Fury',
    ],
  },

  'Valkyrie': {
    'Shining Knight': [
      'Shining Knight',
      'Sword Training',
      'Holy Sword Unleashed',
      'Trinity',
    ],
    'Liberator': [
      'Liberator',
      'Vitality',
      'Divine Plan',
      'Wings of Freedom',
    ],
  },

  // ============================================================
  // MARTIAL ARTIST
  // ============================================================

  'Striker': {
    'Esoteric Skill Enhancement': [
      'Esoteric Flurry',
      'Untouchable',
      'Esoteric Skill Focus',
      'Flurry Enhancement',
    ],
    'Deathblow': [
      'Deathblow I',
      'Orb Bonus',
      'Deathblow II',
      "Orb's Blessing",
    ],
  },

  'Wardancer': {
    'First Intention': [
      'Powerful Taijutsu',
      'Energy Recovery',
      'First Intention',
      'Esoteric Origin',
    ],
    'Esoteric Skill Enhancement': [
      'Powerful Esoteric Skill',
      'Orb Bonus',
      'Esoteric Skill Enhancement',
      'Circulate',
    ],
  },

  'Scrapper': {
    'Ultimate Skill: Taijutsu': [
      'Stamina Recovery',
      'Tenacity Recovery',
      'Ultimate Skill: Taijutsu',
      'Earth Rend',
    ],
    'Shock Training': [
      'Enhanced Speed',
      'Shock Recovery',
      'Shock Training',
      'Shock Release',
    ],
  },

  'Soulfist': {
    'Energy Overflow': [
      'Energy Overflow',
      'Energy Forbiddance',
      'Energy Overflow II',
      'Energy Explosion',
    ],
    'Robust Spirit': [
      'Robust Spirit',
      'Energy Activation',
      'Hyper Enhancement',
      'Limit Break',
    ],
  },

  'Glaivier': {
    'Control': [
      'Control',
      'Flurry Move',
      'Flurry Enhancement',
      'Yeon-Style Technique',
    ],
    'Pinnacle': [
      'Pinnacle I',
      'Pinnacle II',
      'Pinnacle III',
      'Yeon-Style Encore',
    ],
  },

  'Breaker': {
    'Brawl King Storm': [
      'Brawl King Storm',
      'Hypogastric Breathing',
      'Brawl King Twelve Form: Falling Blossoms Enhancement',
      'Brawl King Twelve Form: Violent Waves',
    ],
    "Asura's Path": [
      "Asura's Wrath",
      'Lethal Fist',
      'Asura Iron Body',
      'Trance',
    ],
  },

  // ============================================================
  // GUNNER
  // ============================================================

  'Gunslinger': {
    'Time to Hunt': [
      'Time to Hunt',
      'Rifle Cooling',
      'Rifle Expertise',
      'Dead Center',
    ],
    'Peacemaker': [
      'Peacemaker: Handgun',
      'Peacemaker: Shotgun',
      'Peacemaker: Rifle',
      'Pacifist',
    ],
  },

  'Deadeye': {
    'Enhanced Weapon': [
      'Tactical Bullet',
      'Ammo Supplement',
      'Precision Shot Training',
      'Strategic Garb',
    ],
    'Pistoleer': [
      'Pistoleer',
      'Fancy Footwork',
      'Handgun Enhancement',
      'Secret Weapon',
    ],
  },

  'Artillerist': {
    'Barrage Enhancement': [
      'Barrage Enhancement',
      'Barrage Charge',
      'Barrage Output Enhancement',
      'Summon A.C.T',
    ],
    'Firepower Enhancement': [
      'Firepower Enhancement',
      'Sustained Firepower',
      'Overheat',
      'Barrage Attack',
    ],
  },

  'Machinist': {
    'Evolutionary Legacy': [
      'Evolutionary Legacy',
      'Oversync',
      'Combat Mode',
      'Zero Mode',
    ],
    'Arthetinean Skill': [
      'Arthetinean Skill',
      'Drone Defense System',
      'Skill Upgrade',
      'Enchanted Core',
    ],
  },

  'Sharpshooter': {
    'Death Strike': [
      'Death Strike',
      'Hawk Meter Recovery',
      'Final Mark',
      'Silverhawk Assault',
    ],
    'Loyal Companion': [
      'Loyal Companion',
      'Hawk Support',
      'Storm Mark',
      'Storm Hunter',
    ],
  },

  // ============================================================
  // MAGE
  // ============================================================

  'Bard': {
    'Desperate Salvation': [
      'Perfect Harmony',
      'Desperate Salvation',
      'Serenade of Amplification',
      'Serenade of Secrets',
    ],
    'True Courage': [
      'True Courage',
      'Hymn: Tempest',
      'Maestro',
      'Stormfield',
    ],
  },

  'Sorceress': {
    'Igniter': [
      'Igniter',
      "Igniter's Ember",
      'Ignite',
      'Magick Cycle',
    ],
    'Reflux': [
      'Reflux',
      'Reflux Energy',
      'Reflux Enhancement',
      'Magick Charge',
    ],
  },

  'Arcanist': {
    "Empress's Grace": [
      'Grace of the Empress',
      'Scheme of the Empress',
      'Banquet of the Empress',
      'Whispers of the Empress',
    ],
    'Order of the Emperor': [
      'Order of the Emperor',
      'Gift of the Emperor',
      'Feast of the Emperor',
      'Another Emperor',
    ],
  },

  'Summoner': {
    'Communication Overflow': [
      'Communication Overflow',
      'Cleverness',
      "Elemental's Harmony",
      'Elemental Burst',
    ],
    'Master Summoner': [
      'Master Summoner',
      'Mind Concentration',
      'Ancient Strength',
      'Ancient Blessing',
    ],
  },

  // ============================================================
  // ASSASSIN
  // ============================================================

  'Shadowhunter': {
    'Demonic Impulse': [
      'Demon Impulse',
      'Instinct Enhancement',
      'Chaos Enhancement',
      'Execution Ceremony',
    ],
    'Perfect Suppression': [
      'Perfect Suppression',
      'Shadowburst Control',
      'Weapon Training',
      'Storm Grinding',
    ],
  },

  'Deathblade': {
    'Surge': [
      'Surge Enhancement',
      'Orb Compression',
      'Limit Break',
      'Sword Spirit Compression',
    ],
    'Remaining Energy': [
      'Swift Strike',
      'Remaining Energy',
      'Firm Will',
      'Extreme Body Movement',
    ],
  },

  'Reaper': {
    'Lunar Voice': [
      'Lunar Moon',
      'Ghost Dancer',
      'Follow the Shadow',
      'Vital Point Secured',
    ],
    'Hunger': [
      'Smell of Blood',
      'Starvation',
      'Hunger',
      'Slaughterer',
    ],
  },

  'Souleater': {
    'Full Moon Harvester': [
      'Soul Affinity',
      'Full Moon Harvester',
      'Execution Enhancement',
      'Soul Resonance',
    ],
    "Night's Edge": [
      "Night's Edge",
      'Death Refinement',
      'Broken Edge',
      'Soul Decapitation',
    ],
  },

  // ============================================================
  // SPECIALIST
  // ============================================================

  'Artist': {
    'Full Bloom': [
      'Setting Moon',
      'Full Bloom',
      'Blessing of the Soon',
      'Paint: Combat Technique',
    ],
    'Recurrence': [
      'Recurrence',
      'Rising Moon',
      'Lunar Blessing',
      'Paint: Shattering Strike',
    ],
  },

  'Aeromancer': {
    'Wind Fury': [
      'Wind Fury',
      'Ventilation',
      'Swiftness',
      'Space Cleave',
    ],
    'Drizzle': [
      'Drizzle',
      'Rain Shield',
      'Sunny Day',
      'Dazzling Days',
    ],
  },

  'Wildsoul': {
    'Ferality': [
      'Ferality',
      'Awakened Potential',
      'Wild Impulse',
      'Hunter Instinct',
    ],
    'Phantom Beast Spirit': [
      'Phantom Beast Awakening',
      'Vigor',
      'Phantom Beast Spirit',
      'Agile Gait',
    ],
  },

  // ============================================================
  // GUARDIAN KNIGHT (new archtype)
  // ============================================================

  'Guardian Knight': {
    'Hellfire Successor': [
      'Hellfire Successor',
      'Awoken Strength',
      'Power Control',
      'Complete Fusion',
    ],
    'Dreadful Roar': [
      'Dreadful Roar',
      'Complete Combustion',
      'Rousing Shout',
      'Transcend Limit',
    ],
  },

};

// ============================================================
// SPEC DETECTION FUNCTION
// ============================================================

/**
 * Detect the active spec of a character based on their Enlightenment passives.
 * A spec is detected if 2 or more of its nodes appear in the Enlightenment.
 *
 * @param {string} className - The character's class name (e.g. "Deadeye")
 * @param {Object} arkPassive - The extracted arkPassive object
 * @returns {string|null} - The detected spec name, or null if not found
 */
function detectSpec(className, arkPassive) {
  if (!className || !arkPassive?.enlightenment?.passives) return null;

  const specData = SPEC_MAP[className];
  if (!specData) {
    console.warn(`[detectSpec] No spec map for class: ${className}`);
    return null;
  }

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
