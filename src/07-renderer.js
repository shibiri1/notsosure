// ============================================================================
// 07-renderer.js -- LostArk Bible Custom UI
// STATIC_ICONS (b64 fallback assets), render helper functions (qualityGradient,
// gemGradient, gemSym, calcAvgIlvl), global UI actions (refresh/nav), and the
// main renderUI() function plus its sub-builders (buildSkillCard, gearCardHTML,
// apNodes, etc.) that consume ARMORY_CSS/ARMORY_HTML and the extracted data.
// Depends on: 01-config.js, 02-maps.js, 03-utils.js, 05-styles.js, 06-template.js.
// ============================================================================

      // -- STATIC ICONS -------------------------------------------------------------
  var STATIC_ICONS = {
      "gem_symbol_cdr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAE0UlEQVR42nWVbWhWZRjHf/fbOed5Hp497gVsqdWqubY0oYIIsWLqIpPoVcrM1PoQRVqaRlQwoswyVLC3hYRU9i0oDLORG663sTIX2iZZYUVvWNuedLpn5+XqwzlzH6oL7sN9zuG+rv/5n//1vwzGgLUgCViDMQoRQWkwBkgg8A0iAgIK0Ci0cYgACJ4XEMcABvDx/SIarSGOsb4PcUwcJ0xEHMOUKQUqlZgkAaXS54Lg2awqEMchWmmssUBCHIeA0ijngVagwPcdKHAWPC/DYGHV3UvlphuuE0OKemJlxwCNsznAAQ7tggCJIgCqSkUq4yFKIIohHget031r61UsX740SwFGpVT5vsm+JCGRCJBsodNqzkGGolTy8R20zDx73QubnpCDX3TLbz8PypHDvXLo4CeydXO7zKifMifvp/RYC9ake61t9hfQ+DmPOBxHkoRc3nL6ZMSqlbfJ+g3rGB7+iwMHDtD3eS8Yzdy582hubmb6tHNob2/nrbffVbGktI1XUqxa6/Tied4Zzgyw5oEV8stPh+SlbU9KXQlKefCBgge+hqk1sOPljXLs+y9l5YobJPBStCpLYlKezBkKPAMXXTjtwSPffCZbn3tMfA2+gktn1T21aMElcuOiy6WlsbTMU+Ap2L7lcfnhaK9ccP6U640C58DoTFIKsEZhAKdh6+Z22d/1jkytSZMuvLppaPDrD+THox/LT999Ike/6Zb585p+9YH6Oujr3S3Pblwr+SBDnSlFO+uIY8EaSBKYPXsWg4ODjJ6AK64477MdO16rLhaLGKMYGRlCROjo6Ki/+OKzNg39CZ/27GfhgvmMV1IZBJ5CBLSk7cPixYtl167Xpampib6+PsIIGhoariyXy5weGyUMQwqFAlVVVYyOjtLS0vIoQH9/P7W1tXR0bJYlS66XJBEMoKM4wlpNHMdEUUS5XEYphbGglKKurg7P8xARCoUix48fp5AvUi7/jbWQy+U4deIkxXyB8bGQKAJrDRY0UZTQ2dmpdr//AR/37JHGxkaSBH7743fK5TIigjGOkZERrPPxgoDhkZNfhRGcO+M8wjBkxYr7lWQtH0ZxyjFAZTwGoKenh7a2NmpqlOvuGlBbtmzDGEc+n0cpQ5IID61ZS1/fkcuqqw1tbdeyd89eogjCEIKs0QCNMQZroJg3NMyovmbgUI88/8zDEphUGffctVBW33ezrF99p9xxy3zxgLyBTU9tkKOHe+T8abk59bV+wQIWCIw/mdjZVC7VJcOyOxbJof598ur2J2X6VFX0FRQcBCptkKoAXt72tHx7uFfuXX6j+CpN6CnwtEFjUM45wjBMO0+DCAQe3HLrdfLo+kcYq5xmf9c+BgYGEBEumtlMa2srNTW1bHx2MzvffE9NGu2ErWaOZ4wiiVPZWQdRBL6Dhoaz1ty59PZt8+bN5Zzp06lUxhgZGqarq4udO3cuPPbjyY/CCS/7d2ic8yfvMjuc6H2joFiAV158Rna9sV1KOfCAUg7cGS/+d6RyCxOUSieCMSqdIgJ+AOEYnBqFzg+7ATg1llI2dvp/kaZhbA6Ul9ZQDmu9yZcKfE+jgMBmfqIg5zQ2c8L/Q2y0dpOMIySJpCpxFq01YZjqW6WzFGsdYRSjUBjrSJLkPxP/AyVm1wwDpb6oAAAAAElFTkSuQmCC",
      "gem_symbol_attack": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAVCAYAAABCIB6VAAAEaklEQVR42n2VW4hWVRTHf2uffS7f6Iz3ZPCS9qKjmMFkF1CUxMSUMiOpLNRsHDFMhCCy7MlG6sHQbipNY5cx5TOzTEMy8oZZqSijEfbg6KQSDtao4/d957Z6OOM4irpgcw7n7P3fa/3XWv8lrhcQRUVc65JqRJKAMYCCKgAIIA4kMYDt+GJBrm1KudlMFIb06NnTTdO4E7Sysu9DqlBWJoiAAmkMIhAEHtZ1M7BOUOXOJuBaqK//UJctXaLdcuAAjgOOyf4bYwAD4iLG64jAdDy7LNd1AXAcwbGZV9u35/VM83Hdt+d7nTF9ojoCngPWZiQEgYe19jbeZRcbR0zGYUe4RqHl9Cn+PnOGsFTg3XdWsGHDGu3br9tgTcB1oFfP8pGaxnQelK7AabZcxyJkFAhgBbZsbtD8xrVqBZ6dOUn/aNqtRw/v0iWL5+iyN17Ro0f2au8eHkHAjeBdLjFpEuMaQdIsCBRKxasYTQk82LL5R5kx/YmZvx08wILaecyd8zxxVCQXuIOj0k3OdsmVyd6UJAXfz3hM05QoLhGGcN/oAZ83n2rLL178lix6eSFXLv1LRUUZs+fMOl1efh3oVkxjrYMAYSmjx3MMaRzjWhg/ftwLO3d+oQ8+cM+xPbubZOIjk+Wrxi957pmn+WHHNp3y2DgFEJM51QnsGKEUJuQCy8CBfSYsX75Uu3fvjud5xHFWNUOH3k19ff29q1Yt1VzO9K17e43U1NTsOHu2hbq6OhoaPtBevXLOtYayFgyOIQWKYUzN/Pk/T5k6lWHDhhFFEQBRFJEkCarKhAkTWL9+/YXKSjvkyKHmqQvmL5Tm5mZGjRrNt1u3xf3796n2PMF1XUySJAD4viWfzzc0NTVx7HgTKuB54Ps+SZIgIuzZs4/a2tpx58/FzVVVd7255uOPtGr4CH49+DvTpk2T1taLh8NQKRQyp3A96Sy1nAtffrZat+bXqCew8KVpeujAFp00vqrNF+gRwKuLZmnzXwf1l/3bdcyYkfs9X3C9LImO7dAaOjpJyLrOEchvXKsN61ZozsLD1YO+LvfBF3h88v164sguPfXnAV32Wq16BioqvBtq2FqDCNhcLkehUECAXM5QKqS0t7cT+GUAnDjR8pTnwfur63Ts2LG0tV1CxGHr1u9eV4XLl0NcV4hCxVpDHGdKZwqFAkHg4fsOhULaQU2AcT2iBKY/+aju3feTDh8xgvzmbzh3/gLtV0NaL7Z9YhwIfIcoVBxHSNPr8mmz+g1RzbjJhFCo6NGLxg3rtLq6msbGRhobG+e1tPzzaS4IEBGuXCkQxqBxlvwkuVE6re+7lEoRxmTyGMXZpgGDhlB+6T9mz32x5eTJk1WtrYV2gCQtISLEaaaIcXJrLbalUoS1BmMMYRgTBA7FYpFNmzaxcuV7Uix26SaTXZqmertOvm5lQa4zqY6BwDf061feWySrEmvBdbNlnRtFzNwBWgTTwaqgKJ6XDbwwVBx7bc7dJDBiUM326y3mHcD/hP7Pr6XOydYAAAAASUVORK5CYII=",
      "card_empty": "data:image/png;base64,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",
  };


  // -- RENDER UTILITIES ---------------------------------------------------------
  function qualityGradient(q) {
    if (q>=100) return 'linear-gradient(135deg,rgba(174,80,0,1),rgba(232,221,61,1))';
    if (q>=90)  return 'linear-gradient(135deg,rgba(67,4,100,1),rgba(214,20,230,1))';
    if (q>=70)  return 'linear-gradient(135deg,rgba(11,64,128,1),rgba(22,226,240,1))';
    return           'linear-gradient(135deg,rgba(42,98,4,1),rgba(207,247,20,1))';
  }
  function gemGradient(lv) {
    var g={
      7:  'linear-gradient(135deg,#3d2a0d,#9c6820)',
      8:  'linear-gradient(135deg,#5c1a05,#e35205)',
      9:  'linear-gradient(135deg,#8a0f02 0%,#d61f1f 60%,#ff6b1a 100%)',
      10: 'linear-gradient(135deg,#3d3325,#dcc999)',
    };
    return g[lv]||g[7];
  }
  function gemSym(key, lv) {
    var sym=STATIC_ICONS[key]; if(!sym) return '';
    return '<div class="gem-sym" style="background:'+gemGradient(lv)+';-webkit-mask-image:url('+JSON.stringify(sym)+');mask-image:url('+JSON.stringify(sym)+');" title="Lv.'+lv+'"></div>';
  }
  function calcAvgIlvl(gear) {
    if (!gear||!gear.length) return {avg:'0.00'};
    return {avg:(gear.reduce(function(s,g){return s+(g.ilvl||0);},0)/gear.length).toFixed(2)};
  }

  // -- GLOBAL ACTIONS ------------------------------------------------------------
  window.armoryToggleGrid = function(idx) {
    var exp=document.getElementById('ag-exp-'+idx), chev=document.getElementById('ag-chev-'+idx);
    if(!exp) return;
    var open=exp.style.maxHeight&&exp.style.maxHeight!=='0px';
    exp.style.maxHeight=open?'0px':exp.scrollHeight+'px';
    if(chev) chev.style.transform=open?'rotate(0deg)':'rotate(180deg)';
  };
  window.armoryNav = function(section) {
    var parts=window.location.pathname.split('/');
    var base=parts.slice(0,4).join('/');
    var ui=document.getElementById('armory-ui'); if(ui) ui.remove();
    window.location.href=section==='character'?base:base+'/'+section;
  };
  window.armoryRefresh = function() {
    var data=window._armoryData; if(!data||!data.character) return;
    var region=REGION_MAP[data.character.region]||data.character.region||'NA';
    var name=encodeURIComponent(data.character.name||'');
    var url='/api/refresh?region='+region+'&name='+name+'&force=false';
    var btn=document.getElementById('armory-refresh-btn');
    if(btn){btn.textContent='Refreshing...';btn.disabled=true;}
    fetch(url,{method:'POST'}).then(function(){
      if(btn) btn.textContent='Updated!';
      setTimeout(function(){
        var ui=document.getElementById('armory-ui'); if(ui) ui.remove();
        init();
      },2000);
    }).catch(function(e){
      console.error('[LostArk UI] Refresh error:',e);
      if(btn){btn.textContent='\u8635 Refresh';btn.disabled=false;}
    });
  };

  window.armoryNavExt = function(path) {
    var ui=document.getElementById('armory-ui'); if(ui) ui.remove();
    window.location.href=path;
  };

  // -- MAIN RENDERER -------------------------------------------------------------
  function renderUI(data) {
    console.log('[LostArk UI] Rendering v4...');
    var char=data.character; if(!char){console.warn('[LostArk UI] No char data');return;}
    window._armoryData=data;

    // Asset URLs
    var specSlug=(char.spec||'').replace(/ /g,'_');
    var charArtUrl=ASSETS_URL+'/Art_Class/BG_'+char.class+'.png';
    var emblemUrl=ASSETS_URL+'/Art_background/'+(char.archetype||'')+'_'+char.class+'.png';
    var specIconUrl=resolveSpecIcon(char.class, char.spec);

    // Weapon: check Esther, then resolve filename
    var gear=data.gear||[];
    var weaponPiece=gear[gear.length-1];
    var weaponEl=document.querySelector('.equipment-grid')?.querySelectorAll('.no-row-on-large')[10];
    var isEsther=detectEsther(weaponEl);
    var weaponFile=resolveWeaponAsset(char.spec, char.class, isEsther, weaponPiece?.hone||0);
    var isPlaceholder = weaponFile === 'NO_IMAGE';
    var weaponUrl = weaponFile
      ? (isPlaceholder ? ASSETS_URL+'/Art_Weapons/NO_IMAGE.png' : ASSETS_URL+'/Art_Weapons/'+weaponFile+'.png')
      : '';

    console.log('[LostArk UI] Assets:', {spec:char.spec, class:char.class, armorType:char.armorType, weaponFile:weaponFile, isEsther:isEsther});

    // Fonts
    if(!document.getElementById('armory-fonts')){
      var lnk=document.createElement('link');lnk.id='armory-fonts';lnk.rel='stylesheet';
      lnk.href='https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Rajdhani:wght@400;500;600;700&family=Heebo:wght@400;500;600;700&display=swap';
      document.head.appendChild(lnk);
    }
    // CSS
    if(!document.getElementById('armory-style')){
      var s=document.createElement('style');s.id='armory-style';s.textContent=ARMORY_CSS;
      document.head.appendChild(s);
    }
    // Container
    var el=document.getElementById('armory-ui');
    if(!el){el=document.createElement('div');el.id='armory-ui';document.body.appendChild(el);}
    el.innerHTML=ARMORY_HTML;

    // Wire up nav buttons (after HTML injection)
    document.getElementById('armory-refresh-btn').onclick=window.armoryRefresh;
    document.getElementById('tab-character').onclick=function(){window.armoryNav('character');};
    document.getElementById('tab-roster').onclick=function(){window.armoryNav('roster');};
    document.getElementById('tab-styles').onclick=function(){window.armoryNav('style-book');};
    document.getElementById('tab-guild').onclick=function(){window.armoryNav('guild');};
    document.getElementById('tab-logs').onclick=function(){window.armoryNav('logs');};

    // -- HEADER ----------------------------------------------
    var ilvl=calcAvgIlvl(gear);
    var rosterLevel=parseInt((char.level||'').replace(/Lv\.?\s*/i,'').trim())||'';
    var bg=document.getElementById('page-char-bg');
    bg.style.backgroundImage="url('"+charArtUrl+"')";
    document.getElementById('header-emblem').style.backgroundImage="url('"+emblemUrl+"')";
    document.getElementById('header-char').style.backgroundImage="url('"+charArtUrl+"')";
    document.getElementById('spec-img').src=specIconUrl;
    document.getElementById('char-name').textContent=char.name||'';
    document.getElementById('char-title').textContent=char.title||'';
    document.getElementById('char-sub').innerHTML='<span>'+(char.class||'')+'</span> &middot; '+(char.spec||'?')+' &middot; '+(char.server||'');
    // Current equipped CP as main, max recorded as secondary
    // If both are equal or currentCP missing, only show one
    var displayCP = char.currentCP || char.combatPower || '--';
    var maxCP = (char.currentCP && char.combatPower && char.currentCP !== char.combatPower)
      ? '≈ '+char.combatPower : '';
    document.getElementById('stat-cp').textContent = displayCP;
    document.getElementById('stat-cp-current').textContent = maxCP;
    // Role indicator -- elliptical radial glow behind the CP number
    var cpCard = document.getElementById('stat-cp')?.closest('.stat-card');
    if (cpCard) {
      var isSupport = char.combatPowerColor === 'support';
      var roleColor = isSupport ? 'rgba(74,222,128,' : 'rgba(220,38,38,';
      cpCard.style.position = 'relative';
      cpCard.style.overflow = 'hidden';
      // Remove old glow if exists
      var oldGlow = cpCard.querySelector('.cp-glow');
      if (oldGlow) oldGlow.remove();
      // Create glow element
      // Anchor glow to the number element itself
      var cpNum = document.getElementById('stat-cp');
      cpNum.style.position = 'relative';
      var glow = document.createElement('div');
      glow.className = 'cp-glow';
      glow.style.cssText = [
        'position:absolute',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'width:220%',
        'height:120%',
        'background:radial-gradient(ellipse at center, '+roleColor+'0.7) 0%, '+roleColor+'0.35) 30%, '+roleColor+'0.1) 55%, '+roleColor+'0) 65%)',
        'filter:blur(6px)',
        'pointer-events:none',
        'z-index:-1',
      ].join(';');
      cpNum.appendChild(glow);
    }
    document.getElementById('stat-ilvl').textContent=ilvl.avg;
    document.getElementById('stat-roster').textContent=rosterLevel;
    document.getElementById('stat-char').textContent='70';

    // -- GEAR ------------------------------------------------
    var armor=gear.slice(0,-1);
    function gearCardHTML(piece,iconUrl,isWpn){
      if(!piece) return '';
      var ec=piece.hone>=20?'#ffe060':'#c8922a';
      var sz=isWpn?'72px':'54px', pd=isWpn?'14px 16px':'9px 12px';
      var bg=isWpn?'':'background:var(--l2-bg);';
      var adv=piece.advHone!=null?'<span class="adv-tag">+'+piece.advHone+' Adv.</span>':'';
      var phOverlay = (isWpn && isPlaceholder)
        ? '<div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);border-radius:3px;">'
          +'<span style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Placeholder</span>'
          +'</div>'
        : '';
      return '<div class="item-card" style="padding:'+pd+'">'
        +'<div style="width:'+sz+';height:'+sz+';flex-shrink:0">'
        +'<div class="qborder" style="background:'+qualityGradient(piece.quality||0)+'">'
        +'<div class="qinner" style="position:relative;'+bg+'">'+phOverlay
        +'<img src="'+iconUrl+'" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.opacity=0.3">'
        +'</div></div></div>'
        +'<div class="item-text"><div class="item-name">'
        +(function(){
          var dispName = isWpn
            ? weaponDisplayName(weaponFile)
            : armorDisplayName(ARMOR_FILE_MAP[char.armorType]&&ARMOR_FILE_MAP[char.armorType][piece.slot]);
          return '<span class="name-str" style="font-size:'+(isWpn?'14':'13')+'px">'+(dispName||piece.slot||'')+'</span>';
        })()
        +'<span class="enhance" style="color:'+ec+'">+'+piece.hone+'</span>'
        +'<span class="tier-badge">'+(piece.tier||'T4')+'</span>'
        +'</div><div class="item-sub"><span class="ilvl-val">'+piece.ilvl+' ilvl</span>'+adv+'</div></div></div>';
    }
    document.getElementById('armor-list').innerHTML=armor.map(function(g){
      return gearCardHTML(g, resolveArmorAsset(char.armorType,g.slot), false);
    }).join('');
    document.getElementById('weapon-slot').innerHTML=weaponPiece?gearCardHTML(weaponPiece,weaponUrl,true):'';

    // -- ACCESSORIES -----------------------------------------
    var jewelry=pickJewelry(data.accessories||[]);
    (data.accessories||[]).forEach(function(acc,i){
      var j=jewelry[i]||{img:'',name:acc.slot||''};
      var qEl=document.getElementById('acc-q-'+i);
      if(qEl) qEl.style.background=qualityGradient(acc.quality||0);
      var imgEl=document.getElementById('acc-img-'+i);
      var nameEl=document.getElementById('acc-name-'+i);
      if(imgEl) imgEl.src=j.img;
      if(nameEl) nameEl.textContent=j.name||acc.slot||'';
      var linesEl=document.getElementById('acc-lines-'+i);
      if(linesEl) linesEl.innerHTML=(acc.stats||[]).map(function(s){
        var m=s.name.match(/^(.+?)\s+(\+[\d.]+%?)$/);
        var nm=m?m[1]:s.name, val=m?m[2]:'';
        var col=s.domColor||(s.rollQuality==='high'?'#EA6811':s.rollQuality==='mid'?'#DF18E3':'#1260EB');
        return '<div class="bonus-line"><span>'+nm+' </span><span class="bonus-val" style="color:'+col+'">'+val+'</span></div>';
      }).join('');
    });

    // -- STONE -----------------------------------------------
    var stone=data.stone;
    document.getElementById('stone-icon').src='https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/magic_stone_talisman.png';
    document.getElementById('stone-engravings').innerHTML=(stone&&stone.engravings||[]).map(function(e){
      var col=STONE_LEVEL_COLOR[e.level]||'#8888aa';
      return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">'
        +'<span style="font-size:12px;font-weight:600;color:var(--gold);flex:1">'+e.name+'</span>'
        +'<img style="width:14px;height:14px;object-fit:contain;flex-shrink:0;margin-left:4px;" src="https://lostark.bible/i/ico_ability_stone_symbol.png">'
        +'<span style="font-size:11px;font-weight:700;color:'+col+'">Lv.'+e.level+'</span>'
        +'</div>';
    }).join('');
    var brace=data.bracelet;
    document.getElementById('bracelet-icon').src='https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/bracelet_of_ei00.png';
    document.getElementById('bracelet-effects').innerHTML=(brace&&brace.stats||[]).map(function(s){
      // Use full innerHTML bypass -- site has already applied colors via inline styles
      return '<div class="b-line">'+(s.html||s.text||'')+'</div>';
    }).join('');

    // -- ENGRAVINGS -------------------------------------------
    document.getElementById('engravings-list').innerHTML=(data.engravings||[]).map(function(e){
      var col=e.domColor||(function(){
        var p=(e.progress||'0/20').split('/').map(Number);
        return p[0]>=p[1]?'#d4a820':p[0]>0?'#b535cc':'#3a3a60';
      })();
var gradeImg=e.gradeIconUrl?'<img class="eng-grade-icon" src="'+e.gradeIconUrl+'" onerror="this.style.display=&quot;none&quot;">':'';
var stoneImg=e.stoneIconUrl?'<img class="eng-stone-icon" src="'+e.stoneIconUrl+'" onerror="this.style.display=&quot;none&quot;">':'';
      var bonus=e.stoneBonus?'<span class="eng-stone-bonus">'+e.stoneBonus+'</span>'+stoneImg:'';
      return '<div class="eng-item">'
        +gradeImg
        +'<span class="eng-item-name" style="color:'+col+'">'+(e.name||'')+'</span>'
        +'<div class="eng-item-right">'
        +bonus
        +'<span class="eng-item-pts" style="color:'+col+'">'+(e.progress||'')+'</span>'
        +'</div></div>';
    }).join('');

    // -- SKILLS & GEMS ----------------------------------------
    var isHellfire = (char.spec === 'Hellfire Successor');
    var NO_RUNE_URL = 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/no_rune.png';

    function buildSkillCard(skill, cls) {
      // Tripod badges — background = tier color (from 02-maps.js), text
      // always white+shadow for legibility regardless of background tier.
      var tdots = (skill.tripods||[]).map(function(t){
        if (!t || !t.number) return '';
        var bg = TRIPOD_TIER_COLOR[t.color] || TRIPOD_TIER_COLOR.blue;
        return '<span class="tp-badge" style="background:'+bg+'">'+t.number+'</span>';
      }).join('');

      // Rune badge — overlay at bottom-right of icon. Background = rarity
      // color extracted directly from the site's own gradient (DOM bypass,
      // same pattern as ark grid gem/core rarity), not a computed/mapped value.
      var runeUrl = skill.runeIconUrl || NO_RUNE_URL;
      var runeBg = skill.runeRarityColor ? 'background:'+skill.runeRarityColor+';' : '';
      var runeBadge = '<span class="skill-rune-badge" style="'+runeBg+'"><img src="'+runeUrl+'" title="'+(skill.rune||'No rune')+'"></span>';

      // Skill icon
      var ico = skill.iconUrl ? '<img src="'+skill.iconUrl+'">' : '';

      // Gems
      var cdr = skill.gems && skill.gems.find(function(g){return g.type==='time';});
      var dmg = skill.gems && skill.gems.find(function(g){return g.type==='attack';});
      var syms = '';
      if(cdr&&dmg) syms=gemSym('gem_symbol_cdr',cdr.level)+gemSym('gem_symbol_attack',dmg.level);
      else if(cdr) syms=gemSym('gem_symbol_cdr',cdr.level);
      else if(dmg) syms=gemSym('gem_symbol_attack',dmg.level);

      return '<div class="skill-card '+(cls||'').trim()+'">'        +'<div class="skill-tripods">'+tdots+'</div>'        +'<div class="skill-icon-wrap"><div class="skill-icon-ph">'+ico+'</div>'+runeBadge+'</div>'        +'<div class="skill-gems">'+syms+'</div>'        +'</div>';
    }

    var skillByName={};
    (data.skills||[]).forEach(function(s){ skillByName[s.name]=s; });

    function renderSkillList(skills) {
      var html='';
      skills.forEach(function(skill){
        if(isHellfire && HELLFIRE_GHOST[skill.name]) return;
        if(isHellfire && HELLFIRE_NORMAL[skill.name]){
          var ghost=skillByName[HELLFIRE_NORMAL[skill.name]];
          html+='<div class="skill-pair">'            +buildSkillCard(skill,'skill-card-front')            +(ghost?buildSkillCard(ghost,'skill-card-ghost'):'')            +'</div>';
        } else {
          html+=buildSkillCard(skill,'');
        }
      });
      return html;
    }

    var groupResult = matchSkillGroup(char.class, char.spec, data.skills||[]);
    var html='';
    if (groupResult) {
      groupResult.grouped.forEach(function(group, gi) {
        if (!group.length) return;
        if (gi > 0) html += '<div class="skill-group-sep"></div>';
        html += '<div class="skill-group">';
        html += '<span class="skill-group-label">'+groupResult.labels[gi]+'</span>';
        html += '<div class="skill-group-skills">'+renderSkillList(group)+'</div>';
        html += '</div>';
      });
      if (groupResult.ungrouped.length) {
        html += '<div class="skill-group-sep"></div>';
        html += '<div class="skill-group">'+renderSkillList(groupResult.ungrouped)+'</div>';
      }
    } else {
      html = '<div style="display:flex;flex-wrap:wrap;gap:10px;">'+renderSkillList(data.skills||[])+'</div>';
    }
    document.getElementById('skills-gems-grid').innerHTML=html;

    // -- ARK PASSIVE ------------------------------------------
    var ap=data.arkPassive;
    function apNodes(passives){
      return (passives||[]).map(function(p){
        var img=p.iconUrl?'<img src="'+p.iconUrl+'" onerror="this.style.display=&quot;none&quot;">':'';
        return '<div class="ark-node">'+img+'<div class="ark-tooltip">'+(p.name||'')+'</div></div>';
      }).join('');
    }
    if(ap){
      document.getElementById('ark-evo').innerHTML=apNodes(ap.evolution&&ap.evolution.passives);
      document.getElementById('ark-enl').innerHTML=apNodes(ap.enlightenment&&ap.enlightenment.passives);
      document.getElementById('ark-leap').innerHTML=apNodes(ap.leap&&ap.leap.passives);
    }

    // Card border -- bypass site URLs directly (confirmed working from DOM)
    function cardBorderUrl(grade) {
      var num = {uncommon:'1', rare:'2', epic:'3', legendary:'4'};
      return 'https://lostark.bible/i/img_card_grade_tooltip'+(num[(grade||'').toLowerCase()]||'4')+'.png';
    }

        // -- CARDS ------------------------------------------------
    var cards=data.cards;
    if(cards){
      document.getElementById('cards-set-name').textContent=(cards.sets||[]).join(' · ');
      document.getElementById('cards-row').innerHTML=(cards.cards||[]).map(function(c){
        var border=cardBorderUrl(c.grade);
        var art=c.artUrl||'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/ico_emptycard_grade.png';
        var awakeHtml=c.awakeHtml?'<div style="transform:scale(0.80);transform-origin:top center;pointer-events:none;position:relative;left:50%;transform:translateX(-50%) scale(0.80);">'+c.awakeHtml+'</div>':'';
        return '<div class="card-outer">'
          +'<div class="card-art-clip"><img class="card-art" src="'+art+'" title="'+(c.name||'')+'"></div>'
          +'<img class="card-border" src="'+border+'">' 
          +'<div class="awake-wrap">'+awakeHtml+'</div>'
          +'</div>';
      }).join('');
    }

    // -- ARK GRID ---------------------------------------------
    var arkGrid=data.arkGrid;
    if(arkGrid){
      document.getElementById('grid-list').innerHTML=(arkGrid.cores||[]).map(function(core,idx){
        // Show gem icon + type icon side by side in the slot
        var gemIco=core.gemIconUrl?'<img src="'+core.gemIconUrl+'" style="width:100%;height:100%;object-fit:cover;display:block;">':'';
        var typeIco=core.typeIconUrl?'<img src="'+core.typeIconUrl+'" style="width:14px;height:14px;object-fit:contain;flex-shrink:0;">':'';
        var icon=gemIco;
        return '<div class="grid-item">'
          +'<div class="grid-header" onclick="armoryToggleGrid('+idx+')">'
          +'<div class="grid-slot-icon">'+icon+'</div>'
          +'<div class="grid-core-info"><span class="grid-core-name" style="color:'+(core.rarityColor||'var(--text)')+'">'+(core.name||'')+'</span><span class="grid-core-label" style="color:var(--gold-b)">'+typeIco+(core.type||'')+'</span></div>'
          +'<span class="grid-core-pts">'+(core.points||'')+'</span>'
          +'<span class="grid-chevron" id="ag-chev-'+idx+'">&#9662;</span>'
          +'</div>'
          +'<div class="grid-expand" id="ag-exp-'+idx+'">'  
          +'<div class="expand-inner">'  
          +(core.gems&&core.gems.length  
            ?(core.gems.map(function(g){  
                var gico=g.gemIconUrl?'<img src="'+g.gemIconUrl+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover;flex-shrink:0;">':'';  
                var gc=g.rarityColor||'var(--text)';
                return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'+gico+'<div><div style="font-size:12px;font-weight:600;color:'+gc+'">'+g.name+'</div><div style="font-size:10px;"><span style="color:var(--text-muted)"><div><span style=\"color:var(--gold)\">Willpower Cost:</span> '+g.willpower+'</div><div><span style=\"color:var(--gold)\">Chaos Points:</span> '+g.orderPoints+'</div></div></div></div>';  
              }).join(''))  
            :'<span style="color:var(--text-muted);font-size:11px;">No gems</span>'  
          )  
          +'</div></div>'  
          +'</div>';
      }).join('');
      var ANCHOR_MAP = {
        'Attack Power': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_atk_pwr.png',
        'Additional Damage': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_add_dmg.png',
        'Boss Damage': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_boss_dmg.png',
        'Ally Damage Enh.': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_ally_dmg_enh.png',
        'Brand Power': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_br_pwr.png',
        'Ally Attack Enh.': 'https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/assets/Art_Miscs/anchor_ally_atk_enh.png',
      };
      document.getElementById('grid-bonuses-list').innerHTML=(arkGrid.bonuses||[]).map(function(b){
        var anc=ANCHOR_MAP[b.name]?'<img class="grid-bonus-anchor" src="'+ANCHOR_MAP[b.name]+'">':'';
        return '<div class="grid-bonus-row">'
          +'<div class="grid-bonus-badge"><div class="grid-bonus-badge-text">Lv.'+b.level+'</div></div>'
          +anc
          +'<span class="grid-bonus-name">'+b.name+'</span>'
          +'<div class="grid-bonus-val">'+b.percent+' <span class="grid-bonus-arrow"></span></div>'
          +'</div>';
      }).join('');
    }
    console.log('[LostArk UI] v4 render complete!');
  }


