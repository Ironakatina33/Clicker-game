// ==UserScript==
// @name         PokéClicker Mini Tools FR — Œufs, Pokédex et AutoClick
// @namespace    https://www.pokeclicker.com/
// @version      1.5.0
// @description  PokéTools 1.5 : HUD shiny, tableau de bord, nouveaux thèmes et outils complets avec mises à jour auto.
// @author       PokéClicker Mini Tools
// @homepageURL  https://github.com/Ironakatina33/Clicker-game/tree/main/pokeclicker-mini-tools
// @match        https://www.pokeclicker.com/*
// @match        https://pokeclicker.com/*
// @updateURL    https://raw.githubusercontent.com/Ironakatina33/Clicker-game/main/pokeclicker-mini-tools/PokeClicker_Mini_Tools.meta.js
// @downloadURL  https://raw.githubusercontent.com/Ironakatina33/Clicker-game/main/pokeclicker-mini-tools/PokeClicker_Mini_Tools.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const ROOT = 'pcmt-root';
    const STORE = 'pcmt-settings-v1';
    if (document.getElementById(ROOT) || window.PokeMiniTools) return;

    const TYPES = {
        0: 'Routes', 1: 'Pokémon errants', 2: 'Donjons', 3: 'Boss de donjon',
        4: 'Coffres de donjon', 5: 'Évolutions', 6: 'Œufs', 7: 'Bébés / reproduction',
        8: 'Boutiques', 9: 'Fossiles', 10: 'Safari', 11: 'Battle Frontier',
        12: 'Ferme / baies', 13: 'Discord', 14: 'Récompenses de quêtes',
        15: 'Combats spéciaux', 16: 'Récompenses d’arène',
        17: 'Récompenses de donjon', 18: 'Échanges', 19: 'Cadeaux PNJ',
        20: 'Pokémon obscurs', 21: 'Orbes de rêve', 22: 'Battle Café', 23: 'Objets du Safari',
    };
    const EGG_FR = {
        Fire_egg: 'Feu', Water_egg: 'Eau', Grass_egg: 'Plante',
        Fighting_egg: 'Combat', Electric_egg: 'Électrik', Dragon_egg: 'Dragon',
        Mystery_egg: 'Mystère',
    };

    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (_) { /* ignore */ }
    const state = {
        tab: 'eggs', open: false, eggType: 'all', missingOnly: false,
        region: null, search: '', selected: null,
        cps: Math.max(1, Math.min(80, Number(stored.cps) || 10)),
        turbo: !!stored.turbo, catchSpeed: [1,2,4,8].includes(Number(stored.catchSpeed)) ? Number(stored.catchSpeed):1,
        enabled: false, clicks: 0, timer: null,
        dexRegion: stored.dexRegion ?? null, dexFilter: stored.dexFilter || 'missing',
        dexSearch:'', dexPage:0, autoRoute:false, routeMode:stored.routeMode || 'missing',
        routeInterval:Math.max(30,Math.min(300,Number(stored.routeInterval)||90)),
        lastRouteChange:0, routeOwnedSince:0, routePrevious:null,
        smartBalls:false, smartRare:Math.max(5,Math.min(100,Number(stored.smartRare)||45)),
        shinyMaster:!!stored.shinyMaster, autoClaim:!!stored.autoClaim,
        ballMode:stored.ballMode==='native'?'native':'smart', smartRepeat:!!stored.smartRepeat,
        theme:stored.theme==='night'?'night':'classic',
        shinyTarget:stored.shinyTarget || '',
        notifications:stored.notifications !== false,
        hiddenTabs:Array.isArray(stored.hiddenTabs)?stored.hiddenTabs:[],
        favorites:Array.isArray(stored.favorites)?stored.favorites:['eggs','dex','shiny'],
        compact:!!stored.compact,
        hudVisible: stored.hudVisible !== false,
        hudCollapsed:!!stored.hudCollapsed,
        hudSide:stored.hudSide==='left'?'left':'right',

    };
    const css = `
#${ROOT}, #${ROOT} * { box-sizing:border-box; }
#${ROOT} { font-family:system-ui,-apple-system,'Segoe UI',sans-serif; font-size:13px; color:#e9f2ff; }
#${ROOT} button, #${ROOT} input, #${ROOT} select { font:inherit; }
#${ROOT} button { cursor:pointer; }
#${ROOT} .pcmt-fab {position:fixed;right:16px;bottom:18px;z-index:2147483000;padding:12px 17px;border-radius:999px;background:#174b8e;border:1px solid #69b7ff;color:white;font-weight:750;box-shadow:0 7px 25px #0009;}
#${ROOT} .pcmt-fab:hover {background:#2161ad;}
#${ROOT} .pcmt-panel {position:fixed;bottom:75px;right:16px;z-index:2147482999;width:min(430px,calc(100vw - 24px));max-height:min(75vh,700px);display:flex;flex-direction:column;overflow:hidden;border-radius:17px;border:1px solid #315579;background:#101c2e;box-shadow:0 18px 55px #000b;}
#${ROOT} .pcmt-panel[hidden] {display:none!important;}
#${ROOT} .pcmt-head {padding:15px 17px 11px;background:linear-gradient(130deg,#193e67,#10263e);display:flex;align-items:center;justify-content:space-between;gap:12px;}
#${ROOT} .pcmt-title {font-size:17px;font-weight:780;letter-spacing:-.3px;}
#${ROOT} .pcmt-muted {color:#a3b7d1;font-size:12px;}
#${ROOT} .pcmt-close {color:#dcecff;background:transparent;border:1px solid #44658c;border-radius:8px;font-size:17px;padding:3px 10px;}
#${ROOT} .pcmt-tabs {display:flex;overflow-x:auto;gap:4px;padding:7px;background:#0b1625;scrollbar-width:thin;flex-shrink:0;}
#${ROOT} .pcmt-tab {padding:9px 11px;border:0;white-space:nowrap;border-radius:9px;background:transparent;color:#a9c4df;font-weight:650;flex-shrink:0;}
#${ROOT} .pcmt-tab.active {background:#234c79;color:white;}
#${ROOT} .pcmt-content {overflow-y:auto;min-height:180px;padding:15px;overscroll-behavior:contain;}
#${ROOT} .pcmt-controls {display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px;}
#${ROOT} .pcmt-input,#${ROOT} .pcmt-select {width:100%;min-width:0;padding:9px 10px;background:#172a41;color:#eef6ff;border:1px solid #395674;border-radius:10px;outline:none;}
#${ROOT} .pcmt-input:focus,#${ROOT} .pcmt-select:focus {border-color:#66b5ff;}
#${ROOT} .pcmt-select {flex:1;min-width:120px;}
#${ROOT} .pcmt-card {background:#16293f;border:1px solid #294564;border-radius:12px;padding:11px 12px;margin-bottom:11px;}
#${ROOT} .pcmt-cardtitle {font-size:14px;font-weight:750;margin-bottom:6px;}
#${ROOT} .pcmt-chip {display:inline-block;margin:3px 5px 3px 0;padding:6px 9px;border:1px solid #355675;background:#1c3754;color:#e5f4ff;border-radius:8px;text-align:left;max-width:100%;}
#${ROOT} .pcmt-chip.caught {background:#153b37;border-color:#327a60;color:#b5f8d6;}
#${ROOT} .pcmt-chip.missing {background:#433125;border-color:#896347;color:#ffdbbb;}
#${ROOT} .pcmt-chip:hover {border-color:#86bdff;}
#${ROOT} .pcmt-pill {display:inline-block;padding:3px 7px;background:#214568;color:#c9e5ff;border-radius:999px;margin:4px 5px 4px 0;font-size:11px;}
#${ROOT} .pcmt-switchrow {display:flex;align-items:center;gap:8px;cursor:pointer;}
#${ROOT} .pcmt-switchrow input {accent-color:#62b8ff;width:16px;height:16px;}
#${ROOT} .pcmt-action {background:#287cc2;border:1px solid #6ab8ef;color:#fff;border-radius:10px;padding:10px 14px;font-weight:700;}
#${ROOT} .pcmt-action.stop {background:#833c42;border-color:#d2858e;}
#${ROOT} .pcmt-result {display:block;width:100%;padding:9px 10px;text-align:left;border:0;border-bottom:1px solid #29435e;color:#e9f3ff;background:transparent;}
#${ROOT} .pcmt-result:hover {background:#234364;}
#${ROOT} .pcmt-results {max-height:210px;overflow:auto;border:1px solid #29435e;border-radius:10px;margin:9px 0;}
#${ROOT} .pcmt-link {color:#8cccff;text-decoration:underline;text-underline-offset:3px;}
#${ROOT} .pcmt-note {font-size:12px;line-height:1.5;color:#a8bed6;margin:9px 0;}
#${ROOT} .pcmt-row {display:flex;justify-content:space-between;align-items:center;gap:8px;}
#${ROOT} .pcmt-group {padding:7px 0;border-bottom:1px solid #29435e;line-height:1.5;}
#${ROOT} .pcmt-group:last-child {border-bottom:none;}
#${ROOT} .pcmt-meter {height:7px;background:#30435e;border-radius:20px;overflow:hidden;margin:7px 0;}
#${ROOT} .pcmt-meter > span {display:block;height:100%;background:#59b5f6;border-radius:20px;}
#${ROOT} input[type=range] {accent-color:#65baff;width:100%;margin:12px 0;}
#${ROOT} .pcmt-favorites {display:flex;gap:5px;padding:6px 11px;background:#112238;border-top:1px solid #263e59;flex-wrap:wrap;}
#${ROOT} .pcmt-favorites button {border:1px solid #315778;background:#1d3b5a;color:#dceaff;border-radius:18px;padding:5px 9px;font-size:11px;}
#${ROOT} .pcmt-toast {position:fixed;right:17px;bottom:75px;z-index:2147483100;max-width:330px;padding:11px 15px;border:1px solid #75bfff;border-radius:12px;background:#174b74;color:#fff;box-shadow:0 5px 20px #0008;}
#${ROOT} .pcmt-small {font-size:11px;color:#9bb1c8;}
#${ROOT} .pcmt-minirow {display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid #29435e;}
#${ROOT} .pcmt-minirow button {flex-shrink:0;}
#${ROOT} .pcmt-fav {background:transparent;border:0;color:#e2bb53;cursor:pointer;}
#${ROOT}.compact .pcmt-panel {width:min(380px,calc(100vw - 24px));max-height:min(60vh,600px);}
#${ROOT}.compact .pcmt-card {padding:8px;margin-bottom:6px;}
#${ROOT} .pcmt-toggle {padding:6px 9px;background:#254765;border:1px solid #42729b;color:#ebf6ff;border-radius:8px;}
#${ROOT} .pcmt-toggle:disabled {opacity:.45;cursor:not-allowed;}
#${ROOT} .pcmt-tag-good {color:#9fe1ad;} #${ROOT} .pcmt-tag-warn {color:#ffbd87;}
@media(max-width:540px) {#${ROOT} .pcmt-panel {right:12px;bottom:69px;max-height:70vh;}#${ROOT} .pcmt-fab {right:12px;bottom:12px;}}
`;
    // Palette inspirée de l'interface de PokéClicker et d'une Poké Ball.
    const themeCss = `
#${ROOT} .pcmt-head::before {content:'';flex-shrink:0;width:27px;height:27px;display:block;border-radius:50%;border:3px solid #172234;background:linear-gradient(#e85652 0 43%,#172234 43% 55%,#fafbfe 55% 100%);box-shadow:0 0 0 2px #fff2,inset 0 0 0 1px #fff3;}
#${ROOT} .pcmt-head::after {content:'';position:absolute;left:33px;top:25px;width:9px;height:9px;border-radius:50%;border:2px solid #1c2738;background:#fff;pointer-events:none;}
#${ROOT} .pcmt-head {position:relative;justify-content:flex-start;background:linear-gradient(110deg,#a92235,#d44149);border-bottom:3px solid #f9d55f;}
#${ROOT} .pcmt-head .pcmt-close{margin-left:auto;background:#fff2;border-color:#fffa;}
#${ROOT} .pcmt-title,#${ROOT} .pcmt-muted{color:#fff;}
#${ROOT} .pcmt-panel {background:#f3f6fb;color:#26374f;border:2px solid #24374e;box-shadow:0 14px 50px #0f1b2f77;}
#${ROOT} .pcmt-content{color:#223349;}
#${ROOT} .pcmt-tabs{background:#e9eef7;border-bottom:1px solid #ccd6e5;}
#${ROOT} .pcmt-tab{color:#405473;}
#${ROOT} .pcmt-tab:hover {background:#dbe4f0;}
#${ROOT} .pcmt-tab.active{background:#fff;color:#a9263c;box-shadow:inset 0 -3px #d9444e;}
#${ROOT} .pcmt-card{background:#fff;border-color:#dbe2ed;box-shadow:0 2px 7px #162b4710;}
#${ROOT} .pcmt-cardtitle{color:#24374e;}
#${ROOT} .pcmt-note,#${ROOT} .pcmt-small{color:#66758b;}
#${ROOT} .pcmt-input,#${ROOT} .pcmt-select{background:#fff;border-color:#bdcbdb;color:#26374f;}
#${ROOT} .pcmt-input:focus,#${ROOT} .pcmt-select:focus{border-color:#e65d64;}
#${ROOT} .pcmt-chip{background:#f2f6fd;border-color:#ccdaeb;color:#2d4565;}
#${ROOT} .pcmt-chip.caught{background:#e3f8e9;border-color:#91d4a8;color:#276a45;}
#${ROOT} .pcmt-chip.missing{background:#fff0e5;border-color:#e7b78f;color:#954b32;}
#${ROOT} .pcmt-group,#${ROOT} .pcmt-minirow{border-bottom-color:#e0e6ef;}
#${ROOT} .pcmt-action{background:#c93447;border-color:#9f2838;color:white;}
#${ROOT} .pcmt-toggle{background:#eef2f8;border-color:#c6d4e4;color:#29415c;}
#${ROOT} .pcmt-pill{background:#e4edf8;color:#345879;}
#${ROOT} .pcmt-link{color:#a7283f;}
#${ROOT} .pcmt-favorites{background:#edf2f9;border-top-color:#d0dce9;}
#${ROOT} .pcmt-favorites button{background:#fff;border-color:#d0d9e5;color:#405474;}
#${ROOT} .pcmt-fab{background:#c63545;border:2px solid white;box-shadow:0 0 0 2px #2a334c,0 9px 25px #0008;}
#${ROOT} .pcmt-fab:hover{background:#a92137;}
#${ROOT} input[type=range],#${ROOT} .pcmt-switchrow input{accent-color:#c73549;}
#${ROOT} .pcmt-results{border-color:#d2dce9;}
#${ROOT} .pcmt-result{color:#2c3c54;border-bottom-color:#e0e6ef;}
#${ROOT} .pcmt-result:hover{background:#edf3fa;}
#${ROOT} .pcmt-tag-good{color:#1d8245;}#${ROOT} .pcmt-tag-warn{color:#a85027;}
#${ROOT} .pcmt-meter{background:#d9e4ef;}#${ROOT} .pcmt-meter > span{background:#d64d56;}
#${ROOT}.theme-night .pcmt-panel{background:#101b2b;color:#e8f3ff;border-color:#425978;}
#${ROOT}.theme-night .pcmt-content{color:#e9f3ff;}
#${ROOT}.theme-night .pcmt-tabs,#${ROOT}.theme-night .pcmt-favorites{background:#111e31;border-color:#30425c;}
#${ROOT}.theme-night .pcmt-tab{color:#b9cbe1;}
#${ROOT}.theme-night .pcmt-tab.active{background:#243e5f;color:#fff;}
#${ROOT}.theme-night .pcmt-card{background:#182941;border-color:#355070;}
#${ROOT}.theme-night .pcmt-cardtitle{color:#f1f7ff;}
#${ROOT}.theme-night .pcmt-note,#${ROOT}.theme-night .pcmt-small{color:#b6c4d8;}
#${ROOT}.theme-night .pcmt-input,#${ROOT}.theme-night .pcmt-select{background:#203951;color:#fff;border-color:#4b6482;}
#${ROOT}.theme-night .pcmt-toggle,#${ROOT}.theme-night .pcmt-chip,#${ROOT}.theme-night .pcmt-favorites button{background:#26425d;border-color:#4c6b8e;color:#edf5ff;}
#${ROOT}.theme-night .pcmt-group,#${ROOT}.theme-night .pcmt-minirow{border-bottom-color:#3c506d;}
#${ROOT}.theme-night .pcmt-pill{background:#264364;color:#d6eafa;}
#${ROOT}.theme-night .pcmt-result{color:#e8f4ff;border-color:#3b5270;}
#${ROOT}.theme-night .pcmt-result:hover{background:#2b4b6a;}
#${ROOT}.theme-night .pcmt-tag-good{color:#92dbb0;}
#${ROOT} .pcmt-callout{font-size:12px;padding:9px 11px;border-left:3px solid #cf404b;background:#f9ecec;border-radius:5px;color:#513942;margin:9px 0;line-height:1.5;}
#${ROOT}.theme-night .pcmt-callout{background:#362c39;color:#f7e0e4;}
#${ROOT} button:focus-visible,#${ROOT} select:focus-visible,#${ROOT} input:focus-visible{outline:2px solid #d44a55;outline-offset:2px;}
`;
    // Refonte 1.5 : une identité propre à PokéTools, sans ressources externes.
    const polishCss = `
#${ROOT}{--pc-red:#de4950;--pc-red-deep:#b93043;--pc-ink:#233248;--pc-muted:#687a8d;--pc-line:#e6e9ef;--pc-paper:#f5f6f9;--pc-white:#fff;--pc-blue:#365d87;--pc-gold:#f7c45f;--pc-green:#268b66;--pc-shadow:0 18px 54px rgba(17,28,48,.26);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:0}
#${ROOT} button{transition:transform .14s ease,background .18s ease,box-shadow .18s ease,border-color .18s ease}
#${ROOT} button:active{transform:scale(.97)}
#${ROOT} .pcmt-panel{width:min(515px,calc(100vw - 22px));max-height:min(84vh,790px);border-radius:22px;border:1px solid rgba(38,50,74,.22);background:var(--pc-paper);color:var(--pc-ink);box-shadow:var(--pc-shadow);bottom:79px;right:18px;isolation:isolate;animation:pcmt-panel-in .21s cubic-bezier(.2,.8,.2,1) both}
#${ROOT} .pcmt-head{min-height:100px;display:flex;align-items:center;gap:14px;padding:16px 18px 17px;background:linear-gradient(116deg,#25374f,#142338);border-bottom:0;overflow:hidden;position:relative}
#${ROOT} .pcmt-head::before{content:none}
#${ROOT} .pcmt-head::after{content:'';position:absolute;right:-38px;top:-91px;left:auto;width:220px;height:220px;opacity:.12;border:26px solid white;background:radial-gradient(circle at center,transparent 0 18%,white 18% 23%,transparent 24%);border-radius:50%;pointer-events:none}
#${ROOT} .pcmt-emblem{position:relative;width:45px;height:45px;min-width:45px;overflow:hidden;border:3px solid #fff;border-radius:50%;background:linear-gradient(#eb6264 0 46%,#263247 46% 55%,#fbfcfe 55%);box-shadow:0 0 0 3px rgba(255,255,255,.13),0 8px 17px rgba(0,0,0,.23)}
#${ROOT} .pcmt-emblem::after{content:'';position:absolute;width:13px;height:13px;border-radius:50%;left:calc(50% - 6.5px);top:calc(50% - 6.5px);background:#f7f9ff;border:3px solid #253247;box-shadow:0 0 0 1px #fff}
#${ROOT} .pcmt-head .pcmt-title{font-size:20px;line-height:1.1;color:white;font-weight:850;letter-spacing:-.65px}
#${ROOT} .pcmt-head .pcmt-muted{font-size:10px;letter-spacing:1.1px;color:#acbfd3;margin-top:6px;font-weight:650}
#${ROOT} .pcmt-head .pcmt-close{margin-left:auto;z-index:1;line-height:1;font-size:22px;border:1px solid #64748970;background:#fff1;border-radius:11px;padding:8px 11px;color:#e5edf7;align-self:flex-start}
#${ROOT} .pcmt-head .pcmt-close:hover{background:#fff3}
#${ROOT} .pcmt-header-status{padding:8px 17px;display:flex;gap:10px;align-items:center;justify-content:space-between;background:var(--pc-white);color:var(--pc-muted);border-bottom:1px solid var(--pc-line);font-size:11px;font-weight:650}
#${ROOT} .pcmt-live-dot{display:inline-block;width:7px;height:7px;background:#3cba86;border-radius:100%;box-shadow:0 0 0 3px #3cba8626;margin-right:6px}
#${ROOT} .pcmt-tabs{padding:10px 11px 12px;display:flex;gap:7px;overflow-x:auto;scroll-snap-type:x proximity;flex-wrap:nowrap;border-bottom:1px solid var(--pc-line);background:#fff;scrollbar-color:#cad0dc transparent}
#${ROOT} .pcmt-tabs .pcmt-tab{padding:8px 11px;scroll-snap-align:start;min-height:34px;font-size:11px;border-radius:9px;font-weight:750;border:1px solid transparent;background:#f2f3f7;color:#617187}
#${ROOT} .pcmt-tabs .pcmt-tab:hover{background:#e9edf5;color:#253e5d}
#${ROOT} .pcmt-tabs .pcmt-tab.active{background:#263b58;border-color:#263b58;color:#fff;box-shadow:none}
#${ROOT} .pcmt-favorites{padding:8px 14px;background:#fbfbfe;border-top:0;border-bottom:1px solid var(--pc-line);gap:7px}
#${ROOT} .pcmt-favorites button{border-radius:8px;background:white;color:#4a5c73;border:1px solid #e2e5ed;padding:5px 10px;font-size:10px;font-weight:650}
#${ROOT} .pcmt-content{padding:17px;background:radial-gradient(circle at 100% 0%,#f1eff2,transparent 42%),#f6f7fa;min-height:235px;color:var(--pc-ink);scrollbar-color:#c4cad5 transparent}
#${ROOT} .pcmt-card{background:#fff;border:1px solid #e6e9f0;border-radius:15px;padding:15px 16px;margin:0 0 12px;box-shadow:0 5px 18px rgba(35,49,75,.045)}
#${ROOT} .pcmt-cardtitle{font-size:14px;color:#26364c;font-weight:800;letter-spacing:-.15px;margin-bottom:9px}
#${ROOT} .pcmt-note,#${ROOT} .pcmt-small{color:#748094;line-height:1.52}
#${ROOT} .pcmt-note{font-size:12px}
#${ROOT} .pcmt-row{gap:11px}
#${ROOT} .pcmt-minirow,#${ROOT} .pcmt-group{border-bottom:1px solid #eef0f4;padding:9px 0;gap:12px}
#${ROOT} .pcmt-minirow strong,#${ROOT} .pcmt-group strong{color:#354963;max-width:48%;text-align:right}
#${ROOT} .pcmt-input,#${ROOT} .pcmt-select{border:1px solid #dee4eb;border-radius:10px;padding:11px 12px;background:#fafbfd;color:#273a53;min-height:38px}
#${ROOT} .pcmt-input:focus,#${ROOT} .pcmt-select:focus{border-color:#d64855;box-shadow:0 0 0 3px #d6485518}
#${ROOT} .pcmt-action{background:#cb3d4d;border:0;border-radius:10px;color:white;padding:10px 14px;font-size:12px;box-shadow:0 4px 10px #cb3d4d19}
#${ROOT} .pcmt-action:hover{background:#b62d40;box-shadow:0 5px 12px #cb3d4d30}
#${ROOT} .pcmt-toggle{background:#f4f6fa;border-color:#e1e5ed;color:#34506b;border-radius:9px;padding:8px 11px}
#${ROOT} .pcmt-toggle:hover{background:#ecf1f8;border-color:#b6c4d6}
#${ROOT} .pcmt-chip{background:#f5f8fc;border-color:#dae2ec;border-radius:9px;padding:7px 10px;color:#314b68;font-weight:620}
#${ROOT} .pcmt-chip.caught{background:#e9f7ee;border-color:#bce0ca;color:#27734b}
#${ROOT} .pcmt-chip.missing{background:#fff3e7;border-color:#f0cfab;color:#a35b35}
#${ROOT} .pcmt-pill{background:#eff3f9;color:#516c8b;border-radius:7px;padding:4px 7px}
#${ROOT} .pcmt-fab{right:19px;bottom:17px;border:1px solid #d6e0ec;border-radius:14px;padding:12px 18px;background:#263b56;color:#fff;box-shadow:0 12px 28px rgba(17,31,55,.24);font-size:13px;font-weight:790;letter-spacing:-.1px;display:flex;align-items:center;gap:9px}
#${ROOT} .pcmt-fab:hover{background:#345070;transform:translateY(-2px)}
#${ROOT} .pcmt-fab .pcmt-fab-orb{display:inline-block;width:17px;height:17px;border-radius:50%;border:2px solid #e7eef7;position:relative;background:linear-gradient(#e04b56 0 43%,#20324b 43% 55%,white 55%)}
#${ROOT} .pcmt-fab .pcmt-fab-orb::after{content:'';position:absolute;left:4px;top:4px;width:5px;height:5px;background:#fff;border-radius:50%;border:1px solid #1c3450}
#${ROOT} .pcmt-toast{background:#263b56;border-color:#7593b7;border-radius:10px}
#${ROOT} .pcmt-pagehero{position:relative;overflow:hidden;background:linear-gradient(125deg,#2a405e,#15263b);color:white;border-radius:16px;padding:20px;margin-bottom:13px}
#${ROOT} .pcmt-pagehero::after{content:'◓';position:absolute;right:-4px;top:-48px;font-size:175px;line-height:1;color:#ffffff12;pointer-events:none}
#${ROOT} .pcmt-kicker{font-size:10px;letter-spacing:1.55px;text-transform:uppercase;font-weight:800;color:#fbcb72}
#${ROOT} .pcmt-pagehero h2{margin:8px 0;font-size:24px;line-height:1.1;font-weight:850;letter-spacing:-.6px;color:#fff}
#${ROOT} .pcmt-pagehero p{margin:0;color:#bdcad8;font-size:12px;max-width:300px;line-height:1.55}
#${ROOT} .pcmt-dash-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}
#${ROOT} .pcmt-dash-tile{background:#fff;border:1px solid #e5e9f0;border-radius:13px;padding:14px 13px;text-align:left;display:flex;flex-direction:column;gap:7px;color:#304763;min-height:99px}
#${ROOT} .pcmt-dash-tile:hover{transform:translateY(-2px);border-color:#b0c3d7;box-shadow:0 7px 15px #1e355615}
#${ROOT} .pcmt-dash-icon{font-size:22px;line-height:1}
#${ROOT} .pcmt-dash-tile strong{font-size:13px;color:#2b3f58;font-weight:800}
#${ROOT} .pcmt-dash-tile span:last-child{font-size:11px;color:#718298;line-height:1.4}
#${ROOT} .pcmt-home-statgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:13px}
#${ROOT} .pcmt-home-stat{background:#fff;border:1px solid #e8ebf0;border-radius:12px;padding:13px 9px;text-align:center;min-width:0}
#${ROOT} .pcmt-home-stat strong{display:block;font-size:18px;letter-spacing:-.6px;color:#2e435e}
#${ROOT} .pcmt-home-stat span{display:block;font-size:10px;color:#7d8b9c;margin-top:3px}
#${ROOT} .pcmt-shiny-banner{background:linear-gradient(120deg,#fff8ed,#fff);border:1px solid #f1dfba;border-radius:12px;padding:15px;margin-bottom:14px}
#${ROOT} .pcmt-shiny-banner strong{font-size:22px;color:#9a5e23;letter-spacing:-.8px;display:block}
#${ROOT} .pcmt-shiny-banner span{color:#a47c45;font-size:11px}
/* Radar/HUD persistant, compact et indépendant du panneau */
#${ROOT} .pcmt-radar{position:fixed;right:18px;bottom:79px;z-index:2147482988;width:308px;max-width:calc(100vw - 24px);color:#eaf2fc;background:linear-gradient(150deg,#1e314c,#182a40);border:1px solid #516683;border-radius:18px;box-shadow:0 17px 45px #111b3290;overflow:hidden;font-variant-numeric:tabular-nums;animation:pcmt-panel-in .23s ease-out both}
#${ROOT} .pcmt-radar[hidden],#${ROOT}.pcmt-open .pcmt-radar{display:none!important}
#${ROOT}.pcmt-hud-left .pcmt-radar{right:auto;left:18px}
#${ROOT} .pcmt-radar-head{padding:12px 14px 10px;display:flex;align-items:center;gap:8px;background:#ffffff08;border-bottom:1px solid #ffffff13}
#${ROOT} .pcmt-radar-head .pcmt-radar-icon{width:20px;height:20px;border-radius:7px;background:#f05a60;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold}
#${ROOT} .pcmt-radar-head strong{font-size:10px;letter-spacing:1.45px;color:#eaf0fa}
#${ROOT} .pcmt-radar-head .pcmt-radar-live{margin-left:auto;color:#72dbb6;font-size:9px;letter-spacing:1px;font-weight:800}
#${ROOT} .pcmt-radar-head button{border:0;background:#ffffff12;border-radius:7px;color:#cbd8e9;font-size:14px;padding:2px 7px;line-height:21px}
#${ROOT} .pcmt-radar-body{padding:15px 16px 13px}
#${ROOT} .pcmt-radar-title{font-size:10px;text-transform:uppercase;color:#a7b7cc;font-weight:750;letter-spacing:1.05px}
#${ROOT} .pcmt-radar-odds{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:4px 0 9px}
#${ROOT} .pcmt-radar-odds strong{font-size:31px;letter-spacing:-1.5px;font-weight:850;color:#fff;line-height:1.2}
#${ROOT} .pcmt-radar-percent{font-size:12px;color:#ffca8a;font-weight:740}
#${ROOT} .pcmt-radar-chancebar{height:3px;border-radius:5px;background:linear-gradient(90deg,#ee6163,#f5c75d,#8de0c0);opacity:.8;margin-bottom:13px}
#${ROOT} .pcmt-radar-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding-bottom:12px}
#${ROOT} .pcmt-radar-stat{min-width:0;background:#ffffff0a;border:1px solid #ffffff12;border-radius:10px;padding:9px 10px}
#${ROOT} .pcmt-radar-stat span{font-size:9px;display:block;color:#9cacc3;line-height:1.35;margin-bottom:4px}
#${ROOT} .pcmt-radar-stat strong{font-size:14px;font-weight:790;color:#f8fafe;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${ROOT} .pcmt-radar-route{padding:9px 0;border-top:1px solid #ffffff16;display:flex;gap:8px;align-items:center;min-width:0}
#${ROOT} .pcmt-radar-routeicon{font-size:20px;line-height:1}
#${ROOT} .pcmt-radar-route span{display:block;font-size:9px;color:#a0b0c4;margin-bottom:3px}
#${ROOT} .pcmt-radar-route strong{font-size:12px;color:#edf4fc;display:block;max-width:230px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
#${ROOT} .pcmt-radar-actions{padding:9px 12px;background:#ffffff08;display:flex;gap:8px}
#${ROOT} .pcmt-radar-actions button{flex:1;border:1px solid #7788a44d;background:#ffffff11;color:#ebf3ff;border-radius:8px;padding:8px 5px;font-size:10px;font-weight:730}
#${ROOT} .pcmt-radar-actions button:hover{background:#ffffff25}
#${ROOT}.pcmt-radar-compact .pcmt-radar-body,#${ROOT}.pcmt-radar-compact .pcmt-radar-actions{display:none}
#${ROOT}.pcmt-radar-compact .pcmt-radar{width:275px;border-radius:12px}
#${ROOT}.pcmt-radar-compact .pcmt-radar-head{border:0;padding:9px 10px}
#${ROOT}.pcmt-radar-compact .pcmt-radar-live{font-size:10px;color:#ffe09e}
#${ROOT}.pcmt-hud-left .pcmt-fab{right:19px}
#${ROOT}.theme-night{--pc-paper:#131f30;--pc-ink:#e8f3ff;--pc-line:#2e425c}
#${ROOT}.theme-night .pcmt-panel{background:#131f30;color:#e8f3ff;border-color:#435775}
#${ROOT}.theme-night .pcmt-header-status,#${ROOT}.theme-night .pcmt-tabs,#${ROOT}.theme-night .pcmt-favorites{background:#1a2b42;border-color:#304864;color:#c4d5e7}
#${ROOT}.theme-night .pcmt-content{background:#142236;color:#eaf2fa}
#${ROOT}.theme-night .pcmt-card,#${ROOT}.theme-night .pcmt-dash-tile,#${ROOT}.theme-night .pcmt-home-stat{background:#1d3149;border-color:#3a4d66;color:#eaf2fa}
#${ROOT}.theme-night .pcmt-cardtitle,#${ROOT}.theme-night .pcmt-home-stat strong,#${ROOT}.theme-night .pcmt-dash-tile strong,#${ROOT}.theme-night .pcmt-minirow strong{color:#f4f7fd}
#${ROOT}.theme-night .pcmt-tabs .pcmt-tab{background:#26394f;color:#cbdae9}
#${ROOT}.theme-night .pcmt-tabs .pcmt-tab.active{background:#de4950;color:#fff;border-color:#de4950}
#${ROOT}.theme-night .pcmt-favorites button{background:#29415c;color:#e8f3ff;border-color:#3d5777}
#${ROOT}.theme-night .pcmt-note,#${ROOT}.theme-night .pcmt-small{color:#b5c4d6}
#${ROOT}.theme-night .pcmt-input,#${ROOT}.theme-night .pcmt-select{background:#20344f;border-color:#536c8c;color:#f3f6ff}
#${ROOT}.theme-night .pcmt-minirow,#${ROOT}.theme-night .pcmt-group{border-color:#3c4e66}
#${ROOT}.theme-night .pcmt-shiny-banner{background:linear-gradient(120deg,#47332c,#2b3141);border-color:#776047}
#${ROOT}.theme-night .pcmt-shiny-banner strong{color:#ffce86}
@keyframes pcmt-panel-in{from{opacity:0;transform:translateY(9px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:540px){#${ROOT} .pcmt-panel{right:9px;bottom:70px;max-height:calc(100dvh - 91px);width:calc(100vw - 18px);border-radius:17px}#${ROOT} .pcmt-head{min-height:80px}#${ROOT} .pcmt-tabs{padding:7px}#${ROOT} .pcmt-content{padding:12px}#${ROOT} .pcmt-radar{right:10px;bottom:69px;max-width:calc(100vw - 20px);width:290px}#${ROOT}.pcmt-hud-left .pcmt-radar{left:10px}#${ROOT} .pcmt-fab{right:11px;bottom:11px}}
@media(prefers-reduced-motion:reduce){#${ROOT} *,#${ROOT} *::before,#${ROOT} *::after{animation:none!important;transition:none!important}}
`;
    const clean = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
    const E = (tag, klass, textValue) => {
        const n = document.createElement(tag);
        if (klass) n.className = klass;
        if (textValue !== undefined) n.textContent = textValue;
        return n;
    };
    const safe = (fn, fallback = null) => { try { return fn(); } catch (e) { console.debug('[Poké Mini Tools]', e); return fallback; } };
    const regionName = (id) => {
        const name = GameConstants.Region?.[Number(id)];
        return name ? name[0].toUpperCase() + name.slice(1) : `Région ${id}`;
    };
    const pokemonData = (name) => safe(() => PokemonHelper.getPokemonByName(name), null);
    const caught = (name) => {
        const data = pokemonData(name);
        return !!(data && safe(() => App.game.party.alreadyCaughtPokemon(data.id), false));
    };
    const display = (name) => safe(() => PokemonHelper.displayName(name), name) || name;
    const eggKey = (id) => GameConstants.EggItemType?.[id] ?? String(id);
    const eggName = (id) => EGG_FR[eggKey(id)] || eggKey(id).replace(/_/g, ' ');

    const TAB_LIST = [
        ['home','⌂ Accueil'], ['eggs','🥚 Œufs'], ['pokemon','🔎 Pokémon'], ['clicker','⚡ Auto'],
        ['shiny','✨ Shiny'], ['dex','📗 Pokédex'], ['routes','🧭 Routes'],
        ['balls','🔴 Balls'], ['quests','📋 Quêtes'], ['stats','📊 Stats'], ['backups','💾 Saves'],
        ['settings','⚙ Options']
    ];
    let root, panel, content, tabs, fab, favBar;
    let toastTimeout;
    const session = {start:Date.now(),base:null,counts:{},last:0};
    function notify(msg) {
        if (!state.notifications || !root) return;
        root.querySelector('.pcmt-toast')?.remove();
        const toast = E('div','pcmt-toast',msg);
        toast.setAttribute('role','status'); root.appendChild(toast);
        clearTimeout(toastTimeout);
        toastTimeout=setTimeout(()=>toast.remove(),4500);
    }
    function selectedFavorite(id) {
        if (state.favorites.includes(id)) state.favorites=state.favorites.filter(x=>x!==id);
        else if (state.favorites.length<5) state.favorites.push(id);
        else {notify('Cinq favoris maximum.');return;}
        save();renderFavorites();
        if (state.tab==='settings') render();
    }
    // Mini radar visible hors panneau. Toutes les valeurs proviennent du jeu.
    let radar = null;
    let hudUpdateTime = 0;
    function makeRadar() {
        radar=E('aside','pcmt-radar');radar.setAttribute('aria-label','PokéRadar : informations de partie');
        const header=E('div','pcmt-radar-head');
        const emblem=E('span','pcmt-radar-icon','✦');header.appendChild(emblem);
        header.appendChild(E('strong','', 'POKÉRADAR'));
        header.appendChild(E('span','pcmt-radar-live','● EN DIRECT'));
        const collapse=E('button','',state.hudCollapsed?'⌄':'−');collapse.type='button';collapse.title='Réduire / déployer le PokéRadar';collapse.setAttribute('aria-label','Réduire ou déployer le PokéRadar');
        collapse.onclick=()=>{state.hudCollapsed=!state.hudCollapsed;save();syncRadarVisibility();};
        header.appendChild(collapse);radar.appendChild(header);
        const body=E('div','pcmt-radar-body');
        body.innerHTML=`<div class="pcmt-radar-title">✨ CHANCE SHINY · PROCHAINE RENCONTRE</div>
        <div class="pcmt-radar-odds"><strong id="pcmt-hud-odds">—</strong><span class="pcmt-radar-percent" id="pcmt-hud-percent">—</span></div>
        <div class="pcmt-radar-chancebar" role="presentation"></div>
        <div class="pcmt-radar-stats">
          <div class="pcmt-radar-stat"><span>Shinies capturés · total</span><strong id="pcmt-hud-shinies">—</strong></div>
          <div class="pcmt-radar-stat"><span>Rencontres / min</span><strong id="pcmt-hud-rate">—</strong></div>
          <div class="pcmt-radar-stat"><span>Depuis dernier shiny · route</span><strong id="pcmt-hud-since">—</strong></div>
          <div class="pcmt-radar-stat"><span>Autoclicker</span><strong id="pcmt-hud-auto">—</strong></div>
        </div><div class="pcmt-radar-route"><span class="pcmt-radar-routeicon">🧭</span><div><span id="pcmt-hud-route-mode">AUTO-ROUTE</span><strong id="pcmt-hud-next-route">—</strong></div></div>`;
        radar.appendChild(body);
        const actions=E('div','pcmt-radar-actions');
        for (const [tab,label] of [['shiny','✦ Shiny Hunter'],['routes','◈ Auto-route']]){
            const btn=E('button','',label);btn.type='button';btn.onclick=()=>{togglePanel(true);selectTab(tab);};actions.appendChild(btn);
        }
        radar.appendChild(actions);
        root.appendChild(radar);
        syncRadarVisibility();updateRadar();
    }
    function syncRadarVisibility(){
        if(!root)return;
        root.classList.toggle('pcmt-radar-compact',state.hudCollapsed);
        root.classList.toggle('pcmt-hud-left',state.hudSide==='left');
        root.classList.toggle('pcmt-open',state.open);
        if(radar){radar.hidden=!state.hudVisible;
            const collapse=radar.querySelector('.pcmt-radar-head button');
            if(collapse)collapse.textContent=state.hudCollapsed?'⌄':'−';}
    }
    function updateRadar(){
        if(!radar || !state.hudVisible)return;
        const $ = id=>radar.querySelector('#'+id);
        const m=shinyMetrics();
        $('pcmt-hud-odds').textContent=Number.isFinite(m.odds)?'1 / '+fmt(Math.round(m.odds)):'Indisponible';
        $('pcmt-hud-percent').textContent=Number.isFinite(m.p)?(m.p*100).toLocaleString('fr-FR',{maximumFractionDigits:4})+' %':'—';
        $('pcmt-hud-shinies').textContent=fmt(readStat('totalShinyPokemonCaptured'));
        $('pcmt-hud-rate').textContent=Number.isFinite(m.rate)?(m.rate*60).toLocaleString('fr-FR',{maximumFractionDigits:1}):'Calcul…';
        $('pcmt-hud-since').textContent=shinyTrack.key?fmt(shinyTrack.sinceLastShiny):'—';
        $('pcmt-hud-auto').textContent=state.enabled?(state.turbo?'Turbo · '+state.cps+'/s':'Actif · '+state.cps+'/s'):'En pause';
        const active=safe(()=>App.game.gameState===GameConstants.GameState.fighting,false);
        let routeText=active?String(safe(()=>Routes.getName(player.route,player.region),'Route actuelle')):'Hors route';
        let modeText=state.autoRoute?'● AUTO-ROUTE ACTIVE':'○ AUTO-ROUTE EN PAUSE';
        if(active){
            const candidates=bestRouteCandidate(Number(player.region),state.routeMode);
            const other=candidates.filter(r=>r.number!==Number(player.route));
            const target=state.routeMode==='missing'?other[0]:(other.find(r=>r.number!==state.routePrevious)||other[0]);
            if(target)routeText=(state.autoRoute?'À suivre : ':'Suggestion : ')+target.label;
            else if(state.routeMode==='missing'&&candidates.some(r=>r.number===Number(player.route))){routeText='Objectif : terminer la route actuelle';}
            else if(candidates.length===1){routeText='Objectif : '+candidates[0].label;}
            else routeText='Aucune autre route disponible';
        }
        $('pcmt-hud-route-mode').textContent=modeText;
        $('pcmt-hud-next-route').textContent=routeText;
        $('pcmt-hud-next-route').title=routeText;
        if(state.hudCollapsed){const tag=radar.querySelector('.pcmt-radar-live'); if(tag)tag.textContent=Number.isFinite(m.odds)?'✨ 1/'+fmt(Math.round(m.odds)):'● LIVE';}
        else{const tag=radar.querySelector('.pcmt-radar-live'); if(tag)tag.textContent='● EN DIRECT';}
        hudUpdateTime=Date.now();
    }

    function renderFavorites() {
        if (!favBar) return;
        favBar.replaceChildren();
        for (const id of state.favorites) {
            const item=TAB_LIST.find(x=>x[0]===id);
            if (!item)continue;
            const btn=E('button','', '★ '+item[1]);
            btn.type='button';btn.onclick=()=>selectTab(id);favBar.appendChild(btn);
        }
    }

    function save() {
        try { localStorage.setItem(STORE, JSON.stringify({
            cps:state.cps,turbo:state.turbo,catchSpeed:state.catchSpeed,
            ballMode:state.ballMode,smartRepeat:state.smartRepeat,theme:state.theme,
            dexRegion:state.dexRegion,dexFilter:state.dexFilter,
            routeMode:state.routeMode,routeInterval:state.routeInterval,smartRare:state.smartRare,
            shinyMaster:state.shinyMaster,autoClaim:state.autoClaim,shinyTarget:state.shinyTarget,
            hiddenTabs:state.hiddenTabs,favorites:state.favorites,notifications:state.notifications,
            compact:state.compact, hudVisible:state.hudVisible,
            hudCollapsed:state.hudCollapsed,hudSide:state.hudSide
        })); } catch (_) { /* ignore */ }
    }
    function selectTab(tab) {
        state.tab = tab;
        [...tabs.children].forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        render();
    }
    function togglePanel(force) {
        state.open = typeof force === 'boolean' ? force : !state.open;
        panel.hidden = !state.open;
        fab.innerHTML = state.open ? '<span aria-hidden="true">✕</span><span>Fermer</span>' : '<span class="pcmt-fab-orb" aria-hidden="true"></span><span>PokéTools</span>';
        fab.setAttribute('aria-label',state.open?'Fermer PokéTools':'Ouvrir PokéTools');
        syncRadarVisibility();
        if (state.open) render();
    }
    function mount() {
        if (document.getElementById(ROOT)) return;
        root = E('div'); root.id = ROOT; root.classList.toggle('compact',state.compact); root.classList.toggle('theme-night',state.theme==='night'); root.classList.toggle('pcmt-hud-left',state.hudSide==='left');
        const style = E('style'); style.textContent = css+themeCss+polishCss;
        root.appendChild(style);
        fab = E('button', 'pcmt-fab'); fab.innerHTML='<span class="pcmt-fab-orb" aria-hidden="true"></span><span>PokéTools</span>'; fab.setAttribute('aria-label','Ouvrir PokéTools');
        fab.type = 'button'; fab.addEventListener('click', () => togglePanel());
        root.appendChild(fab);
        panel = E('section', 'pcmt-panel'); panel.hidden = true;
        panel.setAttribute('aria-label', 'PokéClicker Mini Tools');
        const head = E('div', 'pcmt-head');
        const titleWrap = E('div');
        titleWrap.appendChild(E('div', 'pcmt-title', 'PokéClicker · Mini Tools'));
        titleWrap.appendChild(E('div', 'pcmt-muted', 'v1.5.0 · 12 outils personnalisables'));
        head.appendChild(E('span','pcmt-emblem')); head.appendChild(titleWrap);
        const close = E('button', 'pcmt-close', '×');
        close.type = 'button'; close.setAttribute('aria-label', 'Fermer');
        close.addEventListener('click', () => togglePanel(false)); head.appendChild(close);
        panel.appendChild(head);
        const livebar=E('div','pcmt-header-status'); livebar.innerHTML='<span><span class="pcmt-live-dot"></span> OUTILS CONNECTÉS AU JEU</span><span id="pcmt-location-live">—</span>'; panel.appendChild(livebar);
        tabs = E('nav', 'pcmt-tabs');
        TAB_LIST.forEach(([id, label]) => {
            const b = E('button', 'pcmt-tab', label);
            b.type = 'button'; b.dataset.tab = id; b.hidden = state.hiddenTabs.includes(id)&&id!=='settings';
            b.addEventListener('click', () => selectTab(id));
            tabs.appendChild(b);
        });
        panel.appendChild(tabs);
        favBar=E('div','pcmt-favorites');panel.appendChild(favBar);renderFavorites();
        content = E('div', 'pcmt-content'); panel.appendChild(content);
        root.appendChild(panel);
        document.body.appendChild(root);
        makeRadar();
        selectTab('home');
        setInterval(() => {
            updateRadar();
            const live=document.getElementById('pcmt-location-live');
            if(live)live.textContent=safe(()=>regionName(player.region)+' · '+Routes.getName(player.route,player.region),regionName(safe(()=>player.region,0)));
            if (!state.open) return;
            if (state.tab === 'home') refreshHome();
            if (state.tab === 'eggs') renderEggs();
            if (state.tab === 'clicker') refreshCounter();
            if (state.tab === 'shiny') refreshShiny();
            if (state.tab === 'stats') renderStats();
            if (state.tab === 'quests') renderQuests();
            if (state.tab === 'routes') updateRoutesStatus();
            if (state.tab === 'balls') updateBallPreview();
            if (state.tab === 'backups') refreshBackupsStatus();
        }, 3500);
        window.addEventListener('pagehide', () => { stopAutoClick(); restoreCatchSpeed(); enableSmartBalls(false); });
        initSession();
        applyCatchSpeed();
        setupBackups();
        shinyPoll();
        setInterval(() => { shinyPoll(); pollShinyTarget(); pollSession(); },1000);
        setInterval(updateRadar,2500);
        setInterval(() => { autoRouteTick(); autoQuestTick(); },2500);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && state.open) togglePanel(false);
            if (e.altKey && e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) { e.preventDefault();state.hudVisible=!state.hudVisible;save();syncRadarVisibility(); }
            if (e.altKey && e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();togglePanel();
            }
        });
    }

    function render() {
        if (!content) return;
        content.replaceChildren();
        if (state.tab === 'home') renderHome();
        if (state.tab === 'eggs') renderEggs();
        if (state.tab === 'pokemon') renderSearch();
        if (state.tab === 'clicker') renderClicker();
        if (state.tab === 'shiny') renderShiny();
        if (state.tab === 'dex') renderDex();
        if (state.tab === 'routes') renderRoutes();
        if (state.tab === 'balls') renderBalls();
        if (state.tab === 'quests') renderQuests();
        if (state.tab === 'stats') renderStats();
        if (state.tab === 'settings') renderSettings();
        if (state.tab === 'backups') renderBackups();
    }
    function renderHome(){
        content.replaceChildren();
        const hero=E('div','pcmt-pagehero');
        hero.innerHTML='<div class="pcmt-kicker">TON COMPAGNON DE PARTIE</div><h2>Prêt à explorer ?</h2><p>Un œil sur ta progression, un accès rapide à tes outils et tes prochaines captures.</p>';
        content.appendChild(hero);
        const metrics=E('div','pcmt-home-statgrid');
        for(const [id,label] of [['pcmt-home-owned','Pokémon capturés'],['pcmt-home-shiny','Shinies attrapés'],['pcmt-home-eggs','Œufs en cours']]){
            const c=E('div','pcmt-home-stat');const number=E('strong','', '—');number.id=id;c.appendChild(number);c.appendChild(E('span','',label));metrics.appendChild(c);
        }
        content.appendChild(metrics);
        const shine=E('div','pcmt-shiny-banner');
        shine.innerHTML='<span>✦ TA PROCHAINE RENCONTRE SHINY</span><strong id="pcmt-home-odds">—</strong><span id="pcmt-home-rate">Calcul en cours…</span>';
        content.appendChild(shine);
        const h=E('div','pcmt-cardtitle','Accès rapides');content.appendChild(h);
        const grid=E('div','pcmt-dash-grid');
        const shortcuts=[['shiny','✨','Shiny Hunter','Chances et statistiques'],['dex','📗','Pokédex','Pokémon manquants'],['clicker','⚡','Autoclicker','Vitesse et captures'],['backups','💾','Sauvegardes','Copies et restauration'],['routes','🧭','Auto-route','Ta prochaine destination'],['eggs','🥚','Œufs','Éclosions et recommandations']];
        shortcuts.forEach(([id,emoji,name,detail])=>{
            const b=E('button','pcmt-dash-tile');b.type='button';
            b.appendChild(E('span','pcmt-dash-icon',emoji));b.appendChild(E('strong','',name));b.appendChild(E('span','',detail));
            b.onclick=()=>selectTab(id);grid.appendChild(b);
        });
        content.appendChild(grid);
        refreshHome();
    }
    function refreshHome(){
        const owned=document.getElementById('pcmt-home-owned');if(!owned)return;
        owned.textContent=fmt(safe(()=>pokemonList.filter(p=>caught(p.name)).length,0));
        const shiny=document.getElementById('pcmt-home-shiny');if(shiny)shiny.textContent=fmt(readStat('totalShinyPokemonCaptured'));
        const eggs=document.getElementById('pcmt-home-eggs');if(eggs)eggs.textContent=fmt(safe(()=>App.game.breeding.eggList.filter(x=>!x().isNone()).length,0));
        const metrics=shinyMetrics(),odds=document.getElementById('pcmt-home-odds');
        if(odds)odds.textContent=Number.isFinite(metrics.odds)?'1 sur '+fmt(Math.round(metrics.odds)):'—';
        const speed=document.getElementById('pcmt-home-rate');if(speed)speed.textContent=Number.isFinite(metrics.rate)?'≈ '+(metrics.rate*60).toLocaleString('fr-FR',{maximumFractionDigits:1})+' rencontres/min · statistique, pas de compte à rebours':'Données mesurées après quelques rencontres sur une route';
    }

    function renderEggs() {
        if (state.tab !== 'eggs' || !content) return;
        content.replaceChildren();
        const breeding = App.game?.breeding;
        if (!breeding?.hatchList) { content.appendChild(E('p', 'pcmt-note', 'La pension n’est pas encore disponible.')); return; }
        if (state.region === null) state.region = String(safe(() => player.highestRegion(), 0));
        const card = E('div', 'pcmt-card');
        card.appendChild(E('div', 'pcmt-cardtitle', 'Œufs en incubation'));
        let active = 0;
        for (const [i, obs] of (breeding.eggList || []).entries()) {
            const egg = safe(() => obs(), null);
            if (!egg || safe(() => egg.isNone(), true)) continue;
            active++;
            const steps = Math.max(0, Number(safe(() => egg.stepsRemaining(), 0)));
            const required = Number(egg.stepsRequired || egg.totalSteps || 0);
            const done = Math.max(0, required - steps);
            const row = E('div', 'pcmt-group');
            const label = safe(() => PokemonHelper.getPokemonById(egg.pokemon)?.name, `Œuf ${i+1}`);
            row.appendChild(E('div', 'pcmt-row', `#${i+1} · ${display(label)} — ${steps === 0 ? 'Prêt !' : fmt(steps)+' pas restants'}`));
            const meter = E('div', 'pcmt-meter');
            const fill = E('span'); fill.style.width = `${required ? Math.min(100, Math.max(0, done / required * 100)) : 0}%`;
            meter.appendChild(fill); row.appendChild(meter); card.appendChild(row);
        }
        if (!active) card.appendChild(E('div', 'pcmt-muted', 'Aucun œuf en incubation actuellement.'));
        content.appendChild(card);
        renderEggSuggestions();
        const title = E('div', 'pcmt-cardtitle', 'Que contiennent les œufs ?'); content.appendChild(title);
        const controls = E('div', 'pcmt-controls');
        const typeSelect = E('select', 'pcmt-select');
        const types = Object.keys(breeding.hatchList).filter(x => Array.isArray(breeding.hatchList[x]));
        typeSelect.add(new Option('Tous les types', 'all'));
        types.forEach(id => typeSelect.add(new Option(`Œuf ${eggName(id)}`, id)));
        typeSelect.value = state.eggType;
        typeSelect.addEventListener('change', () => { state.eggType = typeSelect.value; renderEggs(); });
        controls.appendChild(typeSelect);
        const regionSelect = E('select', 'pcmt-select');
        regionSelect.add(new Option('Toutes les régions', 'all'));
        const max = Math.max(...types.map(id => breeding.hatchList[id].length)) - 1;
        for (let r = 0; r <= max; r++) regionSelect.add(new Option(regionName(r), String(r)));
        regionSelect.value = state.region;
        regionSelect.addEventListener('change', () => { state.region = regionSelect.value; renderEggs(); });
        controls.appendChild(regionSelect);
        content.appendChild(controls);
        const check = E('label', 'pcmt-switchrow');
        const input = E('input'); input.type='checkbox'; input.checked=state.missingOnly;
        input.addEventListener('change', () => {state.missingOnly=input.checked; renderEggs();});
        check.appendChild(input); check.appendChild(E('span', '', 'Afficher seulement les Pokémon manquants'));
        content.appendChild(check);
        content.appendChild(E('div', 'pcmt-note', 'Les Pokémon obtenables varient selon la région atteinte. Un œuf Mystère peut aussi tirer dans les autres catégories. Les chances ne sont pas identiques entre les régions.'));
        let shown = 0, missing = 0;
        for (const id of types) {
            if (state.eggType !== 'all' && state.eggType !== id) continue;
            const pool = breeding.hatchList[id];
            let names = state.region === 'all' ? pool.flat() : (pool[Number(state.region)] || []);
            names = [...new Set(names)];
            if (!names.length) continue;
            const missInPool = names.filter(n => !caught(n));
            missing += missInPool.length;
            const namesToShow = state.missingOnly ? missInPool : names;
            if (!namesToShow.length) continue;
            const group = E('div', 'pcmt-card');
            group.appendChild(E('div', 'pcmt-cardtitle', `Œuf ${eggName(id)} · ${missInPool.length} manquant(s) / ${names.length}`));
            const owned = safe(() => player.itemList?.[eggKey(id)]?.(), null);
            if (owned !== null) group.appendChild(E('div', 'pcmt-muted', `${fmt(owned)} dans ton inventaire`));
            for (const name of namesToShow) {
                const b = E('button', `pcmt-chip ${caught(name) ? 'caught' : 'missing'}`, `${caught(name) ? '✓' : '○'} ${display(name)}`);
                b.type='button'; b.title='Voir où obtenir ce Pokémon';
                b.addEventListener('click', () => {
                    state.selected = name; state.search = name; selectTab('pokemon');
                });
                group.appendChild(b); shown++;
            }
            content.appendChild(group);
        }
        if (!shown) content.appendChild(E('div', 'pcmt-note', 'Aucun Pokémon à afficher pour ce filtre.'));
    }

    function renderSearch() {
        content.appendChild(E('div', 'pcmt-cardtitle', 'Où trouver un Pokémon ?'));
        content.appendChild(E('div', 'pcmt-note', 'Cherche un nom français ou anglais, ou son numéro. Clique sur une suggestion pour afficher ses emplacements et méthodes d’obtention.'));
        const input = E('input', 'pcmt-input');
        input.type = 'search'; input.placeholder='Ex. Pikachu, Riolu, 25…';
        input.value = state.search; input.autocomplete='off';
        content.appendChild(input);
        const results = E('div', 'pcmt-results'); results.hidden = true; content.appendChild(results);
        const detail = E('div'); content.appendChild(detail);
        const entries = (typeof pokemonList !== 'undefined' ? pokemonList : [])
            .filter(p => p?.name && Number.isFinite(Number(p.id)));
        const findMatches = (value) => {
            const query = clean(value.trim());
            if (!query) return [];
            return entries.filter(p => clean(p.name).includes(query)
                || clean(display(p.name)).includes(query)
                || String(p.id) === query)
                .sort((a, b) => {
                    const aScore = clean(a.name).startsWith(query) || clean(display(a.name)).startsWith(query) ? 0 : 1;
                    const bScore = clean(b.name).startsWith(query) || clean(display(b.name)).startsWith(query) ? 0 : 1;
                    return aScore - bScore || a.id - b.id;
                }).slice(0, 30);
        };
        function showSuggestions() {
            results.replaceChildren();
            const list = findMatches(input.value);
            results.hidden = !input.value.trim();
            if (!list.length && !results.hidden) results.appendChild(E('div', 'pcmt-note', 'Aucun résultat trouvé.'));
            for (const p of list) {
                const b = E('button', 'pcmt-result', `#${p.id} · ${display(p.name)} ${caught(p.name) ? '✓' : '○'}`);
                b.type = 'button';
                b.addEventListener('click', () => choose(p.name));
                results.appendChild(b);
            }
        }
        function choose(name) {
            state.selected = name; state.search = name; input.value = display(name);
            results.hidden = true; showDetails(name);
        }
        function showDetails(name) {
            detail.replaceChildren();
            if (!name) return;
            const p = pokemonData(name);
            if (!p) { detail.appendChild(E('p', 'pcmt-note', 'Pokémon introuvable.')); return; }
            const card = E('div', 'pcmt-card');
            card.style.marginTop = '12px';
            const h = E('div', 'pcmt-row');
            h.appendChild(E('div', 'pcmt-cardtitle', `#${p.id} · ${display(name)}`));
            h.appendChild(E('span', 'pcmt-pill', caught(name) ? '✓ Capturé' : '○ À capturer'));
            card.appendChild(h);
            const link = E('a', 'pcmt-link', 'Consulter sa fiche Wiki ↗');
            link.href = 'https://wiki.pokeclicker.com/#!Pokemon/' + encodeURIComponent(name);
            link.target = '_blank'; link.rel = 'noopener noreferrer';
            card.appendChild(link);
            let loc;
            try { loc = PokemonLocations.getPokemonLocations(name); }
            catch (err) {
                const warning = E('p', 'pcmt-note', 'Les données de localisation ne sont pas disponibles pour cette version du jeu. Consulte la fiche Wiki.');
                card.appendChild(warning); console.warn('[Poké Mini Tools] Recherche localisation :', err);
                detail.appendChild(card); return;
            }
            const groups = Object.entries(loc || {}).sort((a,b) => Number(a[0]) - Number(b[0]));
            if (!groups.length) card.appendChild(E('p', 'pcmt-note', 'Aucun moyen d’obtention référencé dans les données du jeu.'));
            for (const [id, data] of groups) {
                const info = E('div', 'pcmt-group');
                info.appendChild(E('div', 'pcmt-cardtitle', TYPES[id] || `Méthode ${id}`));
                const lines = formatLocation(Number(id), data, name);
                if (!lines.length) info.appendChild(E('span', 'pcmt-muted', 'Informations disponibles sur le Wiki.'));
                else lines.slice(0, 80).forEach(line => info.appendChild(E('div', '', line)));
                if (lines.length > 80) info.appendChild(E('div', 'pcmt-muted', 'Plus d’emplacements sur le Wiki.'));
                card.appendChild(info);
            }
            card.appendChild(E('div', 'pcmt-note', 'Certains emplacements nécessitent une quête, un objet, une météo ou une progression particulière.'));
            detail.appendChild(card);
        }
        input.addEventListener('input', () => {
            state.search = input.value; state.selected = null;
            detail.replaceChildren(); showSuggestions();
        });
        input.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            const matches = findMatches(input.value);
            if (matches.length) choose(matches[0].name);
        });
        if (state.selected) { input.value=display(state.selected); showDetails(state.selected); }
        else if (state.search) showSuggestions();
    }

    function formatLocation(id, data, name) {
        const arr = Array.isArray(data) ? data : [];
        switch (id) {
            case 0: return Object.entries(data || {}).flatMap(([region, routes]) =>
                (routes || []).map(r => {
                    const route=safe(()=>Routes.getRoute(Number(region),r.route),null);
                    const reqs=[...(route?.requirements || []),
                        ...(Array.isArray(r.requirements)?r.requirements:(r.requirements?[r.requirements]:[]))];
                    const unmet=reqs.filter(x=>!safe(()=>x.isCompleted(),false))
                        .map(x=>safe(()=>x.hint(),'Condition spéciale'));
                    return `${regionName(region)} · ${route?.routeName || 'Route '+r.route}`
                        + (unmet.length?` · 🔒 ${unmet.join(', ')}`:'');
                }));
            case 1: return arr.map(x => `${regionName(x.region)} · Pokémon errant${x.roamingGroup?.name ? ` (${x.roamingGroup.name})` : ''}`);
            case 2: case 3: case 4:
                return arr.map(x => {
                    const conditions=Array.isArray(x.requirements)?x.requirements:(x.requirements?[x.requirements]:[]);
                    const hints=conditions.filter(y=>!safe(()=>y.isCompleted(),false))
                        .map(y=>safe(()=>y.hint(),'Condition spéciale'));
                    return `${x.dungeon}${hints.length?' · 🔒 '+hints.join(', '):''}`;
                });
            case 5: {
                const parents = (typeof pokemonList !== 'undefined' ? pokemonList : [])
                    .filter(p => p.evolutions?.some(e => e.evolvedPokemon === name));
                return parents.length ? parents.map(x => `Faire évoluer ${display(x.name)}`) : ['Évolution d’un autre Pokémon'];
            }
            case 6: return [...new Set(arr.map(x => EGG_FR[x] || String(x).replace(/_/g,' ')))].map(x => `Œuf ${x}`);
            case 7: return arr.map(x => `Faire éclore ${display(x)} pour obtenir sa pré-évolution`);
            case 8: case 12: case 14: case 15: case 16: case 17: case 18: case 20: case 21:
                return arr.map(x => String(x));
            case 10: return Object.keys(data || {}).map(x => `Safari de ${regionName(x)}`);
            case 11: return arr.map(x => `Palier ${x}`);
            case 13: return arr.map(x => `${fmt(x)} points Discord`);
            case 19: return arr.map(x => `${x.town || 'Ville'} · ${x.npc || 'PNJ'}`);
            case 22: return ['Effectuer la combinaison requise au Battle Café'];
            case 23: return Object.keys(data || {}).map(x => `Objet du Safari · ${regionName(x)}`);
            default:
                return arr.length ? arr.map(x => typeof x === 'string' ? x : (x?.name || x?.town || JSON.stringify(x)))
                    : Object.keys(data || {}).map(x => String(x));
        }
    }

    function clickBattleTarget() {
        const gs=GameConstants.GameState,s=App.game.gameState;
        if(s===gs.fighting)return Battle;
        if(s===gs.gym)return GymBattle;
        if(s===gs.dungeon && safe(()=>DungeonRunner.fighting(),false))return DungeonBattle;
        if(s===gs.temporaryBattle)return TemporaryBattleBattle;
        return null;
    }
    function tick() {
        if (!state.enabled) return;
        try {
            const battle=clickBattleTarget();
            if (!battle || typeof battle.clickAttack!=='function') return;
            // Standard mode respects game cap. Turbo deliberately raises the manual click
            // rate by resetting the *click* cooldown only, not combat or game timers.
            if (state.turbo && Number.isFinite(battle.lastClickAttack))
                battle.lastClickAttack=Math.min(battle.lastClickAttack,Date.now()-51);
            const before=safe(()=>Number(App.game.statistics.clickAttacks()),NaN);
            battle.clickAttack();
            const after=safe(()=>Number(App.game.statistics.clickAttacks()),NaN);
            if (Number.isFinite(before)&&Number.isFinite(after)) state.clicks+=Math.max(0,after-before);
        } catch(e) {
            console.warn('[Poké Mini Tools] Autoclicker arrêté :',e);
            stopAutoClick();refreshCounter();notify('Autoclicker arrêté suite à une erreur.');
        }
    }
    function stopAutoClick(){state.enabled=false;if(state.timer)clearInterval(state.timer);state.timer=null;}
    function startAutoClick(){
        stopAutoClick();state.enabled=true;
        const delay=Math.max(state.turbo?13:50,Math.round(1000/state.cps));
        state.timer=setInterval(tick,delay);
    }
    function refreshCounter(){
        const status=document.getElementById('pcmt-clicker-status');
        const button=document.getElementById('pcmt-clicker-toggle');
        if(status)status.textContent=`${state.enabled?'● Activé':'○ Arrêté'} · ${fmt(state.clicks)} clics effectifs mesurés`;
        if(button){button.textContent=state.enabled?'Arrêter':'Démarrer';button.classList.toggle('stop',state.enabled);}
    }
    let originalCatchTime=null,catchOwner=null;
    function restoreCatchSpeed(){
        if(originalCatchTime&&catchOwner?.calculateCatchTime===patchedCatchTime)
            catchOwner.calculateCatchTime=originalCatchTime;
        originalCatchTime=null;catchOwner=null;
    }
    function patchedCatchTime(ball){
        const normal=originalCatchTime.call(this,ball);
        const factor=[1,2,4,8].includes(state.catchSpeed)?state.catchSpeed:1;
        return Math.max(40,Math.round(normal/factor));
    }
    function applyCatchSpeed(){
        const manager=safe(()=>App.game.pokeballs,null);
        if(!manager)return;
        if(!originalCatchTime){
            originalCatchTime=manager.calculateCatchTime;
            if(typeof originalCatchTime!=='function'){originalCatchTime=null;return;}
            catchOwner=manager;
        }
        if(manager.calculateCatchTime!==patchedCatchTime)
            manager.calculateCatchTime=patchedCatchTime;
    }
    function renderClicker(){
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','⚡ Autoclicker'));
        card.appendChild(E('p','pcmt-note','La vitesse normale du jeu est limitée à 20 clics/s. Le mode Turbo accélère uniquement les attaques manuelles, sans accélérer les cycles du jeu.'));
        const status=E('div','pcmt-muted');status.id='pcmt-clicker-status';card.appendChild(status);
        const row=E('div','pcmt-row');row.appendChild(E('span','','Vitesse souhaitée'));
        const speedValue=E('strong','',`${state.cps} clics/s`);row.appendChild(speedValue);card.appendChild(row);
        const slider=E('input');slider.type='range';slider.min='1';slider.max=state.turbo?'80':'20';slider.step='1';slider.value=String(Math.min(state.cps,state.turbo?80:20));
        slider.setAttribute('aria-label','Clics par seconde');slider.oninput=()=>{
            state.cps=Number(slider.value);speedValue.textContent=`${state.cps} clics/s`;
            save();if(state.enabled)startAutoClick();
        };card.appendChild(slider);
        addSwitch(card,'🚀 Mode Turbo (jusqu’à 80 clics/s)',state.turbo,v=>{
            state.turbo=v;state.cps=Math.min(state.cps,v?80:20);save();if(state.enabled)startAutoClick();renderClickerReset();
        });
        const btn=E('button','pcmt-action');btn.id='pcmt-clicker-toggle';btn.type='button';
        btn.onclick=()=>{if(state.enabled)stopAutoClick();else startAutoClick();refreshCounter()};card.appendChild(btn);
        content.appendChild(card);
        const capture=E('div','pcmt-card');capture.appendChild(E('div','pcmt-cardtitle','⏩ Animation des captures'));
        capture.appendChild(E('div','pcmt-note','Accélère le délai d’attente après l’envoi d’une Ball (routes, donjons, ferme…), sans modifier les chances de capture.'));
        addSelect(capture,[[1,'Normale (×1)'],[2,'Rapide (×2)'],[4,'Très rapide (×4)'],[8,'Instantanée ou presque (×8)']],state.catchSpeed,v=>{
            state.catchSpeed=Number(v);save();applyCatchSpeed();notify('Capture : vitesse ×'+v);
        });
        capture.appendChild(E('div','pcmt-callout','Le Turbo sollicite davantage le jeu. Si tu constates des ralentissements ou utilises un autre autoclicker, réduis la vitesse.'));
        content.appendChild(capture);refreshCounter();
    }
    function renderClickerReset(){if(state.open&&state.tab==='clicker')render();}

    // Shiny : estimateur de temps, fondé sur les statistiques réelles du jeu.
    // Ne prédit pas le prochain tirage ; chaque rencontre est indépendante.
    const shinyTrack = {
        key: null, routeName: '', encounters: 0, seenShinies: 0,
        sinceLastShiny: 0, lastGlobal: null, lastShinyGlobal: null,
        lastTick: 0, lastWasRoute: false, samples: [],
    };
    const duration = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return 'indisponible';
        if (seconds < 60) return `≈ ${Math.max(1, Math.round(seconds))} s`;
        if (seconds < 3600) return `≈ ${Math.round(seconds / 60)} min`;
        if (seconds < 86400) return `≈ ${(seconds / 3600).toLocaleString('fr-FR', {maximumFractionDigits:1})} h`;
        return `≈ ${(seconds / 86400).toLocaleString('fr-FR', {maximumFractionDigits:1})} j`;
    };
    function shinyPoll() {
        const now = Date.now();
        const all = Number(safe(() => App.game.statistics.totalPokemonEncountered(), NaN));
        const shiny = Number(safe(() => App.game.statistics.totalShinyPokemonEncountered(), NaN));
        if (!Number.isFinite(all) || !Number.isFinite(shiny)) return;
        const routeActive = safe(() => App.game.gameState === GameConstants.GameState.fighting, false);
        const key = routeActive ? String(safe(() => player.region, '?')) + ':' + String(safe(() => player.route, '?')) : null;
        if (routeActive && key !== shinyTrack.key) {
            shinyTrack.key = key;
            shinyTrack.routeName = String(safe(() => Routes.getName(player.route, player.region), `Route ${player.route}`));
            shinyTrack.encounters = 0;
            shinyTrack.seenShinies = 0;
            shinyTrack.sinceLastShiny = 0;
            shinyTrack.samples = [];
        }
        if (shinyTrack.lastGlobal === null || shinyTrack.lastShinyGlobal === null) {
            shinyTrack.lastGlobal = all;
            shinyTrack.lastShinyGlobal = shiny;
            shinyTrack.lastTick = now;
            shinyTrack.lastWasRoute = routeActive;
            return;
        }
        const dt = (now - shinyTrack.lastTick) / 1000;
        const de = Math.max(0, all - shinyTrack.lastGlobal);
        const ds = Math.max(0, shiny - shinyTrack.lastShinyGlobal);
        // On mesure seulement les rencontres de route, sans celles des autres modes.
        if (routeActive && shinyTrack.lastWasRoute && dt > 0 && dt < 10 && de >= 0) {
            shinyTrack.encounters += de;
            if (ds) {
                shinyTrack.seenShinies += ds;
                shinyTrack.sinceLastShiny = 0;
            } else {
                shinyTrack.sinceLastShiny += de;
            }
            shinyTrack.samples.push({time: now, seconds: dt, count: de});
            shinyTrack.samples = shinyTrack.samples.filter(x => now - x.time <= 90000);
        }
        shinyTrack.lastGlobal = all;
        shinyTrack.lastShinyGlobal = shiny;
        shinyTrack.lastTick = now;
        shinyTrack.lastWasRoute = routeActive;
        if (state.open && state.tab === 'shiny') refreshShiny();
    }
    function shinyMetrics() {
        const bonus = Number(safe(() => App.game.multiplier.getBonus('shiny'), NaN));
        const base = Number(safe(() => GameConstants.SHINY_CHANCE_BATTLE, NaN));
        const odds = base > 0 && bonus > 0 ? Math.max(1, base / bonus) : NaN;
        const p = Number.isFinite(odds) ? Math.min(1, 1 / odds) : NaN;
        const seconds = shinyTrack.samples.reduce((sum, s) => sum + s.seconds, 0);
        const n = shinyTrack.samples.reduce((sum, s) => sum + s.count, 0);
        const rate = seconds >= 8 && n >= 10 ? n / seconds : NaN;
        const countTo = (probability) => {
            if (!Number.isFinite(p)) return NaN;
            if (p >= 1) return 1;
            return Math.log(1 - probability) / Math.log1p(-p);
        };
        return {p, odds, rate, avg: 1 / p / rate, median: countTo(0.5) / rate,
            ninety: countTo(0.9) / rate};
    }
    function renderShiny() {
        const card = E('div', 'pcmt-card');
        card.appendChild(E('div', 'pcmt-cardtitle', '✨ Prochain shiny (sur une route)'));
        const shinyHero=E('div','pcmt-shiny-banner');shinyHero.innerHTML='<span>✦ CHANCE PAR RENCONTRE</span><strong id="pcmt-shiny-hero-odds">—</strong><span>Chaque rencontre reste un tirage indépendant.</span>';card.appendChild(shinyHero);
        card.appendChild(E('p', 'pcmt-note',
            'Estimation basée sur les chances réelles du jeu, tes bonus et les rencontres par seconde mesurées. Elle concerne un shiny quelconque sur la route, pas une espèce précise.'));
        for (const [id, label] of [
            ['pcmt-shiny-route','Lieu'],['pcmt-shiny-odds','Chance par rencontre'],
            ['pcmt-shiny-rate','Vitesse observée'],['pcmt-shiny-average','Temps d’attente moyen'],
            ['pcmt-shiny-50','50 % de chance en'],['pcmt-shiny-90','90 % de chance en'],
            ['pcmt-shiny-seen','Rencontres suivies sur cette route'],
            ['pcmt-shiny-found','Shinies rencontrés durant ce suivi']
        ]) {
            const row = E('div','pcmt-group pcmt-row');
            row.appendChild(E('span','',label));
            const value = E('strong','', '—'); value.id = id;
            value.style.textAlign = 'right'; row.appendChild(value);
            card.appendChild(row);
        }
        content.appendChild(card);
        content.appendChild(E('p','pcmt-note',
            '⚠️ Ce n’est pas un compte à rebours : tu peux trouver un shiny dès la prochaine rencontre, ou bien plus tard que la moyenne. Le compteur démarre à l’ouverture du jeu, se remet à zéro si tu changes de route, et ne compte pas les œufs / donjons.'));
        renderTargetShiny();
        refreshShiny();
    }
    function refreshShiny() {
        const $ = (id) => document.getElementById(id);
        if (!$('pcmt-shiny-route')) return;
        const m = shinyMetrics();
        const active = safe(() => App.game.gameState === GameConstants.GameState.fighting, false);
        const heroOdds=$('pcmt-shiny-hero-odds');if(heroOdds)heroOdds.textContent=Number.isFinite(m.odds)?'1 sur '+fmt(Math.round(m.odds)):'Indisponible';
        $('pcmt-shiny-route').textContent = shinyTrack.key ? shinyTrack.routeName + (active ? '' : ' (pause)') : 'Va sur une route';
        $('pcmt-shiny-odds').textContent = Number.isFinite(m.odds) ? `1 sur ${fmt(Math.round(m.odds))} (${(m.p * 100).toLocaleString('fr-FR',{maximumFractionDigits:3})} %)` : 'Indisponible';
        $('pcmt-shiny-rate').textContent = Number.isFinite(m.rate) ? `${(m.rate * 60).toLocaleString('fr-FR',{maximumFractionDigits:1})} rencontres/min` : 'Mesure en cours…';
        $('pcmt-shiny-average').textContent = duration(m.avg);
        $('pcmt-shiny-50').textContent = duration(m.median);
        $('pcmt-shiny-90').textContent = duration(m.ninety);
        $('pcmt-shiny-seen').textContent = `${fmt(shinyTrack.encounters)} (dont ${fmt(shinyTrack.sinceLastShiny)} depuis le dernier shiny)`;
        $('pcmt-shiny-found').textContent = fmt(shinyTrack.seenShinies);
        refreshTargetShiny();
    }

    // Extensions 1.3 : appels conservateurs aux API natives de PokéClicker.
    const nowNum = () => Date.now();
    const readStat = (name) => Number(safe(() => App.game.statistics[name](), 0)) || 0;
    const perPokemonStat = (kind, name) => {
        const id = Number(pokemonData(name)?.id);
        return id > 0 ? Number(safe(() => App.game.statistics[kind][id](), 0)) || 0 : 0;
    };
    const durationLong = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return 'Mesure en cours';
        if (seconds < 60) return `${Math.max(1,Math.round(seconds))} s`;
        if (seconds < 3600) return `${(seconds/60).toLocaleString('fr-FR',{maximumFractionDigits:1})} min`;
        if (seconds < 86400) return `${(seconds/3600).toLocaleString('fr-FR',{maximumFractionDigits:1})} h`;
        return `${(seconds/86400).toLocaleString('fr-FR',{maximumFractionDigits:1})} jours`;
    };
    function addRow(container, label, value) {
        const row = E('div','pcmt-minirow');
        row.appendChild(E('span','',label));
        row.appendChild(E('strong','',String(value)));
        container.appendChild(row);
        return row;
    }
    function addButton(container, label, callback, cls='pcmt-toggle') {
        const btn=E('button',cls,label);btn.type='button';btn.onclick=callback;
        container.appendChild(btn);return btn;
    }
    function addSwitch(container,label,value,callback) {
        const row=E('label','pcmt-switchrow');
        const input=E('input');input.type='checkbox';input.checked=!!value;
        input.addEventListener('change',()=>callback(input.checked));
        row.appendChild(input);row.appendChild(E('span','',label));container.appendChild(row);
        return input;
    }
    function addSelect(container,options,value,change) {
        const select=E('select','pcmt-select');
        options.forEach(([v,label])=>select.add(new Option(label,String(v))));
        select.value=String(value);
        select.addEventListener('change',()=>change(select.value));
        container.appendChild(select);return select;
    }
    function routeList(region=Number(player.region)) {
        const max=Number(safe(()=>player.highestRegion(),0));
        if (region<0 || region>max) return [];
        return (safe(()=>Routes.getRoutesByRegion(region),[])||[])
            .filter(r=>safe(()=>r.isUnlocked(),false) && safe(()=>MapHelper.accessToRoute(r.number,region),false));
    }
    // Inclut uniquement les rencontres directement accessibles, sans Headbutt.
    function availableRouteNames(route) {
        return new Set(safe(()=>RouteHelper.getAvailablePokemonList(route.number,route.region,false),[])||[]);
    }
    function routeChoices(region) {
        return routeList(region).map(route=>{
            const mon=availableRouteNames(route);
            return {route,number:route.number,region, names:mon,
                missing:[...mon].filter(n=>!caught(n)),
                label: safe(()=>Routes.getName(route.number,region),route.routeName||'Route '+route.number)};
        });
    }
    function ownedEggItems() {
        const h=App.game.breeding.hatchList;
        const max=Math.max(0,Number(safe(()=>player.highestRegion(),0)));
        return Object.entries(h).filter(([,p])=>Array.isArray(p)).map(([id,rows])=>{
            const pokemons=[...new Set(rows.slice(0,max+1).flat())];
            const available=safe(()=>player.itemList?.[eggKey(id)]?.(),0)||0;
            return {id,pokemons,missing:pokemons.filter(x=>!caught(x)),available};
        });
    }

    // 1) Assistant de collection : accès direct confirmé vs pistes possibles.
    function nativeRegion(p) {
        return Number(safe(()=>PokemonHelper.calcNativeRegion(p.name),p.nativeRegion??-1));
    }
    function renderDex() {
        const max=Number(safe(()=>player.highestRegion(),0));
        if (state.dexRegion===null || Number(state.dexRegion)>max) state.dexRegion=String(safe(()=>player.region,0));
        const head=E('div','pcmt-card');head.appendChild(E('div','pcmt-cardtitle','📗 Pokédex intelligent'));
        const opts=E('div','pcmt-controls');
        addSelect(opts,Array.from({length:max+1},(_,i)=>[i,regionName(i)]),state.dexRegion,v=>{
            state.dexRegion=v;state.dexPage=0;save();renderDex();
        });
        addSelect(opts,[['missing','Manquants'],['now','Accessibles en route'],['all','Tous']],state.dexFilter,v=>{
            state.dexFilter=v;state.dexPage=0;save();renderDex();
        });head.appendChild(opts);
        const input=E('input','pcmt-input');input.type='search';input.placeholder='Filtrer par nom ou numéro…';
        input.value=state.dexSearch;input.addEventListener('input',()=>{
            state.dexSearch=input.value;state.dexPage=0;paintList();
        });head.appendChild(input);content.appendChild(head);
        const list=E('div');content.appendChild(list);
        const routeEntries=routeChoices(Number(state.dexRegion));
        const routeMap=new Map();
        for(const r of routeEntries) for(const n of r.names) {
            if(!routeMap.has(n))routeMap.set(n,[]);
            routeMap.get(n).push(r.label);
        }
        const catalog=(typeof pokemonList!=='undefined'?pokemonList:[])
            .filter(p=>p && p.name && Number(p.id)>0 && nativeRegion(p)===Number(state.dexRegion));
        const unique=[...new Map(catalog.map(p=>[p.name,p])).values()];
        const totalMissing=unique.filter(p=>!caught(p.name));
        const eggMap=new Map();
        for(const e of ownedEggItems()) for(const n of e.pokemons) {
            if(!eggMap.has(n))eggMap.set(n,[]);
            eggMap.get(n).push(`Œuf ${eggName(e.id)}${e.available?' en stock':''}`);
        }
        function paintList(){
            list.replaceChildren();
            const q=clean(state.dexSearch.trim());
            const candidates=unique.filter(p=>{
                if (state.dexFilter==='missing' && caught(p.name)) return false;
                if (state.dexFilter==='now' && (caught(p.name)||!routeMap.has(p.name))) return false;
                return !q||clean(p.name).includes(q)||clean(display(p.name)).includes(q)||String(p.id)===q;
            });
            const summary=E('div','pcmt-card');
            summary.appendChild(E('div','pcmt-cardtitle',`${fmt(unique.length-totalMissing.length)} / ${fmt(unique.length)} capturés · ${fmt(totalMissing.length)} manquants`));
            const meter=E('div','pcmt-meter');const fill=E('span');fill.style.width=(unique.length?((unique.length-totalMissing.length)/unique.length*100):0)+'%';meter.appendChild(fill);summary.appendChild(meter);
            summary.appendChild(E('div','pcmt-note',`Routes accessibles dans cette région : ${routeEntries.length}. « Accessible » indique une rencontre de route déverrouillée (les autres méthodes ne sont pas exclues).`));
            list.appendChild(summary);
            const pageSize=45,last=Math.max(0,Math.ceil(candidates.length/pageSize)-1);
            state.dexPage=Math.min(last,state.dexPage);
            const results=E('div','pcmt-card');
            results.appendChild(E('div','pcmt-cardtitle',`${fmt(candidates.length)} résultat(s)`));
            candidates.slice(state.dexPage*pageSize,(state.dexPage+1)*pageSize).forEach(p=>{
                const row=E('div','pcmt-group pcmt-row');
                const title=E('div');title.style.minWidth='0';
                title.appendChild(E('div','',`#${p.id} · ${display(p.name)} ${caught(p.name)?'✓':'○'}`));
                const places=routeMap.get(p.name)||[];
                const hint=places.length?`🟢 ${places.slice(0,3).join(' · ')}${places.length>3?'…':''}`
                    :(eggMap.has(p.name)?`🥚 ${eggMap.get(p.name).slice(0,2).join(', ')}`:'Autre méthode ou accès non débloqué');
                title.appendChild(E('div','pcmt-small',hint));
                row.appendChild(title);
                addButton(row,'Détails',()=>{state.selected=p.name;state.search=p.name;selectTab('pokemon');});
                results.appendChild(row);
            });
            if(!candidates.length)results.appendChild(E('div','pcmt-note','Aucun résultat pour ces filtres.'));
            list.appendChild(results);
            const pager=E('div','pcmt-controls');
            const prev=addButton(pager,'← Avant',()=>{state.dexPage--;paintList()});prev.disabled=state.dexPage===0;
            pager.appendChild(E('span','pcmt-muted',`Page ${state.dexPage+1}/${last+1}`));
            const next=addButton(pager,'Après →',()=>{state.dexPage++;paintList()});next.disabled=state.dexPage>=last;
            list.appendChild(pager);
        }
        paintList();
    }

    // 2) Recommandations d'œufs et reproduction : n'effectue aucune action payante.
    function renderEggSuggestions() {
        const block=E('div','pcmt-card');
        block.appendChild(E('div','pcmt-cardtitle','💡 Assistant œufs — suggestions'));
        block.appendChild(E('div','pcmt-note','Classement indicatif : quantité de Pokémon manquants parmi les éclosions possibles. Il ne garantit pas le prochain résultat.'));
        const items=ownedEggItems().filter(e=>e.pokemons.length&&e.id!=='Mystery_egg')
            .sort((a,b)=>Number(b.available>0)-Number(a.available>0)
                || b.missing.length/b.pokemons.length - a.missing.length/a.pokemons.length);
        items.slice(0,4).forEach((e,i)=>addRow(block,
            `${i+1}. Œuf ${eggName(e.id)} (${fmt(e.available)} en stock)`,
            `${e.missing.length}/${e.pokemons.length} manquants`));
        const breeding=App.game.breeding;
        const candidates=[];
        if (typeof pokemonBabyPrevolutionMap!=='undefined') {
            for(const [parent,baby] of Object.entries(pokemonBabyPrevolutionMap)) {
                const owned=safe(()=>App.game.party.getPokemonByName(parent),null);
                if(owned&&!caught(baby)) {
                    candidates.push({parent,baby,ready:!!safe(()=>owned.level>=100 && !owned.breeding,false)});
                }
            }
        }
        if (candidates.length) {
            block.appendChild(E('div','pcmt-cardtitle','Reproductions utiles pour le Pokédex'));
            for(const x of candidates.slice(0,7)) {
                const row=E('div','pcmt-group');
                row.appendChild(E('div','',`${display(x.parent)} → ${display(x.baby)}`));
                row.appendChild(E('div','pcmt-small',x.ready?'✓ Parent au niveau 100, à vérifier à la pension':'Parent possédé, monte-le au niveau requis'));
                block.appendChild(row);
            }
        } else {
            block.appendChild(E('div','pcmt-note','Aucune pré-évolution manquante identifiée parmi tes Pokémon possédés.'));
        }
        if (safe(()=>breeding.eggList.some(o=>o()&&!o().isNone()),false)) {
            block.appendChild(E('div','pcmt-note',`Éclosions durant cette session : ${fmt(Math.max(0,readStat('totalPokemonHatched')-(session.base?.totalPokemonHatched||readStat('totalPokemonHatched'))))}`));
        }
        content.appendChild(block);
    }

    // 3) Auto-route volontaire, limitée au territoire actuellement débloqué.
    function stopAutoRoute(reason='') {
        state.autoRoute=false;
        if (reason) notify('Auto-route arrêtée : '+reason);
    }
    function bestRouteCandidate(currentRegion, mode) {
        const candidates=routeChoices(currentRegion);
        if (mode==='missing') return candidates
            .filter(x=>x.missing.length).sort((a,b)=> b.missing.length-a.missing.length||a.number-b.number);
        if (state.shinyTarget) return candidates.filter(x=>x.names.has(state.shinyTarget));
        return candidates;
    }
    function autoRouteTick() {
        if (!state.autoRoute) return;
        if (!safe(()=>App.game.gameState===GameConstants.GameState.fighting,false)){
            stopAutoRoute('tu as quitté les combats de route');return;
        }
        if (safe(()=>Battle.catching(),false))return;
        if (Number(player.region)>Number(player.highestRegion())) {stopAutoRoute('région non débloquée');return;}
        const region=Number(player.region),current=Number(player.route);
        const choices=bestRouteCandidate(region,state.routeMode);
        if (!choices.length){stopAutoRoute('aucune route compatible débloquée');return;}
        const available=choices.find(x=>x.number===current);
        if (state.routeMode==='missing' && available && available.missing.length) return;
        if(state.routeMode==='shiny' && nowNum()-state.lastRouteChange<state.routeInterval*1000)return;
        const different=choices.filter(x=>x.number!==current);
        if(!different.length){if(state.routeMode==='missing')stopAutoRoute('plus de route à compléter');return;}
        const chosen=state.routeMode==='missing'?different[0]
            :different.find(x=>x.number!==state.routePrevious)||different[0];
        if (!chosen || !safe(()=>chosen.route.isUnlocked(),false))return;
        try {
            MapHelper.moveToRoute(chosen.number,chosen.region);
            state.routePrevious=current;
            state.lastRouteChange=nowNum();
            notify(`🧭 ${chosen.label}${state.routeMode==='missing'?` · ${chosen.missing.length} Pokémon manquants`:''}`);
            if(state.open&&state.tab==='routes')updateRoutesStatus();
        } catch(e){console.warn('[Poké Mini Tools] auto-route',e);stopAutoRoute('déplacement refusé');}
    }
    function renderRoutes() {
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','🧭 Auto-route intelligente'));
        card.appendChild(E('p','pcmt-note','Change de route seulement pendant les combats normaux, dans ta région actuelle, vers une route déjà déverrouillée. Arrête automatiquement si tu quittes une route.'));
        const opts=E('div','pcmt-controls');
        addSelect(opts,[['missing','Compléter le Pokédex'],['shiny','Rotation pour shiny']],state.routeMode,v=>{
            state.routeMode=v;state.lastRouteChange=0;save();renderRoutes();
        });card.appendChild(opts);
        if(state.routeMode==='shiny'){
            card.appendChild(E('div','pcmt-note',state.shinyTarget?`Cible actuelle : ${display(state.shinyTarget)}`:'Aucune cible : rotation entre toutes les routes déverrouillées.'));
            addRow(card,'Changer toutes les',`${state.routeInterval} s`);
            const sl=E('input');sl.type='range';sl.min=30;sl.max=300;sl.step=15;sl.value=String(state.routeInterval);
            sl.onchange=()=>{state.routeInterval=Number(sl.value);save();renderRoutes();};card.appendChild(sl);
        }
        const status=E('div','pcmt-note');status.id='pcmt-route-status';card.appendChild(status);
        addButton(card,state.autoRoute?'⏹ Arrêter l’auto-route':'▶ Activer l’auto-route',()=>{
            if(state.autoRoute)stopAutoRoute();
            else if(safe(()=>App.game.gameState===GameConstants.GameState.fighting,false)){
                state.autoRoute=true;state.lastRouteChange=nowNum();
            } else {notify('Va d’abord sur une route pour lancer l’auto-route.');}
            renderRoutes();
        },`pcmt-action ${state.autoRoute?'stop':''}`);
        content.appendChild(card);
        const list=E('div','pcmt-card');list.appendChild(E('div','pcmt-cardtitle','Routes accessibles ici'));
        const options=routeChoices(Number(player.region));
        for(const r of options.sort((a,b)=>b.missing.length-a.missing.length).slice(0,35)){
            const line=E('div','pcmt-minirow');
            line.appendChild(E('span','',`${r.label} · ${r.missing.length} manquant(s)`));
            const btn=addButton(line,'Y aller',()=>{
                if(!safe(()=>Battle.catching(),false)){
                    stopAutoRoute();MapHelper.moveToRoute(r.number,r.region);renderRoutes();
                }else notify('Capture en cours : déplacement différé.');
            });
            btn.disabled=Number(player.route)===r.number;
            list.appendChild(line);
        }
        if(!options.length)list.appendChild(E('div','pcmt-note','Aucune route accessible ici.'));
        content.appendChild(list);updateRoutesStatus();
    }
    function updateRoutesStatus() {
        const target=document.getElementById('pcmt-route-status');
        if(!target)return;
        const current=safe(()=>Routes.getName(player.route,player.region),'Hors route');
        target.textContent=`${state.autoRoute?'● Auto-route active':'○ Arrêtée'} · ${current}`;
    }

    // 4) Shiny Hunter+ : vitesse réellement mesurée par Pokémon dans la route.
    const targetTrack={key:'',last:0,lastTime:0,samples:[],sinceLast:0,seen:0,met:0};
    function pollShinyTarget(){
        const active=safe(()=>App.game.gameState===GameConstants.GameState.fighting,false);
        const name=state.shinyTarget;
        const key=active && name ? `${player.region}:${player.route}:${name}`:'';
        if(!key){targetTrack.key='';return;}
        const total=perPokemonStat('pokemonEncountered',name);
        const shiny=perPokemonStat('shinyPokemonEncountered',name);
        const now=nowNum();
        if(key!==targetTrack.key){
            Object.assign(targetTrack,{key,last:total,lastShiny:shiny,lastTime:now,samples:[],sinceLast:0,seen:0,met:0});return;
        }
        const dt=(now-targetTrack.lastTime)/1000;
        const n=Math.max(0,total-targetTrack.last),s=Math.max(0,shiny-targetTrack.lastShiny);
        if(dt>0 && dt<10 && n>=0 && n<10000){
            targetTrack.samples.push({now,dt,n});
            targetTrack.samples=targetTrack.samples.filter(x=>now-x.now<120000);
            targetTrack.met+=n;targetTrack.seen+=s;
            if(s)targetTrack.sinceLast=0;else targetTrack.sinceLast+=n;
        }
        targetTrack.last=total;targetTrack.lastShiny=shiny;targetTrack.lastTime=now;
    }
    function renderTargetShiny(){
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','🎯 Chasser un Pokémon précis'));
        card.appendChild(E('div','pcmt-note','Sur la route actuelle, choisis une espèce. Les estimations utilisent la fréquence observée de CETTE espèce, et non une supposition sur sa rareté.'));
        const options=[['','N’importe quel shiny']];
        const names=safe(()=>{
            const r=Routes.getRoute(player.region,player.route);
            return r ? [...availableRouteNames(r)] : [];
        },[]);
        for(const name of names.sort((a,b)=>display(a).localeCompare(display(b))))options.push([name,display(name)]);
        if(state.shinyTarget&&!options.some(([id])=>id===state.shinyTarget))options.push([state.shinyTarget,`${display(state.shinyTarget)} (absent de cette route)`]);
        const control=E('div','pcmt-controls');
        addSelect(control,options,state.shinyTarget,v=>{
            state.shinyTarget=v;targetTrack.key='';save();renderShiny();
        });
        card.appendChild(control);
        const box=E('div');box.id='pcmt-shiny-target';card.appendChild(box);
        content.appendChild(card);refreshTargetShiny();
    }
    function refreshTargetShiny(){
        const box=document.getElementById('pcmt-shiny-target');if(!box)return;
        box.replaceChildren();
        if(!state.shinyTarget){box.appendChild(E('div','pcmt-note','Sélectionne un Pokémon pour voir ses statistiques et son temps estimé.'));return;}
        const name=state.shinyTarget;
        addRow(box,'Rencontres historiques de cette espèce',fmt(perPokemonStat('pokemonEncountered',name)));
        addRow(box,'Shinies historiques rencontrés',fmt(perPokemonStat('shinyPokemonEncountered',name)));
        addRow(box,'Rencontres suivies sur cette route',fmt(targetTrack.met));
        addRow(box,'Depuis le dernier shiny de cette espèce',fmt(targetTrack.sinceLast));
        const curr=safe(()=>Routes.getRoute(player.region,player.route),null);
        if (!curr || !availableRouteNames(curr).has(name)) {
            box.appendChild(E('div','pcmt-note','Cette espèce n’est pas référencée parmi les rencontres directes possibles sur la route actuelle.'));return;
        }
        const observations=targetTrack.samples.reduce((a,x)=>({n:a.n+x.n,t:a.t+x.dt}),{n:0,t:0});
        if(observations.t<10||observations.n<3){
            box.appendChild(E('div','pcmt-note','Mesure de la fréquence de cette espèce en cours (minimum 3 rencontres et 10 secondes).'));return;
        }
        const rate=observations.n/observations.t;
        const chance=Number(safe(()=>GameConstants.SHINY_CHANCE_BATTLE,8192)) /
            Math.max(0.00001,Number(safe(()=>App.game.multiplier.getBonus('shiny'),1)));
        const p=Math.min(1,1/chance);
        const countProb=t=>Math.log(1-t)/Math.log1p(-p);
        addRow(box,'Rencontres de cette espèce / min',(rate*60).toLocaleString('fr-FR',{maximumFractionDigits:1}));
        addRow(box,'Probabilité shiny à chaque rencontre',`1 / ${fmt(Math.max(1,Math.round(chance)))}`);
        addRow(box,'Temps moyen estimé',durationLong(1/p/rate));
        addRow(box,'50 % de chances en',durationLong(countProb(.5)/rate));
        addRow(box,'90 % de chances en',durationLong(countProb(.9)/rate));
    }

    // Pokéballs intelligentes : intercepte uniquement la sélection de Ball,
    // sans modifier les filtres stockés dans la sauvegarde.
    let originalBallPicker=null,ballOwner=null;
    const ballHistory=[];
    function ballLabel(id){
        const name=GameConstants.Pokeball?.[id];
        const table={Pokeball:'Poké Ball',Greatball:'Super Ball',Ultraball:'Hyper Ball',Masterball:'Master Ball',Beastball:'Ultra Ball'};
        return table[name]||name||'Aucune Ball';
    }
    function chooseSmartBall(game,id,isShiny,isShadow,encounterType,forPreview=false){
        const P=GameConstants.Pokeball,stock=game.pokeballs;
        const data=safe(()=>PokemonHelper.getPokemonById(id),null),name=data?.name||'?';
        const old=()=>safe(()=>originalBallPicker.call(game,id,isShiny,isShadow,encounterType),P.None);
        const ultraBeast=safe(()=>GameConstants.UltraBeastType[name]!==undefined,false);
        if(isShadow||ultraBeast){return {id:old(),reason:'Règles spéciales natives (Obscur / Ultra-Chimère)'};}
        const owned=!!safe(()=>App.game.party.alreadyCaughtPokemon(id),false);
        const alreadyShiny=!!safe(()=>App.game.party.alreadyCaughtPokemon(id,true),false);
        const shinyNew=!!isShiny&&!alreadyShiny;
        const qty=(k)=>Number(safe(()=>stock[k].quantity(),0));
        const available=k=>Number.isInteger(k)&&k>=0&&qty(k)>0&&safe(()=>stock[k].unlocked(),true);
        if(state.ballMode==='native'){
            const choice=old();
            if(choice!==P.None && available(choice))return {id:choice,reason:'Filtre natif prioritaire'};
        }
        if(!isShiny&&owned&&!state.smartRepeat)return {id:P.None,reason:'Déjà capturé : économiser les Balls'};
        const rarity=Number(data?.catchRate);
        let want,reason;
        if(shinyNew){
            const allowMaster=state.shinyMaster&&!safe(()=>App.game.challenges.list.disableMasterballs.active(),false);
            want=allowMaster&&available(P.Masterball)?P.Masterball:P.Ultraball;
            reason='Nouveau shiny : priorité de capture';
        }else if(isShiny){want=P.Ultraball;reason='Shiny déjà connu';}
        else if(!owned && Number.isFinite(rarity) && rarity<=state.smartRare){want=P.Ultraball;reason='Nouveau Pokémon, taux de capture faible';}
        else if(!owned){want=P.Greatball;reason='Nouveau Pokémon';}
        else {want=P.Pokeball;reason='Capture répétée';}
        let choice=P.None;
        const ladder=want===P.Masterball?[P.Masterball,P.Ultraball,P.Greatball,P.Pokeball]:
            want===P.Ultraball?[P.Ultraball,P.Greatball,P.Pokeball]:
            want===P.Greatball?[P.Greatball,P.Pokeball]:[P.Pokeball];
        choice=ladder.find(available)??P.None;
        if(choice===P.None)reason+=' · plus de Balls utilisables';
        return {id:choice,reason};
    }
    function enableSmartBalls(enabled){
        const manager=safe(()=>App.game.pokeballs,null);
        if(!manager){notify('Système de Balls indisponible.');return false;}
        if(enabled){
            if(!originalBallPicker){
                originalBallPicker=manager.calculatePokeballToUse;
                if(typeof originalBallPicker!=='function') {originalBallPicker=null;notify('Fonction de capture introuvable.');return false;}
                ballOwner=manager;
            }
            manager.calculatePokeballToUse=function(id,isShiny,isShadow,encounterType){
                try{
                    const result=chooseSmartBall(this,id,isShiny,isShadow,encounterType);
                    const name=safe(()=>PokemonHelper.getPokemonById(id).name,'Pokémon');
                    ballHistory.unshift({name,ball:ballLabel(result.id),reason:result.reason,at:Date.now()});
                    ballHistory.length=Math.min(ballHistory.length,10);
                    return result.id;
                }catch(e){
                    console.warn('[PokéTools] Choix de Ball : retour aux filtres natifs',e);
                    return originalBallPicker.call(this,id,isShiny,isShadow,encounterType);
                }
            };
            state.smartBalls=true;
        }else{
            state.smartBalls=false;
            if(originalBallPicker && ballOwner)ballOwner.calculatePokeballToUse=originalBallPicker;
            originalBallPicker=null;ballOwner=null;
        }
        return true;
    }
    function updateBallPreview(){
        const box=document.getElementById('pcmt-ball-preview');if(!box)return;
        box.replaceChildren();
        const enemy=safe(()=>Battle.enemyPokemon?.(),null);
        if(!enemy){box.appendChild(E('div','pcmt-note','Aucun Pokémon en combat pour le moment.'));return;}
        const name=String(enemy.name||'Pokémon');
        const owned=safe(()=>App.game.party.alreadyCaughtPokemon(enemy.id),false);
        const label=E('div','pcmt-group',`${display(name)} · ${enemy.shiny?'✨ Shiny · ':''}${owned?'Déjà capturé':'Manquant'}`);
        box.appendChild(label);
        // Prévision sans appeler la fonction native pour ne pas produire d'effets secondaires.
        if(state.ballMode==='native'){
            box.appendChild(E('div','pcmt-note','Mode natif prioritaire : le choix effectif est affiché dans l’historique de capture.'));
        }else{
            const r=chooseSmartBall(App.game.pokeballs,enemy.id,!!enemy.shiny,
                Number(enemy.shadow)===Number(GameConstants.ShadowStatus?.Shadow),enemy.encounterType,true);
            box.appendChild(E('div','pcmt-cardtitle',`${ballLabel(r.id)} · ${r.reason}`));
        }
        if(ballHistory.length){
            box.appendChild(E('div','pcmt-cardtitle','Derniers choix'));
            for(const item of ballHistory.slice(0,4))box.appendChild(E('div','pcmt-small',`${display(item.name)} : ${item.ball} — ${item.reason}`));
        }
    }
    function renderBalls(){
        const card=E('div','pcmt-card');card.appendChild(E('div','pcmt-cardtitle','🔴 Pokéballs intelligentes'));
        card.appendChild(E('div','pcmt-note','Règles claires, sans modifier tes filtres enregistrés. Toutes les décisions passent par le système de capture de PokéClicker.'));
        addSwitch(card,'Activer le choix automatique',state.smartBalls,v=>{
            enableSmartBalls(v);render();notify(v?'Balls intelligentes activées':'Retour aux filtres du jeu');
        });
        addSelect(card,[['smart','PokéTools prioritaire'],['native','Respecter d’abord mes filtres du jeu']],state.ballMode,v=>{
            state.ballMode=v;save();render();
        });
        addSwitch(card,'Capturer aussi les Pokémon déjà possédés',state.smartRepeat,v=>{state.smartRepeat=v;save();render();});
        addSwitch(card,'Autoriser Master Ball sur un NOUVEAU shiny',state.shinyMaster,v=>{state.shinyMaster=v;save();render();});
        card.appendChild(E('div','pcmt-note',`Pokémon difficiles : seuil ≤ ${state.smartRare} de taux de capture`));
        const slider=E('input');slider.type='range';slider.min=5;slider.max=100;slider.step=5;slider.value=state.smartRare;
        slider.oninput=()=>{state.smartRare=Number(slider.value);save();render();};card.appendChild(slider);
        card.appendChild(E('div','pcmt-callout','Priorité : shiny inconnu → Hyper Ball ; Pokémon rare → Hyper Ball ; nouveau Pokémon → Super Ball ; déjà possédé → aucun lancer, sauf option activée. Repli selon les stocks.'));
        content.appendChild(card);
        const preview=E('div','pcmt-card');preview.appendChild(E('div','pcmt-cardtitle','Aperçu / diagnostic'));
        const box=E('div');box.id='pcmt-ball-preview';preview.appendChild(box);content.appendChild(preview);
        const stocks=E('div','pcmt-card');stocks.appendChild(E('div','pcmt-cardtitle','Stock actuel'));
        for(const name of ['Pokeball','Greatball','Ultraball','Masterball','Beastball']){
            const id=GameConstants.Pokeball?.[name];
            if(Number.isInteger(id))addRow(stocks,ballLabel(id),fmt(safe(()=>App.game.pokeballs.getBallQuantity(id),0)));
        }
        content.appendChild(stocks);updateBallPreview();
    }

    // 6) Assistant quêtes. Validation via claimQuest pour garder les effets natifs.
    function autoQuestTick(){
        if(!state.autoClaim)return;
        const quests=safe(()=>App.game.quests.questList(),[]);
        const ready=quests.findIndex(q=>safe(()=>q.isCompleted() && !q.claimed(),false));
        if(ready>=0){
            try{ App.game.quests.claimQuest(ready);notify('📋 Quête validée automatiquement.'); }
            catch(e){console.warn('[Poké Mini Tools] quête',e);state.autoClaim=false;}
        }
    }
    function renderQuests(){
        content.replaceChildren();
        const q=safe(()=>App.game.quests,null);
        if(!q?.questList){content.appendChild(E('div','pcmt-note','Quêtes non disponibles.'));return;}
        const card=E('div','pcmt-card');card.appendChild(E('div','pcmt-cardtitle','📋 Assistant quêtes'));
        card.appendChild(E('div','pcmt-note',`Quêtes en cours : ${safe(()=>q.currentQuests().length,0)} / ${safe(()=>q.questSlots(),0)}`));
        addSwitch(card,'Valider automatiquement les quêtes terminées',state.autoClaim,v=>{
            state.autoClaim=v;save();notify(v?'Validation automatique activée.':'Validation automatique arrêtée.');
        });
        content.appendChild(card);
        const list=safe(()=>q.questList(),[]);
        const area=E('div');
        for (let i=0;i<list.length;i++){
            const item=list[i],done=!!safe(()=>item.isCompleted(),false);
            const claimed=!!safe(()=>item.claimed(),false),running=!!safe(()=>item.inProgress(),false);
            const row=E('div','pcmt-card');
            row.appendChild(E('div','pcmt-cardtitle',`${claimed?'✓ ':done?'✅ ':running?'⏳ ':'○ '}${String(safe(()=>item.description,'Quête'))}`));
            const text=String(safe(()=>item.progressText(),'0 / ?'));
            row.appendChild(E('div','pcmt-small',`${text} · ${fmt(item.pointsReward)} points`));
            const meter=E('div','pcmt-meter');const fill=E('span');fill.style.width=`${Math.min(100,Math.max(0,100*Number(safe(()=>item.progress(),0))))}%`;
            meter.appendChild(fill);row.appendChild(meter);
            if(done&&!claimed)addButton(row,'Récupérer la récompense',()=>{
                q.claimQuest(i);renderQuests();
            },'pcmt-action');
            else if(!running&&!claimed&&safe(()=>q.canStartNewQuest(),false))addButton(row,'Commencer',()=>{
                q.beginQuest(i);renderQuests();
            });
            area.appendChild(row);
        }
        if(!list.length)area.appendChild(E('div','pcmt-note','Aucune quête affichée pour le moment.'));
        content.appendChild(area);
    }

    // 7) Statistiques de la session, comparaison des compteurs natives.
    const SESSION_STATS=['totalPokemonEncountered','totalPokemonDefeated','totalPokemonCaptured',
        'totalShinyPokemonEncountered','totalShinyPokemonCaptured','totalPokemonHatched','totalShinyPokemonHatched'];
    const sessionHistory=[];
    function statSnapshot(){
        const s={};for(const name of SESSION_STATS)s[name]=readStat(name);
        return s;
    }
    function initSession(){session.start=nowNum();session.base=statSnapshot();session.last=nowNum();
        session.lastRead={shiny:readStat('totalShinyPokemonEncountered'),hatched:readStat('totalPokemonHatched')};
        sessionHistory.push({time:session.last,total:session.base.totalPokemonDefeated});
    }
    function pollSession(){
        if(!session.base)return;
        const now=nowNum();
        const shinyNow=readStat('totalShinyPokemonEncountered');
        const hatchedNow=readStat('totalPokemonHatched');
        if(session.lastRead){
            if(shinyNow>session.lastRead.shiny)notify('✨ Un shiny a été rencontré !');
            if(hatchedNow>session.lastRead.hatched)notify(`🥚 ${hatchedNow-session.lastRead.hatched} œuf(s) éclos !`);
        }
        session.lastRead={shiny:shinyNow,hatched:hatchedNow};
        sessionHistory.push({time:now,total:readStat('totalPokemonDefeated')});
        while(sessionHistory.length>2&&now-sessionHistory[0].time>120000)sessionHistory.shift();
    }
    function sessionDiff(name){return Math.max(0,readStat(name)-(session.base?.[name]||0));}
    function renderStats(){
        content.replaceChildren();
        if(!session.base)initSession();
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','📊 Statistiques de session'));
        const secs=(nowNum()-session.start)/1000;
        addRow(card,'Session',durationLong(secs));
        for(const [kind,label] of [
            ['totalPokemonEncountered','Pokémon rencontrés'],['totalPokemonDefeated','Combats gagnés'],
            ['totalPokemonCaptured','Pokémon capturés'],['totalShinyPokemonEncountered','Shinies rencontrés'],
            ['totalShinyPokemonCaptured','Shinies capturés'],['totalPokemonHatched','Œufs éclos'],
            ['totalShinyPokemonHatched','Œufs shiny éclos']
        ])addRow(card,label,fmt(sessionDiff(kind)));
        let rate=0;
        if(sessionHistory.length>1){
            const a=sessionHistory[0],b=sessionHistory[sessionHistory.length-1];
            rate=(b.total-a.total)/(b.time-a.time)*60000;
        }
        addRow(card,'Combats gagnés/min (2 dernières min)',Number.isFinite(rate)?rate.toLocaleString('fr-FR',{maximumFractionDigits:1}):'0');
        addRow(card,'Captures/heure',(secs>=5?(sessionDiff('totalPokemonCaptured')*3600/secs):0).toLocaleString('fr-FR',{maximumFractionDigits:1}));
        card.appendChild(E('p','pcmt-note','Les compteurs démarrent à l’ouverture de PokéTools et repartent à zéro à chaque rechargement. Ils ne modifient pas les statistiques du jeu.'));
        addButton(card,'Réinitialiser les compteurs de session',()=>{initSession();sessionHistory.splice(0,sessionHistory.length);renderStats();});
        content.appendChild(card);
    }

    // Sauvegarde : export officiel + rotation de 5 snapshots IndexedDB par slot.
    const BACKUP_DB='pcmt-pokeclicker-backups';
    const BACKUP_INTERVAL=20*60*1000;
    let backupDbPromise=null,lastBackupAt=0;
    const currentSlot=()=>String(safe(()=>Save.key,''));
    function backupDatabase(){
        if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB indisponible'));
        if(!backupDbPromise)backupDbPromise=new Promise((resolve,reject)=>{
            const request=indexedDB.open(BACKUP_DB,1);
            request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('snapshots'))request.result.createObjectStore('snapshots',{keyPath:'id'});};
            request.onsuccess=()=>resolve(request.result);
            request.onerror=()=>reject(request.error);
        }).catch(err=>{backupDbPromise=null;throw err;});
        return backupDbPromise;
    }
    function backupTx(mode,handler){return backupDatabase().then(db=>new Promise((resolve,reject)=>{
        const tx=db.transaction('snapshots',mode),store=tx.objectStore('snapshots');
        let result;
        tx.oncomplete=()=>resolve(result);
        tx.onerror=()=>reject(tx.error||new Error('Erreur IndexedDB'));
        tx.onabort=()=>reject(tx.error||new Error('Sauvegarde annulée'));
        try{result=handler(store);}catch(e){tx.abort();reject(e);}
    }));}
    function allSnapshots(){return backupDatabase().then(db=>new Promise((resolve,reject)=>{
        const tx=db.transaction('snapshots','readonly'),req=tx.objectStore('snapshots').getAll();
        req.onsuccess=()=>resolve((req.result||[]).filter(x=>x.slot===currentSlot()).sort((a,b)=>b.date-a.date));
        req.onerror=()=>reject(req.error);
    }));}
    function snapshotPayload(){
        if(typeof Save==='undefined'||typeof Settings==='undefined')throw new Error('Sauvegarde du jeu non disponible');
        const payload=JSON.parse(JSON.stringify({player,save:Save.getSaveObject(),settings:Settings.toJSON()}));
        if(!payload?.player||!payload?.save||!payload?.settings)throw new Error('Sauvegarde incomplète');
        return payload;
    }
    async function createBackup(type='manual',quiet=false){
        try{
            const payload=snapshotPayload(),date=Date.now(),slot=currentSlot();
            const record={id:`${slot}|${date}|${Math.random().toString(36).slice(2,7)}`,date,slot,type,payload};
            await backupTx('readwrite',s=>s.put(record));
            const all=await allSnapshots();
            if(all.length>5){await backupTx('readwrite',s=>all.slice(5).forEach(x=>s.delete(x.id)));}
            lastBackupAt=date;
            if(!quiet)notify('💾 Copie locale enregistrée.');
            if(state.open&&state.tab==='backups')await renderBackups();
            return true;
        }catch(e){console.warn('[PokéTools] sauvegarde',e);if(!quiet)notify('Échec de la sauvegarde locale : '+e.message);return false;}
    }
    async function restoreSnapshot(id){
        const snapshots=await allSnapshots(),snap=snapshots.find(x=>x.id===id);
        if(!snap?.payload?.player||!snap?.payload?.save)throw new Error('Sauvegarde introuvable ou incorrecte');
        if(!window.confirm('Restaurer cette copie ? La progression actuelle sera remplacée. Exporte d’abord ta sauvegarde si tu veux la conserver.'))return;
        // Replace local storage then suppress the game's onbeforeunload autosave.
        const slot=currentSlot(),data=snap.payload;
        localStorage.setItem(`player${slot}`,JSON.stringify(data.player));
        localStorage.setItem(`save${slot}`,JSON.stringify(data.save));
        if(data.settings)localStorage.setItem(`settings${slot}`,JSON.stringify(data.settings));
        window.onbeforeunload=()=>{};
        location.reload();
    }
    function refreshBackupsStatus(){
        const el=document.getElementById('pcmt-backup-status');if(!el)return;
        allSnapshots().then(list=>{
            if(document.getElementById('pcmt-backup-status')===el)
                el.textContent=`${list.length} copie(s) locales · Dernière : ${list[0]?new Date(list[0].date).toLocaleString('fr-FR'):'aucune'}`;
        }).catch(()=>el.textContent='Stockage de copies indisponible');
    }
    async function renderBackups(){
        if(!state.open||state.tab!=='backups')return;
        content.replaceChildren();
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','💾 Protéger ma progression'));
        card.appendChild(E('div','pcmt-callout','Les copies automatiques sont enregistrées dans CE navigateur : elles disparaissent si tu effaces ses données. Exporte régulièrement un fichier sur ton PC pour éviter toute perte définitive.'));
        addButton(card,'⬇ Exporter la sauvegarde officielle',async()=>{
            try{await Save.download();notify('Téléchargement demandé au jeu. Vérifie ton dossier Téléchargements.');}
            catch(e){console.warn(e);notify('Erreur d’export : '+e.message);}
        },'pcmt-action');
        addButton(card,'💾 Créer une copie locale maintenant',()=>createBackup('manual'),'pcmt-toggle');
        const inp=E('input');inp.type='file';inp.accept='.txt,.sav,.json';inp.style.display='none';
        inp.onchange=()=>{
            const file=inp.files?.[0];if(!file)return;
            if(window.confirm('Importer ce fichier de sauvegarde ? La progression actuelle sera remplacée. Fais un export de ta partie avant.')){
                createBackup('before-import',true).finally(()=>safe(()=>Save.loadFromFile(file)));
            }
            inp.value='';
        };
        card.appendChild(inp);
        addButton(card,'↥ Importer une sauvegarde PokéClicker',()=>inp.click(),'pcmt-toggle');
        card.appendChild(E('p','pcmt-note','Copies automatiques toutes les 20 minutes (cinq dernières conservées). Les fichiers sont téléchargés au format officiel du jeu.'));
        content.appendChild(card);
        const card2=E('div','pcmt-card');card2.appendChild(E('div','pcmt-cardtitle','Historique des copies locales'));
        const info=E('div','pcmt-note','Chargement des copies…');info.id='pcmt-backup-status';card2.appendChild(info);
        content.appendChild(card2);
        try{
            const copies=await allSnapshots();
            if(!state.open||state.tab!=='backups'||!card2.isConnected)return;
            for(const item of copies){
                const row=E('div','pcmt-minirow');
                const label=E('div','',new Date(item.date).toLocaleString('fr-FR')+` · ${item.type==='manual'?'Manuelle':item.type==='before-import'?'Avant import':'Auto'}`);
                row.appendChild(label);
                addButton(row,'Restaurer',()=>restoreSnapshot(item.id).catch(e=>notify(e.message)),'pcmt-toggle');
                card2.appendChild(row);
            }
            refreshBackupsStatus();
        }catch(e){info.textContent='Copies indisponibles : '+e.message;}
    }
    function setupBackups(){
        // No remote upload; snapshots stay in the site's IndexedDB.
        backupDatabase().then(()=>allSnapshots()).then(list=>{
            if(!list.length)return createBackup('auto',true);
            lastBackupAt=list[0].date;
        }).catch(e=>console.warn('[PokéTools] Copies locales indisponibles',e));
        setInterval(()=>{
            if(Date.now()-lastBackupAt>=BACKUP_INTERVAL)createBackup('auto',true);
        },60000);
    }

    // 8) Options, visibilité, favoris et raccourcis.
    function renderSettings(){
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','⚙ Interface et raccourcis'));
        addSelect(card,[['classic','Poké Ball · clair'],['night','Nuit · sombre']],state.theme,v=>{state.theme=v;root.classList.toggle('theme-night',v==='night');save();});
        addSwitch(card,'Mode compact',state.compact,v=>{
            state.compact=v;root.classList.toggle('compact',v);save();
        });
        addSwitch(card,'Notifications PokéTools',state.notifications,v=>{state.notifications=v;save();});
        const hudTitle=E('div','pcmt-cardtitle','✦ PokéRadar · aperçu en jeu');hudTitle.style.marginTop='18px';card.appendChild(hudTitle);
        addSwitch(card,'Afficher le PokéRadar lorsque le panneau est fermé',state.hudVisible,v=>{state.hudVisible=v;save();syncRadarVisibility();updateRadar();});
        addSwitch(card,'PokéRadar réduit (discret)',state.hudCollapsed,v=>{state.hudCollapsed=v;save();syncRadarVisibility();});
        addSelect(card,[['right','En bas à droite'],['left','En bas à gauche']],state.hudSide,v=>{state.hudSide=v;save();syncRadarVisibility();});
        card.appendChild(E('div','pcmt-note','Alt + H : afficher ou masquer le PokéRadar. Les statistiques et les chances shiny se mettent à jour même lorsque PokéTools est fermé.'));
        card.appendChild(E('div','pcmt-note','Alt + P : afficher/masquer PokéTools · Échap : fermer. Jusqu’à 5 favoris disponibles en accès direct.'));
        content.appendChild(card);
        const modules=E('div','pcmt-card');modules.appendChild(E('div','pcmt-cardtitle','Modules visibles dans la barre'));
        for(const [id,label] of TAB_LIST){
            if(id==='settings')continue;
            const row=E('div','pcmt-minirow');
            const check=addSwitch(row,label,!state.hiddenTabs.includes(id),v=>{
                state.hiddenTabs=v?state.hiddenTabs.filter(x=>x!==id):[...state.hiddenTabs,id];
                tabs.querySelector(`[data-tab="${id}"]`).hidden=!v;save();
            });
            addButton(row,state.favorites.includes(id)?'★ Favori':'☆ Ajouter',()=>selectedFavorite(id),'pcmt-fav');
            modules.appendChild(row);
        }
        content.appendChild(modules);
        const info=E('div','pcmt-card');info.appendChild(E('div','pcmt-cardtitle','Mises à jour et sécurité'));
        info.appendChild(E('div','pcmt-note','Version 1.5.0. Tampermonkey télécharge les versions depuis GitHub via les liens @updateURL et @downloadURL présents dans le script. Les automatisations de déplacement et de capture restent désactivées après chaque rechargement.'));
        const link=E('a','pcmt-link','Consulter le script sur GitHub ↗');
        link.href='https://github.com/Ironakatina33/Clicker-game/tree/main/pokeclicker-mini-tools';link.target='_blank';link.rel='noopener noreferrer';info.appendChild(link);
        content.appendChild(info);
    }


    function boot() {
        const ready = () => typeof App !== 'undefined' && !!App.game?.breeding?.hatchList
            && typeof GameConstants !== 'undefined' && typeof PokemonHelper !== 'undefined'
            && typeof PokemonLocations !== 'undefined' && typeof pokemonList !== 'undefined';
        let attempts = 0;
        const waiter = setInterval(() => {
            if (document.getElementById(ROOT)) { clearInterval(waiter); return; }
            if (ready()) { clearInterval(waiter); mount(); return; }
            if (++attempts > 180) { clearInterval(waiter); console.warn('[Poké Mini Tools] Le jeu n’a pas été détecté.'); }
        }, 1000);
    }
    window.PokeMiniTools = { version:'1.5.0', open: () => togglePanel(true), close: () => togglePanel(false), stop: stopAutoClick, updateRadar:()=>updateRadar() };
    boot();
})();