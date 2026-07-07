// ==UserScript==
// @name         LostArk Bible -- Custom UI
// @namespace    https://github.com/shibiri1/notsosure
// @version      4.6
// @description  Custom UI overlay for LostArk Bible
// @author       shibiri1
// @match        https://lostark.bible/character/*/*
// @grant        GM_getResourceText
// @resource     mapsData    https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/maps.json
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/00-payload-parser.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/01-config.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/02-maps.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/03-utils.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/04-extractor.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/05-styles.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/06-template.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/07-renderer.js
// @require      https://cdn.jsdelivr.net/gh/shibiri1/notsosure@main/src/08-main.js
// ==/UserScript==

// This file is intentionally empty.
// All logic lives in the @require'd files above, loaded in dependency order:
//   00-payload-parser -- extractRawPayload(), parsePayload() and its decodeXxx()
//                  helpers. Standalone (no deps on 01-08), receives `maps` as
//                  a function argument rather than reading a global.
//   01-config    -- ASSETS_URL, SUPPORT_SPECS, REGION_MAP
//   02-maps      -- fixed lookup tables (WEAPON_MAP, ARMOR_*_MAP, SPEC_MAP, etc.)
//   03-utils     -- resolver/utility functions (depends on 01, 02)
//   04-extractor -- DOM scraping + payload-based extraction (depends on 02, 03)
//   05-styles    -- ARMORY_CSS string
//   06-template  -- ARMORY_HTML string
//   07-renderer  -- renderUI() and builders (depends on 01, 02, 03, 05, 06)
//   08-main      -- init() and bootstrap (depends on everything above; runs last)
//
// jsDelivr caches by branch/tag -- if you push a fix and don't see it reflected,
// either wait a few minutes for cache purge or bump to a commit-pinned URL
// (replace @main with @<commit-sha>) to force-bust the cache during testing.
//
// PAYLOAD MAPS (maps.json, ~7.3MB):
// Loaded via @resource + GM_getResourceText instead of fetch() -- Tampermonkey
// downloads this once when the script is installed/updated (based on @version
// in this header), then serves it from local cache synchronously on every
// page load. No network request happens at runtime. If you push a new
// maps.json to the repo, bump @version here so Tampermonkey re-fetches it --
// otherwise users keep the maps.json bundled with whatever version they have
// installed, even if the file changed on GitHub.
