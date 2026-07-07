// =============================================================================
// parsePayload.js — LostArk Bible Skin
// =============================================================================
// Substitui toda a camada de extração DOM/hover por leitura direta do payload
// SSR do lostark.bible. Validado contra payload real (Deadeye, ilvl 1754,
// loadouts: most_recent_raid + most_recent_chaos_dungeon).
//
// COBERTURA COMPLETA:
//   gear · accessories · bracelet · stone · engravings · gems · skills ·
//   cards · arkPassive · arkGrid (cores + astrogems + bonuses) ·
//   combatPowerBreakdown · _meta (paradise + trinity orb)
//
// FORA DE ESCOPO (intencional):
//   character (nome/servidor/região/guild) — vem de payload.data[1].data.header,
//   slice nunca capturado; a skin continua usando extractCharacter() via DOM.
//
// DEPENDÊNCIAS:
//   maps — objeto com todos os maps estáticos extraídos dos chunks do bundle
//   (ver Seção 2 para shape completo). Injetado externamente — este arquivo
//   não faz fetch nem import de nenhum chunk.
//
// USO:
//   const raw   = extractRawPayload();          // lê o script SSR inline
//   const result = parsePayload(raw, maps);     // decodifica tudo
//   // result tem o mesmo schema que extractCharacterData() produzia
// =============================================================================


// =============================================================================
// SEÇÃO 1 — CAPTURA DO PAYLOAD BRUTO
// =============================================================================

function extractRawPayload(doc) {
  doc = doc || document;
  var scriptEl = [...doc.scripts].find(function(s) {
    return s.textContent.includes('arkGridCores');
  });
  if (!scriptEl) throw new Error('[parsePayload] script com arkGridCores não encontrado');

  var text = scriptEl.textContent;
  var startIdx = text.indexOf('kit.start(');
  if (startIdx === -1) throw new Error('[parsePayload] "kit.start(" não encontrado');
  var argsStart = text.indexOf('{', startIdx);

  var objText = extractBalancedObject(text, argsStart);
  if (!objText) throw new Error('[parsePayload] falha ao extrair objeto balanceado');

  return new Function('return ' + objText)();
}

