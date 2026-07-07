// ============================================================================
// 08-main.js -- LostArk Bible Custom UI
// Bootstrapping: waitForDOM, init() (calls extractCharacterData + renderUI),
// pollCurrentCP, MutationObserver for SvelteKit client-side navigation, and the
// initial init() call. Must load LAST -- it invokes everything above.
// Depends on: ALL other files (04-extractor.js for extraction, 07-renderer.js
// for renderUI).
// ============================================================================

  // -- INIT ------------------------------------------------
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
      const data = await extractCharacterData();
      if (!data.character) {
        console.warn('[LostArk UI] Could not extract character data.');
        return;
      }
      renderUI(data);

      // Poll for currentCP after render -- element appears late in DOM
      (function pollCurrentCP() {
        var attempts = 0;
        var interval = setInterval(function() {
          attempts++;
          var el = [...document.querySelectorAll('*')].find(function(e) {
            var cls = String(e.className || '');
            return cls.includes('text-2xl') && cls.includes('font-bold');
          });
          if (el) {
            clearInterval(interval);
            var val = parseFloat(el.textContent.trim().replace(/[^0-9.]/g, '')) || null;
            if (val) {
              var cpEl = document.getElementById('stat-cp');
              var cpSub = document.getElementById('stat-cp-current');
              var maxCP = data.character.combatPower;
              if (cpEl) cpEl.textContent = val;
              if (cpSub) cpSub.textContent = (maxCP && String(val) !== String(maxCP)) ? '\u2248 '+maxCP : '';
              // Recreate glow anchored to updated number
              var oldGlow = cpEl?.querySelector('.cp-glow');
              if (oldGlow) oldGlow.remove();
              var isSupport = data.character.combatPowerColor === 'support';
              var rc = isSupport ? 'rgba(74,222,128,' : 'rgba(220,38,38,';
              if (cpEl) {
                cpEl.style.position = 'relative';
                var glow = document.createElement('div');
                glow.className = 'cp-glow';
                glow.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220%;height:120%;background:radial-gradient(ellipse at center,'+rc+'0.7) 0%,'+rc+'0.35) 30%,'+rc+'0.1) 55%,'+rc+'0) 65%);filter:blur(6px);pointer-events:none;z-index:-1;';
                cpEl.appendChild(glow);
              }
            }
          } else if (attempts >= 50) {
            clearInterval(interval);
          }
        }, 200);
      })();
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

  init();
