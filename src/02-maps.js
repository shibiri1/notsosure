// ============================================================================
// 02-maps.js -- LostArk Bible Custom UI
// Fixed lookup tables for visual asset resolution (weapon/armor filenames,
// archetypes, esther weapons, jewelry pool) plus SPEC_MAP (enlightenment-passive
// -> spec name detection table). These stay in the skin per Claude B's payload
// findings -- the SSR payload won't know which asset file or spec label to use.
// Depends on: 01-config.js (none of these maps reference ASSETS_URL directly,
// but kept after config for load-order consistency).
// ============================================================================

  // -- DATA MAPS -----------------------------------------------------------------
  const GEM_MAP = {
    'use_12_103': { type:'time',   level:7 },
    'use_12_113': { type:'attack', level:7 },
    'use_13_52':  { type:'time',   level:8 },
    'use_13_62':  { type:'attack', level:8 },
    'use_14_52':  { type:'time',   level:9 },
    'use_14_62':  { type:'attack', level:9 },
    'use_15_52':  { type:'time',   level:10 },
    'use_15_62':  { type:'attack', level:10 },
  };

  const ARCHETYPE_MAP = {
    Berserker:'Warrior', Paladin:'Warrior', Gunlancer:'Warrior',
    Destroyer:'Warrior', Slayer:'Warrior', Valkyrie:'Warrior',
    Guardianknight:'Dragon',
    Striker:'Martial Artist', Wardancer:'Martial Artist', Scrapper:'Martial Artist',
    Soulfist:'Martial Artist', Glaivier:'Martial Artist', Breaker:'Martial Artist',
    Gunslinger:'Gunner', Deadeye:'Gunner', Artillerist:'Gunner',
    Machinist:'Gunner', Sharpshooter:'Gunner',
    Bard:'Mage', Sorceress:'Mage', Arcanist:'Mage', Summoner:'Mage',
    Shadowhunter:'Assassin', Deathblade:'Assassin', Reaper:'Assassin', Souleater:'Assassin',
    Artist:'Specialist', Aeromancer:'Specialist', Wildsoul:'Specialist',
  };

  const ARMOR_TYPE_MAP = {
    Bard:'Thalassar-Regalia', Sorceress:'Thalassar-Regalia',
    Summoner:'Thalassar-Regalia', Arcanist:'Thalassar-Regalia',
    Artist:'Thalassar-Regalia', Aeromancer:'Thalassar-Regalia', Wildsoul:'Thalassar-Regalia',
    Wardancer:'Vesper-Noble-Leather', Scrapper:'Vesper-Noble-Leather',
    Soulfist:'Vesper-Noble-Leather', Glaivier:'Vesper-Noble-Leather',
    Striker:'Vesper-Noble-Leather', Breaker:'Vesper-Noble-Leather',
    Deathblade:'Vesper-Noble-Leather', Shadowhunter:'Vesper-Noble-Leather',
    Reaper:'Vesper-Noble-Leather', Souleater:'Vesper-Noble-Leather',
    Gunslinger:'Vesper-Noble-Leather', Deadeye:'Vesper-Noble-Leather',
    Sharpshooter:'Vesper-Noble-Leather', Machinist:'Vesper-Noble-Leather',
    Berserker:'Elegia-Heavy', Destroyer:'Elegia-Heavy', Gunlancer:'Elegia-Heavy',
    Paladin:'Elegia-Heavy', Slayer:'Elegia-Heavy', Valkyrie:'Elegia-Heavy',
    Guardianknight:'Elegia-Heavy', Artillerist:'Elegia-Heavy',
  };

  const ARMOR_FILE_MAP = {
    'Elegia-Heavy': {
      Head:'Elegia-Heavy-Helmet_Head', Shoulder:'Elegia-Heavy-Pauldrons_Shoulder',
      Chest:'Elegia-Heavy-Breastplate_Chest', Pants:'Elegia-Heavy-Gaiter_Pants',
      Gloves:'Elegia-Heavy-Gantlets_Gloves',
    },
    'Vesper-Noble-Leather': {
      Head:'Vesper-Noble-Leather-Helmet_Head', Shoulder:'Vesper-Noble-Leather-Shoulderpads_Shoulder',
      Chest:'Vesper-Noble-Leather-Breastplate_Chest', Pants:'Vesper-Noble-Leather-Leggings_Pants',
      Gloves:'Vesper-Noble-Leather-Gloves_Gloves',
    },
    'Thalassar-Regalia': {
      Head:'Thalassar-Regalia-Visage_Head', Shoulder:'Thalassar-Regalia-Spaulders_Shoulder',
      Chest:'Thalassar-Regalia-Tunic_Chest', Pants:'Thalassar-Regalia-Stockings_Pants',
      Gloves:'Thalassar-Regalia-Gantlets_Gloves',
    },
  };

  // WEAPON_MAP: spec -> full filename (no extension)
  const WEAPON_MAP = {
    'Mayhem':'Lava-Saw_Greatsword_Zweihaender',
    'Berserker Technique':'Lava-Saw_Greatsword_Zweihaender',
    'Judgement':'Eternal-Core-Sword_Sword',
    'Blessed Aura':'Eternal-Core-Sword_Sword',
    'Rage Hammer':'Pereztear-Greathammer_Mace',
    'Gravity Training':'Pereztear-Greathammer_Mace',
    'Punisher':'Amaranthine-Bloody_Slasher',
    'Predator':'Amaranthine-Bloody_Slasher',
    'Shining Knight':'Lair-Bijou_Rapier',
    'Liberator':'Lair-Bijou_Rapier',
    'Striker_Esoteric Skill Enhancement':'Crimson-Crusher_FistM1',
    'Deathblow':'Crimson-Crusher_FistM1',
    'First Intention':'Vanguard-Ironclads_FistF',
    'Wardancer_Esoteric Skill Enhancement':'Vanguard-Ironclads_FistF1',
    'Shock Training':'Vanguard-Ironclads_FistF',
    'Ultimate Skill: Taijutsu':'Vanguard-Ironclads_FistF1',
    'Brawl King Storm':'Amethyst-Crusher_FistM',
    "Asura's Path":'Crimson-Crusher_FistM1',
    'Pinnacle':'Bound-Requiem-Stormer_Spear',
    'Control':'Bound-Specter-Stormer_Spear1',
    'Peacemaker':'Kelbim-Quartz-Carabina_Carabina',
    'Time to Hunt':'Lindvior-Gale-Carbine_Rifle',
    'Enhanced Weapon':'Kelbim-Shard-Bore_Carabine',
    'Pistoleer':'Dreadfang-Repetier_Sidearms',
    'Barrage Enhancement':'Zariche-Howitzer-MKVI_Launcher',
    'Firepower Enhancement':'Zariche-Howitzer-MKVI_Launcher',
    'Death Strike':'Kelbim-Atelia-Quartz_Bow',
    'Loyal Companion':'Kelbim-Atelia-Quartz_Bow',
    'Igniter':'Helios-Retributer_Staff',
    'Reflux':'Helios-Retributer_Staff',
    'Order of the Emperor':'Wind-of-Mardil_Oracle',
    "Empress's Grace":'Wind-of-Mardil_Oracle',
    'Master Summoner':'Blessed-Archangel-Pinion_MBlunt',
    'Communication Overflow':'Blessed-Archangel-Pinion_MBlunt',
    'Surge':'Zephyr-Razor-Blades_Swords',
    'Remaining Energy':'Zephyr-Razor-Blades_Swords',
    'Lunar Voice':'Blessed-Glimmer-Kaliel_Shaper',
    'Hunger':'Blessed-Glimmer-Kaliel_Shaper',
    'Full Moon Harvester':'Tiat-Tiatenon_Soulrender',
    "Night's Edge":'Tiat-Tiatenon_Soulrender',
    'Hellfire Successor':'Demitelum-Ruin_Polearm',
    'Dreadful Roar':'Demitelum-Ruin_Polearm',
    // Placeholder for classes without weapon asset yet
    'Combat Readiness':       'NO_IMAGE',
    'Lone Knight':            'NO_IMAGE',
    'Robust Spirit':          'NO_IMAGE',
    'Energy Overflow':        'NO_IMAGE',
    'Evolutionary Legacy':    'NO_IMAGE',
    'Arthetinean Skill':      'NO_IMAGE',
    'Desperate Salvation':    'NO_IMAGE',
    'True Courage':           'NO_IMAGE',
    'Demonic Impulse':        'NO_IMAGE',
    'Perfect Suppression':    'NO_IMAGE',
    'Full Bloom':             'NO_IMAGE',
    'Recurrence':             'NO_IMAGE',
    'Wind Fury':              'NO_IMAGE',
    'Drizzle':                'NO_IMAGE',
    'Ferality':               'NO_IMAGE',
    'Phantom Beast Spirit':   'NO_IMAGE',
  };

  // ESTHER weapon assets: class -> { standard, legendary }
  // standard = hone <= 8, legendary = hone >= 10
  const ESTHER_WEAPON_MAP = {
    'Guardianknight': { standard:'Infinity_Tempest_Polearm',  legendary:'Infinity-Vanguard_Halberd' },
    'Destroyer':      { standard:'Infinity_Breaker_Blunt',    legendary:'Infinity-Singularity_Blunt' },
    'Berserker':      { standard:'Infinity_Dreadnought_2HSword', legendary:'Infinity-Edge_Sword' },
    'Slayer':         { standard:'Infinity_Dreadnought_2HSword', legendary:'Infinity-Edge_Sword' },
    'Paladin':        { standard:'Infinity-Edge_Sword',       legendary:'Infinity-Edge_Sword' },
    'Valkyrie':       { standard:'Infinity-Edge_Sword',       legendary:'Infinity-Edge_Sword' },
    'Breaker':        { standard:'Infinity_Nexus_Fists',      legendary:'Infinity-Rend_Fists' },
    'Striker':        { standard:'Infinity_Nexus_Fists',      legendary:'Infinity-Rend_Fists' },
    'Scrapper':       { standard:'Infinity_Nexus_Fists',      legendary:'Infinity-Rend_Fists' },
    'Soulfist':       { standard:'Infinity_Nexus_Fists',      legendary:'Infinity-Rend_Fists' },
    'Glaivier':       { standard:'Infinity_Tempest_Polearm',  legendary:'Infinity-Vanguard_Halberd' },
    'Sorceress':      { standard:'Infinity_Spellblad_Magic',  legendary:'Infinity-Singularity_Blunt' },
    'Summoner':       { standard:'Infinity_Seraph_Wand',      legendary:'Infinity-Harbinger_Core' },
    'Bard':           { standard:'Infinity-Symphony_Style',   legendary:'Infinity-Symphony_Style' },
    'Artist':         { standard:'Infinity-Harbinger_Core',   legendary:'Infinity-Harbinger_Core' },
    'Deathblade':     { standard:'Infinity_Phantomfangs_Dual', legendary:'Infinity-Serrator_Blades' },
    'Reaper':         { standard:'Infinity_Soulstinger_Daggers', legendary:'Infinity-Serrator_Blades' },
    'Shadowhunter':   { standard:'Infinity_Phantomfangs_Dual', legendary:'Infinity-Serrator_Blades' },
    'Sharpshooter':   { standard:'Infinity_Starstrike_Bow',   legendary:'Infinity-Ballista_Heavy' },
    'Artillerist':    { standard:'Infinity-Ballista_Heavy',   legendary:'Infinity-Ballista_Heavy' },
    'Gunslinger':     { standard:'Infinity-Arbitrator_Firearm', legendary:'Infinity-Arbitrator_Firearm' },
    'Deadeye':        { standard:'Infinity-Arbitrator_Firearm', legendary:'Infinity-Arbitrator_Firearm' },
    'Machinist':      { standard:'Infinity-Arbitrator_Firearm', legendary:'Infinity-Arbitrator_Firearm' },
  };

  // Hellfire Successor transform pairs [normal, empowered]
  var HELLFIRE_PAIRS = [
    ['Spinning Flame',   "Abaddon's Flame"],
    ['Soaring Strike',   'Wing Lash'],
    ['Blaze Sweep',      'Blazing Flash'],
    ['Rending Finisher', 'Exploding Finisher'],
    ['Vengeful Blow',    'Avenging Spear'],
  ];
  var HELLFIRE_NORMAL = {}; // normal -> empowered name
  var HELLFIRE_GHOST  = {}; // empowered name -> true (skip as standalone)
  HELLFIRE_PAIRS.forEach(function(p){ HELLFIRE_NORMAL[p[0]]=p[1]; HELLFIRE_GHOST[p[1]]=true; });

  // Jewelry pool -- loaded from GitHub CDN, random by slot type, no duplicates
  const JEWELRY_POOL = {
    Necklace: ["Frintezza's-Necklace_Necklace","Necklace-of-Valakas_Necklace","Necklace-of-Harnak_Necklace","Necklace-of-Freya_Necklace"],
    Earring:  ["Baylor's-Earring_Earring","Earring-of-Antharas_Earring","Earring-of-Orfen_Earring","Helios-Earring_Earring","Lindvior's-Earring_Earring","Zaken's-Earring_Earring"],
    Ring:     ["Earthworm-Heart-Ring_Ring","Ring-of-Baium_Ring","Ring-of-Beleth_Ring","Ring-of-Core_Ring","Ring-of-Mirmir_Ring","Ring-of-Queen-Ant_Ring","Tauti-Ring_Ring"],
  };

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

  // -- COLOR LOOKUP TABLES -----------------------------------------------------
  // These translate a raw grade/tier value (from DOM or payload) into a display
  // color. Extractors (04-extractor.js) only pass through the raw grade/tier;
  // the renderer (07-renderer.js) looks up the color here. Keeps visual
  // decisions out of the extraction layer.

  // Engraving name color by grade. Only Legendary/Relic are obtainable today
  // (the game auto-upgrades engravings to Legendary as a baseline).
  const ENGRAVING_GRADE_COLOR = {
    'Legendary': '#FE9600',
    'Relic':     '#FF6000',
  };

  // Ability Stone engraving level color, keyed by invested node count.
  // Node count -> level mapping: 6=lv1, 7=lv2, 8=lv2 (same as 7, no separate
  // tier), 9=lv3, 10=lv4. Levels 1/3/4 share the same hue formula (oklch
  // L=0.64 C=0.29, hue rotated per tier) for visual consistency. Note: the
  // live site actually shows lv1 as a desaturated gray (oklch 45% 0 0,
  // chroma=0) rather than green -- using the calculated vivid green here
  // instead, by choice.
  const STONE_LEVEL_COLOR = {
    1: '#00B300', // oklch(0.64 0.29 145)   -- green,  node 6
    2: '#1260EB', //                         -- blue,   node 7-8
    3: '#DF18E3', // oklch(0.64 0.29 327.33) -- purple, node 9
    4: '#EA6811', //                         -- orange, node 10 (legendary)
  };

  // Maps ability-stone invested node count -> STONE_LEVEL_COLOR key.
  function stoneNodesToLevel(nodes) {
    if (nodes >= 10) return 4;
    if (nodes >= 9)  return 3;
    if (nodes >= 7)  return 2;
    if (nodes >= 6)  return 1;
    return 0; // not shown as a distinct tier on-site below node 6
  }

  // Tripod tier color (background of the tripod number badge). Semantic
  // label ('blue'/'green'/'gold') comes from the extractor by tripod ROW
  // position (1st/2nd/3rd tripod tier), NOT rarity -- this is a separate
  // color system from the 4-tier rarity scheme used for accessories/stone/
  // engravings/runes.
  const TRIPOD_TIER_COLOR = {
    blue:  '#38bdf8',
    green: '#4ade80',
    gold:  '#f59e0b',
  };

  // Ability Stone "malus" engravings -- negative effects that can roll
  // unluckily on a stone. These are never useful information to display
  // and should always be filtered out of the stone's engraving list.
  // IDs confirmed against real payload data (loadout.items ability_stone
  // .data.engravings[].id) plus keyword search in engravingNames covering
  // both grade tiers of each malus type.
  const MALUS_STONE_ENGRAVING_IDS = new Set([
    800, 801, 802, 803,    // Atk. Power / Defense / Atk. Speed / Move Speed Reduction (tier A)
    1800, 1801, 1802, 1803, // same 4, tier B
  ]);