function extractBalancedObject(text, startPos) {
  var depth = 0, inString = false, stringChar = '', escaped = false;
  for (var i = startPos; i < text.length; i++) {
    var ch = text[i];
    if (escaped)  { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (inString) { if (ch === stringChar) inString = false; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; continue; }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') { depth--; if (depth === 0) return text.slice(startPos, i + 1); }
  }
  return null;
}


// =============================================================================
// SEÇÃO 2 — CONSTANTES FIXAS
// =============================================================================

// Ordem e nomes de display dos slots de gear (payload usa snake_case)
const GEAR_SLOT_ORDER = ['head', 'shoulder', 'upper_body', 'lower_body', 'hand', 'weapon'];
const GEAR_SLOT_NAME  = {
  head: 'Head', shoulder: 'Shoulder', upper_body: 'Chest',
  lower_body: 'Pants', hand: 'Gloves', weapon: 'Weapon',
};

// Ordem e nomes de display dos slots de acessório
const ACCESSORY_SLOT_ORDER = ['neck', 'ear1', 'ear2', 'finger1', 'finger2'];
const ACCESSORY_SLOT_NAME  = {
  neck: 'Necklace', ear1: 'Earring', ear2: 'Earring',
  finger1: 'Ring', finger2: 'Ring',
};

// Grade de engraving (string do payload → nome de exibição)
// Fonte: nodes/16.BcrPuMX5.js
const ENGRAVE_GRADE_NAME = {
  engrave_grade02: 'Rare',
  engrave_grade03: 'Epic',
  engrave_grade04: 'Legendary',
  engrave_grade05: 'Relic',
};

// Cor por tier de roll de acessório (0=low → 3=high)
// Fonte: BIVkqT-L.js (array logo após STAT_NAMES)
const STAT_TIER_COLOR = ['#99FF99', '#00B5FF', '#CE43FC', '#FE9600'];

// Fallback de qualidade máxima para armas sem entrada em statRollTable
const WEAPON_QUALITY_FALLBACK_MAX = 3000;

// Tipo de efeito de gem normal (effects[0].type)
const GEM_EFFECT_TYPE = { DAMAGE: 27, COOLDOWN: 5 };

// Q enum — battlePoint.parts[].type → label de texto
// Fonte: BIVkqT-L.js (função f(e){return e[e.base_attack_point=1]=...})
const COMBAT_POWER_TYPE = {
  0:  'none',
  1:  'base_attack_point',
  2:  'base_health_point',
  3:  'level',
  4:  'weapon_quality',
  5:  'arkpassive_evolution',
  6:  'arkpassive_enlightment',
  7:  'arkpassive_leap',
  8:  'karma_evolutionrank',
  9:  'karma_leaplevel',
  10: 'ability_attack',
  11: 'ability_defense',
  12: 'elixir_set',
  13: 'elixir_grade_attack',
  14: 'elixir_grade_defense',
  15: 'accessory_grinding_attack',
  16: 'accessory_grinding_defense',
  17: 'accessory_grinding_addontype_attack',
  18: 'accessory_grinding_addontype_defense',
  19: 'bracelet_stattype',
  20: 'bracelet_addontype_attack',
  21: 'bracelet_addontype_defense',
  22: 'gem',
  23: 'esther_weapon',
  24: 'transcendence_armor',
  25: 'transcendence_additional',
  26: 'battlestat',
  27: 'card_set',
  28: 'pet_specialty',
  29: 'arkgrid_core',
  30: 'arkgrid_core_defense',
  31: 'arkgrid_gem',
  32: 'arkgrid_gem_defense',
  33: 'trinity_orb',
  34: 'trinity_orb_defense',
};


// =============================================================================
// SEÇÃO 3 — SHAPE DOS MAPS ESTÁTICOS (injeção de dependência)
// =============================================================================
// O objeto `maps` reúne todos os chunks estáticos já localizados no bundle.
// A estratégia de carregamento (fetch dinâmico vs. embutido) é responsabilidade
// do módulo de infraestrutura (Etapa 2) — este arquivo só documenta o shape.
//
// maps = {
//   skillNames:       { [skillId]:    [name, classId, iconKey] },
//   tripodNames:      { [skillId]:    [[name, iconKey], ...] },       // 8 por skill (3+3+2/3)
//   runeNames:        { [runeId]:     name },
//   engravingNames:   { [engId]:      [name, iconKey, classId, flag] },
//   normalGemNames:   { [gemId]:      [name, level] },
//   astrogemNames:    { [gemId]:      [name, gemKind] },
//   coreNames:        { [coreId]:     [name, attr, coreType, groupId, floor, [floorIds], classId] },
//   coreGroupNames:   { [groupId]:    [groupName, classType, perks] },
//   arkGridOptText:   { [optId]:      [[name, type, statIndex, valueCentesimal], ...] },
//   arkPassiveNodes:  { [nodeId]:     [name, iconKey, tree, tier, pos, maxLevel, classId, ?] },
//   cardNames:        { [cardId]:     [iconKey, name, grade] },
//   cardSets:         [[setId, name, [[count,bonusLevel],...], [cardIds]], ...],
//   orbNames:         { [orbId]:      name },
//   itemStaticData:   { [itemId]:     [iconKey, grade, baseItemLevel, tier, honingTableId, categoryId, ?, advHoneFlag] },
//   honingTables:     { [tableId]:    [[bonusIlvl, ?, ?], ...] },     // índice = nível de honing
//   statNames:        { [index]:      [name, isPercent] },
//   statRollTable:    { [statId]:     [[type,grade,idx,idxAlt,max,min,?,?,tier,cachedText], ...] },
//   braceletEffects:  { [index]:      [template, refIndex] },
//   genericEffectText:{ [index]:      template },
// }


// =============================================================================
// SEÇÃO 4 — DECODIFICAÇÃO DE STATS (acessórios / bracer / stone)
// =============================================================================

// Resolve uma linha de stat de acessório em { desc, tier, color }.
// `itemGrade` = grade do item (ex: 6 = Relic) — a tabela indexa por grade,
// não por classId do personagem (bug corrigido pós-teste de paridade).
function resolveStat(stat, itemGrade, maps) {
  const rows = maps.statRollTable[stat.id] || [];

  // Tenta match exato (roll único, ex: efeitos categóricos tipo 54/59)
  let entry = rows.find(function(r) {
    var type = r[0], rGrade = r[1], idxA = r[2], idxB = r[3], max = r[4], min = r[5];
    var idx = type === 2 ? idxA : idxB;
    return type === stat.type && rGrade === itemGrade && idx === stat.index
      && stat.value === max && min === max;
  });

  var tier = null;
  if (!entry) {
    // Match por faixa de valor (roll variável, ex: substats tipo 2)
    var idxForRange = (stat.type === 2 && [3, 4, 5].includes(stat.index)) ? 11 : stat.index;
    entry = rows.find(function(r) {
      var type = r[0], rGrade = r[1], idxA = r[2], idxB = r[3], max = r[4], min = r[5];
      var idx = type === 2 ? idxB : max;
      return type === stat.type && rGrade === itemGrade && idx === idxForRange
        && stat.value >= min && stat.value <= max;
    });
    if (entry) {
      var max = entry[4], min = entry[5];
      var p = (stat.value - min) / (max - min || 1);
      tier = p === 1 ? 3 : p >= 0.7 ? 2 : p >= 0.4 ? 1 : 0;
    }
  } else {
    tier = entry[8];
  }

  var color = STAT_TIER_COLOR[tier] || STAT_TIER_COLOR[0];

  if (!entry) return { desc: 'Unknown, please report!', tier: 0, color: STAT_TIER_COLOR[0] };

  // Se a entrada já tem texto pronto (cachedText), usa direto
  var cachedText = entry[9];
  if (cachedText) {
    return { desc: cachedText.replace('{0}', color), tier: tier, color: color };
  }

  // type === 2: monta via STAT_NAMES + fórmula value/100 ou flat
  if (stat.type === 2) {
    var statName = maps.statNames[stat.index];
    if (!statName) return { desc: 'Unknown stat index ' + stat.index, tier: tier, color: color };
    var name = statName[0], isPercent = statName[1];
    var value = isPercent ? stat.value / 100 : stat.value;
    return { name: name, value: value, isPercent: isPercent,
             desc: name + ' +' + value + (isPercent ? '%' : ''), tier: tier, color: color };
  }

  return { desc: 'Unknown: t=' + stat.type, tier: tier, color: color };
}

// Resolve uma linha de stat de bracelet.
// Braceletes têm stat.id único por peça — sem entrada em statRollTable.
// type 2 → STAT_NAMES; type 3 → braceletEffects; type 4 → genericEffectText.
function resolveBraceletEffect(stat, maps) {
  if (stat.type === 2) {
    var statName = maps.statNames[stat.index];
    if (!statName) return { desc: 'Unknown stat index ' + stat.index };
    var name = statName[0], isPercent = statName[1];
    var value = isPercent ? stat.value / 100 : stat.value;
    return { desc: name + ' +' + value + (isPercent ? '%' : '') };
  }
  if (stat.type === 3) {
    var entry = maps.braceletEffects[stat.index];
    return { desc: entry ? entry[0].replace('{0}', STAT_TIER_COLOR[1]) : 'Unknown bracelet effect ' + stat.index };
  }
  if (stat.type === 4) {
    var template = maps.genericEffectText[stat.index];
    return { desc: template ? template.replace('{0}', STAT_TIER_COLOR[1]) : 'Unknown effect ' + stat.index };
  }
  return { desc: 'Unknown: t=' + stat.type };
}


// =============================================================================
// SEÇÃO 5 — CÁLCULOS DE GEAR
// =============================================================================

// Calcula ilvl final usando a tabela de honing do banco de itens estático.
// Fórmula extraída de chunks/BIVkqT-L.js (função R(e,t)).
function calcItemLevel(item, itemStatic, maps) {
  var baseItemLevel = itemStatic[2];
  var honingTableId = itemStatic[4];
  var advHoneFlag   = itemStatic[7];
  var ilvl = baseItemLevel + (advHoneFlag ? item.data.advancedHoning : 0);
  var honingTable = maps.honingTables[honingTableId];
  if (honingTable && honingTable[item.data.honing]) {
    var bonus = honingTable[item.data.honing][0];
    if (bonus) ilvl += bonus;
  }
  return ilvl;
}

// Calcula quality (0-100%) usando a stat base do item vs. o máximo da tabela.
function calcQuality(item, itemStatic, maps) {
  var baseStat = item.data.stats.find(function(s) { return s.base; });
  if (!baseStat) return null;
  var rows = maps.statRollTable[baseStat.id];
  if (rows && rows[0]) {
    var max = rows[0][4];
    if (max) return Math.round((baseStat.value / max) * 100);
  }
  return Math.round((baseStat.value / WEAPON_QUALITY_FALLBACK_MAX) * 100);
}


// Tipos de battlePoint.parts que são valores ABSOLUTOS (não porcentagem).
// Confirmado via combatpower-breakdown-bug-report.md: type 1 (base_attack_point)
// mostra "Total Base Atk. Power" em número cru, não em %. type 2 (base_health_point)
// segue o mesmo padrão estrutural (campo companion `maxHp`), tratado igual por
// precaução — não há evidência de %, apenas ausência de contra-exemplo.
const CP_ABSOLUTE_TYPES = new Set([1, 2]);

// Resolve o texto de identificação de uma linha do Full Breakdown.
// Reaproveita resolveStat()/resolveBraceletEffect() já existentes, porque
// part.stat (types 15-21) tem exatamente o mesmo shape {type,index,id,value}
// dos stats de accessory/bracelet — e part.itemGrade já vem pronto no próprio
// part, sem precisar relookup no item.
function resolveCombatPowerLabel(part, maps) {
  switch (part.type) {
    case 1:  return { label: 'Total Base Atk. Power', raw: part.baseAttackPower };
    case 2:  return { label: 'Total Base HP', raw: part.maxHp };
    case 3:  return { label: 'Character Level ' + part.level };
    case 4:  return { label: 'Weapon Quality ' + part.quality };
    case 5:  return { label: 'Ark Passive Evolution (' + part.pointsSpent + ' pts)' };
    case 6:  return { label: 'Ark Passive Enlightenment (' + part.pointsSpent + ' pts)' };
    case 7:  return { label: 'Ark Passive Leap (' + part.pointsSpent + ' pts)' };
    case 8:  return { label: 'Karma Evolution Rank' };
    case 9:  return { label: 'Karma Leap Level' };
    case 10: {
      var info  = maps.engravingNames[part.id];
      var grade = ENGRAVE_GRADE_NAME[part.grade] || part.grade;
      return { label: info ? (grade + ' ' + info[0]) : ('Unknown engraving ' + part.id) };
    }
    case 15: case 16: case 17: case 18: {
      if (!part.stat) return { label: 'Accessory stat (' + part.slot + ')' };
      var resolvedStat = resolveStat(part.stat, part.itemGrade, maps);
      return { label: resolvedStat.desc.replace(/<[^>]*>/g, '').trim() };
    }
    case 19: case 20: case 21: {
      if (!part.stat) return { label: 'Bracelet effect' };
      var resolvedBrace = resolveBraceletEffect(part.stat, maps);
      return { label: resolvedBrace.desc.replace(/<[^>]*>/g, '').trim() };
    }
    case 22: {
      var gemInfo = maps.normalGemNames[part.id];
      return { label: gemInfo ? gemInfo[0] : ('Unknown gem ' + part.id) }; // gemInfo[0] já inclui "Lv. X"
    }
    case 23: return { label: 'Esther Weapon' };
    case 24: case 25: return { label: 'Transcendence' };
    case 26: return { label: 'Combat Stats' };
    case 27: {
      var set = (maps.cardSets || []).find(function(s) { return s[0] === part.id; });
      return { label: set ? set[1] : 'Unknown card set ' + part.id };
    }
    case 28: return { label: 'Stronghold Pet Effect' };
    case 29: case 30: {
      var coreInfo = maps.coreNames[part.id];
      var coreName = coreInfo ? coreInfo[0] : ('Unknown core ' + part.id);
      return { label: part.points != null ? (coreName + ' (' + part.points + ' pts)') : coreName };
    }
    case 31: case 32: {
      var optTable = maps.arkGridOptText[part.id];
      var optEntry = optTable && optTable[part.totalLevel - 1];
      return { label: optEntry ? ('Lv. ' + part.totalLevel + ' ' + optEntry[0]) : ('Unknown ark grid opt ' + part.id) };
    }
    case 33: case 34: {
      var orbName = maps.orbNames[part.id];
      return { label: orbName || ('Unknown orb ' + part.id) };
    }
    default:
      return { label: 'Unknown type ' + part.type };
  }
}

// =============================================================================
// SEÇÃO 6 — DECODIFICADORES POR DOMÍNIO
// =============================================================================

function decodeGear(loadout, maps) {
  return GEAR_SLOT_ORDER.map(function(slotKey) {
    var item = loadout.items.find(function(i) { return i.slot === slotKey; });
    if (!item) return null;
    var itemStatic = maps.itemStaticData[item.id];
    if (!itemStatic) return {
      slot: GEAR_SLOT_NAME[slotKey], hone: item.data.honing,
      advHone: null, tier: null, quality: null, ilvl: null,
    };
    return {
      slot:    GEAR_SLOT_NAME[slotKey],
      hone:    item.data.honing,
      advHone: item.data.advancedHoning > 0 ? item.data.advancedHoning : null,
      tier:    'Tier ' + itemStatic[3],
      quality: calcQuality(item, itemStatic, maps),
      ilvl:    calcItemLevel(item, itemStatic, maps),
    };
  }).filter(Boolean);
}

function decodeAccessories(loadout, maps) {
  return ACCESSORY_SLOT_ORDER.map(function(slotKey) {
    var item = loadout.items.find(function(i) { return i.slot === slotKey; });
    if (!item) return null;
    var itemStatic = maps.itemStaticData[item.id];
    var itemGrade  = itemStatic ? itemStatic[1] : null;
    var qualityStat = item.data.stats.find(function(s) { return s.type === 57; });
    var bonusLines  = item.data.stats.filter(function(s) { return !s.base; });
    return {
      slot:    ACCESSORY_SLOT_NAME[slotKey],
      tier:    itemStatic ? 'Tier ' + itemStatic[3] : null,
      quality: qualityStat ? qualityStat.value : null,
      enhance: null,  // sem fonte clara no payload — mantido por compatibilidade de schema
      stats: bonusLines.map(function(stat) {
        var resolved = resolveStat(stat, itemGrade, maps);
        return {
          name:        resolved.desc.replace(/<[^>]*>/g, '').trim(),
          rollQuality: resolved.tier >= 2 ? 'high' : resolved.tier === 1 ? 'mid' : 'low',
          domColor:    resolved.color,
        };
      }),
    };
  }).filter(Boolean);
}

function decodeBracelet(loadout, maps) {
  var item = loadout.items.find(function(i) { return i.slot === 'bracelet'; });
  if (!item) return null;
  var itemStatic = maps.itemStaticData[item.id];
  return {
    tier:           itemStatic ? 'Tier ' + itemStatic[3] : null,
    rollsRemaining: item.data.numRerolls,
    stats: item.data.stats.map(function(stat) {
      var resolved = resolveBraceletEffect(stat, maps);
      return {
        html:   resolved.desc,
        text:   resolved.desc.replace(/<[^>]*>/g, '').trim(),
        locked: !!stat.fixed,
      };
    }),
  };
}

function decodeStone(loadout, maps) {
  var item = loadout.items.find(function(i) { return i.slot === 'ability_stone'; });
  if (!item) return null;
  var itemStatic = maps.itemStaticData[item.id];
  return {
    tier: itemStatic ? 'Tier ' + itemStatic[3] : null,
    engravings: (item.data.engravings || []).map(function(eng) {
      var info = maps.engravingNames[eng.id];
      return {
        name:         info ? info[0] : 'Unknown engraving ' + eng.id,
        level:        eng.nodes,
        rollQuality:  eng.nodes >= 9 ? 'high' : 'mid',
        gradeIconUrl: null,
      };
    }),
  };
}

function decodeEngravings(loadout, maps) {
  return (loadout.engravings || []).map(function(eng) {
    var info = maps.engravingNames[eng.id];
    return {
      name:         info ? info[0] : 'Unknown engraving ' + eng.id,
      domColor:     null,
      progress:     String(eng.progress),
      stoneBonus:   null,
      gradeIconUrl: null,
      stoneIconUrl: null,
      grade:        ENGRAVE_GRADE_NAME[eng.grade] || eng.grade,
    };
  });
}

function decodeGems(loadout, maps) {
  return (loadout.gems || []).map(function(gem) {
    var primaryEffect = gem.effects && gem.effects[0];
    if (!primaryEffect) return null;
    var skillInfo = maps.skillNames[primaryEffect.id];
    if (!skillInfo) return null;
    var gemInfo = maps.normalGemNames[gem.id];
    var type = primaryEffect.type === GEM_EFFECT_TYPE.COOLDOWN ? 'time'
             : primaryEffect.type === GEM_EFFECT_TYPE.DAMAGE   ? 'attack' : null;
    return {
      skill: skillInfo[0],
      type:  type,
      level: gemInfo ? gemInfo[1] : null,
    };
  }).filter(Boolean);
}

function decodeSkills(loadout, maps) {
  return (loadout.skills || [])
    .filter(function(s) { return s.tripods && s.tripods.length > 0; })
    .map(function(skill) {
      var skillInfo    = maps.skillNames[skill.id];
      var tripodOptions = maps.tripodNames[skill.id] || [];
      var tripods = skill.tripods.map(function(choice, tierIdx) {
        if (!choice) return null;
        var optionIdx = tierIdx * 3 + (choice - 1);
        var opt = tripodOptions[optionIdx];
        return {
          number: choice,
          color:  tierIdx === 0 ? 'blue' : tierIdx === 1 ? 'green' : 'gold',
          name:   opt ? opt[0] : null,
        };
      }).filter(Boolean);
      return {
        name:    skillInfo ? skillInfo[0] : 'Unknown skill ' + skill.id,
        level:   skill.level,
        iconUrl: null,
        tripods: tripods,
        rune:    skill.rune ? (maps.runeNames[skill.rune] || 'Unknown rune ' + skill.rune) : null,
        gems:    [], // preenchido pelo orquestrador após decodeGems()
      };
    });
}

function decodeArkPassive(loadout, maps) {
  var trees = ['evolution', 'enlightenment', 'leap'];
  var result = {};
  trees.forEach(function(tree) {
    var nodes = (loadout.arkPassive || {})[tree] || [];
    result[tree] = {
      points: (loadout.apPoints || {})[tree] || 0,
      passives: nodes.map(function(node) {
        var info = maps.arkPassiveNodes[node.id];
        return {
          tier:    String(node.level),
          name:    info ? info[0] : 'Unknown node ' + node.id,
          iconUrl: null,
        };
      }),
    };
  });
  return result;
}

function decodeArkGrid(loadout, maps) {
  if (!loadout.arkGridCores || loadout.arkGridCores.length === 0) return null;

  var cores = loadout.arkGridCores.map(function(core) {
    var coreInfo = maps.coreNames[core.id] || [];
    return {
      name:        coreInfo[0] || 'Unknown core ' + core.id,
      points:      core.corePoints || core.gems.reduce(function(s, g) { return s + (g.corePoints || 0); }, 0),
      type:        coreInfo[2] || '',
      gemIconUrl:  null,
      typeIconUrl: null,
      rarityColor: null,
      gems: core.gems.map(function(gem) {
        var gemInfo = maps.astrogemNames[gem.id] || [];
        return {
          name:        gemInfo[0] || 'Unknown gem ' + gem.id,
          willpower:   String(gem.costReduc),
          orderPoints: String(gem.corePoints),
          gemIconUrl:  null,
          rarityColor: null,
        };
      }),
    };
  });

  // Bonuses: soma os levels de cada optId em todos os cores/gems,
  // depois faz UMA lookup em arkGridOptText[optId][totalLevel-1].
  // Validado 100% contra site: todos os 6 bônus batem em nível e valor.
  var optLevels = {};
  loadout.arkGridCores.forEach(function(core) {
    core.gems.forEach(function(gem) {
      (gem.opts || []).forEach(function(opt) {
        var table = maps.arkGridOptText[opt.id];
        if (!table) return;
        if (!optLevels[opt.id]) {
          optLevels[opt.id] = { name: table[0][0], type: table[0][1], totalLevel: 0 };
        }
        optLevels[opt.id].totalLevel += opt.level;
      });
    });
  });

  var bonuses = Object.keys(optLevels).map(function(optId) {
    var entry = optLevels[optId];
    var table  = maps.arkGridOptText[optId];
    var row    = table[entry.totalLevel - 1];
    if (!row) return null;
    var rawValue  = row[3];
    var isPercent = entry.type === 2 || entry.type === 4 || entry.type === 54 || entry.type === 59;
    var displayValue = isPercent ? (rawValue / 100).toFixed(2) : rawValue;
    return {
      optId:   Number(optId),
      name:    entry.name,
      level:   entry.totalLevel,
      value:   displayValue,
      percent: isPercent,
      desc:    entry.name + ' +' + displayValue + (isPercent ? '%' : ''),
    };
  }).filter(Boolean);

  return { cores: cores, bonuses: bonuses };
}

function decodeCards(loadout, maps) {
  if (!loadout.cards || loadout.cards.length === 0) return null;
  var ownedIds = loadout.cards.map(function(c) { return c.id; });
  var matched = (maps.cardSets || [])
    .map(function(set) {
      return {
        name:       set[1],
        ownedCount: set[3].filter(function(id) { return ownedIds.includes(id); }).length,
      };
    })
    .filter(function(s) { return s.ownedCount > 0; })
    .sort(function(a, b) { return b.ownedCount - a.ownedCount; })[0];

  return {
    sets:  matched ? [matched.name] : [],
    cards: loadout.cards.map(function(c) {
      var info = maps.cardNames[c.id];
      return {
        name:     info ? info[1] : 'Unknown card ' + c.id,
        grade:    info ? info[2] : null,
        artUrl:   null,
        awakeHtml: '',
      };
    }),
  };
}

// Corrige os 2 bugs documentados em combatpower-breakdown-bug-report.md:
//   Bug 1: part.value é porcentagem × 100 (ex: 2945 = 29.45%), não porcentagem
//          direta — exceto type 1/2 (CP_ABSOLUTE_TYPES), que são valores crus.
//   Bug 2: múltiplas entradas do mesmo type (gems, engravings, accessory
//          stats, bracelet effects, ark grid cores/opts) se sobrescreviam
//          num objeto {label: value} — agora cada categoria acumula um ARRAY
//          de linhas, uma por entrada real do battlePoint.parts.
function decodeCombatPowerBreakdown(loadout, maps) {
  var breakdown = {};
  ((loadout.battlePoint || {}).parts || []).forEach(function(part) {
    if (part.value === undefined) return;
    var category = COMBAT_POWER_TYPE[part.type] || ('type_' + part.type);
    var resolved = resolveCombatPowerLabel(part, maps);

    var entry;
    if (CP_ABSOLUTE_TYPES.has(part.type)) {
      entry = { label: resolved.label, value: resolved.raw != null ? resolved.raw : part.value, percent: null };
    } else {
      entry = { label: resolved.label, percent: (part.value / 100).toFixed(2) + '%' };
    }

    if (!breakdown[category]) breakdown[category] = [];
    breakdown[category].push(entry);
  });
  return breakdown;
}


// =============================================================================
// SEÇÃO 7 — ORQUESTRADOR PRINCIPAL
// =============================================================================

function selectLoadout(loadoutsData, preferred) {
  preferred = preferred || 'most_recent_chaos_dungeon';
  return loadoutsData.loadouts.find(function(l) { return l.classification === preferred; })
      || loadoutsData.loadouts[0];
}

// Ponto de entrada principal.
// rawPayload = saída de extractRawPayload()
// maps       = objeto com todos os maps estáticos (ver shape na Seção 3)
// opts       = { preferredClassification: 'most_recent_chaos_dungeon' | 'most_recent_raid' }
function parsePayload(rawPayload, maps, opts) {
  opts = opts || {};
  var loadoutsData = rawPayload.data[2].data;
  var loadout      = selectLoadout(loadoutsData, opts.preferredClassification);
  var classInfo    = loadoutsData.characterInfo || {};

  // Decodifica skills e gems, depois pareira gems → skills por nome
  var skills = decodeSkills(loadout, maps);
  var gems   = decodeGems(loadout, maps);
  skills.forEach(function(skill) {
    skill.gems = gems.filter(function(g) { return g.skill === skill.name; });
  });

  // Monta o objeto com o mesmo schema de extractCharacterData()
  var result = {
    character:              null,  // DOM-based — ver nota no topo do arquivo
    gear:                   decodeGear(loadout, maps),
    accessories:            decodeAccessories(loadout, maps),
    bracelet:               decodeBracelet(loadout, maps),
    stone:                  decodeStone(loadout, maps),
    engravings:             decodeEngravings(loadout, maps),
    gems:                   gems,
    skills:                 skills,
    cards:                  decodeCards(loadout, maps),
    arkPassive:             decodeArkPassive(loadout, maps),
    arkGrid:                decodeArkGrid(loadout, maps),
    combatPowerBreakdown:   decodeCombatPowerBreakdown(loadout, maps),

    // Campos extras não presentes no schema original — disponíveis sem custo
    _meta: {
      classification:    loadout.classification,
      classId:           classInfo.classId || null,
      itemLevel:         classInfo.itemLevel || loadout.itemLevel,
      level:             classInfo.level || null,
      combatPower:       loadout.combatPower,
      availableLoadouts: loadoutsData.loadouts.map(function(l) { return l.classification; }),
      paradise: (function() {
        var trinityItem = loadout.items.find(function(i) { return i.slot === 'trinity_core'; });
        return {
          score:    (loadout.paradise || {}).score    || null,
          orbScore: (loadout.paradise || {}).orbScore || null,
          orbName:  trinityItem ? (maps.orbNames[trinityItem.id] || 'Unknown orb ' + trinityItem.id) : null,
        };
      }()),
    },
  };

  return result;
}


// =============================================================================
// SEÇÃO 8 — EXPORTS
// =============================================================================

if (typeof window !== 'undefined') {
  window.LostArkPayloadParser = {
    extractRawPayload:      extractRawPayload,
    extractBalancedObject:  extractBalancedObject,
    parsePayload:           parsePayload,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractRawPayload:      extractRawPayload,
    extractBalancedObject:  extractBalancedObject,
    parsePayload:           parsePayload,
    resolveStat:            resolveStat,
    calcItemLevel:          calcItemLevel,
    calcQuality:            calcQuality,
  };
}
