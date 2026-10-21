/* Shared helpers for The Plus Side pages. */
const TPS = (() => {
  const SITE = {
    twitter: "TheePlusSide", // your X/Twitter handle without the @, e.g. "ThePlusSide"
  };
  const here = document.currentScript.dataset.page || "";
  const root = document.currentScript.dataset.root || "..";

  const cache = {};
  const load = (name) =>
    (cache[name] ||= fetch(`${root}/firstbasket/data/${name}.json`, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return r.json();
    }));

  const pct = (v, d = 0) => (v == null || isNaN(v) ? "–" : (v * 100).toFixed(d) + "%");
  const int = (v) => (v == null ? "–" : Number(v).toLocaleString("en-US"));
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : String(kid));
    return n;
  };
  const dateLabel = (iso, opts = { weekday: "long", month: "long", day: "numeric" }) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", opts);
  const time12 = (hhmm) => {
    if (!hhmm) return "";
    let [h, m] = hhmm.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap} ET`;
  };
  const playerLink = (id, name) => el("a", { href: `${root}/firstbasket/player.html?id=${encodeURIComponent(id)}`, text: name });

  function header() {
    const links = [
      ["today", "Today", `${root}/firstbasket/`],
      ["matchup", "Matchup", `${root}/firstbasket/matchup.html`],
      ["players", "Players", `${root}/firstbasket/players.html`],
      ["teams", "Teams", `${root}/firstbasket/teams.html`],
      ["about", "How it works", `${root}/firstbasket/about.html`],
    ];
    const bar = el("header", { class: "bar" },
      el("div", { class: "wrap" },
        el("a", { class: "brand", href: `${root}/` },
          el("span", { class: "mark", "aria-hidden": "true", text: "+" }),
          "The Plus Side",
          el("small", { text: "First Basket" })),
        el("nav", { class: "nav", "aria-label": "Main" },
          links.map(([k, label, href]) => el("a", { href, "aria-current": k === here ? "page" : null, text: label })))));
    document.body.prepend(bar);
  }

  function footer(updated) {
    const parts = [];
    if (updated) {
      const d = new Date(updated);
      parts.push(`Updated ${d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET`);
    }
    const f = el("footer", {},
      el("div", { class: "wrap" },
        el("span", {}, "Stats from NBA play-by-play. For entertainment; not betting advice." + (parts.length ? " · " + parts.join(" · ") : "")),
        SITE.twitter ? el("a", { href: `https://x.com/${SITE.twitter}`, text: `@${SITE.twitter} on X` }) : null));
    document.body.append(f);
  }

  // Sortable, searchable table renderer
  function table(tableEl, rows, cols, state, onSort) {
    const thead = tableEl.querySelector("thead") || tableEl.appendChild(el("thead"));
    const tbody = tableEl.querySelector("tbody") || tableEl.appendChild(el("tbody"));
    thead.replaceChildren(el("tr", {}, cols.map((c) => {
      const th = el("th", { class: c.left ? "l" : null, "aria-sort": state && state.k === c.k ? (state.dir > 0 ? "ascending" : "descending") : null });
      if (state) {
        const b = el("button", { class: "sort", type: "button", text: c.label });
        b.addEventListener("click", () => {
          if (state.k === c.k) state.dir = -state.dir;
          else { state.k = c.k; state.dir = c.text ? 1 : -1; }
          onSort();
        });
        th.append(b);
      } else th.textContent = c.label;
      return th;
    })));
    let sorted = rows;
    if (state) {
      const { k, dir } = state;
      sorted = rows.slice().sort((a, b) => {
        const x = a[k], y = b[k];
        const xn = x == null, yn = y == null;
        if (xn !== yn) return xn ? 1 : -1;
        if (typeof x === "number") return (x - y) * dir;
        return String(x).localeCompare(String(y)) * dir;
      });
    }
    tbody.replaceChildren(...sorted.map((r) => el("tr", {}, cols.map((c) => {
      const td = el("td", { class: c.left ? "l" : null });
      const v = c.render ? c.render(r) : r[c.k];
      td.append(v == null ? "–" : v.nodeType ? v : String(v));
      if (c.style) c.style(td, r);
      return td;
    }))));
    if (!sorted.length) tbody.append(el("tr", {}, el("td", { class: "l", colspan: cols.length, text: "No matches." })));
  }

  return { SITE, load, pct, int, el, dateLabel, time12, playerLink, header, footer, table, root };
})();
