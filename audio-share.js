/*
 * Audio Share: plays sound that someone sends from a computer (a browser tab, a mic, a mixer, or any app
 * through a virtual audio cable) to everyone in the world. A snippet for SideQuest / Banter.
 *
 *   <bs-snippet name="audio-share" script="https://YOUR-HOST/audio-share.js" position="x y z" ...>
 *
 * A small panel shows a code and an address. On a computer, open the address (share-audio.html, hosted
 * next to this file), type the code, pick the sound and press Play. The sound goes straight from that
 * computer to everyone in the room. Everyone has their own volume, and it fades with distance from the panel.
 */
(() => {
  const EL = document.querySelector('bs-snippet[name="audio-share"]') ||
    [...document.querySelectorAll("bs-snippet")].find((e) => /audio-share(\.min)?\.js(\?|$)/.test(e.getAttribute("script") || ""));
  if (!EL) return;
  const attr = (n, d) => { const v = EL.getAttribute(n); return v === null || v === "" ? d : v; };
  const num = (n, d, lo, hi) => { const v = parseFloat(attr(n, "")); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  const bool = (n, d) => { const v = String(attr(n, "")).toLowerCase(); return v === "true" ? true : v === "false" ? false : d; };
  const vec3 = (n, d) => { const a = String(attr(n, "")).trim().split(/\s+/).map(Number); return a.length === 3 && a.every(isFinite) ? a : d; };
  const POS = vec3("position", [0, 1.5, 2]), ROT = vec3("rotation", [0, 0, 0]);
  const WIDTH = num("width", 0.9, 0.3, 5);
  const KEY = String(attr("channel", "as")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 16) || "as";
  const startVol = num("volume", 60, 0, 100) / 100;
  const distanceVolume = bool("distance-volume", true);
  const fullAt = num("full-volume-distance", 6, 0, 500), silentAt = Math.max(fullAt + 0.5, num("silence-distance", 20, 0, 1000));
  const C = { bg: "rgba(24,22,30,0.96)", button: "#3a3646", accent: "#e0457b", ok: "#3ccf8e", text: "#ffffff", dim: "#b9b3c6", muted: "#77708a", code: "#211f29" };

  const SRC = (document.currentScript && document.currentScript.src) ||
    ([...document.scripts].map((s) => s.src).find((s) => /audio-share(\.min)?\.js/.test(s)) || "");
  const LISTENER = attr("listener", "") || (SRC ? new URL("listener.html", SRC).href : "");
  // The share page is also the folder's front page (index.html), so the address to type is just the folder
  const SHARE = attr("share-page", "") || (SRC ? new URL("./", SRC).href : "");
  if (!/^https?:/.test(LISTENER)) { console.warn("[Audio share] can't find listener.html; set the listener attribute"); return; }
  const shortAddr = SHARE.replace(/^https?:\/\//, "").replace(/\/(index\.html)?$/, "");
  // The code: the same for everyone, worked out from this snippet's own id in the world page (which every
  // visitor gets identically), so it can never differ between people. A "code" setting overrides it.
  const fixedCode = (() => {
    const pick = String(attr("code", "")).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (pick.length >= 4) return pick.slice(0, 8);
    const seed = (EL.getAttribute("instance") || (location.host + location.pathname)) + "|" + KEY;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let c = "";
    for (let i = 0; i < 5; i++) { c += A[h % A.length]; h = (Math.floor(h / A.length) ^ Math.imul(h, 2654435761)) >>> 0; }
    return c;
  })();

  window.addEventListener("bs-loaded", () => {
    const scene = BS.Scene.GetInstance();
    const J = (v) => JSON.stringify(v);
    let code = fixedCode, browser = null, loadedCode = fixedCode, state = "starting", refreshUi = () => {};
    const load = () => { if (browser && code && code !== loadedCode) { loadedCode = code; browser.url = LISTENER + "#code=" + code; } refreshUi(); };
    console.log("[Audio share] code " + code);
    setTimeout(load, 0);

    scene.On("unity-loaded", async () => {
      const anchor = new BS.GameObject({ name: "AudioShare", localPosition: new BS.Vector3(POS[0], POS[1], POS[2]),
                                         localEulerAngles: new BS.Vector3(ROT[0], ROT[1], ROT[2]) });

      // The (hidden) player sits just behind the middle of the panel: a browser's sound comes from where it is.
      const pObj = new BS.GameObject({ name: "AudioSharePlayer", parent: anchor, localPosition: new BS.Vector3(0, 0, 0.01),
                                       localScale: new BS.Vector3(0.004, 0.004, 0.004) });
      browser = await pObj.AddComponent(new BS.Browser({ url: LISTENER + "#code=" + code, pageWidth: 64, pageHeight: 64 }));
      try { browser.pageWidth = 64; browser.pageHeight = 64; browser.ToggleInteraction(false); } catch (e) {}
      pObj.On("browser-message", (e) => {
        let m; try { m = JSON.parse(e.detail); } catch (err) { return; }
        if (m && m.from === "as" && m.state !== state) { state = m.state; console.log("[Audio share] " + state); refreshUi(); }
      });
      load();

      // My volume x distance from the panel
      let myVolume = startVol, muted = false, factor = 1, sent = -1, sentAt = 0;
      scene.On("pose-update", (e) => {
        const hd = e.detail && e.detail.head; const h = hd && (hd.position || (hd.x !== undefined ? hd : null));
        if (!h || !distanceVolume) return;
        const d = Math.sqrt((h.x - POS[0]) ** 2 + (h.y - POS[1]) ** 2 + (h.z - POS[2]) ** 2);
        const v = Math.max(0, Math.min(1, 1 - (d - fullAt) / (silentAt - fullAt)));
        factor = v * v;
      });
      setInterval(() => {
        const want = muted ? 0 : Math.round(myVolume * factor * 100) / 100;
        if (Math.abs(want - sent) < 0.01 && Date.now() - sentAt < 2000) return;
        sent = want; sentAt = Date.now();
        try { browser.RunActions(J({ actions: [{ actionType: "runscript", strParam1: "window.__asVol&&window.__asVol(" + want + ")" }] })); } catch (e) {}
        try { browser.RunActions(J({ actions: [{ actionType: "postmessage", strParam1: J({ asvol: want }) }] })); } catch (e) {}
      }, 200);

      // ---------- The panel ----------
      const PW = 900, PH = 330, ps = WIDTH / (PW / 100);
      const panelObj = new BS.GameObject({ name: "AudioSharePanel", parent: anchor, localPosition: new BS.Vector3(0, 0, 0),
                                           localScale: new BS.Vector3(ps, ps, ps) });
      const ui = new BS.UI(new BS.Vector2(PW, PH));
      await panelObj.AddComponent(ui);
      ui.SetBackgroundColor(new BS.Vector4(0, 0, 0, 0));
      const box = (parent, st) => { const e = ui.CreateVisualElement(parent); if (st) e.SetStyles(st); return e; };
      const text = (parent, t, st) => { const e = ui.CreateLabel(t, parent);
        e.SetStyles(Object.assign({ color: C.text, fontSize: 22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, st || {})); return e; };
      const btn = (parent, t, f, st) => { const b = ui.CreateButtonWithText(t, "", parent);
        b.SetStyles(Object.assign({ height: 54, minWidth: 110, marginRight: 10, paddingLeft: 14, paddingRight: 14, fontSize: 21,
          color: C.text, backgroundColor: C.button, borderRadius: 27, borderWidth: 0 }, st || {})); b.OnClick(f); return b; };
      const root = box(null, { width: "100%", height: "100%", backgroundColor: C.bg, borderRadius: 24, padding: 22, flexDirection: "column" });

      // What's happening
      const top = box(root, { flexDirection: "row", alignItems: "center", marginBottom: 14 });
      const disc = box(top, { width: 64, height: 64, borderRadius: 32, backgroundColor: C.button, marginRight: 16, alignItems: "center", justifyContent: "center" });
      text(disc, "♪", { fontSize: 34, overflow: "visible" });
      const col = box(top, { flexDirection: "column", flexGrow: 1, flexShrink: 1, overflow: "hidden" });
      text(col, "SHARED AUDIO", { fontSize: 15, fontWeight: "bold", color: C.dim });
      const title = text(col, "", { fontSize: 28, fontWeight: "bold" });

      // How to play sound here
      const how = box(root, { flexDirection: "row", alignItems: "center", marginBottom: 16 });
      const howCol = box(how, { flexDirection: "column", flexGrow: 1, flexShrink: 1, overflow: "hidden", marginRight: 12 });
      text(howCol, "To play sound here, open", { fontSize: 18, color: C.dim });
      text(howCol, shortAddr, { fontSize: 19 });
      const codeBox = box(how, { flexDirection: "column", alignItems: "center", backgroundColor: C.code, borderRadius: 14, paddingLeft: 18, paddingRight: 18, paddingTop: 4, paddingBottom: 6 });
      text(codeBox, "CODE", { fontSize: 13, fontWeight: "bold", color: C.dim });
      const codeLabel = text(codeBox, "", { fontSize: 38, fontWeight: "bold", letterSpacing: 6, overflow: "visible" });

      // My volume
      const volRow = box(root, { flexDirection: "row", alignItems: "center" });
      const muteBtn = btn(volRow, "Mute", () => { muted = !muted; refreshUi(); });
      text(volRow, "My volume", { fontSize: 18, color: C.dim, marginRight: 10 });
      const vol = ui.CreateSlider(0, 100, volRow);
      vol.SetStyles({ flexGrow: 1 });
      vol.SetValue(Math.round(myVolume * 100));
      vol.OnChange((e) => { myVolume = Math.max(0, Math.min(1, Number(e.value) / 100)); muted = false; refreshUi(); });

      refreshUi = () => {
        const playing = state === "playing";
        try { title.text = playing ? "Playing from a computer" : state === "blocked" ? "Can't reach the computer playing" : state === "error" ? "Can't connect right now" : "Nothing playing"; } catch (e) {}
        try { disc.SetStyles({ backgroundColor: playing ? C.accent : C.button }); } catch (e) {}
        try { codeLabel.text = code || "…"; } catch (e) {}
        try { muteBtn.text = muted ? "Unmute" : "Mute"; } catch (e) {}
      };
      refreshUi();
    });
  });
})();
