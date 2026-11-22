// ==UserScript==
// @name         PokéClicker Mini Tools FR — Œufs, Pokédex et AutoClick
// @namespace    https://www.pokeclicker.com/
// @version      1.3.0
// @description  Pokédex, œufs, shiny, auto-route, Pokéballs, quêtes, statistiques et auto-updates.
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
        cps: Math.max(1, Math.min(20, Number(stored.cps) || 10)),
        enabled: false, clicks: 0, timer: null,
        dexRegion: stored.dexRegion ?? null, dexFilter: stored.dexFilter || 'missing',
        dexSearch:'', dexPage:0, autoRoute:false, routeMode:stored.routeMode || 'missing',
        routeInterval:Math.max(30,Math.min(300,Number(stored.routeInterval)||90)),
        lastRouteChange:0, routeOwnedSince:0, routePrevious:null,
        smartBalls:false, smartRare:Math.max(5,Math.min(100,Number(stored.smartRare)||45)),
        shinyMaster:!!stored.shinyMaster, autoClaim:!!stored.autoClaim,
        shinyTarget:stored.shinyTarget || '',
        notifications:stored.notifications !== false,
        hiddenTabs:Array.isArray(stored.hiddenTabs)?stored.hiddenTabs:[],
        favorites:Array.isArray(stored.favorites)?stored.favorites:['eggs','dex','shiny'],
        compact:!!stored.compact,

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
        ['eggs','🥚 Œufs'], ['pokemon','🔎 Pokémon'], ['clicker','⚡ Auto'],
        ['shiny','✨ Shiny'], ['dex','📗 Pokédex'], ['routes','🧭 Routes'],
        ['balls','🔴 Balls'], ['quests','📋 Quêtes'], ['stats','📊 Stats'],
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
            cps:state.cps,dexRegion:state.dexRegion,dexFilter:state.dexFilter,
            routeMode:state.routeMode,routeInterval:state.routeInterval,smartRare:state.smartRare,
            shinyMaster:state.shinyMaster,autoClaim:state.autoClaim,shinyTarget:state.shinyTarget,
            hiddenTabs:state.hiddenTabs,favorites:state.favorites,notifications:state.notifications,
            compact:state.compact
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
        fab.textContent = state.open ? '✕ Fermer les outils' : '⚙ PokéTools';
        if (state.open) render();
    }
    function mount() {
        if (document.getElementById(ROOT)) return;
        root = E('div'); root.id = ROOT; root.classList.toggle('compact',state.compact);
        const style = E('style'); style.textContent = css;
        root.appendChild(style);
        fab = E('button', 'pcmt-fab', '⚙ PokéTools');
        fab.type = 'button'; fab.addEventListener('click', () => togglePanel());
        root.appendChild(fab);
        panel = E('section', 'pcmt-panel'); panel.hidden = true;
        panel.setAttribute('aria-label', 'PokéClicker Mini Tools');
        const head = E('div', 'pcmt-head');
        const titleWrap = E('div');
        titleWrap.appendChild(E('div', 'pcmt-title', 'PokéClicker · Mini Tools'));
        titleWrap.appendChild(E('div', 'pcmt-muted', 'v1.3.0 · 10 outils configurables'));
        head.appendChild(titleWrap);
        const close = E('button', 'pcmt-close', '×');
        close.type = 'button'; close.setAttribute('aria-label', 'Fermer');
        close.addEventListener('click', () => togglePanel(false)); head.appendChild(close);
        panel.appendChild(head);
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
        selectTab('eggs');
        setInterval(() => {
            if (!state.open) return;
            if (state.tab === 'eggs') renderEggs();
            if (state.tab === 'clicker') refreshCounter();
            if (state.tab === 'shiny') refreshShiny();
            if (state.tab === 'stats') renderStats();
            if (state.tab === 'quests') renderQuests();
            if (state.tab === 'routes') updateRoutesStatus();
        }, 3500);
        window.addEventListener('pagehide', stopAutoClick);
        initSession();
        shinyPoll();
        setInterval(() => { shinyPoll(); pollShinyTarget(); pollSession(); },1000);
        setInterval(() => { autoRouteTick(); autoQuestTick(); },2500);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && state.open) togglePanel(false);
            if (e.altKey && e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();togglePanel();
            }
        });
    }

    function render() {
        if (!content) return;
        content.replaceChildren();
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

    function tick() {
        if (!state.enabled) return;
        try {
            const s = App.game.gameState;
            const gs = GameConstants.GameState;
            if (s === gs.fighting) { Battle.clickAttack(); state.clicks++; }
            else if (s === gs.gym) { GymBattle.clickAttack(); state.clicks++; }
            else if (s === gs.dungeon && DungeonRunner.fighting()) { DungeonBattle.clickAttack(); state.clicks++; }
            else if (s === gs.temporaryBattle) { TemporaryBattleBattle.clickAttack(); state.clicks++; }
        } catch (e) {
            console.warn('[Poké Mini Tools] Autoclicker arrêté :', e);
            stopAutoClick(); refreshCounter();
        }
    }
    function stopAutoClick() {
        state.enabled = false;
        if (state.timer) clearInterval(state.timer);
        state.timer = null;
    }
    function startAutoClick() {
        stopAutoClick();
        state.enabled = true;
        state.timer = setInterval(tick, Math.max(50, Math.round(1000 / state.cps)));
    }
    function refreshCounter() {
        const status = document.getElementById('pcmt-clicker-status');
        const button = document.getElementById('pcmt-clicker-toggle');
        if (status) status.textContent = `${state.enabled ? '● Activé' : '○ Arrêté'} · ${fmt(state.clicks)} appels de clic depuis l’ouverture`;
        if (button) { button.textContent = state.enabled ? 'Arrêter l’autoclicker' : 'Démarrer l’autoclicker'; button.classList.toggle('stop', state.enabled); }
    }
    function renderClicker() {
        const card = E('div', 'pcmt-card');
        card.appendChild(E('div', 'pcmt-cardtitle', 'Autoclicker intégré'));
        card.appendChild(E('p', 'pcmt-note', 'Envoie les clics de combat normaux du jeu, sans accélérer artificiellement les règles du combat. Fonctionne sur les routes, en arène et durant les combats des donjons.'));
        const status = E('div', 'pcmt-muted'); status.id = 'pcmt-clicker-status'; card.appendChild(status);
        const speed = E('div', 'pcmt-row');
        speed.appendChild(E('span', '', 'Vitesse'));
        const speedValue = E('strong', '', `${state.cps} clics/s`); speed.appendChild(speedValue); card.appendChild(speed);
        const slider = E('input'); slider.type='range'; slider.min='1'; slider.max='20'; slider.step='1'; slider.value=String(state.cps);
        slider.setAttribute('aria-label', 'Vitesse en clics par seconde');
        slider.addEventListener('input', () => {
            state.cps=Number(slider.value); speedValue.textContent=`${state.cps} clics/s`;
            save(); if (state.enabled) startAutoClick();
        });
        card.appendChild(slider);
        const toggle = E('button', 'pcmt-action'); toggle.id='pcmt-clicker-toggle'; toggle.type='button';
        toggle.addEventListener('click', () => { if (state.enabled) stopAutoClick(); else startAutoClick(); refreshCounter(); });
        card.appendChild(toggle);
        content.appendChild(card);
        content.appendChild(E('p', 'pcmt-note', 'Limité à 20 appels de clic par seconde (le jeu applique ses propres délais). Ne lance pas les combats ni les déplacements automatiquement. Désactive tout autre autoclicker pour éviter les conflits.'));
        refreshCounter();
    }


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

    // 5) Pokéballs : choisir sans jamais attribuer de Master Ball automatiquement
    // sauf si l'utilisateur active expressément l'option.
    let originalBallPicker=null,ballOwner=null;
    function autoBallChoice(game,id,isShiny,isShadow,encounterType){
        if (!state.smartBalls || !originalBallPicker) return originalBallPicker.call(game,id,isShiny,isShadow,encounterType);
        const P=GameConstants.Pokeball, pokes=game.pokeballs;
        const data=safe(()=>PokemonHelper.getPokemonById(id),null);
        const name=data?.name || '';
        // Les Ultra-Chimères imposent les Beast Balls : respecter cette règle native.
        if (safe(()=>GameConstants.UltraBeastType[name]!==undefined,false))return originalBallPicker.call(game,id,isShiny,isShadow,encounterType);
        if (isShadow)return originalBallPicker.call(game,id,isShiny,isShadow,encounterType);
        const have=id2=>Number(safe(()=>pokes[id2].quantity(),0))>0 &&
            safe(()=>pokes[id2].unlocked(),true);
        const newShiny=!!isShiny&&!safe(()=>App.game.party.alreadyCaughtPokemon(id,true),false);
        const newPokemon=!safe(()=>App.game.party.alreadyCaughtPokemon(id),false);
        let requested;
        if (newShiny){
            const allowMaster=state.shinyMaster&&!safe(()=>App.game.challenges.list.disableMasterballs.active(),false);
            requested=allowMaster && have(P.Masterball) ? P.Masterball:P.Ultraball;
        } else if (newPokemon){
            const catchRate=Number(data?.catchRate);
            requested=Number.isFinite(catchRate)&&catchRate<=state.smartRare ? P.Ultraball:P.Greatball;
        } else if (isShiny){requested=P.Greatball;}
        else {requested=P.Pokeball;}
        if(have(requested))return requested;
        // La chute du stock n'autorise jamais une Masterball non voulue.
        for(const next of [P.Ultraball,P.Greatball,P.Pokeball]){
            if(Number(next)<=Number(requested) && have(next))return next;
        }
        return P.None;
    }
    function enableSmartBalls(enabled){
        const manager=safe(()=>App.game.pokeballs,null);
        if(!manager){notify('Les Pokéballs ne sont pas encore disponibles.');return false;}
        if(enabled){
            if(!originalBallPicker){
                originalBallPicker=manager.calculatePokeballToUse;
                if(typeof originalBallPicker!=='function')return false;
                ballOwner=manager;
                manager.calculatePokeballToUse=function(id,isShiny,isShadow,encounterType){
                    return autoBallChoice(this,id,isShiny,isShadow,encounterType);
                };
            }
            state.smartBalls=true;
        } else {
            state.smartBalls=false;
            if(originalBallPicker&&ballOwner?.calculatePokeballToUse){
                ballOwner.calculatePokeballToUse=originalBallPicker;
            }
            originalBallPicker=null;ballOwner=null;
        }
        return true;
    }
    function renderBalls(){
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','🔴 Pokéballs intelligentes'));
        card.appendChild(E('p','pcmt-note','Désactivé par défaut. En l’activant, PokéTools choisit temporairement la ball au moment de la capture : nouveau shiny, nouveau Pokémon, rareté estimée par taux de capture, puis stock disponible. Les filtres natifs restent inchangés et reviennent à l’arrêt.'));
        const status=E('div','pcmt-note',state.smartBalls?'● Choix automatique actif':'○ Choix automatique arrêté');card.appendChild(status);
        addButton(card,state.smartBalls?'⏹ Désactiver':'▶ Activer',()=>{
            enableSmartBalls(!state.smartBalls);renderBalls();
        },`pcmt-action ${state.smartBalls?'stop':''}`);
        const rare=E('div','pcmt-card');
        rare.appendChild(E('div','pcmt-cardtitle',`Taux de capture « rare » : ${state.smartRare} ou moins`));
        const slider=E('input');slider.type='range';slider.min=5;slider.max=100;slider.step=5;slider.value=state.smartRare;
        slider.onchange=()=>{state.smartRare=Number(slider.value);save();renderBalls()};rare.appendChild(slider);
        addSwitch(rare,'Autoriser la Master Ball sur un nouveau shiny',state.shinyMaster,v=>{
            state.shinyMaster=v;save();renderBalls();
        });
        rare.appendChild(E('div','pcmt-note','Par défaut : Ultra Ball pour nouveau shiny, Ultra Ball pour Pokémon difficile à capturer, Great Ball pour nouveau Pokémon, Poké Ball pour Pokémon déjà capturé. Retour aux balls moins puissantes si le stock manque. Les Ultra-Chimères et Pokémon obscurs gardent les règles natives.'));
        content.appendChild(card);content.appendChild(rare);
        const stocks=E('div','pcmt-card');stocks.appendChild(E('div','pcmt-cardtitle','Stock de balls'));
        for(const name of ['Pokeball','Greatball','Ultraball','Masterball','Beastball']){
            const id=GameConstants.Pokeball?.[name];
            if(Number.isFinite(Number(id)))addRow(stocks,name,fmt(safe(()=>App.game.pokeballs.getBallQuantity(id),0)));
        }
        content.appendChild(stocks);
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

    // 8) Options, visibilité, favoris et raccourcis.
    function renderSettings(){
        const card=E('div','pcmt-card');
        card.appendChild(E('div','pcmt-cardtitle','⚙ Interface et raccourcis'));
        addSwitch(card,'Mode compact',state.compact,v=>{
            state.compact=v;root.classList.toggle('compact',v);save();
        });
        addSwitch(card,'Notifications PokéTools',state.notifications,v=>{state.notifications=v;save();});
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
        info.appendChild(E('div','pcmt-note','Version 1.3.0. Tampermonkey télécharge les versions depuis GitHub via les liens @updateURL et @downloadURL présents dans le script. Les automatisations de déplacement et de capture restent désactivées après chaque rechargement.'));
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
    window.PokeMiniTools = { version:'1.3.0', open: () => togglePanel(true), close: () => togglePanel(false), stop: stopAutoClick };
    boot();
})();