// ============================================================================
// 03-utils.js -- LostArk Bible Custom UI
// Pure utility/resolver functions: filename->display-name helpers, array shuffle,
// key normalization, asset URL resolvers (armor/weapon/spec icon), esther/spec
// detection, skill-group matching, jewelry picker, gem-from-src lookup.
// Depends on: 01-config.js (ASSETS_URL), 02-maps.js (all the *_MAP constants).
// ============================================================================

  // -- ASSET RESOLUTION HELPERS
  // Derive display name from armor file map entry
  // e.g. 'Elegia-Heavy-Helmet_Head' → 'Elegia Heavy Helmet'
  function armorDisplayName(filename) {
    if (!filename) return '';
    return filename.replace(/_[^_]+$/, '').replace(/-/g, ' ');
  }

  // Derive weapon display name from WEAPON_MAP filename
  // e.g. 'Kelbim-Atelia-Quartz_Bow' → 'Kelbim Atelia Quartz'
  function weaponDisplayName(filename) {
    if (!filename) return '';
    return filename.replace(/_[^_]+$/, '').replace(/-/g, ' ');
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length-1; i > 0; i--) {
      var j = Math.floor(Math.random()*(i+1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }


  // Normalize lookup key: removes apostrophes, normalizes spaces/hyphens/underscores
  // e.g. "Asura's Path" -> "asuraspath", "Asuras_Path" -> "asuraspath"
  function normalizeKey(str) {
    return (str || "").toLowerCase().replace(/[\u2018\u2019']/g, "").replace(/[_\-\s]+/g, "").trim();
  }

  // Pre-built normalized WEAPON_MAP for fuzzy lookups (handles apostrophes, etc.)
  var WEAPON_MAP_NORM = (function() {
    var m = {};
    Object.keys(WEAPON_MAP).forEach(function(k) { m[normalizeKey(k)] = WEAPON_MAP[k]; });
    return m;
  })();


  // Skill grouping by weapon/stance for multi-stance classes
  // Order of groups array = display order
  var SKILL_GROUPS = {
    'Gunslinger': {
      'Peacemaker': [
        { label:'Shotgun', skills:['Hour of Judgment','Shotgun Rapid Fire','Last Request','Dual Buckshot','Sharpshooter'] },
        { label:'Pistol',  skills:['Spiral Tracker','AT02 Grenade','Plasma Bullet','Peace Keeper','Bullet Rain','Dexterous Shot','Quick Step','Somersault Shot','Meteor Stream','Equilibrium','Death Fire'] },
        { label:'Rifle',   skills:['Spiral Flame','Focused Shot','Target Down','Catastrophe','Perfect Shot'] },
      ],
      'Time to Hunt': [
        { label:'Rifle',  skills:['Focused Shot','Catastrophe','Perfect Shot','Spiral Flame','Target Down'] },
        { label:'Pistol',  skills:['Spiral Tracker','AT02 Grenade','Plasma Bullet','Peace Keeper','Bullet Rain','Dexterous Shot','Quick Step','Somersault Shot','Meteor Stream','Equilibrium','Death Fire'] },
      ],
    },
    'Deadeye': {
      'Enhanced Weapon': [
        { label:'Shotgun', skills:['Sign of Apocalypse','Judgment Day','Shotgun Rapid Fire','Shotgun Dominator','Last Request'] },
        { label:'Pistol',  skills:['AT02 Grenade','Death Fire','Meteor Stream','Enforce Execution','Equilibrium','Desperado','Cruel Tracker','Quick Shot','Spiral Tracker','Plasma Bullet','Somersault Shot','Dexterous Shot'] },
        { label:'Rifle',   skills:['Spiral Flame','One Shot One Kill','Aimed Shot','Perfect Shot'] },
      ],
    },
    'Glaivier': {
      'Pinnacle': [
        { label:'Focus',  skills:['Spiraling Spear','4-Headed Dragon','Thrust of Destruction','Starfall Pounce','Dragonscale Defense',"Red Dragon's Horn"] },
        { label:'Flurry', skills:['Double Strike','Chain Slash','Stampeding Slash','Soul Cutter','Flash Kick','Thorn Jab','Half Moon Slash','Raging Dragon Slash','Wheel of Blades','Spear Dive',"Blue Dragon's Claw",'Windsplitter','Cutting Wind','Shackling Blue Dragon'] },
      ],
    },
  };

  // Normalize skill name for group lookup
  function matchSkillGroup(className, spec, skills) {
    var specGroups = SKILL_GROUPS[className] && SKILL_GROUPS[className][spec];
    if (!specGroups) return null; // no grouping for this class/spec

    // Build lookup: skillName -> groupIndex
    var skillToGroup = {};
    specGroups.forEach(function(group, gi) {
      group.skills.forEach(function(s) {
        skillToGroup[s.toLowerCase()] = gi;
      });
    });

    // Sort skills by group order, preserve original order within group
    var grouped = specGroups.map(function() { return []; });
    var ungrouped = [];
    skills.forEach(function(skill) {
      var gi = skillToGroup[(skill.name||'').toLowerCase()];
      if (gi !== undefined) grouped[gi].push(skill);
      else ungrouped.push(skill);
    });

    return { grouped: grouped, ungrouped: ungrouped, labels: specGroups.map(function(g){return g.label;}) };
  }

  // Pick jewelry icons -- random by slot type, no slot-type duplicates
  function pickJewelry(accessories) {
    var pools = {
      Necklace: shuffleArray(JEWELRY_POOL.Necklace),
      Earring:  shuffleArray(JEWELRY_POOL.Earring),
      Ring:     shuffleArray(JEWELRY_POOL.Ring),
    };
    var idx = { Necklace:0, Earring:0, Ring:0 };
    return (accessories||[]).map(function(acc) {
      var slot = acc.slot || 'Necklace';
      var pool = pools[slot] || pools.Necklace;
      var i    = (idx[slot] || 0) % pool.length;
      idx[slot] = i + 1;
      var fname = pool[i];
      var name  = fname.replace(/_[^_]+$/, '').replace(/-/g, ' ');
      return { img: ASSETS_URL+'/Armor_Jewels/'+fname+'.png', name: name };
    });
  }

  // Resolve gear/armor icon URL
  function resolveArmorAsset(armorType, slot) {
    var files = ARMOR_FILE_MAP[armorType];
    if (files && files[slot]) return ASSETS_URL+'/Armor_Gear/'+files[slot]+'.png';
    return '';
  }

  // Detect Esther weapon from gradient style of the weapon item element
  function detectEsther(weaponEl) {
    if (!weaponEl) return false;
    var bg = (weaponEl.querySelector('[style*="gradient"]') || weaponEl).style.background || '';
    // Esther gradient signature: rgb(12, 46, 44) or rgb(47, 171, 168)
    return bg.includes('12, 46, 44') || bg.includes('47, 171, 168');
  }

  // Resolve weapon asset filename
  function resolveWeaponAsset(spec, className, isEsther, hone) {
    if (isEsther) {
      var em = ESTHER_WEAPON_MAP[className];
      if (em) return isEsther && hone >= 10 ? em.legendary : em.standard;
    }
    // Composite key for classes with same spec name
    // Try exact keys first, then normalized fallback (handles apostrophes, casing, etc.)
    var key  = className+'_'+spec;
    var nKey = normalizeKey(className)+'_'+normalizeKey(spec);
    var nSpc = normalizeKey(spec);
    return WEAPON_MAP[key] || WEAPON_MAP[spec]
        || WEAPON_MAP_NORM[nKey] || WEAPON_MAP_NORM[nSpc] || null;
  }

  // Resolve spec icon URL
  function resolveSpecIcon(className, spec) {
    if (!className || !spec) return '';
    var slug = spec.replace(/[‘’']/g, '').replace(/ /g, '_');
    return ASSETS_URL+'/Art_Specs/'+className+'_'+slug+'.png';
  }

  // -- SPEC MAP -----------------------------------------------------------------




  // This function is responsible for detecting the active spec of a character.
  // It works by reading all Enlightenment passive names already extracted from the DOM
  // and counting how many match each spec's known node list.
  // A spec is confirmed when 2 or more of its nodes are found in the character's passive list.



  function getWeaponType(className, spec) {
    return WEAPON_MAP[`${className}_${spec}`] || WEAPON_MAP[spec] || null;
  }

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
  // findByText -- finds the first DOM element that contains exactly the given text
  // getGemFromSrc -- resolves a gem image src to its gem data using GEM_MAP
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
