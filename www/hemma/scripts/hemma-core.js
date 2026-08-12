// ── Now Playing collector ────────────────────────────────────────────────────
(function () {
  if (!window.HEMMA_ACTIVE_STATES) {
    window.HEMMA_ACTIVE_STATES = new Set([
      'on', 'open', 'opening', 'playing', 'unlocked', 'unlocking',
      'cleaning', 'returning', 'cool', 'heat', 'washing', 'rinsing',
      'spinning', 'drying', 'running', 'active', 'problem',
    ]);
  }

  if (!window.HEMMA_TEMPLATE_SIZES) {
    window.HEMMA_TEMPLATE_SIZES = {};
  }

  // Works off the RAW config: both callers run before button-card merges templates.
  if (typeof window.hemmaCardSize !== 'function') {
    window.hemmaCardSize = function (cfg) {
      if (!cfg) return 'small';
      const direct = cfg.variables?.size;
      if (direct) return String(direct).toLowerCase() === 'large' ? 'large' : 'small';
      const tmpl = cfg.template;
      const list = Array.isArray(tmpl) ? tmpl : (tmpl ? [tmpl] : []);
      const sizes = window.HEMMA_TEMPLATE_SIZES || {};
      for (const t of list) {
        if (sizes[t] === 'large') return 'large';
      }
      return 'small';
    };
  }

  if (typeof window.hemmaStateFit !== 'function') {
    const emCache = new Map();
    let ctx = null;
    let fam = null;

    window.hemmaTextEm = function (text, weight) {
      const w = weight || 500;
      const key = w + '|' + text;
      const hit = emCache.get(key);
      if (hit !== undefined) return hit;
      if (!ctx) ctx = document.createElement('canvas').getContext('2d');
      if (!fam) {
        fam = getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-font-family').trim() || 'system-ui, sans-serif';
      }
      // Measured at 100px and divided back down, so the result is a ratio.
      ctx.font = w + ' 100px ' + fam;
      // 2% slack for letter-spacing and sub-pixel rounding.
      const em = (ctx.measureText(String(text)).width / 100) * 1.02;
      emCache.set(key, em);
      return em;
    };

    window.hemmaStateFit = function (text, weight) {
      const t = text == null ? '' : String(text);
      if (!t) return '';
      const em = window.hemmaTextEm(t, weight);
      if (!(em > 0)) return t;
      const esc = t.replace(/[&<>"]/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
      ));
      return '<span style="display:inline-block;white-space:nowrap;font-size:min(1em,'
        + 'calc((100cqi - var(--hemma-tile-state-inset, 0px)) / ' + em.toFixed(3) + '))">'
        + esc + '</span>';
    };
  }

  // Mirrors each template's variables.mobile_filter_category, so a card's
  // category can be resolved from its template name alone.
  if (!window.HEMMA_FILTER_CATEGORIES) {
    window.HEMMA_FILTER_CATEGORIES = {
      hemma_thermostat:    'climate',
      hemma_air_purifier:  'climate',
      hemma_cover:         'climate',
      hemma_fan:           'climate',
      hemma_humidifier:    'climate',
      hemma_light:         'lights',
      hemma_media:         'media',
      hemma_energy:        'energy',
      hemma_lock:          'security',
      hemma_doorbell:      'security',
      hemma_vacuum:        'unfiltered',
      hemma_plant:         'unfiltered',
    };
  }

  if (typeof window._hemmaNPSources !== 'function') {
      window._hemmaNPSources = function (states, V) {
        const norm = (x) => String(x ?? '').trim();
        const low  = (x) => norm(x).toLowerCase();
        const abs  = (u) => {
          if (!u) return null;
          const s = String(u);
          const full = s.startsWith('/') ? (location.origin + s) : s;
          // Plex's ?refresh= changes every poll; strip it so the browser
          // reuses the decoded image instead of flashing on each update.
          try {
  const p = new URL(full, location.origin);
  p.searchParams.delete('refresh');
  return p.toString();
          } catch (e) { return full; }
        };
        const ms = (t) => { const n = t ? Date.parse(t) : NaN; return Number.isFinite(n) ? n : 0; };

        const pauseTimeout = Number(V.pause_timeout_minutes ?? 5);
        const out = [];

        // ── media_player.N ────────────────────────────────────────────
        for (let i = 1; i <= 10; i++) {
          if (!V['show_media_player_' + i]) continue;
          const eid = V['media_player_' + i];
          const s = eid && states[eid];
          if (!s) continue;

          const st = low(s.state);
          const a  = s.attributes || {};
          const rawTitle = norm(a.media_title);
          let artist = norm(a.media_artist || a.artist || a.media_album_artist);
          const hasContent = !!(rawTitle || artist);

          let active = false;
          if (st === 'playing' || st === 'buffering') active = true;
          else if (st === 'paused' && hasContent) {
  active = pauseTimeout <= 0 ||
    ((Date.now() - ms(s.last_changed)) / 60000) <= pauseTimeout;
          }
          if (!active) continue;

          // Matches the media badge's title/artist derivation so the two can't
          // disagree about what's playing.
          let title = rawTitle;
          if (!artist && a.media_content_type === 'tvshow') {
  const series  = norm(a.media_series_title);
  const season  = a.media_season  ? 'S' + String(a.media_season).padStart(2, '0')  : '';
  const episode = a.media_episode ? 'E' + String(a.media_episode).padStart(2, '0') : '';
  artist = [series, [season, episode].filter(Boolean).join('')].filter(Boolean).join(' · ');
          }
          if (!artist) {
  const parts = rawTitle.split(/\s+[-–—]\s+/);
  if (parts.length >= 3) {
    title = parts[parts.length - 1];
    artist = parts.slice(0, -1).join(' – ');
  }
          }

          let art = abs(a.entity_picture || a.media_image_url || a.media_album_cover_url || a.image_url);
          if (!art) {
  const app = low(a.app_name || a.source) + ' ' + low(a.app_id);
  if (app.includes('youtube')) art = '/local/hemma/icons/youtube.png';
          }

          const feats = Number(a.supported_features || 0);
          out.push({
  key: 'mp' + i,
  kind: 'player',
  entity: eid,
  art: art,
  title: title || norm(a.friendly_name) || 'Media',
  subtitle: artist,
  source: norm(a.app_name || a.source || a.friendly_name),
  started: ms(s.last_changed),
  state: st,
  playing: st === 'playing' || st === 'buffering',
  // 16384 PLAY, 1 PAUSE, 32 NEXT, 16 PREVIOUS
  controls: {
    toggle: !!(feats & 16385),
    next: !!(feats & 32),
    prev: !!(feats & 16),
  },
  pos: Number(a.media_position),
  dur: Number(a.media_duration),
  posAt: ms(a.media_position_updated_at),
          });
        }

        // ── Plex sessions ─────────────────────────────────────────────
        for (let i = 1; i <= 2; i++) {
          if (!V['show_plex_' + i]) continue;
          const sid = V['plex_stream_' + i];
          const sState = sid && states[sid];
          if (!sState || low(sState.state) !== 'playing') continue;
          const a = sState.attributes || {};
          const full = norm(a.full_title || a.title);
          if (!full) continue;
          const tau = sid.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli');
          const pst = low((states[tau]?.state) || sState.state || '');
          if (pst !== 'playing' && pst !== 'buffering') continue;
          out.push({
  key: 'plex' + i,
  kind: 'plex',
  entity: sid,
  art: abs(a.image_url || a.entity_picture_local || a.entity_picture || a.media_image_url),
  title: full,
  subtitle: '',
  source: 'Plex · ' + (norm(a.user) || 'Unknown'),
  started: ms(sState.last_changed),
  state: 'playing',
  playing: true,
  controls: { toggle: false, next: false, prev: false },
          });
        }

        // ── PlayStation sessions ──────────────────────────────────────
        for (let i = 1; i <= 2; i++) {
          if (!V['show_psn_' + i]) continue;
          const eid = V['psn_' + i];
          const s = eid && states[eid];
          if (!s) continue;
          const st = low(s.state);
          if (['unavailable', 'unknown', 'off', 'standby', 'none', ''].includes(st)) continue;
          const a = s.attributes || {};
          const title = norm(a.full_title || a.media_title || a.title);
          if (!title) continue;
          out.push({
  key: 'psn' + i,
  kind: 'activity',
  entity: eid,
  art: abs(a.entity_picture_local || a.entity_picture || a.image_url || a.media_image_url),
  title: title,
  subtitle: norm(a.user),
  // The console's name ("PS5"), not a.source's "PlayStation Network".
  source: norm(a.friendly_name) || norm(a.source) || 'PlayStation',
  started: ms(s.last_changed),
  state: st,
  playing: st === 'playing',
  controls: { toggle: false, next: false, prev: false },
          });
        }

        // ── Discord / Steam ───────────────────────────────────────────
        if (V.show_discord_steam && V.discord_steam_online && V.discord_steam_game) {
          const online = low(states[V.discord_steam_online]?.state) === 'online';
          const game = norm(states[V.discord_steam_game]?.state);
          const dead = !game || ['unknown', 'unavailable'].includes(game.toLowerCase());
          if (online && !dead) {
  const imgS = V.discord_steam_image && states[V.discord_steam_image];
  const ia = (imgS && imgS.attributes) || {};
  out.push({
    key: 'steam',
    kind: 'activity',
    entity: V.discord_steam_image || V.discord_steam_game,
    art: abs(ia.entity_picture_local || ia.entity_picture || ia.image_url),
    title: game,
    subtitle: norm(states[V.discord_steam_details]?.state).replace(/^(unknown|unavailable)$/i, ''),
    source: 'Steam',
    started: ms(states[V.discord_steam_game]?.last_changed),
    state: 'playing',
    playing: true,
    controls: { toggle: false, next: false, prev: false },
  });
          }
        }

        window._hemmaNPStartedAt = window._hemmaNPStartedAt || {};
        const startedAtCache = window._hemmaNPStartedAt;
        const nowActiveKeys = new Set();
        for (const r of out) {
          nowActiveKeys.add(r.key);
          if (!(r.key in startedAtCache)) startedAtCache[r.key] = r.started;
          r.started = startedAtCache[r.key];
        }
        for (const k of Object.keys(startedAtCache)) {
          if (!nowActiveKeys.has(k)) delete startedAtCache[k];
        }

        const rank = (r) => {
          const c = r.controls;
          const hasCtl = !!(c && (c.toggle || c.next || c.prev));
          const isMedia = r.kind !== 'activity';
          return (r.playing ? 4 : 0) + (hasCtl ? 2 : 0) + (isMedia ? 1 : 0);
        };
        out.sort((x, y) => (rank(y) - rank(x)) || (y.started - x.started));


        const pin = String(V.pinned_key || '').trim();
        if (pin) {
          const i = out.findIndex(r => r.key === pin);
          if (i > 0) out.unshift(out.splice(i, 1)[0]);
        }
        return out;
      };
    }

    if (typeof window._hemmaNPView !== 'function') {
      window._hemmaNPView = function (states, V) {
        const live = window._hemmaNP(states, V);
        const st = window._hemmaNPHold = window._hemmaNPHold || {};
        if (live.length) { st.last = live; st.emptyAt = 0; return live; }
        if (st.last && st.last.length) {
          if (!st.emptyAt) st.emptyAt = Date.now();
          // Comfortably past the 420ms exit; the content is hidden by then.
          if (Date.now() - st.emptyAt < 900) return st.last;
        }
        return live;
      };
    }

    if (typeof window._hemmaNPStableView !== 'function') {
      window._hemmaNPStableView = function (states, V, ctxId) {
        const HOLD_MS = 2500;
        const raw = window._hemmaNPView(states, V);
        const rawKeys = raw.map(r => r.key);
        const store = window._hemmaNPStableStore = window._hemmaNPStableStore || {};
        const st = store[ctxId] = store[ctxId] || { confirmed: null, pending: null };
        const sameArr = (a, b) => !!a && !!b && a.length === b.length && a.every((k, i) => k === b[i]);

        if (!st.confirmed) {
          st.confirmed = rawKeys;
        } else if (sameArr(rawKeys, st.confirmed)) {
          st.pending = null;
        } else if (sameArr(rawKeys, st.pending?.order)) {
          if (Date.now() - st.pending.at >= HOLD_MS) {
            st.confirmed = rawKeys;
            st.pending = null;
          }
        } else {
          st.pending = { order: rawKeys, at: Date.now() };
        }

        if (sameArr(rawKeys, st.confirmed)) return raw;

        const byKey = new Map(raw.map(r => [r.key, r]));
        return st.confirmed.filter(k => byKey.has(k)).map(k => byKey.get(k));
      };
    }

    if (typeof window._hemmaNPSyncMobileRow !== 'function') {
      window._hemmaNPSyncMobileRow = function (cardEl, states) {
        const root = cardEl && cardEl.getRootNode && cardEl.getRootNode();
        const rowHost = root && root.host;
        if (!rowHost || !rowHost.shadowRoot) return;
        // Cached so a later recheck can re-run without a live slot element.
        window._hemmaNPMobileRowHostCache = rowHost;
        const shadow = rowHost.shadowRoot;

        const flipIds = ['media1','media2','media3','media4','media5','media6','media7','media8','media9'];
        const slotState = window._hemmaNPSlotState || {};
        const settled = flipIds.map(id => slotState[id]?._npHoldSrc || null);
        const activeCount = settled.filter(Boolean).length;

        const outerRoot = rowHost.getRootNode && rowHost.getRootNode();
        const outerHost = outerRoot && outerRoot.host;
        const outerTpl  = outerHost && outerHost._config && outerHost._config.template;
        const isNpCard  = outerTpl === 'hemma_mobile_now_playing'
          || (Array.isArray(outerTpl) && outerTpl.includes('hemma_mobile_now_playing'));
        if (outerHost && isNpCard) {
          const shown = activeCount > 0;
          if (outerHost._npAnyActive !== shown) {
            outerHost._npAnyActive = shown;
            const ov = shown ? 'visible' : 'hidden';
            outerHost.style.setProperty('display', 'grid', 'important');
            outerHost.style.setProperty('overflow', ov, 'important');
            outerHost.style.setProperty('grid-template-rows', shown ? '1fr' : '0fr', 'important');
            outerHost.style.setProperty('grid-template-columns', 'minmax(0,1fr)', 'important');
            outerHost.style.setProperty('opacity', shown ? '1' : '0');
            outerHost.style.setProperty('pointer-events', shown ? 'auto' : 'none');
            outerHost.style.setProperty(
              'transition',
              `grid-template-rows .5s cubic-bezier(0.32,0.72,0,1), opacity ${shown ? '.35s ease .12s' : '.25s ease'}`
            );
            const aspectRatio = outerHost.shadowRoot?.getElementById('aspect-ratio');
            if (aspectRatio) aspectRatio.style.setProperty('overflow', ov, 'important');
            const haCard = outerHost.shadowRoot?.querySelector('ha-card.button-card-main');
            if (haCard) {
              haCard.style.setProperty('min-height', '0', 'important');
              haCard.style.setProperty('overflow', ov, 'important');
            }
          }
        }

        const filter = states?.['input_select.hemma_mobile_filter']?.state ?? 'all';
        const inColumn = filter === 'media';
        const usesPeek = !inColumn && activeCount > 1;

        const gutters = '(max(var(--hemma-measured-safe-left, 0px), var(--hemma-rail-left, 11px)) + var(--hemma-rail-left, 11px))';
        const activeW = usesPeek
          ? `calc(100vw - ${gutters} - var(--np-peek, 26px))`
          : `calc(100vw - ${gutters})`;
        const activeGap = usesPeek ? 'var(--np-gap, 10px)' : '0px';

        const prevPeek = rowHost._npRowUsesPeek;
        const firstRun = prevPeek === undefined;
        rowHost._npRowUsesPeek = usesPeek;

        const curKeys = flipIds.map((_, i) => settled[i]?.key || null);
        const prevKeys = rowHost._npSlotKeys || [];
        const slotKeyChanged = new Set();
        curKeys.forEach((k, i) => { if (prevKeys[i] !== k) slotKeyChanged.add(flipIds[i]); });
        rowHost._npSlotKeys = curKeys;

        if (firstRun || prevPeek === usesPeek) {
          rowHost.style.setProperty('--np-active-w', activeW);
          rowHost.style.setProperty('--np-active-gap', activeGap);
          return;
        }

        if (rowHost._npFlipPending) {
          rowHost.style.setProperty('--np-active-w', activeW);
          rowHost.style.setProperty('--np-active-gap', activeGap);
          return;
        }
        rowHost._npFlipPending = true;

        const beforeRects = {};
        for (const id of flipIds) {
          const el = shadow.getElementById(id);
          if (el) beforeRects[id] = el.getBoundingClientRect();
        }

        rowHost.style.setProperty('--np-active-w', activeW);
        rowHost.style.setProperty('--np-active-gap', activeGap);

        const reduceMotion = window.matchMedia
          && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) { rowHost._npFlipPending = false; return; }

        requestAnimationFrame(() => {
          rowHost._npFlipPending = false;
          for (const id of flipIds) {
            if (slotKeyChanged.has(id)) continue;
            const el = shadow.getElementById(id);
            if (!el) continue;
            const before = beforeRects[id];
            if (!before || before.width < 2) continue;
            const after = el.getBoundingClientRect();
            if (after.width < 2) continue;
            if (Math.abs(before.width - after.width) < 1) continue;
            const ratio = before.width / after.width;
            el.style.transformOrigin = 'left center';
            try { el._npWidthFlip?.cancel(); } catch (e) {}
            el._npWidthFlip = el.animate(
              [{ transform: `scaleX(${ratio})` }, { transform: 'scaleX(1)' }],
              { duration: 460, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
            );
          }
        });
      };
    }

    if (!window._hemmaNPResizeGuardInstalled) {
      window._hemmaNPResizeGuardInstalled = true;
      window.addEventListener('resize', () => {
        const slots = window._hemmaNPSlotState || {};
        for (const key of Object.keys(slots)) {
          const s = slots[key];
          try { s._npChipAnim?.cancel(); } catch (e) {}
          try { s._npShiftAnim?.cancel(); } catch (e) {}
        }
      });
    }

    if (typeof window._hemmaNPMobileRecheck !== 'function') {
      window._hemmaNPMobileRecheck = function (states) {
        const rowHost = window._hemmaNPMobileRowHostCache;
        if (!rowHost || !rowHost.isConnected) return;
        window._hemmaNPSyncMobileRow({ getRootNode: () => ({ host: rowHost }) }, states);
      };
    }

    if (typeof window._hemmaNPDesktopSettle !== 'function') {
      window._hemmaNPDesktopSettle = function (states, V) {
        const DEPART_HOLD_MS = 500;

        const raw = window._hemmaNP(states, V);
        const rawByKey = new Map(raw.map(r => [r.key, r]));
        const rawKeys = raw.map(r => r.key);

        const state = window._hemmaNPDesktopState = window._hemmaNPDesktopState || { keys: {} };

        for (const key of rawKeys) {
          const k = state.keys[key] = state.keys[key] || {};
          k.lastRecord = rawByKey.get(key);
          k.departedAt = null;
        }

        // Every source gets the same short departure hold, just so its exit
        // animation has content to animate away with.
        let anyPending = false;
        for (const key of Object.keys(state.keys)) {
          if (rawByKey.has(key)) continue;
          const k = state.keys[key];
          if (!k.departedAt) k.departedAt = Date.now();
          if (Date.now() - k.departedAt >= DEPART_HOLD_MS) { delete state.keys[key]; continue; }
          anyPending = true;
        }

        const departingKeys = Object.keys(state.keys).filter(k => !rawByKey.has(k));
        const orderedKeys = rawKeys.concat(departingKeys);

        for (const key of rawKeys) {
          if (rawByKey.get(key)?.state === 'paused') { anyPending = true; break; }
        }

        return { list: orderedKeys.map(k => state.keys[k].lastRecord), pending: anyPending };
      };
    }

    if (typeof window._hemmaNP !== 'function') {
      window._hemmaNP = function (states, V) {
        const artSig = (u) => String(u || '').split('?')[0];
        const parts = [];
        for (let i = 1; i <= 10; i++) {
          const e = V['show_media_player_' + i] && V['media_player_' + i];
          if (e) {
            const s = states[e]; const a = s?.attributes || {};
            parts.push(e + s?.state + (a.media_title || '') + (a.media_position || '') +
              artSig(a.entity_picture || a.media_image_url || a.media_album_cover_url || a.image_url));
          }
        }
        for (let i = 1; i <= 2; i++) {
          const t = V['show_plex_' + i] && V['plex_stream_' + i];
          if (t) {
            const ta = states[t]?.attributes || {};
            parts.push(t + states[t]?.state + String(ta.full_title || '') +
              String((states[t.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli')]?.state) || states[t]?.state || '') +
              artSig(ta.image_url || ta.entity_picture_local || ta.entity_picture || ta.media_image_url));
          }
          const p = V['show_psn_' + i] && V['psn_' + i];
          if (p) {
            const pa = states[p]?.attributes || {};
            parts.push(p + states[p]?.state + (pa.full_title || '') +
              artSig(pa.entity_picture_local || pa.entity_picture || pa.image_url || pa.media_image_url));
          }
        }
        if (V.show_discord_steam) {
          const ia = (V.discord_steam_image && states[V.discord_steam_image]?.attributes) || {};
          parts.push(String(states[V.discord_steam_online]?.state) + String(states[V.discord_steam_game]?.state) +
            artSig(ia.entity_picture_local || ia.entity_picture || ia.image_url));
        }
        parts.push('pin:' + String(V.pinned_key || ''));
        const sig = parts.join('|');
        const c = window._hemmaNPCache;
        if (c && c.sig === sig) return c.list;
        const list = window._hemmaNPSources(states, V);
        window._hemmaNPCache = { sig, list };

        const prevKeys = window._hemmaNPKeys || [];
        const newKeys = list.map(x => x.key);
        if (prevKeys.length && prevKeys[0] && newKeys[0] !== prevKeys[0]) {
          const idx = newKeys.indexOf(prevKeys[0]);
          if (idx > 0) window._hemmaNPDemoted = { key: prevKeys[0], at: Date.now() };
        }
        window._hemmaNPKeys = newKeys;

        return list;
      };
    }

    // ── Plex session popup ─────────────────────────────────────────────────
    if (typeof window._hemmaPlexPopupCard !== 'function') {
      window._hemmaPlexPopupCard = function (sid, states) {
        const resolveTau = (id) => {
          if (!id) return null;
          const indexed = id.replace(/^(sensor\.)plex_stream_(\d+)$/, '$1plex_session_$2_tautulli');
          if (indexed !== id && states[indexed]) return indexed;
          const want = String(states[id]?.attributes?.full_title || '').trim();
          if (!want) return null;
          for (let n = 1; n <= 8; n++) {
            const cand = 'sensor.plex_session_' + n + '_tautulli';
            const ca = states[cand]?.attributes;
            if (ca && String(ca.full_title || '').trim() === want) return cand;
          }
          return null;
        };
        const tauEntity = resolveTau(sid) || sid || '';

        const a = states[tauEntity]?.attributes || {};

        /* Poster */
        const esc = (s) => String(s ?? '')
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

        const resolveUrl = (raw) => {
          if (!raw) return null;
          const s = String(raw);
          return s.startsWith('/') ? location.origin + s : s;
        };

        const posterUrl = resolveUrl(a.image_url);

        const posterHtml = posterUrl
          ? '<div style="position:relative;width:90px;height:135px;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.32);">'
              + '<img src="' + esc(posterUrl) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block;" />'
              + '<div style="position:absolute;inset:0;border-radius:12px;pointer-events:none;'
                + 'box-shadow:var(--hemma-media-poster-highlight, inset 0 1px 1px -0.5px rgba(255,255,255,0.15), inset 0 -1px 1px -0.5px rgba(255,255,255,0.05));'
                + 'background:var(--hemma-media-poster-glow-top, linear-gradient(to bottom, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.12) 10%, rgba(255,255,255,0) 38%)), '
                + 'var(--hemma-media-poster-glow-bottom, linear-gradient(to top, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.07) 10%, rgba(255,255,255,0) 35%));"></div>'
            + '</div>'
          : '<div style="width:90px;height:135px;background:rgba(255,255,255,0.07);border-radius:12px;display:flex;align-items:center;justify-content:center;"><ha-icon icon="mdi:plex" style="--mdc-icon-size:32px;color:rgba(255,255,255,0.35);"></ha-icon></div>';

        const padTop = 24;
        const padBottom = 14;

        /* Card */
        const mainCard = {
          type: 'custom:button-card',
          entity: sid || tauEntity,
          tap_action: { action: 'none' },
          show_icon: false, show_name: false, show_label: false, show_state: false,
          variables: {
            tau_entity: tauEntity,
            pad_top: padTop,
            pad_bottom: padBottom,
          },
          styles: {
            card: [
              { border: 'none' },
              { 'box-shadow': 'none' },
              { padding: '0' },
              { '--ha-card-box-shadow': 'none' },
              { '--ha-card-border-color': 'transparent' },
            ],
            grid: [
              { 'grid-template-areas': '"c"' },
              { 'grid-template-columns': '1fr' },
            ],
            custom_fields: {
              poster: [
                { position: 'absolute' },
                { top: padTop + 'px' },
                { left: '28px' },
                { 'z-index': '2' },
              ],
              c: [{ 'justify-self': 'stretch' }],
            },
          },
          extra_styles: `[[[
            const tauEid = variables?.tau_entity || entity?.entity_id || '';
            const a = states[tauEid]?.attributes || entity?.attributes || {};
            const progress = Math.min(100, Math.max(0, parseFloat(a.progress_percent || '0') || 0));
            const remSecs = (() => {
              const t = String(a.stream_remaining || '');
              if (!t) return 0;
              const p = t.split(':').map(Number);
              return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2] : p.length === 2 ? p[0]*60 + p[1] : 0;
            })();
            const isPlaying = (states[tauEid]?.state || '').toLowerCase() === 'playing';
            const totalSecs = (progress > 0 && progress < 100 && remSecs > 0)
              ? remSecs / (1 - progress / 100) : 0;
            const elapsedSecs = Math.max(0, totalSecs - remSecs);
            const animPart = (isPlaying && totalSecs > 0)
              ? \`animation: plexProgressFill \${totalSecs.toFixed(1)}s linear -\${elapsedSecs.toFixed(1)}s forwards;\`
              : '';
            return \`
              @keyframes plexProgressFill {
                from { width: 0%; }
                to { width: 100%; }
              }
              #plex-prog-fill { \${animPart} }
              :host {
                --ha-card-box-shadow: none !important;
                --button-card-box-shadow: none !important;
                --button-card-box-shadow-hover: none !important;
                --button-card-padding: 0px;
                overflow: visible !important;
              }
              ha-card {
                --ha-card-background: transparent !important;
                --card-background-color: transparent !important;
                --ha-card-box-shadow: none !important;
                --ha-card-border-color: transparent !important;
                overflow: visible !important;
                background: transparent !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                cursor: default !important;
                position: relative !important;
                padding: 0 !important;
              }
              #container {
                padding: 0 !important;
                text-align: left !important;
                position: relative !important;
                z-index: 2 !important;
                overflow: visible !important;
              }
              /* button-card's .ellipsis class clips every custom_field tightly
               * to content, which cuts the poster's corner anti-aliasing and
               * shadow. Override #poster only — text truncation elsewhere still
               * relies on the shared class. */
              #poster { overflow: visible !important; }
              ha-ripple { display: none !important; }
              ha-card:hover { box-shadow: none !important; }
            \`;
          ]]]`,
          custom_fields: {
            poster: posterHtml,
            c: `[[[
              /* Resolution */
              const tauEid = variables?.tau_entity || entity?.entity_id || '';
              const a = states[tauEid]?.attributes || entity?.attributes || {};

              /* Helpers */
              const esc = (s) => String(s ?? '')
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

              /* Media Data */
              const mediaType = (a.media_type || '').toLowerCase();
              const isEpisode = mediaType === 'episode';
              const showTitle = isEpisode
                ? (a.grandparent_title || a.full_title || 'Unknown')
                : (a.title || a.full_title || 'Unknown');
              const episodeTitle = isEpisode ? (a.title || '') : '';
              const seasonEpisode = isEpisode
                ? 'S' + (a.parent_media_index || '?') + ' · E' + (a.media_index || '?')
                : (a.year ? String(a.year) : '');

              const progress = Math.min(100, Math.max(0, parseFloat(a.progress_percent || '0') || 0));

              const remSecs = (() => {
                const t = String(a.stream_remaining || '');
                if (!t) return null;
                const p = t.split(':').map(Number);
                return p.length === 3 ? p[0]*3600 + p[1]*60 + p[2]
                     : p.length === 2 ? p[0]*60 + p[1] : null;
              })();
              const timeLeft = (remSecs == null || remSecs <= 0) ? ''
                : remSecs < 90   ? 'Less than 1 min left'
                : remSecs < 3600 ? Math.floor(remSecs/60) + ' min left'
                : Math.floor(remSecs/3600) + ' hr ' + Math.floor((remSecs%3600)/60) + ' min left';

              /* Video / Audio Formatting */
              const fmtVCodec = (c) => {
                const m = {h264:'H.264',hevc:'H.265',h265:'H.265',av1:'AV1',vp9:'VP9',vc1:'VC1',mpeg4:'MPEG-4',mpeg2video:'MPEG-2'};
                return m[(c||'').toLowerCase()] || (c||'').toUpperCase();
              };
              const fmtACodec = (c) => {
                const m = {dts:'DTS',dca:'DTS','dts-hd ma':'DTS-HD MA','dts-hd':'DTS-HD',eac3:'EAC3','e-ac-3':'EAC3',ac3:'AC3',aac:'AAC',mp3:'MP3',truehd:'TrueHD',flac:'FLAC',opus:'Opus',pcm:'PCM'};
                return m[(c||'').toLowerCase()] || (c||'').toUpperCase();
              };
              const fmtCh = (l) => {
                const m = {'7.1':'7.1','5.1':'5.1','5.1(side)':'5.1','5.1(back)':'5.1',stereo:'Stereo','2.0':'Stereo',mono:'Mono','1.0':'Mono'};
                return m[(l||'').toLowerCase()] || l || '';
              };
              const fmtRes = (r) => { const m = {'4k':'4K','8k':'8K','2k':'2K'}; return m[(r||'').trim().toLowerCase()] || (r||''); };
              const fmtVideoDR = (dr) => {
                const d = (dr||'').toLowerCase();
                if (!d) return '';
                if (d.includes('dolby vision') && d.includes('hdr10+')) return 'Dolby Vision · HDR10+';
                if (d.includes('dolby vision') && d.includes('hdr10')) return 'Dolby Vision · HDR10';
                if (d.includes('dolby vision')) return 'Dolby Vision';
                if (d.includes('hdr10+')) return 'HDR10+';
                if (d.includes('hdr10')) return 'HDR10';
                if (d.includes('hdr')) return 'HDR';
                if (d === 'sdr') return 'SDR';
                return '';
              };
              const fmtAudioExtra = (prof) => {
                const p = (prof||'').toLowerCase();
                if (!p) return '';
                if (p.includes('atmos')) return 'Dolby Atmos';
                if (p.includes('truehd')) return 'TrueHD';
                if (p.includes('dts:x') || p.includes('dts-x')) return 'DTS:X';
                if (p.includes('auro-3d')) return 'Auro-3D';
                return '';
              };

              const videoRes = fmtRes(a.stream_video_full_resolution || (a.video_resolution ? a.video_resolution+'p' : ''));
              const videoCodec = fmtVCodec(a.stream_video_codec || a.video_codec || '');
              const vBrKbps = parseInt(a.stream_video_bitrate || '0');
              const videoBitrate = vBrKbps > 0 ? (vBrKbps >= 1000 ? (vBrKbps/1000).toFixed(1)+' Mbps' : vBrKbps+' Kbps') : '';
              const videoDR = fmtVideoDR(a.stream_video_dynamic_range || a.video_dynamic_range || '');
              const hasDV = videoDR.startsWith('Dolby Vision');
              const videoDVExtra = hasDV ? 'Dolby Vision' : '';
              const videoDRLine = hasDV ? videoDR.replace('Dolby Vision · ', '').replace('Dolby Vision', '').trim() : videoDR;
              const videoStr = [videoRes, videoDRLine, videoCodec].filter(Boolean).join(' · ');

              const audioLang = a.stream_audio_language || a.audio_language || '';
              const audioCodec = fmtACodec(a.stream_audio_codec || a.audio_codec || '');
              const audioCh = fmtCh(a.stream_audio_channel_layout || a.audio_channel_layout || '');
              const audioStr = [audioLang, audioCodec, audioCh].filter(Boolean).join(' · ');
              const audioExtra = fmtAudioExtra(a.audio_profile || '');

              /* Stream Quality */
              const qualityProfile = a.quality_profile || '';
              const streamBrKbps = parseInt(a.stream_bitrate || a.bitrate || '0');
              const streamBrStr = streamBrKbps > 0
                ? (streamBrKbps >= 1000 ? (streamBrKbps/1000).toFixed(1)+' Mbps' : streamBrKbps+' Kbps')
                : '';

              /* Connection. lan/wan is the fact that decides whether a stream
               * costs the server any upstream at all, which no bitrate figure
               * tells you — and Quality already carries this stream's bitrate,
               * so a second Mbps number here would only have been noise.
               *
               * One line, no sub-line, so all four tiles are the same shape.
               * ip_address is no longer part of hasConn: without location or the
               * local flag an address alone cannot tell lan from wan. Geo goes to
               * the tooltip rather than being dropped — and only for remote
               * sessions, since Tautulli derives it from the PUBLIC ip even on a
               * lan one, which would have a local stream claiming a city it is
               * not streaming from. */
              const locRaw = String(a.location || '').toLowerCase();
              const hasConn = !!(locRaw || a.local != null);
              const isLocal = locRaw ? locRaw === 'lan' : String(a.local ?? '') === '1';
              const relayed = String(a.relayed ?? '') === '1' || String(a.relay ?? '') === '1';
              const playerStr = String(a.player || a.device || a.platform || '').trim();
              const connValue = [
                hasConn ? (isLocal ? 'Local' : 'Remote') : '',
                playerStr,
              ].filter(Boolean).join(' · ');
              const connHint = [
                (hasConn && !isLocal)
                  ? ([a.geo_city || '', a.geo_region || ''].filter(Boolean).join(', ')
                     || String(a.geo_country || ''))
                  : '',
                relayed ? 'Proxied by Plex Relay rather than served directly' : '',
              ].filter(Boolean).join(' — ');

              /* Doubled backslashes, and it has to stay that way: this whole
               * block is a template literal in hemma-core.js, so the JS engine
               * consumes escapes BEFORE button-card evals the string. A single
               * \\s arrives as a bare s and the regex silently matches the wrong
               * thing; a single \\/ inside a regex arrives as / and closes it
               * early, which is a SyntaxError surfacing as
               * ButtonCardJSTemplateError with no line number. */
              const decisionLabel = (raw) => raw === 'direct play' ? 'Direct Play'
                : raw === 'direct stream' || raw === 'copy' ? 'Direct Stream'
                : raw === 'transcode' ? 'Transcode'
                : raw ? raw.replace(/(^|\\s)\\S/g, c => c.toUpperCase()) : '';
              const decisionColor = (raw) => raw === 'direct play'
                ? 'var(--hemma-popup-primary-color,#00c3d0)'
                : raw === 'direct stream' || raw === 'copy'
                ? 'var(--hemma-popup-yellow-color,#ffd600)'
                : raw === 'transcode' ? 'var(--hemma-popup-orange-color,#ff9230)'
                : 'rgba(255,255,255,0.4)';

              /* Transcode Chips — Video */
              const tdRaw = (a.transcode_decision || a.stream_video_decision || '').toLowerCase();
              const tdLabel = decisionLabel(tdRaw);
              const tdColor = decisionColor(tdRaw);

              /* Transcode Chips — Audio */
              const adRaw = (a.stream_audio_decision || a.audio_decision || '').toLowerCase();
              const adLabel = decisionLabel(adRaw);
              const adColor = decisionColor(adRaw);

              /* Playback state. An indicator, not a control — a Plex session
               * exposes no transport, so this must not grow into anything that
               * looks tappable.
               *
               * 14px, not the 13px of the text beside it: these glyphs only fill
               * ~15 of the viewBox's 24 units vertically, so at a nominal 13px
               * their ink is ~8px against the text's ~9.2px cap height and the
               * triangle reads weedy. 14px lands the ink on the cap height.
               * Alpha is a shade above the text's 0.5 for the same reason — a
               * thin triangle carries less mass than a letterform at equal
               * alpha. Both are optical corrections; matching the numbers is
               * what looked wrong. */
              const rawState = (states[tauEid]?.state || entity?.state || '').toLowerCase();
              const svgGlyph = (inner) => '<svg width="14" height="14" viewBox="0 0 24 24" style="flex-shrink:0;display:block;fill:rgba(255,255,255,0.58);">' + inner + '</svg>';
              const stateIconHtml = rawState === 'playing'   ? svgGlyph('<path d="M8.2 4.6a1.2 1.2 0 0 0-1.85 1.01v12.78A1.2 1.2 0 0 0 8.2 19.4l10.1-6.39a1.2 1.2 0 0 0 0-2.02L8.2 4.6z"/>')
                : rawState === 'paused'     ? svgGlyph('<rect x="6" y="4.5" width="4.2" height="15" rx="1.7"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.7"/>')
                : rawState === 'buffering'  ? svgGlyph('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>')
                : rawState === 'stopped'    ? svgGlyph('<rect x="6" y="6" width="12" height="12" rx="2.4"/>')
                : '';

              /* User. The device tooltip only earns its keep when device and
               * player actually differ ("Apple TV → Living Room") — the player
               * is on the Connection tile now, so when they match, as they do on
               * a phone, this was just "iPhone → iPhone". */
              const userName = a.user_friendly_name || a.user || '';
              const userThumb = a.user_thumb || '';
              const devName = String(a.device || '').trim();
              const deviceStr = (devName && devName !== playerStr)
                ? [devName, playerStr].filter(Boolean).join(' → ')
                : '';

              /* HTML Fragments */
              /* Rounded square rather than a circle, so the avatar matches the
               * poster beside it. The rim is an inset box-shadow — a border
               * would pull the background-image away from the rounded edge. */
              const thumbUrl = userThumb.replace(/[()'" ]/g, encodeURIComponent);
              const avatarHtml = userThumb
                ? '<div style="width:28px;height:28px;border-radius:20%;flex-shrink:0;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14);background:rgba(255,255,255,0.1) url(' + thumbUrl + ') center/cover no-repeat;"></div>'
                : '<div style="width:28px;height:28px;border-radius:20%;background:rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14);"><ha-icon icon="mdi:account" style="--mdc-icon-size:16px;width:16px;height:16px;color:rgba(255,255,255,0.45);"></ha-icon></div>';

              const userBlock = (userName || userThumb)
                ? '<div style="display:flex;align-items:center;gap:9px;flex-shrink:0;"'
                    + (deviceStr ? ' title="' + esc(deviceStr) + '"' : '') + '>'
                    + (userName ? '<span style="font-size:13px;font-weight:500;letter-spacing:-0.08px;color:rgba(255,255,255,0.72);white-space:nowrap;">' + esc(userName) + '</span>' : '')
                    + avatarHtml
                  + '</div>'
                : '';

              /* Type scale */
              const fsTitle = 'clamp(18px, 4.6vw, 20px)';
              const fsMeta = '14px';
              const fsValue = '15px';
              const fsCaption = '13px';

              const tilePrimary = 'var(--hemma-popup-tiles-text-primary, rgba(255,255,255,0.95))';
              const tileSecondary = 'var(--hemma-popup-tiles-text-secondary, rgba(255,255,255,0.75))';
              const tileMuted = 'var(--hemma-popup-tiles-text-muted, rgba(255,255,255,0.52))';

              /* Glass tiles */
              const tileStyle = 'display:flex;flex-direction:column;box-sizing:border-box;'
                + 'flex:1 1 calc(50% - 4px);min-width:min(100%, 220px);'
                + 'padding:18px 18px 16px 18px;border-radius:24px;'
                + 'background:var(--hemma-popup-tiles-fill, rgba(255,255,255,0.08));'
                + 'box-shadow:inset 0 1px 0.5px -0.5px rgba(255,255,255,var(--hemma-popup-tiles-glow-top-tight,0.24)),'
                + 'inset 0 -1px 0.5px -0.5px rgba(255,255,255,var(--hemma-popup-tiles-glow-bottom-tight,0.10)),'
                + 'inset 0 3px 6px -3px rgba(255,255,255,var(--hemma-popup-tiles-glow-top-soft,0.15)),'
                + 'inset 0 -3px 6px -3px rgba(255,255,255,var(--hemma-popup-tiles-glow-bottom-soft,0.07));';

              const tileHead = (icon, label, status, statusColor) =>
                '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;">'
                  + '<div style="display:flex;align-items:center;gap:7px;min-width:0;">'
                    + '<ha-icon icon="' + icon + '" style="--mdc-icon-size:14px;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:' + tileMuted + ';"></ha-icon>'
                    + '<span style="font-size:' + fsCaption + ';font-weight:400;letter-spacing:-0.01em;white-space:nowrap;color:' + tileSecondary + ';">' + esc(label) + '</span>'
                  + '</div>'
                  + (status ? '<span style="font-size:' + fsCaption + ';font-weight:500;letter-spacing:-0.01em;white-space:nowrap;color:' + statusColor + ';">' + esc(status) + '</span>' : '')
                + '</div>';

              const tileValue = (text) =>
                '<span style="font-size:' + fsValue + ';font-weight:500;line-height:1.35;letter-spacing:-0.2px;color:' + tilePrimary + ';">' + esc(text) + '</span>';

              const tileSub = (text) => text
                ? '<span style="font-size:' + fsCaption + ';font-weight:400;line-height:1.3;margin-top:4px;color:' + tileMuted + ';">' + esc(text) + '</span>'
                : '';

              const videoTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:movie-open-outline', 'Video', tdLabel, tdColor)
                + tileValue(videoStr || '—')
                + tileSub(videoDVExtra)
              + '</div>';

              const audioTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:volume-high', 'Audio', adLabel, adColor)
                + tileValue(audioStr || '—')
                + tileSub(audioExtra)
              + '</div>';

              const qualityTile = '<div style="' + tileStyle + '">'
                + tileHead('mdi:quality-high', 'Quality', '', '')
                + tileValue([qualityProfile, streamBrStr].filter(Boolean).join(' · ') || '—')
              + '</div>';

              /* Relay gets the status slot rather than a line of its own — it is
               * the same kind of fact as Transcode, and worth the orange: a
               * relayed stream is proxied by Plex instead of coming from the
               * server directly, and is bandwidth-capped. */
              const connectionTile = '<div style="' + tileStyle + '"'
                  + (connHint ? ' title="' + esc(connHint) + '"' : '') + '>'
                + tileHead(isLocal ? 'mdi:lan-connect' : 'mdi:earth', 'Connection',
                    relayed ? 'Relayed' : '', 'var(--hemma-popup-orange-color,#ff9230)')
                + tileValue(connValue || '—')
              + '</div>';

              /* Scrubber */
              const progressHtml = '<div style="margin-top:14px;height:4px;border-radius:999px;overflow:hidden;background:var(--hemma-popup-progress-track, rgba(255,255,255,0.16));">'
                + '<div id="plex-prog-fill" style="height:100%;width:' + progress.toFixed(1) + '%;border-radius:999px;background:linear-gradient(90deg,#D28512,#e5a00d 55%,#F2BC1A);"></div>'
              + '</div>';

              /* Keep every line single-line: the poster is pinned 50px from the
               * top while this column centres against a 135px spacer, so a
               * taller column slides out from under it. */
              return '<div style="text-align:left;position:relative;">'
                + '<div style="padding:' + (variables?.pad_top ?? 24) + 'px 28px 26px 28px;display:flex;align-items:center;gap:20px;">'
                  + '<div style="width:90px;height:135px;flex-shrink:0;"></div>'
                  + '<div style="display:flex;flex-direction:column;min-width:0;flex:1;text-align:left;">'
                    + '<div style="display:flex;align-items:center;gap:16px;">'
                      + '<div style="flex:1;min-width:0;font-size:' + fsTitle + ';font-weight:700;letter-spacing:-0.4px;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(showTitle) + '</div>'
                      + userBlock
                    + '</div>'
                    + (episodeTitle ? '<div style="font-size:' + fsMeta + ';font-weight:500;letter-spacing:-0.2px;color:rgba(255,255,255,0.8);line-height:1.35;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(episodeTitle) + '</div>' : '')
                    + (seasonEpisode ? '<div style="font-size:' + fsMeta + ';font-weight:400;letter-spacing:-0.2px;color:rgba(255,255,255,0.5);line-height:1.35;margin-top:3px;">' + esc(seasonEpisode) + '</div>' : '')
                    + progressHtml
                    + (timeLeft ? '<div style="display:flex;align-items:center;gap:6px;margin-top:9px;">'
                        + stateIconHtml
                        + '<span style="font-size:' + fsCaption + ';font-weight:400;letter-spacing:-0.08px;color:rgba(255,255,255,0.5);">' + esc(timeLeft) + '</span>'
                      + '</div>' : '')
                  + '</div>'
                + '</div>'
                + '<div style="padding:0 28px ' + (variables?.pad_bottom ?? 14) + 'px 28px;display:flex;flex-wrap:wrap;gap:8px;align-items:stretch;">'
                  + videoTile
                  + audioTile
                  + qualityTile
                  + connectionTile
                + '</div>'
              + '</div>';
            ]]]`,
          },
        };

        return mainCard;
      };
    }
})();

// ── Mobile wallpaper ─────────────────────────────────────────────────────────
(function () {
  // Same breakpoints the card templates use for "mobile": narrow (phone
  // portrait) OR short (phone landscape / very short windows).
  const MOBILE_MQ = window.matchMedia('(max-width: 767px), (max-height: 500px)');
  const MOBILE_RE = /^\/dashboard-hemma-mobile(\/|$)/;
  // Build marker. Read --hemma-wallpaper-js in the console: if it is missing, an
  // OLD cached script is serving this module and the theme's fallback literals
  // are painting instead of sampled colours — silently, because the fallbacks are
  // valid CSS. Lovelace resources are version-pinned per file (`?v=`), so moving
  // code between files means BOTH files' pins have to be bumped. This module used
  // to live in hemma-redirect.js; bumping only one of the two leaves either a
  // stale copy running or no copy at all.
  const WALLPAPER_JS = 3;
  // Refuse to run twice. A stale hemma-redirect.js still ships its own copy of
  // this module, and two of them would both publish variables and both paint
  // <html>.
  if ((window.__hemmaWallpaperJs || 0) >= WALLPAPER_JS) return;
  window.__hemmaWallpaperJs = WALLPAPER_JS;
  try {
    document.documentElement.style.setProperty(
      '--hemma-wallpaper-js', String(WALLPAPER_JS));
  } catch (e) {}

  // Phone landscape. MOBILE_MQ cannot stand in for this: 393x852 and 852x393
  // both satisfy it, so it never fires on rotation.
  const LANDSCAPE_MQ = window.matchMedia('(orientation: landscape) and (max-height: 500px)');

  // ── Background injection ─────────────────────────────────────────────────────

  const SAFE = 'env(safe-area-inset-top, 0px)';
  const off = (v) => `calc(${v} + ${SAFE})`;

  const BG = {
    image:
      'linear-gradient(to bottom,'
      + ' var(--hemma-mobile-hero-tint-top, rgba(170,170,170,0.30)) 0%,'
      + ' var(--hemma-mobile-hero-tint-bot, rgba(170,170,170,0.12))'
      + ` ${off('var(--hemma-mobile-hero-wash-mid, 34%)')},`
      + ` transparent ${off('var(--hemma-mobile-hero-wash-end, 70%)')}),`
      // The mesh has to be here too, in the same order as the card's ::before.
      // Without it <html> paints a clean wash+gradient and the card then adds the
      // mesh on top a beat later, so the wallpaper visibly changes at the exact
      // moment the cards appear.
      + ' radial-gradient('
      + ' var(--hemma-mobile-hero-mesh-a-size, 120% 46%) at'
      + ' var(--hemma-mobile-hero-mesh-a-pos, 18% 58%),'
      + ' var(--hemma-mobile-hero-mesh-a, transparent) 0%,'
      + ' transparent 72%),'
      + ' radial-gradient('
      + ' var(--hemma-mobile-hero-mesh-b-size, 130% 50%) at'
      + ' var(--hemma-mobile-hero-mesh-b-pos, 88% 92%),'
      + ' var(--hemma-mobile-hero-mesh-b, transparent) 0%,'
      + ' transparent 70%),'
      + ' linear-gradient(var(--hemma-mobile-hero-angle, 190deg),'
      + ` transparent ${off('var(--hemma-mobile-hero-fade-start, 0%)')},`
      + ' var(--hemma-mobile-hero-c-handoff, #967f67)'
      + ` ${off('var(--hemma-mobile-hero-p-handoff, 33%)')},`
      + ' var(--hemma-mobile-hero-c-upper, #7e6d59)'
      + ` ${off('var(--hemma-mobile-hero-p-upper, 43%)')},`
      + ' var(--hemma-mobile-hero-c-mid, #685a4b)'
      + ` ${off('var(--hemma-mobile-hero-p-mid, 63%)')},`
      + ' var(--hemma-mobile-hero-c-lower, #51473d)'
      + ` ${off('var(--hemma-mobile-hero-p-lower, 83%)')},`
      + ' var(--hemma-mobile-hero-c-base, #3b352e)'
      + ` ${off('var(--hemma-mobile-hero-p-base, 100%)')}),`
      + ' var(--hemma-mobile-hero-img, url("/local/hemma/rooms/home-demo.jpg"))',
    // Portrait sizes the photo by HEIGHT so the join sits in the same place on
    // every phone. Landscape cannot: 28% of a short viewport is a photo only a
    // quarter of the screen wide, a strip down the middle. There it goes
    // width-driven, matching the card's own landscape media query.
    sizePortrait: '100% 100%, 100% 100%, 100% 100%, 100% 100%, auto '
      + off('var(--hemma-mobile-hero-height, 36.5%)'),
    sizeLandscape: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% auto',
    position: '0 0, 0 0, 0 0, 0 0, '
      + 'var(--hemma-mobile-hero-x, 50%) var(--hemma-mobile-hero-y, 0%)',
    color: 'var(--hemma-mobile-hero-floor, #3b352e)',
  };

  function applyHtmlBackground() {
    if (!MOBILE_MQ.matches) return;
    const h = document.documentElement;
    if (!MOBILE_RE.test(window.location.pathname)) {
      h.style.backgroundImage = 'none';
      h.style.backgroundColor = 'var(--primary-background-color, #0d1117)';
      return;
    }
    h.style.backgroundImage    = BG.image;
    // Read at paint time, not captured once: applyHtmlBackground re-runs on the
    // media query's own change event, so rotating the phone repaints rather than
    // keeping a stale snapshot.
    h.style.backgroundSize     = LANDSCAPE_MQ.matches ? BG.sizeLandscape : BG.sizePortrait;
    h.style.backgroundPosition = BG.position;
    h.style.backgroundRepeat   = 'no-repeat';
    h.style.backgroundColor    = BG.color;
  }

  // ── Gradient sampling ────────────────────────────────────────────────────────
  const SAMPLE_KEYS = ['handoff', 'upper', 'mid', 'lower', 'base'];
  // VERSIONED, and the version has to be bumped whenever the shape of what
  // paletteFrom returns changes. Without that, a palette cached before a field
  // existed is reused forever and the missing field silently falls through to the
  // theme's literal fallback — which looks like the feature never shipped. That
  // is exactly what happened when mesh colours were added: the key was unchanged,
  // so every browser kept serving a pre-mesh palette and painted the hand-tuned
  // fallbacks instead. localStorage also survives a hard refresh, so there is no
  // way for a user to clear it themselves.
  const CACHE_PREFIX = 'hemma-hero-sample:v2:';
  const CACHE_ROOT = 'hemma-hero-sample:';

  const CACHE_FIELDS = SAMPLE_KEYS.concat(['meshA', 'meshB']);

  // Drop entries from earlier cache versions so localStorage does not accumulate
  // a dead palette per version per photo.
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_ROOT) && !k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  const clamp8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const hex = (c) => '#' + c.map((v) => clamp8(v).toString(16).padStart(2, '0')).join('');
  const mute = (c, k) => { const l = lum(c); return c.map((v) => v + (l - v) * k); };
  // Set a colour's brightness while keeping its hue. Luminance is driven
  // separately from colour below, and this is the join between the two.
  const atLum = (c, target) => { const l = lum(c) || 1; return c.map((v) => v * target / l); };
  // Positive is warm (red side), negative cool (blue side). Crude next to a real
  // hue angle, but it only ever has to rank two colours against each other.
  const warmth = (c) => c[0] - c[2];

  function readVarUrl(name) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const m = raw && raw.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    return m ? m[1] : null;
  }

  function handoffRow() {
    const cs = getComputedStyle(document.documentElement);
    const pct = (name, dflt) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v / 100 : dflt;
    };
    const photoFrac = pct('--hemma-mobile-hero-height', 0.31);
    const pHandoff = pct('--hemma-mobile-hero-p-handoff', 0.30);
    if (!Number.isFinite(photoFrac) || photoFrac <= 0) return 0.85;
    return Math.max(0.05, Math.min(1, pHandoff / photoFrac));
  }

  function paletteFrom(img, slot) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return null;
    const w = 64, h = Math.max(8, Math.round(w * ih / iw));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    let data;
    // Tainted canvas throws here. /local/ is same-origin so it should not, but a
    // reverse proxy serving media off another host would.
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }

    const band = (y0, y1) => {
      const a = Math.max(0, Math.floor(y0 * h));
      const b = Math.min(h, Math.max(a + 1, Math.ceil(y1 * h)));
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = a; y < b; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;
        }
      }
      return n ? [r / n, g / n, bl / n] : [128, 128, 128];
    };

    const row = Math.min(handoffRow(), 0.92);
    const handoff = band(row - 0.06, row + 0.02);
    // The subject: the house fills the middle of a home photo.
    const body = band(0.30, 0.75);

    const cs = getComputedStyle(document.documentElement);
    const num = (name, dflt) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : dflt;
    };
    const lift = num('--hemma-mobile-hero-sample-lift', 0.86);
    const depth = num('--hemma-mobile-hero-sample-depth-' + slot, slot === 'night' ? 0.47 : 0.60);
    const muteTop = num('--hemma-mobile-hero-sample-mute-top', 0.41);
    const muteBase = num('--hemma-mobile-hero-sample-mute-base', 0.63);

    const anchor = (slot === 'night')
      ? (warmth(handoff) <= warmth(body) ? handoff : body)
      : (warmth(body) >= warmth(handoff) ? body : handoff);

    const lStart = lift * (lum(handoff) + lum(body)) / 2;
    const lEnd = Math.max(16, lStart * depth);

    let meshOut = null;

    // ── Mesh fields ──────────────────────────────────────────────────────
    const cell = (x0, x1, y0, y1) => {
      const a = Math.max(0, Math.floor(y0 * h)), b = Math.min(h, Math.ceil(y1 * h));
      const c = Math.max(0, Math.floor(x0 * w)), d = Math.min(w, Math.ceil(x1 * w));
      let r = 0, g = 0, bl = 0, n = 0;
      for (let y = a; y < b; y++) {
        for (let x = c; x < d; x++) {
          const i = (y * w + x) * 4;
          r += data[i]; g += data[i + 1]; bl += data[i + 2]; n++;
        }
      }
      return n ? [r / n, g / n, bl / n] : null;
    };
    const mTop = num('--hemma-mobile-hero-mesh-sample-top', 55) / 100;
    const mBot = num('--hemma-mobile-hero-mesh-sample-bottom', 94) / 100;
    const ROWS = 3, COLS = 6;
    const span = Math.max(0.01, (mBot - mTop) / ROWS);
    const cells = [];
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const c = cell(gx / COLS, (gx + 1) / COLS, mTop + gy * span, mTop + (gy + 1) * span);
        if (c) cells.push(c);
      }
    }
    if (cells.length >= 2) {
      cells.sort((p, q) => warmth(p) - warmth(q));
      const half = Math.max(1, Math.floor(cells.length / 2));
      const meanOf = (arr) => [0, 1, 2].map((i) =>
        arr.reduce((t, c) => t + c[i], 0) / arr.length);
      const cooler = meanOf(cells.slice(0, half));
      const warmer = meanOf(cells.slice(-half));

      const lMesh = lum(body) * num('--hemma-mobile-hero-mesh-lum', 0.95);
      const kMesh = num('--hemma-mobile-hero-mesh-mute', 0.45);
      const aA = num('--hemma-mobile-hero-mesh-a-alpha-' + slot, 0.46);
      const aB = num('--hemma-mobile-hero-mesh-b-alpha-' + slot, 0.42);
      const asRgba = (c, alpha) => {
        const v = mute(atLum(c, lMesh), kMesh).map(clamp8);
        return `rgba(${v[0]},${v[1]},${v[2]},${alpha})`;
      };
      meshOut = { a: asRgba(warmer, aA), b: asRgba(cooler, aB) };
    }

    const pal = {};
    if (meshOut) { pal.meshA = meshOut.a; pal.meshB = meshOut.b; }
    SAMPLE_KEYS.forEach((k, i) => {
      const t = i / (SAMPLE_KEYS.length - 1);
      pal[k] = hex(mute(atLum(anchor, lStart + (lEnd - lStart) * t),
                        muteTop + (muteBase - muteTop) * t));
    });
    return pal;
  }

  function publish(slot, pal) {
    if (!pal) return;
    const h = document.documentElement;
    SAMPLE_KEYS.forEach((k) => h.style.setProperty(`--hemma-sampled-${slot}-${k}`, pal[k]));
    if (pal.meshA) h.style.setProperty(`--hemma-sampled-${slot}-mesh-a`, pal.meshA);
    if (pal.meshB) h.style.setProperty(`--hemma-sampled-${slot}-mesh-b`, pal.meshB);
  }

  function sampleInto(slot, url) {
    if (!url) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const key = `${CACHE_PREFIX}${url}|${slot}|${handoffRow().toFixed(2)}`;
      let pal = null;
      try {
        const hit = JSON.parse(localStorage.getItem(key) || 'null');
        // Shape-checked as well as versioned. Either guard alone is one thing to
        // forget; together, a stale or partial entry just misses and recomputes.
        if (hit && CACHE_FIELDS.every((f) => typeof hit[f] === 'string')) pal = hit;
      } catch (e) {}
      if (!pal) {
        pal = paletteFrom(img, slot);
        try { if (pal) localStorage.setItem(key, JSON.stringify(pal)); } catch (e) {}
      }
      publish(slot, pal);
    };
    img.onerror = () => {};
    img.src = url;
  }

  let _sampledFor = null;
  function sampleWallpapers(attempt) {
    if (!MOBILE_MQ.matches) return;
    const day = readVarUrl('--hemma-mobile-hero-img-day');
    const night = readVarUrl('--hemma-mobile-hero-img-night');
    if (!day && !night) {
      if ((attempt || 0) < 20) setTimeout(() => sampleWallpapers((attempt || 0) + 1), 250);
      return;
    }
    const sig = `${day}|${night}|${handoffRow().toFixed(2)}`;
    if (sig === _sampledFor) return;
    _sampledFor = sig;
    sampleInto('day', day);
    sampleInto('night', night);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function init() {
    applyHtmlBackground();
    sampleWallpapers();
  }

  function waitForHA() {
    if (document.querySelector('home-assistant')) {
      init();
    } else {
      requestAnimationFrame(waitForHA);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHA);
  } else {
    waitForHA();
  }

  window.addEventListener('location-changed', () => setTimeout(applyHtmlBackground, 50), true);
  window.addEventListener('popstate', () => setTimeout(applyHtmlBackground, 50), true);
  MOBILE_MQ.addEventListener('change', () => { applyHtmlBackground(); sampleWallpapers(); });
  window.addEventListener('orientationchange', () => setTimeout(() => {
    applyHtmlBackground();
    sampleWallpapers();
  }, 120));
  LANDSCAPE_MQ.addEventListener('change', applyHtmlBackground);
  // The wallpaper is keyed on dark mode, so repaint when the OS flips it.
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', applyHtmlBackground);
})();

