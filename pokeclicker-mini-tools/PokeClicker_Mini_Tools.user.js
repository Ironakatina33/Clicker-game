// ==UserScript==
// @name         PokéClicker Mini Tools FR — Œufs, Pokédex et AutoClick
// @namespace    https://www.pokeclicker.com/
// @version      1.2.0
// @description  Mini panneau en français : œufs, localisation, autoclicker et shiny. Mises à jour automatiques.
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
#${ROOT} .pcmt-tabs {display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:7px;background:#0b1625;}
#${ROOT} .pcmt-tab {padding:9px 3px;border:0;border-radius:9px;background:transparent;color:#a9c4df;font-weight:650;}
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

    let root, panel, content, tabs, fab;
    function save() {
        try { localStorage.setItem(STORE, JSON.stringify({cps: state.cps})); } catch (_) { /* ignore */ }
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
        root = E('div'); root.id = ROOT;
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
        titleWrap.appendChild(E('div', 'pcmt-muted', 'v1.2.0 · Œufs, localisation, clics et shiny'));
        head.appendChild(titleWrap);
        const close = E('button', 'pcmt-close', '×');
        close.type = 'button'; close.setAttribute('aria-label', 'Fermer');
        close.addEventListener('click', () => togglePanel(false)); head.appendChild(close);
        panel.appendChild(head);
        tabs = E('nav', 'pcmt-tabs');
        [['eggs','🥚 Œufs'],['pokemon','🔎 Pokémon'],['clicker','⚡ Auto'],['shiny','✨ Shiny']].forEach(([id, label]) => {
            const b = E('button', 'pcmt-tab', label);
            b.type = 'button'; b.dataset.tab = id;
            b.addEventListener('click', () => selectTab(id));
            tabs.appendChild(b);
        });
        panel.appendChild(tabs);
        content = E('div', 'pcmt-content'); panel.appendChild(content);
        root.appendChild(panel);
        document.body.appendChild(root);
        selectTab('eggs');
        setInterval(() => {
            if (!state.open) return;
            if (state.tab === 'eggs') renderEggs();
            if (state.tab === 'clicker') refreshCounter();
            if (state.tab === 'shiny') refreshShiny();
        }, 3500);
        window.addEventListener('pagehide', stopAutoClick);
        shinyPoll();
        setInterval(shinyPoll, 1000);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open) togglePanel(false); });
    }

    function render() {
        if (!content) return;
        content.replaceChildren();
        if (state.tab === 'eggs') renderEggs();
        if (state.tab === 'pokemon') renderSearch();
        if (state.tab === 'clicker') renderClicker();
        if (state.tab === 'shiny') renderShiny();
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
                (routes || []).map(r => `${regionName(region)} · Route ${r.route}${r.requirements ? ' (conditions spéciales possibles)' : ''}`));
            case 1: return arr.map(x => `${regionName(x.region)} · Pokémon errant${x.roamingGroup?.name ? ` (${x.roamingGroup.name})` : ''}`);
            case 2: case 3: case 4:
                return arr.map(x => `${x.dungeon}${x.requirements ? ' (conditions spéciales possibles)' : ''}`);
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
    window.PokeMiniTools = { version:'1.2.0', open: () => togglePanel(true), close: () => togglePanel(false), stop: stopAutoClick };
    boot();
})();