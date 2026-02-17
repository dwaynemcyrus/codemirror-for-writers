import { ViewPlugin as N, Decoration as p, WidgetType as P, keymap as it, showPanel as we, EditorView as z, rectangularSelection as Tt, crosshairCursor as Mt } from "@codemirror/view";
import { Annotation as Ft, StateField as Z, Facet as H, StateEffect as D, RangeSet as He, Compartment as B, EditorState as J } from "@codemirror/state";
import { markdown as Nt } from "@codemirror/lang-markdown";
import { redo as Rt, undo as It, undoDepth as Dt, redoDepth as Wt, history as Bt, defaultKeymap as At, historyKeymap as Pt } from "@codemirror/commands";
import { selectNextOccurrence as je, selectSelectionMatches as Ot, openSearchPanel as _e, searchKeymap as $t, search as zt } from "@codemirror/search";
import st from "js-yaml";
import Ht from "markdown-it";
import { full as jt } from "markdown-it-emoji";
import at from "katex";
import { highlightTree as _t, classHighlighter as qt } from "@lezer/highlight";
import { javascript as U } from "@codemirror/lang-javascript";
import { python as qe } from "@codemirror/lang-python";
import { css as Kt } from "@codemirror/lang-css";
import { html as Vt } from "@codemirror/lang-html";
import { json as Ut } from "@codemirror/lang-json";
import ct from "mermaid";
const W = Ft.define(), lt = ["i", "!", "?", "*", ">", "<"], Yt = {
  i: { emoji: "🧠", label: "Idea", className: "idea" },
  "!": { emoji: "⚠️", label: "Urgent", className: "urgent" },
  "?": { emoji: "❓", label: "Question", className: "question" },
  "*": { emoji: "⭐", label: "Important", className: "important" },
  ">": { emoji: "➡️", label: "Forwarded", className: "forwarded" },
  "<": { emoji: "📅", label: "Scheduled", className: "scheduled" }
}, dt = "[[", Ce = "]]";
function re(e) {
  return e === e.trim();
}
function mt(e) {
  if (!e || !re(e) || e.includes(`
`) || e.includes("[") || e.includes("]")) return null;
  const t = e.indexOf("|"), n = t === -1 ? e : e.slice(0, t), o = t === -1 ? null : e.slice(t + 1);
  if (!n || o !== null && (!o || !re(o))) return null;
  const r = n.indexOf("#"), s = r === -1 ? n : n.slice(0, r), a = r === -1 ? null : n.slice(r + 1);
  if (!s || !re(s) || a !== null && (!a || !re(a))) return null;
  const i = o ?? a ?? s;
  return {
    raw: `${dt}${e}${Ce}`,
    title: s,
    section: a,
    alias: o,
    display: i
  };
}
function ft(e, t, n) {
  const o = "`".repeat(n);
  return e.indexOf(o, t + n);
}
function Xt(e) {
  const t = [];
  let n = 0;
  for (; n < e.length; ) {
    if (e[n] === "`") {
      let o = 1;
      for (; e[n + o] === "`"; )
        o += 1;
      const r = ft(e, n, o);
      if (r === -1) {
        n += o;
        continue;
      }
      n = r + o;
      continue;
    }
    if (e.startsWith(dt, n)) {
      const o = e.indexOf(Ce, n + 2);
      if (o === -1) {
        n += 2;
        continue;
      }
      const r = e.slice(n + 2, o), s = mt(r);
      if (s) {
        t.push({ from: n, to: o + 2, meta: s }), n = o + 2;
        continue;
      }
      n += 2;
      continue;
    }
    n += 1;
  }
  return t;
}
const Ke = new RegExp("(?:^|(?<=\\s))#([a-zA-Z][\\w/-]*)", "g");
function Gt(e) {
  const t = [], n = [];
  let o;
  const r = /`+/g;
  for (; (o = r.exec(e)) !== null; ) {
    const i = o[0].length, l = ft(e, o.index, i);
    l !== -1 && (n.push({ from: o.index, to: l + i }), r.lastIndex = l + i);
  }
  const s = (i) => n.some((l) => i >= l.from && i < l.to);
  Ke.lastIndex = 0;
  let a;
  for (; (a = Ke.exec(e)) !== null; ) {
    const i = a.index + (a[0].startsWith("#") ? 0 : a[0].indexOf("#"));
    s(i) || t.push({ from: i, to: i + 1 + a[1].length, tag: a[1] });
  }
  return t;
}
const O = new Ht({
  html: !1,
  linkify: !0,
  breaks: !1,
  typographer: !1
});
O.use(jt);
function Zt(e) {
  e.inline.ruler.before("link", "wikilink", (t, n) => {
    if (!t.env || t.env.enableWikiLinks !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 91)
      return !1;
    const r = t.src.indexOf(Ce, o + 2);
    if (r === -1) return !1;
    const s = t.src.slice(o + 2, r), a = mt(s);
    if (!a) return !1;
    if (!n) {
      const i = t.push("wikilink", "", 0);
      i.meta = a;
    }
    return t.pos = r + 2, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const o = t[n].meta || {}, r = e.utils.escapeHtml, s = [
      'class="md-wikilink"',
      `data-wikilink="${r(o.raw || "")}"`,
      `data-wikilink-title="${r(o.title || "")}"`
    ];
    o.section && s.push(`data-wikilink-section="${r(o.section)}"`), o.alias && s.push(`data-wikilink-alias="${r(o.alias)}"`);
    const a = r(o.display || o.title || "");
    return `<span ${s.join(" ")}>${a}</span>`;
  };
}
const Jt = /^#([a-zA-Z][\w/-]*)/;
function Qt(e) {
  e.inline.ruler.before("link", "tag", (t, n) => {
    if (!t.env || t.env.enableTags !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 35) return !1;
    if (o > 0) {
      const i = t.src.charCodeAt(o - 1);
      if (i !== 32 && i !== 9 && i !== 10 && i !== 13) return !1;
    }
    const s = t.src.slice(o).match(Jt);
    if (!s) return !1;
    const a = s[1];
    if (!n) {
      const i = t.push("tag", "", 0);
      i.meta = { tag: a };
    }
    return t.pos = o + 1 + a.length, !0;
  }), e.renderer.rules.tag = (t, n) => {
    const o = t[n].meta || {}, r = e.utils.escapeHtml, s = r(o.tag || "");
    return `<span class="md-tag" data-tag="${s}">#${s}</span>`;
  };
}
function en(e) {
  e.inline.ruler.before("escape", "katex_inline", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 36 || t.src.charCodeAt(o + 1) === 36) return !1;
    let r = o + 1;
    for (; (r = t.src.indexOf("$", r)) !== -1 && t.src.charCodeAt(r - 1) === 92; )
      r += 1;
    if (r === -1) return !1;
    const s = t.src.slice(o + 1, r);
    if (!s || s.includes(`
`)) return !1;
    if (!n) {
      const a = t.push("math_inline", "", 0);
      a.content = s;
    }
    return t.pos = r + 1, !0;
  }), e.renderer.rules.math_inline = (t, n) => {
    try {
      return at.renderToString(t[n].content, { displayMode: !1, throwOnError: !1 });
    } catch {
      return t[n].content;
    }
  };
}
function tn(e) {
  e.inline.ruler.before("emphasis", "highlight", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 61 || t.src.charCodeAt(o + 1) !== 61)
      return !1;
    let r = o + 2;
    for (; (r = t.src.indexOf("==", r)) !== -1 && !(r > o + 2); )
      r += 2;
    if (r === -1) return !1;
    const s = t.src.slice(o + 2, r);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("mark_open", "mark", 1).attrSet("class", "md-highlight"), e.inline.parse(s, e, t.env, t.tokens), t.push("mark_close", "mark", -1)), t.pos = r + 2, !0);
  });
}
function nn(e) {
  e.inline.ruler.before("emphasis", "subscript", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 126 || t.src.charCodeAt(o + 1) === 126) return !1;
    let r = o + 1;
    for (; (r = t.src.indexOf("~", r)) !== -1; ) {
      if (t.src.charCodeAt(r - 1) === 92) {
        r += 1;
        continue;
      }
      if (t.src.charCodeAt(r + 1) === 126) {
        r += 1;
        continue;
      }
      break;
    }
    if (r === -1) return !1;
    const s = t.src.slice(o + 1, r);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("sub_open", "sub", 1).attrSet("class", "md-subscript"), e.inline.parse(s, e, t.env, t.tokens), t.push("sub_close", "sub", -1)), t.pos = r + 1, !0);
  });
}
function on(e) {
  e.inline.ruler.before("emphasis", "superscript", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 94 || t.src.charCodeAt(o + 1) === 94) return !1;
    let r = o + 1;
    for (; (r = t.src.indexOf("^", r)) !== -1; ) {
      if (t.src.charCodeAt(r - 1) === 92) {
        r += 1;
        continue;
      }
      break;
    }
    if (r === -1) return !1;
    const s = t.src.slice(o + 1, r);
    return !s || s.includes(`
`) ? !1 : (n || (t.push("sup_open", "sup", 1).attrSet("class", "md-superscript"), e.inline.parse(s, e, t.env, t.tokens), t.push("sup_close", "sup", -1)), t.pos = r + 1, !0);
  });
}
function rn(e) {
  e.inline.ruler.before("link", "footnote_ref", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 94) return !1;
    const r = t.src.indexOf("]", o + 2);
    if (r === -1) return !1;
    const s = t.src.slice(o + 2, r);
    if (!s) return !1;
    if (!n) {
      const a = t.push("footnote_ref", "", 0);
      a.meta = { id: s };
    }
    return t.pos = r + 1, !0;
  }), e.renderer.rules.footnote_ref = (t, n) => {
    const o = t[n].meta.id;
    return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${o}">[${o}]</span></sup>`;
  };
}
en(O);
tn(O);
nn(O);
on(O);
rn(O);
Zt(O);
Qt(O);
function sn(e) {
  try {
    return at.renderToString(e, { displayMode: !0, throwOnError: !1 });
  } catch {
    return `<span class="math-error">${e}</span>`;
  }
}
function an(e, t, n = {}) {
  const o = I(t, n);
  return `<span class="footnote-def">[${e}]: ${o} <span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></span>`;
}
function I(e, t = {}) {
  const n = {
    enableWikiLinks: t.enableWikiLinks === !0,
    enableTags: t.enableTags === !0
  };
  return O.renderInline(e, n);
}
function cn(e, t, n = {}) {
  if (!t.length) return "";
  const o = t[0].match(/^\[\^([^\]]+)\]:\s*(.*)$/), r = o ? o[2] : t[0], s = [], a = I(r, n);
  s.push(`<div class="md-footnote-line md-footnote-first">[${e}]: ${a}</div>`);
  for (let i = 1; i < t.length; i++) {
    const l = t[i].replace(/^\s{2,}|\t/, ""), c = l.trim() ? I(l, n) : "";
    s.push(`<div class="md-footnote-line md-footnote-continuation">${c}</div>`);
  }
  return s.push(`<div class="md-footnote-backref"><span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></div>`), `<div class="md-footnote-block" data-footnote="${e}">${s.join("")}</div>`;
}
function ln(e, t = {}) {
  if (e.length === 0) return "";
  const n = e[0].trim(), o = [];
  let r = null;
  for (let i = 1; i < e.length; i++) {
    const l = e[i], c = l.match(/^\s*:\s*(.*)$/);
    if (c) {
      r && o.push(r), r = [c[1]];
      continue;
    }
    if (r) {
      const d = l.replace(/^\s{2,}|\t/, "");
      r.push(d);
    }
  }
  r && o.push(r);
  const s = I(n, t), a = o.map((i) => `<dd>${i.map((c) => I(c, t)).join("<br>")}</dd>`).join("");
  return `<dl class="md-definition-list"><dt>${s}</dt>${a}</dl>`;
}
function ut(e, t = {}) {
  if (!e.trim())
    return e;
  const n = t.enableCustomTasks === !0, o = Array.isArray(t.customTaskTypes) ? t.customTaskTypes : lt, r = t.customTaskTypeSet ?? new Set(o), s = t.enableWikiLinks === !0, a = { ...t, enableWikiLinks: s }, i = e.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  if (i)
    return an(i[1], i[2], a);
  const l = e.match(/^(#{1,6})\s+(.*)$/);
  if (l) {
    const d = l[1].length;
    let m = l[2], f = null;
    const u = m.match(/^(.*)\s+(?:\[#([A-Za-z0-9_-]+)\]|\{#([A-Za-z0-9_-]+)\})\s*$/);
    u && (m = u[1], f = u[2] || u[3]);
    const k = f ? ` id="${f}" data-heading-id="${f}"` : "";
    return `<span class="md-header md-h${d}"${k}>${I(m, a)}</span>`;
  }
  if (e.startsWith(">")) {
    const d = e.replace(/^>\s*/, "");
    return `<span class="md-blockquote">${I(d, a)}</span>`;
  }
  const c = e.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (c) {
    const d = c[2], m = c[3], f = m.match(/^\[([ xX])\]\s*(.*)$/);
    if (f) {
      const u = f[1].toLowerCase() === "x", k = u ? "✅" : "⬜️", h = u ? "Completed" : "Incomplete";
      return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${u ? "complete" : "incomplete"}" data-task="${u ? "x" : " "}" role="button" aria-label="${h}" title="${h}">${k}</span> ${I(f[2], a)}</span>`;
    }
    if (n) {
      const u = m.match(/^\[([!?>i*<])\]\s*(.*)$/);
      if (u) {
        const k = u[1], h = Yt[k];
        if (h && r.has(k))
          return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${h.className}" data-task="${k}" role="button" aria-label="${h.label}" title="${h.label}">${h.emoji}</span> ${I(u[2], a)}</span>`;
      }
    }
    return `<span class="md-list-item"><span class="md-list-marker">${d}</span> ${I(m, a)}</span>`;
  }
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(e.trim()))
    return '<hr class="md-hr">';
  if (e.trim().startsWith("|") && e.trim().endsWith("|")) {
    const d = e.trim();
    return /^\|[-:\s|]+\|$/.test(d) && d.includes("-") ? '<span class="md-table-separator"></span>' : `<span class="md-table-row">${d.slice(1, -1).split("|").map((u) => u.trim()).map((u) => `<span class="md-table-cell">${I(u, a)}</span>`).join("")}</span>`;
  }
  return I(e, a);
}
function dn(e, t = {}) {
  if (e.length === 0) return "";
  const n = (l) => {
    const c = l.trim();
    return !c.startsWith("|") || !c.endsWith("|") ? null : c.slice(1, -1).split("|").map((d) => d.trim());
  }, o = (l) => {
    const c = l.trim();
    return /^\|[-:\s|]+\|$/.test(c) && c.includes("-");
  };
  let r = null, s = [], a = !1;
  for (const l of e) {
    if (o(l)) {
      a = !0;
      continue;
    }
    const c = n(l);
    c && (!a && !r ? r = c : s.push(c));
  }
  let i = '<table class="md-table">';
  if (r) {
    i += "<thead><tr>";
    for (const l of r)
      i += `<th>${I(l, t)}</th>`;
    i += "</tr></thead>";
  }
  if (s.length > 0) {
    i += "<tbody>";
    for (const l of s) {
      i += "<tr>";
      for (const c of l)
        i += `<td>${I(c, t)}</td>`;
      i += "</tr>";
    }
    i += "</tbody>";
  }
  return i += "</table>", i;
}
const mn = {
  javascript: U,
  js: U,
  typescript: () => U({ typescript: !0 }),
  ts: () => U({ typescript: !0 }),
  jsx: () => U({ jsx: !0 }),
  tsx: () => U({ jsx: !0, typescript: !0 }),
  python: qe,
  py: qe,
  css: Kt,
  html: Vt,
  json: Ut
};
function ie(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fn(e, t) {
  const n = mn[t == null ? void 0 : t.toLowerCase()];
  if (!n)
    return ie(e);
  const r = n().language.parser.parse(e);
  let s = "", a = 0;
  return _t(r, qt, (i, l, c) => {
    i > a && (s += ie(e.slice(a, i))), s += `<span class="${c}">${ie(e.slice(i, l))}</span>`, a = l;
  }), a < e.length && (s += ie(e.slice(a))), s;
}
const pt = H.define({
  combine(e) {
    return e.length > 0 ? e[e.length - 1] : !0;
  }
}), be = lt, ht = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX!?>i*<])\]/;
function un(e) {
  if (!Array.isArray(e))
    return [...be];
  const t = [], n = /* @__PURE__ */ new Set();
  for (const o of e) {
    if (typeof o != "string" || o.length === 0) continue;
    const r = o.toLowerCase();
    be.includes(r) && (n.has(r) || (n.add(r), t.push(r)));
  }
  return t;
}
function pn(e) {
  return [" ", "x", ...e];
}
function gt(e, t) {
  const n = un(t);
  return {
    enableCustomTasks: e === !0,
    customTaskTypes: n,
    customTaskTypeSet: new Set(n),
    taskCycle: pn(n)
  };
}
const ce = H.define({
  combine(e) {
    return e.length === 0 ? gt(!1, be) : e[e.length - 1];
  }
});
function kt(e, t, n) {
  const o = e === !0;
  return {
    enableWikiLinks: o,
    renderWikiLinks: o && t !== !1,
    onWikiLinkClick: typeof n == "function" ? n : null
  };
}
const V = H.define({
  combine(e) {
    return e.length === 0 ? kt(!1, !1, null) : e[e.length - 1];
  }
});
function bt(e, t) {
  return { enableTags: e === !0, onTagClick: typeof t == "function" ? t : null };
}
const de = H.define({
  combine(e) {
    return e.length === 0 ? bt(!1, null) : e[e.length - 1];
  }
});
function hn(e, t) {
  const n = e.match(ht);
  if (!n) return null;
  const o = n[2].toLowerCase();
  return o === " " || o === "x" || t.enableCustomTasks && t.customTaskTypeSet.has(o) ? o : null;
}
function gn(e, t) {
  if (!Array.isArray(t) || t.length === 0) return e;
  const n = t.indexOf(e);
  return n === -1 ? t[0] : t[(n + 1) % t.length];
}
function kn(e, t) {
  return e.replace(ht, `$1[${t}]`);
}
function Q(e) {
  return {
    raw: e.getAttribute("data-wikilink") || "",
    title: e.getAttribute("data-wikilink-title") || "",
    section: e.getAttribute("data-wikilink-section") || "",
    alias: e.getAttribute("data-wikilink-alias") || "",
    display: e.textContent || ""
  };
}
const xe = D.define(), wt = Z.define({
  create() {
    return /* @__PURE__ */ new Set();
  },
  update(e, t) {
    let n = e;
    for (const o of t.effects)
      o.is(xe) && (n = new Set(e), n.has(o.value) ? n.delete(o.value) : n.add(o.value));
    if (t.docChanged && n.size > 0) {
      const o = /* @__PURE__ */ new Set();
      for (const r of n) {
        const s = t.startState.doc;
        if (r <= s.lines) {
          const a = s.line(r), i = t.changes.mapPos(a.from), l = t.newDoc.lineAt(i).number, c = t.newDoc.line(l).text;
          /^#{1,6}\s/.test(c) && o.add(l);
        }
      }
      n = o;
    }
    return n;
  }
});
ct.initialize({
  startOnLoad: !1,
  theme: "base",
  securityLevel: "loose",
  themeVariables: {
    primaryColor: "#f5f5f5",
    secondaryColor: "#f5f5f5",
    tertiaryColor: "#f5f5f5",
    primaryBorderColor: "#ddd",
    secondaryBorderColor: "#ddd",
    tertiaryBorderColor: "#ddd",
    lineColor: "#aaa",
    edgeLabelBackground: "#fff"
  }
});
class bn extends P {
  constructor(t, n, o) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-markdown-preview";
    const o = t.state.facet(ce), r = t.state.facet(V), s = t.state.facet(de);
    n.innerHTML = ut(this.content, {
      ...o,
      enableWikiLinks: r.renderWikiLinks,
      enableTags: s.enableTags
    });
    const a = this.lineFrom, i = this.lineTo, l = this.content;
    return n.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && s.onTagClick) {
        c.preventDefault(), c.stopPropagation(), s.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-footnote]");
      if (m) {
        c.preventDefault(), c.stopPropagation();
        const C = m.getAttribute("data-footnote"), E = t.state.doc;
        for (let v = 1; v <= E.lines; v++) {
          const M = E.line(v);
          if (M.text.match(new RegExp(`^\\[\\^${C}\\]:`))) {
            t.dispatch({
              selection: { anchor: M.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
        return;
      }
      const f = c.target.closest("[data-footnote-ref]");
      if (f) {
        c.preventDefault(), c.stopPropagation();
        const C = f.getAttribute("data-footnote-ref"), E = t.state.doc;
        for (let v = 1; v <= E.lines; v++) {
          const M = E.line(v);
          if (M.text.match(new RegExp(`\\[\\^${C}\\](?!:)`))) {
            t.dispatch({
              selection: { anchor: M.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
        return;
      }
      const u = c.target.closest("[data-wikilink]");
      if (u && r.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), r.onWikiLinkClick(Q(u));
        return;
      }
      const k = c.target.closest("a");
      if (k && k.href) {
        c.preventDefault(), c.stopPropagation(), window.open(k.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (c.target.closest('input[type="checkbox"], .md-task-icon')) {
        c.preventDefault(), c.stopPropagation();
        const C = t.state.facet(ce), E = hn(l, C);
        if (!E)
          return;
        const v = C.enableCustomTasks ? gn(E, C.taskCycle) : E === "x" ? " " : "x", M = kn(l, v);
        M !== l && t.dispatch({
          changes: { from: a, to: i, insert: M },
          annotations: W.of(!0)
        });
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const b = n.getBoundingClientRect(), g = c.clientX - b.left, x = b.width, w = l.length;
      let y;
      if (x > 0 && w > 0) {
        const C = g / x;
        y = Math.round(C * w), y = Math.max(0, Math.min(y, w));
      } else
        y = 0;
      const L = a + y;
      t.dispatch({
        selection: { anchor: L },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.lineFrom === this.lineFrom && t.lineTo === this.lineTo;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class wn extends P {
  constructor(t, n, o, r, s, a, i) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o, this.lineNumber = r, this.level = s, this.isCollapsed = a, this.hasContent = i;
  }
  toDOM(t) {
    const n = document.createElement("span");
    if (n.className = "cm-markdown-preview cm-heading-preview", this.hasContent) {
      const c = document.createElement("span");
      c.className = `cm-collapse-toggle ${this.isCollapsed ? "collapsed" : "expanded"}`, c.textContent = "›", c.title = this.isCollapsed ? "Expand" : "Collapse";
      const d = this.lineNumber;
      c.addEventListener("click", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation(), t.dispatch({
          effects: xe.of(d)
        });
      }), c.addEventListener("mousedown", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation();
      }), n.appendChild(c);
    }
    const o = document.createElement("span"), r = t.state.facet(ce), s = t.state.facet(V), a = t.state.facet(de);
    o.innerHTML = ut(this.content, {
      ...r,
      enableWikiLinks: s.renderWikiLinks,
      enableTags: a.enableTags
    }), n.appendChild(o);
    const i = this.lineFrom;
    this.lineTo;
    const l = this.content;
    return o.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && a.onTagClick) {
        c.preventDefault(), c.stopPropagation(), a.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-wikilink]");
      if (m && s.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), s.onWikiLinkClick(Q(m));
        return;
      }
      const f = c.target.closest("a");
      if (f && f.href) {
        c.preventDefault(), c.stopPropagation(), window.open(f.href, "_blank", "noopener,noreferrer");
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const u = o.getBoundingClientRect(), k = c.clientX - u.left, h = u.width, b = l.length;
      let g;
      if (h > 0 && b > 0) {
        const w = k / h;
        g = Math.round(w * b), g = Math.max(0, Math.min(g, b));
      } else
        g = 0;
      const x = i + g;
      t.dispatch({
        selection: { anchor: x },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.lineFrom === this.lineFrom && t.lineTo === this.lineTo && t.isCollapsed === this.isCollapsed && t.hasContent === this.hasContent;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function A(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e.selection.ranges) {
    const o = e.doc.lineAt(n.from).number, r = e.doc.lineAt(n.to).number;
    for (let s = o; s <= r; s++)
      t.add(s);
  }
  return t;
}
function Cn(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...")
      return { start: 1, end: n };
  }
  return null;
}
function xn(e) {
  const t = [];
  let n = !1, o = 0, r = "";
  for (let s = 1; s <= e.lines; s++) {
    const i = e.line(s).text;
    i.startsWith("```") && (n ? (t.push({ start: o, end: s, language: r }), n = !1, r = "") : (n = !0, o = s, r = i.slice(3).trim()));
  }
  return n && t.push({ start: o, end: e.lines, language: r }), t;
}
function yn(e, t) {
  const n = [];
  let o = null;
  for (let r = 1; r <= e.lines; r++) {
    if (t.has(r)) {
      o !== null && (o = null);
      continue;
    }
    e.line(r).text.trim() === "$$" && (o === null ? o = r : (n.push({ start: o, end: r }), o = null));
  }
  return n;
}
function Ln(e, t) {
  const n = [];
  let o = null;
  for (let r = 1; r <= e.lines; r++) {
    if (t.has(r)) {
      o !== null && (n.push({ start: o, end: r - 1 }), o = null);
      continue;
    }
    const a = e.line(r).text.trim();
    a.startsWith("|") && a.endsWith("|") ? o === null && (o = r) : o !== null && (n.push({ start: o, end: r - 1 }), o = null);
  }
  return o !== null && n.push({ start: o, end: e.lines }), n;
}
function Ct(e) {
  return /^(\s{2,}|\t)/.test(e);
}
function vn(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const s = e.line(o).text.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!s) continue;
    const a = s[1];
    let i = o;
    for (let l = o + 1; l <= e.lines && !t.has(l); l++) {
      const c = e.line(l).text;
      if (!Ct(c))
        break;
      i = l;
    }
    n.push({ start: o, end: i, id: a }), o = i;
  }
  return n;
}
function Sn(e, t, n) {
  const o = [], r = (a) => /^\s*:\s*/.test(a), s = (a) => {
    if (!a.trim() || /^\s/.test(a) || /^[-*+]\s+/.test(a) || /^\d+\.\s+/.test(a) || /^>/.test(a) || /^#{1,6}\s+/.test(a)) return !1;
    const i = a.trim();
    return !(i.startsWith("|") && i.endsWith("|") || /^\[\^([^\]]+)\]:/.test(a));
  };
  for (let a = 1; a <= e.lines; a++) {
    if (t.has(a) || n.has(a)) continue;
    const i = e.line(a).text;
    if (!s(i)) continue;
    const l = a + 1;
    if (l > e.lines || t.has(l) || n.has(l)) continue;
    const c = e.line(l).text;
    if (!r(c)) continue;
    let d = l;
    for (let m = l + 1; m <= e.lines && !(t.has(m) || n.has(m)); m++) {
      const f = e.line(m).text;
      if (r(f) || Ct(f)) {
        d = m;
        continue;
      }
      break;
    }
    o.push({ start: a, end: d }), a = d;
  }
  return o;
}
function q(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e)
    for (let o = n.start; o <= n.end; o++)
      t.add(o);
  return t;
}
function En(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const s = e.line(o).text.match(/^(#{1,6})\s+/);
    s && n.push({
      line: o,
      level: s[1].length,
      endLine: e.lines
      // Will be adjusted in second pass
    });
  }
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    for (let s = o + 1; s < n.length; s++)
      if (n[s].level <= r.level) {
        r.endLine = n[s].line - 1;
        break;
      }
  }
  return n;
}
function Tn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    for (let o = n.line + 1; o <= n.endLine; o++)
      t.has(o) || t.set(o, n.line);
  return t;
}
const T = Z.define({
  create(e) {
    return Ve(e.doc);
  },
  update(e, t) {
    return t.docChanged ? Ve(t.newDoc) : e;
  }
});
function Ve(e) {
  const t = Cn(e), n = t ? q([t]) : /* @__PURE__ */ new Set(), o = xn(e), r = q(o), s = yn(e, r), a = q(s), i = Ln(e, r), l = q(i), c = vn(e, r), d = q(c), m = Sn(e, r, d), f = q(m), u = o.filter((g) => g.language === "mermaid"), k = q(u), h = En(e, r), b = Tn(h);
  return {
    frontmatter: t,
    frontmatterLines: n,
    codeBlocks: o,
    codeBlockLines: r,
    mathBlocks: s,
    mathBlockLines: a,
    tables: i,
    tableLines: l,
    footnoteBlocks: c,
    footnoteBlockLines: d,
    definitionLists: m,
    definitionListLines: f,
    mermaidBlocks: u,
    mermaidBlockLines: k,
    headings: h,
    headingMap: b
  };
}
class Mn extends P {
  constructor(t, n, o) {
    super(), this.content = t, this.mathFrom = n, this.mathTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-math-preview", n.innerHTML = sn(this.content);
    const o = this.mathFrom;
    return n.addEventListener("mousedown", (r) => {
      r.preventDefault(), r.stopPropagation(), t.dispatch({
        selection: { anchor: o },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Fn extends P {
  constructor(t, n, o) {
    super(), this.content = t, this.mermaidFrom = n, this.mermaidTo = o, this.id = "mermaid-" + Math.random().toString(36).substr(2, 9);
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-mermaid-preview";
    const o = this.mermaidFrom, r = this.content, s = this.id;
    return (async () => {
      try {
        const { svg: a } = await ct.render(s, r);
        n.innerHTML = a;
      } catch (a) {
        n.innerHTML = `<pre class="mermaid-error">${a.message}</pre>`;
      }
    })(), n.addEventListener("mousedown", (a) => {
      a.preventDefault(), a.stopPropagation(), t.dispatch({
        selection: { anchor: o },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Nn extends P {
  constructor(t, n, o) {
    super(), this.rows = t, this.tableFrom = n, this.tableTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-table-preview";
    const o = t.state.facet(V);
    n.innerHTML = dn(this.rows, { enableWikiLinks: o.renderWikiLinks });
    const r = this.tableFrom;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(Q(a));
        return;
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: r },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.rows.length !== this.rows.length) return !1;
    for (let n = 0; n < this.rows.length; n++)
      if (t.rows[n] !== this.rows[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class Rn extends P {
  constructor(t, n, o, r) {
    super(), this.id = t, this.lines = n, this.from = o, this.to = r;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-footnote-preview";
    const o = t.state.facet(V);
    n.innerHTML = cn(this.id, this.lines, { enableWikiLinks: o.renderWikiLinks });
    const r = this.from;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(Q(a));
        return;
      }
      const i = s.target.closest("[data-footnote-ref]");
      if (i) {
        s.preventDefault(), s.stopPropagation();
        const l = i.getAttribute("data-footnote-ref"), c = t.state.doc;
        for (let d = 1; d <= c.lines; d++) {
          const m = c.line(d);
          if (m.text.match(new RegExp(`\\[\\^${l}\\](?!:)`))) {
            t.dispatch({
              selection: { anchor: m.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: r },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.id !== this.id || t.lines.length !== this.lines.length) return !1;
    for (let n = 0; n < this.lines.length; n++)
      if (t.lines[n] !== this.lines[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
class In extends P {
  constructor(t, n, o) {
    super(), this.lines = t, this.from = n, this.to = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-definition-list-preview";
    const o = t.state.facet(V);
    n.innerHTML = ln(this.lines, { enableWikiLinks: o.renderWikiLinks });
    const r = this.from;
    return n.addEventListener("mousedown", (s) => {
      const a = s.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        s.preventDefault(), s.stopPropagation(), o.onWikiLinkClick(Q(a));
        return;
      }
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: r },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    if (t.lines.length !== this.lines.length) return !1;
    for (let n = 0; n < this.lines.length; n++)
      if (t.lines[n] !== this.lines[n]) return !1;
    return !0;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function Dn(e, t, n) {
  for (const o of t)
    if (n.has(o.line) && e > o.line && e <= o.endLine)
      return !0;
  return !1;
}
function Wn(e, t) {
  for (const n of t)
    if (n.line === e)
      return n;
  return null;
}
function Ue(e, t) {
  const { state: n } = e, r = e.hasFocus ? A(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: s,
    codeBlockLines: a,
    tableLines: i,
    mathBlockLines: l,
    footnoteBlockLines: c,
    definitionListLines: d,
    headings: m
  } = t, f = [], u = n.facet(pt), k = u ? n.field(wt) : /* @__PURE__ */ new Set();
  for (const { from: h, to: b } of e.visibleRanges) {
    const g = n.doc.lineAt(h).number, x = n.doc.lineAt(b).number;
    for (let w = g; w <= x; w++) {
      if (u && Dn(w, m, k)) {
        const C = n.doc.line(w);
        f.push(
          p.line({ class: "cm-collapsed-line" }).range(C.from)
        );
        continue;
      }
      if (s.has(w) || r.has(w) || a.has(w) || i.has(w) || l.has(w) || c.has(w) || d.has(w))
        continue;
      const y = n.doc.line(w), L = y.text;
      if (!xt(L) && L.trim()) {
        if (u) {
          const C = Wn(w, m);
          if (C) {
            const E = C.endLine > C.line, v = k.has(w);
            f.push(
              p.replace({
                widget: new wn(
                  L,
                  y.from,
                  y.to,
                  w,
                  C.level,
                  v,
                  E
                ),
                inclusive: !1,
                block: !1
              }).range(y.from, y.to)
            );
            continue;
          }
        }
        f.push(
          p.replace({
            widget: new bn(L, y.from, y.to),
            inclusive: !1,
            block: !1
          }).range(y.from, y.to)
        );
      }
    }
  }
  return p.set(f, !0);
}
function Ye(e, t) {
  if (!e.state.facet(V).enableWikiLinks)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, r = A(o), { codeBlockLines: s } = t, a = [];
  for (const { from: i, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(i).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!r.has(m) || s.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("[[")) continue;
      const u = Xt(f.text);
      for (const k of u)
        a.push(
          p.mark({ class: "cm-wikilink" }).range(
            f.from + k.from,
            f.from + k.to
          )
        );
    }
  }
  return p.set(a, !0);
}
const Bn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Ue(e, t);
    }
    update(e) {
      const t = e.transactions.some(
        (n) => n.effects.some((o) => o.is(xe))
      );
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged || t) {
        const n = e.state.field(T);
        this.decorations = Ue(e.view, n);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), An = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Ye(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Ye(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Xe(e, t) {
  if (!e.state.facet(de).enableTags)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, r = A(o), { codeBlockLines: s } = t, a = [];
  for (const { from: i, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(i).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!r.has(m) || s.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("#")) continue;
      const u = Gt(f.text);
      for (const k of u)
        a.push(
          p.mark({ class: "cm-tag-mark" }).range(
            f.from + k.from,
            f.from + k.to
          )
        );
    }
  }
  return p.set(a, !0);
}
const Pn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Xe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Xe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
class On extends P {
  constructor(t, n, o, r) {
    super(), this.content = t, this.language = n, this.lineFrom = o, this.lineTo = r;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-highlighted-code", n.innerHTML = fn(this.content, this.language);
    const o = this.lineFrom;
    this.lineTo;
    const r = this.content;
    return n.addEventListener("mousedown", (s) => {
      s.preventDefault(), s.stopPropagation();
      const a = n.getBoundingClientRect(), i = s.clientX - a.left, l = a.width, c = r.length;
      let d = 0;
      if (l > 0 && c > 0) {
        const f = i / l;
        d = Math.round(f * c), d = Math.max(0, Math.min(d, c));
      }
      const m = o + d;
      t.dispatch({
        selection: { anchor: m },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.content === this.content && t.language === this.language;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function Ge(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { codeBlocks: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    if (i.language === "mermaid")
      continue;
    let l = !1;
    for (let d = i.start; d <= i.end; d++)
      if (a.has(d)) {
        l = !0;
        break;
      }
    const c = i.end - i.start > 1;
    for (let d = i.start; d <= i.end; d++) {
      const m = n.doc.line(d), f = d === i.start || d === i.end;
      if (f && !l && c) {
        r.push(
          p.replace({}).range(m.from, m.to)
        );
        continue;
      }
      const u = l ? "cm-code-block-line cm-code-block-focused" : "cm-code-block-line";
      r.push(
        p.line({ class: u }).range(m.from)
      );
      const k = a.has(d);
      !f && !k && m.text.length > 0 && r.push(
        p.replace({
          widget: new On(m.text, i.language, m.from, m.to)
        }).range(m.from, m.to)
      );
    }
  }
  return p.set(r, !0);
}
const $n = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Ge(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Ge(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ze(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { tables: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    let l = !1;
    for (let c = i.start; c <= i.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = i.start; c <= i.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-table-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = i.start; m <= i.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(i.start);
      r.push(
        p.replace({
          widget: new Nn(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = i.start + 1; m <= i.end; m++) {
        const f = n.doc.line(m);
        r.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(r, !0);
}
const zn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Ze(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Ze(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Je(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { footnoteBlocks: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    let l = !1;
    for (let c = i.start; c <= i.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = i.start; c <= i.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-footnote-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = i.start; m <= i.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(i.start);
      r.push(
        p.replace({
          widget: new Rn(i.id, c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = i.start + 1; m <= i.end; m++) {
        const f = n.doc.line(m);
        r.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(r, !0);
}
const Hn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Je(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Je(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Qe(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { definitionLists: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    let l = !1;
    for (let c = i.start; c <= i.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = i.start; c <= i.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-definition-list-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = i.start; m <= i.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(i.start);
      r.push(
        p.replace({
          widget: new In(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = i.start + 1; m <= i.end; m++) {
        const f = n.doc.line(m);
        r.push(
          p.line({ class: "cm-hidden-line" }).range(f.from),
          p.replace({}).range(f.from, f.to)
        );
      }
    }
  }
  return p.set(r, !0);
}
const jn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = Qe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = Qe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function et(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { mathBlocks: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    let l = !1;
    for (let c = i.start; c <= i.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = i.start; c <= i.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-math-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = i.start + 1; f < i.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(i.start);
      r.push(
        p.replace({
          widget: new Mn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = i.start + 1; f <= i.end; f++) {
        const u = n.doc.line(f);
        r.push(
          p.line({ class: "cm-hidden-line" }).range(u.from),
          p.replace({}).range(u.from, u.to)
        );
      }
    }
  }
  return p.set(r, !0);
}
const _n = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = et(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = et(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function tt(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { mermaidBlocks: s } = t, a = o ? A(n) : /* @__PURE__ */ new Set();
  for (const i of s) {
    let l = !1;
    for (let c = i.start; c <= i.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = i.start; c <= i.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-mermaid-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = i.start + 1; f < i.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(i.start);
      r.push(
        p.replace({
          widget: new Fn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = i.start + 1; f <= i.end; f++) {
        const u = n.doc.line(f);
        r.push(
          p.line({ class: "cm-hidden-line" }).range(u.from),
          p.replace({}).range(u.from, u.to)
        );
      }
    }
  }
  return p.set(r, !0);
}
const qn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = tt(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = tt(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), Kn = /^!\[([^\]]*)\]\(([^)]+)\)$/;
function xt(e) {
  const t = e.trim().match(Kn);
  return t ? { alt: t[1], url: t[2].trim() } : null;
}
class Vn extends P {
  constructor(t, n, o, r) {
    super(), this.alt = t, this.url = n, this.lineFrom = o, this.lineTo = r;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-image-preview";
    const o = document.createElement("img");
    if (o.src = this.url, o.alt = this.alt, o.loading = "lazy", o.addEventListener("error", () => {
      n.textContent = "";
      const s = document.createElement("div");
      s.className = "cm-image-error", s.textContent = `Image not found: ${this.url}`, n.appendChild(s);
    }), n.appendChild(o), this.alt) {
      const s = document.createElement("span");
      s.className = "cm-image-alt", s.textContent = this.alt, n.appendChild(s);
    }
    const r = this.lineFrom;
    return n.addEventListener("mousedown", (s) => {
      s.preventDefault(), s.stopPropagation(), t.dispatch({
        selection: { anchor: r },
        scrollIntoView: !0
      }), t.focus();
    }), n;
  }
  eq(t) {
    return t.url === this.url && t.alt === this.alt;
  }
  ignoreEvent(t) {
    return t.type !== "mousedown";
  }
}
function nt(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], s = o ? A(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: a,
    codeBlockLines: i,
    tableLines: l,
    mathBlockLines: c,
    footnoteBlockLines: d,
    definitionListLines: m,
    mermaidBlockLines: f
  } = t;
  for (const { from: u, to: k } of e.visibleRanges) {
    const h = n.doc.lineAt(u).number, b = n.doc.lineAt(k).number;
    for (let g = h; g <= b; g++) {
      if (s.has(g) || a.has(g) || i.has(g) || l.has(g) || c.has(g) || d.has(g) || m.has(g) || f.has(g)) continue;
      const x = n.doc.line(g), w = xt(x.text);
      w && r.push(
        p.replace({
          widget: new Vn(w.alt, w.url, x.from, x.to)
        }).range(x.from, x.to)
      );
    }
  }
  return p.set(r, !0);
}
const Un = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = nt(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(T);
        this.decorations = nt(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), Y = D.define(), G = Z.define({
  create() {
    return !1;
  },
  update(e, t) {
    for (const n of t.effects)
      if (n.is(Y))
        return n.value;
    return e;
  }
});
function $(e) {
  return !e || typeof e != "object" || Object.keys(e).length === 0 ? "" : st.dump(e, {
    indent: 2,
    lineWidth: -1,
    noRefs: !0,
    quotingType: '"',
    forceQuotes: !1
  }).trimEnd();
}
function Yn(e, t, n, o, r, s) {
  const a = document.createElement("span");
  if (a.className = "cm-frontmatter-value", typeof t == "boolean") {
    const l = document.createElement("input");
    return l.type = "checkbox", l.checked = t, l.className = "cm-frontmatter-checkbox", l.addEventListener("change", (c) => {
      c.stopPropagation();
      const d = { ...n, [e]: l.checked }, m = $(d);
      s.dispatch({
        changes: { from: o, to: r, insert: m },
        annotations: W.of(!0)
      });
    }), a.appendChild(l), a;
  }
  if (Array.isArray(t)) {
    for (let c = 0; c < t.length; c++) {
      const d = document.createElement("span");
      d.className = "cm-frontmatter-tag", d.textContent = String(t[c]), d.contentEditable = "true", d.spellcheck = !1;
      const m = c;
      d.addEventListener("blur", (f) => {
        f.stopPropagation();
        const u = [...t], k = d.textContent.trim();
        k === "" ? u.splice(m, 1) : u[m] = k;
        const h = { ...n, [e]: u }, b = $(h);
        s.dispatch({
          changes: { from: o, to: r, insert: b },
          annotations: W.of(!0)
        });
      }), d.addEventListener("keydown", (f) => {
        f.key === "Enter" && (f.preventDefault(), d.blur()), f.stopPropagation();
      }), d.addEventListener("mousedown", (f) => f.stopPropagation()), a.appendChild(d);
    }
    const l = document.createElement("span");
    return l.className = "cm-frontmatter-add-tag", l.textContent = "+", l.title = "Add item", l.addEventListener("mousedown", (c) => {
      c.preventDefault(), c.stopPropagation();
    }), l.addEventListener("click", (c) => {
      c.stopPropagation();
      const d = [...t, "new"], m = { ...n, [e]: d }, f = $(m);
      s.dispatch({
        changes: { from: o, to: r, insert: f },
        annotations: W.of(!0)
      });
    }), a.appendChild(l), a;
  }
  if (t !== null && typeof t == "object") {
    const l = document.createElement("input");
    return l.type = "text", l.className = "cm-frontmatter-input", l.value = JSON.stringify(t), l.addEventListener("blur", (c) => {
      c.stopPropagation();
      try {
        const d = JSON.parse(l.value), m = { ...n, [e]: d }, f = $(m);
        s.dispatch({
          changes: { from: o, to: r, insert: f },
          annotations: W.of(!0)
        });
      } catch {
        l.value = JSON.stringify(t);
      }
    }), l.addEventListener("keydown", (c) => {
      c.key === "Enter" && (c.preventDefault(), l.blur()), c.stopPropagation();
    }), l.addEventListener("mousedown", (c) => c.stopPropagation()), a.appendChild(l), a;
  }
  const i = document.createElement("input");
  return i.type = "text", i.className = "cm-frontmatter-input", i.value = t === null ? "" : String(t), i.placeholder = t === null ? "empty" : "", i.addEventListener("blur", (l) => {
    l.stopPropagation();
    const c = i.value;
    let d;
    c === "" || c === "null" ? d = null : c === "true" ? d = !0 : c === "false" ? d = !1 : !isNaN(c) && c.trim() !== "" ? d = Number(c) : d = c;
    const m = { ...n, [e]: d }, f = $(m);
    s.dispatch({
      changes: { from: o, to: r, insert: f },
      annotations: W.of(!0)
    });
  }), i.addEventListener("keydown", (l) => {
    l.key === "Enter" && (l.preventDefault(), i.blur()), l.stopPropagation();
  }), i.addEventListener("mousedown", (l) => l.stopPropagation()), a.appendChild(i), a;
}
function Xn(e, t, n, o, r, s = {}) {
  const { knownKeys: a = [] } = s, i = document.createElement("div");
  i.className = "cm-frontmatter-preview";
  let l;
  try {
    l = st.load(e);
  } catch {
    const h = document.createElement("div");
    return h.className = "cm-frontmatter-error", h.textContent = "Invalid YAML frontmatter — click to edit", i.appendChild(h), { dom: i, error: !0 };
  }
  (!l || typeof l != "object") && (l = {});
  const c = document.createElement("table");
  c.className = "cm-frontmatter-table";
  const d = "cm-fm-keys-" + Math.random().toString(36).slice(2, 8), m = document.createElement("datalist");
  m.id = d;
  const f = new Set(Object.keys(l));
  for (const h of a)
    if (!f.has(h)) {
      const b = document.createElement("option");
      b.value = h, m.appendChild(b);
    }
  i.appendChild(m);
  const u = Object.keys(l);
  for (const h of u) {
    const b = document.createElement("tr"), g = document.createElement("td");
    g.className = "cm-frontmatter-key";
    const x = document.createElement("input");
    x.type = "text", x.className = "cm-frontmatter-key-input", x.value = h, x.size = Math.max(h.length, 1), x.spellcheck = !1, x.setAttribute("list", d), x.addEventListener("blur", (C) => {
      C.stopPropagation();
      const E = x.value.trim();
      if (E === "" || E === h) {
        x.value = h;
        return;
      }
      const v = {};
      for (const R of Object.keys(l))
        R === h ? v[E] = l[R] : v[R] = l[R];
      const M = $(v);
      r.dispatch({
        changes: { from: t, to: n, insert: M },
        annotations: W.of(!0)
      });
    }), x.addEventListener("keydown", (C) => {
      C.key === "Enter" && (C.preventDefault(), x.blur()), C.stopPropagation();
    }), x.addEventListener("mousedown", (C) => C.stopPropagation()), g.appendChild(x), b.appendChild(g);
    const w = document.createElement("td");
    w.className = "cm-frontmatter-value-cell", w.appendChild(
      Yn(h, l[h], l, t, n, r)
    ), b.appendChild(w);
    const y = document.createElement("td");
    y.className = "cm-frontmatter-action-cell";
    const L = document.createElement("span");
    L.className = "cm-frontmatter-delete", L.textContent = "×", L.title = "Remove property", L.addEventListener("mousedown", (C) => {
      C.preventDefault(), C.stopPropagation();
    }), L.addEventListener("click", (C) => {
      C.stopPropagation();
      const E = { ...l };
      delete E[h];
      const v = $(E);
      r.dispatch({
        changes: { from: t, to: n, insert: v },
        annotations: W.of(!0)
      });
    }), y.appendChild(L), b.appendChild(y), c.appendChild(b);
  }
  i.appendChild(c);
  const k = document.createElement("div");
  return k.className = "cm-frontmatter-add", k.textContent = "+ Add property", k.addEventListener("mousedown", (h) => {
    h.preventDefault(), h.stopPropagation();
  }), k.addEventListener("click", (h) => {
    h.stopPropagation();
    let b = "property", g = 1;
    for (; l[b] !== void 0; )
      b = `property${g}`, g++;
    const x = { ...l, [b]: "" }, w = $(x);
    r.dispatch({
      changes: { from: t, to: n, insert: w },
      annotations: W.of(!0)
    });
  }), i.appendChild(k), { dom: i, error: !1 };
}
function ot(e, t) {
  const { state: n } = e, { frontmatter: o } = t;
  if (!o)
    return p.none;
  const r = [], s = n.doc.line(o.start);
  r.push(
    p.replace({}).range(s.from, s.to)
  ), r.push(
    p.line({ class: "cm-hidden-line" }).range(s.from)
  );
  for (let a = o.start + 1; a <= o.end; a++) {
    const i = n.doc.line(a);
    r.push(
      p.line({ class: "cm-hidden-line" }).range(i.from),
      p.replace({}).range(i.from, i.to)
    );
  }
  return p.set(r, !0);
}
const Gn = N.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(T);
      this.decorations = ot(e, t);
    }
    update(e) {
      if (e.docChanged) {
        const t = e.state.field(T);
        this.decorations = ot(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function ye(e = {}) {
  const {
    enableCollapse: t = !0,
    enableCustomTasks: n = !1,
    customTaskTypes: o,
    enableWikiLinks: r = !1,
    renderWikiLinks: s = !0,
    onWikiLinkClick: a,
    enableTags: i = !1,
    onTagClick: l
  } = e, c = gt(n, o), d = kt(r, s, a), m = bt(i, l);
  return [
    // Configuration facet for collapse functionality
    pt.of(t),
    // Configuration facet for custom task types
    ce.of(c),
    // Configuration facet for wiki links
    V.of(d),
    // Configuration facet for tags
    de.of(m),
    // State for tracking collapsed headings (always included, but only used if collapse enabled)
    wt,
    // Frontmatter sheet open/closed state
    G,
    // Shared state for block ranges (computed once per doc change)
    T,
    // ViewPlugins that read from the shared state
    Gn,
    Un,
    Bn,
    An,
    Pn,
    $n,
    zn,
    Hn,
    jn,
    _n,
    qn
  ];
}
function Zn(e) {
  requestAnimationFrame(() => {
    const t = e.dom.querySelector(".cm-search"), n = t == null ? void 0 : t.querySelector('input[name="replace"]');
    n instanceof HTMLInputElement && (n.focus(), n.select());
  });
}
function se(e, t, n) {
  const { from: o, to: r } = e.state.selection.main, s = e.state.sliceDoc(o, r);
  e.dispatch({
    changes: { from: o, to: r, insert: t + s + n },
    selection: { anchor: o + t.length, head: r + t.length }
  });
}
function Jn(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n);
  e.dispatch({
    changes: { from: o.from, to: o.from, insert: t }
  });
}
function ue(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), s = o.text.match(/^(#{1,6})\s/), a = "#".repeat(t) + " ";
  if (s) {
    const i = s[0];
    i === a ? e.dispatch({
      changes: { from: o.from, to: o.from + i.length, insert: "" }
    }) : e.dispatch({
      changes: { from: o.from, to: o.from + i.length, insert: a }
    });
  } else
    e.dispatch({
      changes: { from: o.from, to: o.from, insert: a }
    });
}
function pe(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), r = o.text, s = r.match(/^(-|\*|\+)\s(?!\[[ xX]\])/), a = r.match(/^(\d+)\.\s/), i = r.match(/^(-|\*|\+)\s\[[ xX]\]\s/), c = {
    bullet: "- ",
    numbered: "1. ",
    task: "- [ ] "
  }[t];
  let d = null, m = null;
  i ? (d = i[0], m = "task") : a ? (d = a[0], m = "numbered") : s && (d = s[0], m = "bullet"), d ? m === t ? e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: "" }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: c }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from, insert: c }
  });
}
function Qn(e) {
  const { from: t, to: n } = e.state.selection.main;
  return t !== n ? e.state.sliceDoc(t, n) : null;
}
const F = {
  undo(e) {
    It(e);
  },
  redo(e) {
    Rt(e);
  },
  search(e) {
    _e(e);
  },
  replace(e) {
    _e(e), Zn(e);
  },
  selectNextOccurrence(e) {
    je(e);
  },
  selectAllOccurrences(e) {
    e.state.selection.main.empty && je(e), Ot(e);
  },
  bold(e) {
    se(e, "**", "**");
  },
  italic(e) {
    se(e, "_", "_");
  },
  strikethrough(e) {
    se(e, "~~", "~~");
  },
  h1(e) {
    ue(e, 1);
  },
  h2(e) {
    ue(e, 2);
  },
  h3(e) {
    ue(e, 3);
  },
  link(e) {
    const t = Qn(e), n = "https://example.com";
    if (t) {
      const { from: o, to: r } = e.state.selection.main;
      e.dispatch({
        changes: { from: o, to: r, insert: `[${t}](${n})` },
        selection: { anchor: o + t.length + 3, head: o + t.length + 3 + n.length }
      });
    } else {
      const { from: o } = e.state.selection.main;
      e.dispatch({
        changes: { from: o, insert: `[link text](${n})` },
        selection: { anchor: o + 1, head: o + 10 }
      });
    }
  },
  image(e) {
    const { from: t } = e.state.selection.main;
    e.dispatch({
      changes: { from: t, insert: "![alt text](https://placehold.co/400x200)" },
      selection: { anchor: t + 2, head: t + 10 }
    });
  },
  bulletList(e) {
    pe(e, "bullet");
  },
  numberedList(e) {
    pe(e, "numbered");
  },
  taskList(e) {
    pe(e, "task");
  },
  inlineCode(e) {
    se(e, "`", "`");
  },
  codeBlock(e) {
    const { from: t, to: n } = e.state.selection.main, o = e.state.sliceDoc(t, n), s = o ? "```\n" + o + "\n```" : "```" + `javascript
function hello() {
  alert("hello world");
}
hello();` + "\n```";
    e.dispatch({
      changes: { from: t, to: n, insert: s },
      selection: { anchor: t + 4 }
    });
  },
  hr(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

---
` }
    });
  },
  quote(e) {
    Jn(e, "> ");
  },
  table(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

` + `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |` + `
` },
      selection: { anchor: n.to + 4 }
    });
  },
  diagram(e) {
    const { from: t } = e.state.selection.main, n = e.state.doc.lineAt(t);
    e.dispatch({
      changes: { from: n.to, insert: `

` + "```mermaid\nflowchart LR\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[Result 1]\n    C -->|No| E[Result 2]\n```" + `
` },
      selection: { anchor: n.to + 4 }
    });
  },
  emoji(e) {
    const { from: t } = e.state.selection.main;
    e.dispatch({
      changes: { from: t, insert: ":smile:" },
      selection: { anchor: t + 1, head: t + 6 }
    });
  }
}, yt = H.define({
  combine(e) {
    return e.length === 0 ? {} : e[e.length - 1];
  }
}), K = D.define(), j = D.define(), _ = D.define(), ee = D.define(), te = D.define(), X = Z.define({
  create(e) {
    const t = e.facet(yt);
    return {
      writingModeSheet: !1,
      typewriter: t.typewriter === !0,
      focusMode: t.focusMode === !0,
      focusLevel: t.focusLevel || "paragraph",
      dimIntensity: t.dimIntensity != null ? t.dimIntensity : 30
    };
  },
  update(e, t) {
    for (const n of t.effects)
      n.is(K) ? e = { ...e, writingModeSheet: n.value } : n.is(j) ? e = { ...e, typewriter: n.value } : n.is(_) ? e = { ...e, focusMode: n.value } : n.is(ee) ? e = { ...e, focusLevel: n.value } : n.is(te) && (e = { ...e, dimIntensity: n.value });
    return e;
  }
}), eo = it.of([
  {
    key: "Mod-Shift-t",
    run: (e) => {
      const t = e.state.field(X).typewriter;
      return e.dispatch({ effects: j.of(!t) }), !0;
    }
  },
  {
    key: "Mod-Shift-f",
    run: (e) => {
      const t = e.state.field(X).focusMode;
      return e.dispatch({ effects: _.of(!t) }), !0;
    }
  },
  {
    key: "Mod-b",
    run: (e) => (F.bold(e), !0)
  },
  {
    key: "Mod-i",
    run: (e) => (F.italic(e), !0)
  },
  {
    key: "Mod-k",
    run: (e) => (F.link(e), !0)
  },
  {
    key: "Mod-`",
    run: (e) => (F.inlineCode(e), !0)
  },
  {
    key: "Mod-Shift-`",
    run: (e) => (F.codeBlock(e), !0)
  },
  {
    key: "Mod-h",
    run: (e) => (F.replace(e), !0)
  },
  {
    key: "Mod-d",
    run: (e) => (F.selectNextOccurrence(e), !0)
  },
  {
    key: "Mod-Shift-l",
    run: (e) => (F.selectAllOccurrences(e), !0)
  },
  {
    key: "Mod-Shift-x",
    run: (e) => (F.strikethrough(e), !0)
  },
  {
    key: "Mod-1",
    run: (e) => (F.h1(e), !0)
  },
  {
    key: "Mod-2",
    run: (e) => (F.h2(e), !0)
  },
  {
    key: "Mod-3",
    run: (e) => (F.h3(e), !0)
  },
  {
    key: "Mod-Shift-8",
    run: (e) => (F.bulletList(e), !0)
  },
  {
    key: "Mod-Shift-7",
    run: (e) => (F.numberedList(e), !0)
  },
  {
    key: "Mod-Shift-9",
    run: (e) => (F.taskList(e), !0)
  },
  {
    key: "Mod-Shift-.",
    run: (e) => (F.quote(e), !0)
  },
  {
    key: "Mod-Shift-i",
    run: (e) => (F.image(e), !0)
  }
]), to = p.line({ class: "cm-selectedLine" }), Le = N.fromClass(
  class {
    constructor(e) {
      this.decorations = this.buildDecorations(e);
    }
    update(e) {
      (e.docChanged || e.selectionSet || e.focusChanged) && (this.decorations = this.buildDecorations(e.view));
    }
    buildDecorations(e) {
      if (!e.hasFocus)
        return p.none;
      const t = [], n = /* @__PURE__ */ new Set(), o = e.state;
      for (const r of o.selection.ranges) {
        const s = o.doc.lineAt(r.from).number, a = o.doc.lineAt(r.to).number;
        for (let i = s; i <= a; i++)
          n.add(i);
      }
      for (const r of n) {
        const s = o.doc.line(r);
        t.push(to.range(s.from));
      }
      return p.set(t, !0);
    }
  },
  {
    decorations: (e) => e.decorations
  }
), Lt = N.fromClass(
  class {
    constructor(e) {
      this.view = e;
    }
    update(e) {
      !e.selectionSet && !e.docChanged && !e.geometryChanged || this.view.requestMeasure({
        key: "typewriter-scroll",
        read: (t) => {
          const n = t.state.selection.main.head, o = t.coordsAtPos(n);
          if (!o) return null;
          const r = t.scrollDOM.getBoundingClientRect(), s = r.top + r.height / 2, a = o.top - s;
          return Math.abs(a) < 2 ? null : a;
        },
        write: (t, n) => {
          t != null && n.scrollDOM.scrollBy({ top: t, behavior: "auto" });
        }
      });
    }
  }
), no = p.line({ class: "cm-unfocused-line" });
function oo(e, t) {
  const n = e.lineAt(t);
  let o = n.number, r = n.number;
  for (; o > 1 && e.line(o - 1).text.trim() !== ""; )
    o--;
  for (; r < e.lines && e.line(r + 1).text.trim() !== ""; )
    r++;
  return { from: o, to: r };
}
function ro(e, t) {
  const n = e.toString();
  let o = 0;
  for (let i = t - 1; i >= 0; i--) {
    const l = n[i];
    if ((l === "." || l === "!" || l === "?") && i + 1 < n.length && /\s/.test(n[i + 1])) {
      for (o = i + 1; o < t && /\s/.test(n[o]); ) o++;
      break;
    }
    if (l === `
` && i > 0 && n[i - 1] === `
`) {
      o = i + 1;
      break;
    }
  }
  let r = n.length;
  for (let i = t; i < n.length; i++) {
    const l = n[i];
    if ((l === "." || l === "!" || l === "?") && (i + 1 >= n.length || /\s/.test(n[i + 1]))) {
      r = i + 1;
      break;
    }
    if (l === `
` && i + 1 < n.length && n[i + 1] === `
`) {
      r = i;
      break;
    }
  }
  const s = e.lineAt(Math.max(0, o)).number, a = e.lineAt(Math.min(n.length, Math.max(o, r - 1))).number;
  return { from: s, to: a };
}
function ve(e = "paragraph", t = 30) {
  return N.fromClass(
    class {
      constructor(n) {
        this.setIntensity(n, t), this.decorations = this.buildDecorations(n);
      }
      update(n) {
        (n.selectionSet || n.docChanged || n.focusChanged) && (this.decorations = this.buildDecorations(n.view));
      }
      setIntensity(n, o) {
        const r = Math.max(0, Math.min(1, 1 - o / 100));
        n.dom.style.setProperty("--cm-unfocused-opacity", String(r));
      }
      buildDecorations(n) {
        if (!n.hasFocus)
          return He.empty;
        const o = n.state.doc, r = /* @__PURE__ */ new Set();
        for (const a of n.state.selection.ranges) {
          let i;
          if (e === "line") {
            const l = o.lineAt(a.head);
            i = { from: l.number, to: l.number };
          } else e === "sentence" ? i = ro(o, a.head) : i = oo(o, a.head);
          for (let l = i.from; l <= i.to; l++)
            r.add(l);
        }
        const s = [];
        for (let a = 1; a <= o.lines; a++)
          if (!r.has(a)) {
            const i = o.line(a);
            s.push(no.range(i.from));
          }
        return He.of(s);
      }
      destroy() {
      }
    },
    {
      decorations: (n) => n.decorations
    }
  );
}
const Ho = ve("paragraph", 30);
function io(e, t) {
  const n = e.toString(), o = n.split(/\s+/).filter((d) => d.length > 0).length, r = n.length, s = n.replace(/\s/g, "").length, a = Math.max(1, Math.ceil(o / 238));
  let i = 0, l = 0;
  const c = t && !t.main.empty;
  if (c) {
    const d = e.sliceString(t.main.from, t.main.to);
    i = d.split(/\s+/).filter((m) => m.length > 0).length, l = d.length;
  }
  return { words: o, chars: r, charsNoSpaces: s, readingTime: a, selWords: i, selChars: l, hasSelection: c };
}
function so(e) {
  return e < 1 ? "< 1 min read" : e === 1 ? "1 min read" : `${e} min read`;
}
function he(e, t) {
  const n = document.createElement("span");
  n.className = "cm-word-count-stat";
  const o = document.createElement("span");
  o.className = "cm-word-count-value", o.textContent = t;
  const r = document.createElement("span");
  return r.className = "cm-word-count-label", r.textContent = ` ${e}`, n.appendChild(o), n.appendChild(r), n;
}
function ge() {
  const e = document.createElement("span");
  return e.className = "cm-word-count-divider", e;
}
function ao(e) {
  const t = document.createElement("div");
  t.className = "cm-word-count-panel";
  function n(o) {
    const r = io(o.doc, o.selection);
    if (t.textContent = "", t.appendChild(he("words", r.words.toLocaleString())), t.appendChild(ge()), t.appendChild(he("characters", r.chars.toLocaleString())), t.appendChild(ge()), t.appendChild(he("", so(r.readingTime))), r.hasSelection) {
      t.appendChild(ge());
      const s = document.createElement("span");
      s.className = "cm-word-count-stat cm-word-count-selection";
      const a = document.createElement("span");
      a.className = "cm-word-count-value", a.textContent = `${r.selWords} words, ${r.selChars} chars`;
      const i = document.createElement("span");
      i.className = "cm-word-count-label", i.textContent = " selected", s.appendChild(a), s.appendChild(i), t.appendChild(s);
    }
  }
  return n(e.state), {
    dom: t,
    top: !1,
    update(o) {
      (o.docChanged || o.selectionSet) && n(o.state);
    }
  };
}
const Se = we.of(ao), co = [
  { icon: "↶", title: "Undo", action: "undo" },
  { icon: "↷", title: "Redo", action: "redo" },
  { icon: "B", title: "Bold", action: "bold" },
  { icon: "I", title: "Italic", action: "italic" },
  { icon: "S", title: "Strikethrough", action: "strikethrough" },
  { icon: "H₁", title: "Heading 1", action: "h1" },
  { icon: "H₂", title: "Heading 2", action: "h2" },
  { icon: "H₃", title: "Heading 3", action: "h3" },
  { icon: "🔗", title: "Link", action: "link" },
  { icon: "🖼", title: "Image", action: "image" },
  { icon: "•", title: "Bullet List", action: "bulletList" },
  { icon: "1.", title: "Numbered List", action: "numberedList" },
  { icon: "☑", title: "Task List", action: "taskList" },
  { icon: "< >", title: "Inline Code", action: "inlineCode" },
  { icon: "{ }", title: "Code Block", action: "codeBlock" },
  { icon: "—", title: "Horizontal Rule", action: "hr" },
  { icon: "“", title: "Blockquote", action: "quote" },
  { icon: "⊞", title: "Table", action: "table" }
], lo = z.baseTheme({
  ".cm-bottom-toolbar": {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "6px 8px",
    paddingBottom: "max(6px, env(safe-area-inset-bottom))",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    whiteSpace: "nowrap",
    borderTop: "1px solid #dee2e6",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: "#f8f9fa",
    overscrollBehaviorX: "contain",
    touchAction: "pan-x"
  },
  ".cm-bottom-toolbar::-webkit-scrollbar": {
    display: "none"
  },
  ".cm-bottom-toolbar-btn": {
    minWidth: "36px",
    height: "36px",
    flexShrink: "0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    color: "inherit",
    transition: "background 0.1s",
    padding: "0 4px",
    fontFamily: "inherit"
  },
  ".cm-bottom-toolbar-btn:hover": {
    background: "rgba(0, 0, 0, 0.08)"
  },
  ".cm-bottom-toolbar-btn:active": {
    background: "rgba(0, 0, 0, 0.15)"
  },
  ".cm-bottom-toolbar-btn:disabled": {
    opacity: "0.3",
    cursor: "not-allowed"
  },
  // Dark mode
  "&dark .cm-bottom-toolbar": {
    background: "#252526",
    borderTopColor: "#3c3c3c",
    color: "#d4d4d4"
  },
  "&dark .cm-bottom-toolbar-btn:hover": {
    background: "rgba(255, 255, 255, 0.1)"
  },
  "&dark .cm-bottom-toolbar-btn:active": {
    background: "rgba(255, 255, 255, 0.18)"
  }
});
function Ee(e = {}) {
  const t = e.buttons || co, n = e.extraButtons || [];
  return [we.of((r) => {
    const s = document.createElement("div");
    s.className = "cm-bottom-toolbar";
    const a = /* @__PURE__ */ new Map();
    for (const c of t) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, c.action && (a.set(c.action, d), d.addEventListener("click", (m) => {
        m.preventDefault(), F[c.action] && (F[c.action](r), r.focus());
      })), s.appendChild(d);
    }
    for (const c of n) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, d.addEventListener("click", (m) => {
        m.preventDefault(), c.handler && c.handler(r), r.focus();
      }), s.appendChild(d);
    }
    let i = 0;
    s.addEventListener("touchstart", (c) => {
      i = c.touches[0].clientX;
    }, { passive: !0 }), s.addEventListener("touchmove", (c) => {
      const d = c.touches[0].clientX - i, m = s.scrollLeft <= 0, f = s.scrollLeft + s.clientWidth >= s.scrollWidth - 1;
      (m && d > 0 || f && d < 0) && c.preventDefault();
    }, { passive: !1 });
    const l = (c) => {
      const d = a.get("undo");
      d && (d.disabled = Dt(c) === 0);
      const m = a.get("redo");
      m && (m.disabled = Wt(c) === 0);
    };
    return l(r.state), {
      dom: s,
      top: !1,
      update(c) {
        l(c.state);
      }
    };
  }), lo];
}
const ae = H.define({
  combine(e) {
    return e.length === 0 ? { docTitle: null, onBacklinksRequested: null, onBacklinkClick: null } : e[e.length - 1];
  }
});
function mo(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...") {
      for (let r = 2; r < n; r++) {
        const a = e.line(r).text.match(/^title:\s*(.+)$/);
        if (a) {
          let i = a[1].trim();
          return (i.startsWith('"') && i.endsWith('"') || i.startsWith("'") && i.endsWith("'")) && (i = i.slice(1, -1)), i;
        }
      }
      return null;
    }
  }
  return null;
}
function ke(e, t, n) {
  e.textContent = "";
  const o = document.createElement("span");
  if (o.className = "cm-backlinks-label", o.textContent = "Backlinks", e.appendChild(o), !t || t.length === 0) {
    const s = document.createElement("span");
    s.className = "cm-backlinks-empty", s.textContent = "None", e.appendChild(s);
    return;
  }
  const r = document.createElement("span");
  r.className = "cm-backlinks-list";
  for (const s of t) {
    const a = document.createElement("span");
    a.className = "cm-backlinks-link", a.textContent = s.title, s.excerpt && (a.title = s.excerpt), a.addEventListener("mousedown", (i) => {
      i.preventDefault(), n && n(s);
    }), r.appendChild(a);
  }
  e.appendChild(r);
}
function fo(e) {
  const t = document.createElement("div");
  t.className = "cm-backlinks-panel", e.state.facet(ae);
  let n = null, o = 0;
  function r(a) {
    const i = a.facet(ae);
    return i.docTitle ? i.docTitle : mo(a.doc);
  }
  async function s(a) {
    const i = a.facet(ae);
    if (!i.onBacklinksRequested) {
      t.textContent = "";
      return;
    }
    const l = r(a);
    if (l === n) return;
    if (n = l, !l) {
      ke(t, [], i.onBacklinkClick);
      return;
    }
    t.textContent = "";
    const c = document.createElement("span");
    c.className = "cm-backlinks-label", c.textContent = "Backlinks", t.appendChild(c);
    const d = document.createElement("span");
    d.className = "cm-backlinks-empty", d.textContent = "Loading…", t.appendChild(d);
    const m = ++o;
    try {
      const f = await i.onBacklinksRequested(l);
      m === o && ke(t, f, i.onBacklinkClick);
    } catch {
      m === o && ke(t, [], i.onBacklinkClick);
    }
  }
  return s(e.state), {
    dom: t,
    top: !1,
    update(a) {
      a.docChanged && s(a.state);
    }
  };
}
const Te = we.of(fo), vt = H.define({
  combine(e) {
    return e.length === 0 ? [] : e[e.length - 1];
  }
}), uo = N.fromClass(
  class {
    constructor(e) {
      this.view = e, this.backdrop = null, this.sheet = null, this.escHandler = null, this.isOpen = e.state.field(G), this.isOpen && this.open();
    }
    update(e) {
      const t = this.isOpen;
      this.isOpen = e.state.field(G), !t && this.isOpen ? this.open() : t && !this.isOpen ? this.close() : this.isOpen && e.docChanged && this.rebuildContent();
    }
    open() {
      const e = this.view;
      this.backdrop = document.createElement("div"), this.backdrop.className = "cm-frontmatter-sheet-backdrop", this.backdrop.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: Y.of(!1) });
      }), this.sheet = document.createElement("div"), this.sheet.className = "cm-frontmatter-sheet";
      const t = document.createElement("div");
      t.className = "cm-frontmatter-sheet-header";
      const n = document.createElement("span");
      n.className = "cm-frontmatter-sheet-title", n.textContent = "Properties", t.appendChild(n);
      const o = document.createElement("button");
      o.className = "cm-frontmatter-sheet-close", o.textContent = "×", o.title = "Close", o.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation();
      }), o.addEventListener("click", (r) => {
        r.stopPropagation(), e.dispatch({ effects: Y.of(!1) });
      }), t.appendChild(o), this.sheet.appendChild(t), this.contentEl = document.createElement("div"), this.contentEl.className = "cm-frontmatter-sheet-content", this.sheet.appendChild(this.contentEl), this.buildContent(), e.dom.appendChild(this.backdrop), e.dom.appendChild(this.sheet), e.scrollDOM.style.overflow = "hidden", this.escHandler = (r) => {
        r.key === "Escape" && (r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: Y.of(!1) }));
      }, e.dom.addEventListener("keydown", this.escHandler, !0), requestAnimationFrame(() => {
        this.backdrop && this.backdrop.classList.add("cm-frontmatter-sheet-backdrop-visible"), this.sheet && this.sheet.classList.add("cm-frontmatter-sheet-open");
      });
    }
    close() {
      const e = this.view;
      e.scrollDOM.style.overflow = "", this.escHandler && (e.dom.removeEventListener("keydown", this.escHandler, !0), this.escHandler = null), this.sheet && this.sheet.classList.remove("cm-frontmatter-sheet-open"), this.backdrop && this.backdrop.classList.remove("cm-frontmatter-sheet-backdrop-visible");
      const t = this.sheet, n = this.backdrop;
      setTimeout(() => {
        t == null || t.remove(), n == null || n.remove();
      }, 200), this.sheet = null, this.backdrop = null, this.contentEl = null;
    }
    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = "";
      const e = this.view.state, t = e.field(T), { frontmatter: n } = t;
      if (!n) {
        const m = document.createElement("div");
        m.className = "cm-frontmatter-sheet-empty", m.textContent = "No frontmatter in this document.", this.contentEl.appendChild(m);
        const f = document.createElement("button");
        f.className = "cm-frontmatter-sheet-add-btn", f.textContent = "Add Frontmatter", f.addEventListener("click", (u) => {
          u.stopPropagation(), this.view.dispatch({
            changes: { from: 0, to: 0, insert: `---
---
` },
            annotations: W.of(!0)
          });
        }), this.contentEl.appendChild(f);
        return;
      }
      const o = n.end - n.start > 1, r = o ? e.doc.line(n.start + 1).from : e.doc.line(n.start).to + 1, s = o ? e.doc.line(n.end - 1).to : r, a = [];
      for (let m = n.start + 1; m < n.end; m++)
        a.push(e.doc.line(m).text);
      const i = a.join(`
`), l = e.doc.line(n.start).from, c = this.view.state.facet(vt), { dom: d } = Xn(
        i,
        r,
        s,
        l,
        this.view,
        { knownKeys: c }
      );
      this.contentEl.appendChild(d);
    }
    rebuildContent() {
      this.buildContent();
    }
    destroy() {
      var e, t;
      this.isOpen && (this.escHandler && this.view.dom.removeEventListener("keydown", this.escHandler, !0), (e = this.sheet) == null || e.remove(), (t = this.backdrop) == null || t.remove(), this.view.scrollDOM.style.overflow = "");
    }
  }
), po = typeof navigator < "u" && /Mac/.test(navigator.platform), rt = po ? "⌘" : "Ctrl+", ho = N.fromClass(
  class {
    constructor(e) {
      this.view = e, this.backdrop = null, this.sheet = null, this.escHandler = null, this.isOpen = e.state.field(X).writingModeSheet, this.isOpen && this.open();
    }
    update(e) {
      const t = this.isOpen, n = e.state.field(X);
      this.isOpen = n.writingModeSheet, !t && this.isOpen ? this.open() : t && !this.isOpen ? this.close() : this.isOpen && this.rebuildContent();
    }
    open() {
      const e = this.view;
      this.backdrop = document.createElement("div"), this.backdrop.className = "cm-writing-mode-sheet-backdrop", this.backdrop.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: K.of(!1) });
      }), this.sheet = document.createElement("div"), this.sheet.className = "cm-writing-mode-sheet";
      const t = document.createElement("div");
      t.className = "cm-writing-mode-sheet-header";
      const n = document.createElement("span");
      n.className = "cm-writing-mode-sheet-title", n.textContent = "Writing Mode", t.appendChild(n);
      const o = document.createElement("button");
      o.className = "cm-writing-mode-sheet-close", o.textContent = "×", o.title = "Close", o.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation();
      }), o.addEventListener("click", (r) => {
        r.stopPropagation(), e.dispatch({ effects: K.of(!1) });
      }), t.appendChild(o), this.sheet.appendChild(t), this.contentEl = document.createElement("div"), this.contentEl.className = "cm-writing-mode-sheet-content", this.sheet.appendChild(this.contentEl), this.buildContent(), e.dom.appendChild(this.backdrop), e.dom.appendChild(this.sheet), e.scrollDOM.style.overflow = "hidden", this.escHandler = (r) => {
        r.key === "Escape" && (r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: K.of(!1) }));
      }, e.dom.addEventListener("keydown", this.escHandler, !0), requestAnimationFrame(() => {
        this.backdrop && this.backdrop.classList.add("cm-writing-mode-sheet-backdrop-visible"), this.sheet && this.sheet.classList.add("cm-writing-mode-sheet-open");
      });
    }
    close() {
      const e = this.view;
      e.scrollDOM.style.overflow = "", this.escHandler && (e.dom.removeEventListener("keydown", this.escHandler, !0), this.escHandler = null), this.sheet && this.sheet.classList.remove("cm-writing-mode-sheet-open"), this.backdrop && this.backdrop.classList.remove("cm-writing-mode-sheet-backdrop-visible");
      const t = this.sheet, n = this.backdrop;
      setTimeout(() => {
        t == null || t.remove(), n == null || n.remove();
      }, 200), this.sheet = null, this.backdrop = null, this.contentEl = null;
    }
    buildContent() {
      if (!this.contentEl) return;
      this.contentEl.innerHTML = "";
      const e = this.view, t = e.state.field(X), { typewriter: n, focusMode: o, focusLevel: r, dimIntensity: s } = t;
      let a = "normal";
      n && o ? a = "both" : n ? a = "typewriter" : o && (a = "focus");
      const i = this.createSection("MODE"), l = document.createElement("div");
      l.className = "cm-writing-mode-options";
      const c = [
        { id: "normal", label: "Normal", icon: "—" },
        { id: "typewriter", label: "Typewriter", icon: "⌸" },
        { id: "focus", label: "Focus", icon: "◎" },
        { id: "both", label: "Both", icon: "⦿" }
      ];
      for (const b of c) {
        const g = document.createElement("button");
        g.className = "cm-writing-mode-option", b.id === a && g.classList.add("cm-writing-mode-option-active"), g.title = b.label;
        const x = document.createElement("span");
        x.className = "cm-writing-mode-option-icon", x.textContent = b.icon, g.appendChild(x);
        const w = document.createElement("span");
        w.className = "cm-writing-mode-option-label", w.textContent = b.label, g.appendChild(w), g.addEventListener("mousedown", (y) => y.preventDefault()), g.addEventListener("click", (y) => {
          y.stopPropagation();
          const L = b.id === "typewriter" || b.id === "both", C = b.id === "focus" || b.id === "both";
          e.dispatch({
            effects: [
              j.of(L),
              _.of(C)
            ]
          });
        }), l.appendChild(g);
      }
      if (i.appendChild(l), this.contentEl.appendChild(i), o) {
        const b = this.createSection("FOCUS LEVEL"), g = document.createElement("div");
        g.className = "cm-writing-mode-pills";
        const x = [
          { id: "line", label: "Line" },
          { id: "sentence", label: "Sentence" },
          { id: "paragraph", label: "Paragraph" }
        ];
        for (const M of x) {
          const R = document.createElement("button");
          R.className = "cm-writing-mode-pill", M.id === r && R.classList.add("cm-writing-mode-pill-active"), R.textContent = M.label, R.addEventListener("mousedown", (fe) => fe.preventDefault()), R.addEventListener("click", (fe) => {
            fe.stopPropagation(), e.dispatch({ effects: ee.of(M.id) });
          }), g.appendChild(R);
        }
        b.appendChild(g), this.contentEl.appendChild(b);
        const w = this.createSection(`DIM INTENSITY: ${s}%`);
        this.dimLabel = w.querySelector(".cm-writing-mode-section-label");
        const y = document.createElement("div");
        y.className = "cm-writing-mode-slider-wrap";
        const L = document.createElement("input");
        L.type = "range", L.className = "cm-writing-mode-slider", L.min = "0", L.max = "100", L.step = "10", L.value = String(s), L.addEventListener("mousedown", (M) => M.stopPropagation()), L.addEventListener("input", (M) => {
          M.stopPropagation();
          const R = Number(M.target.value);
          this.dimLabel && (this.dimLabel.textContent = `DIM INTENSITY: ${R}%`), e.dispatch({ effects: te.of(R) });
        });
        const C = document.createElement("div");
        C.className = "cm-writing-mode-slider-labels";
        const E = document.createElement("span");
        E.textContent = "Less dim";
        const v = document.createElement("span");
        v.textContent = "More dim", C.appendChild(E), C.appendChild(v), y.appendChild(L), y.appendChild(C), w.appendChild(y), this.contentEl.appendChild(w);
      }
      const d = document.createElement("div");
      d.className = "cm-writing-mode-shortcuts";
      const m = document.createElement("span");
      m.className = "cm-writing-mode-shortcuts-label", m.textContent = "Shortcuts:", d.appendChild(m);
      const f = document.createElement("kbd");
      f.className = "cm-writing-mode-kbd", f.textContent = `${rt}Shift+T`, d.appendChild(f);
      const u = document.createElement("span");
      u.className = "cm-writing-mode-kbd-desc", u.textContent = "Typewriter", d.appendChild(u);
      const k = document.createElement("kbd");
      k.className = "cm-writing-mode-kbd", k.textContent = `${rt}Shift+F`, d.appendChild(k);
      const h = document.createElement("span");
      h.className = "cm-writing-mode-kbd-desc", h.textContent = "Focus", d.appendChild(h), this.contentEl.appendChild(d);
    }
    createSection(e) {
      const t = document.createElement("div");
      t.className = "cm-writing-mode-section";
      const n = document.createElement("label");
      return n.className = "cm-writing-mode-section-label", n.textContent = e, t.appendChild(n), t;
    }
    rebuildContent() {
      this.buildContent();
    }
    destroy() {
      var e, t;
      this.isOpen && (this.escHandler && this.view.dom.removeEventListener("keydown", this.escHandler, !0), (e = this.sheet) == null || e.remove(), (t = this.backdrop) == null || t.remove(), this.view.scrollDOM.style.overflow = "");
    }
  }
);
if (typeof document < "u") {
  const e = document.createElement("style");
  e.textContent = "@keyframes cmFadeIn { from { opacity: 0 } to { opacity: 1 } }", document.head.appendChild(e);
}
const go = z.baseTheme({
  // Editor base
  "&": {
    height: "100%",
    fontSize: "17px"
  },
  ".cm-content": {
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    padding: "20px 48px",
    lineHeight: "1.75"
  },
  ".cm-line": {
    padding: "4px 0"
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif'
  },
  "&.cm-focused": {
    outline: "none"
  },
  // Markdown preview container
  ".cm-markdown-preview": {
    display: "inline",
    animation: "cmFadeIn 0.12s ease-out"
  },
  // Headers
  ".cm-markdown-preview .md-header": {
    display: "inline",
    fontWeight: "600",
    lineHeight: "1.4"
  },
  ".cm-markdown-preview .md-h1": {
    fontSize: "2em"
  },
  ".cm-markdown-preview .md-h2": {
    fontSize: "1.5em"
  },
  ".cm-markdown-preview .md-h3": {
    fontSize: "1.25em"
  },
  ".cm-markdown-preview .md-h4": {
    fontSize: "1.1em"
  },
  ".cm-markdown-preview .md-h5": {
    fontSize: "1em"
  },
  ".cm-markdown-preview .md-h6": {
    fontSize: "0.9em"
  },
  // Bold and italic
  ".cm-markdown-preview strong": {
    fontWeight: "700"
  },
  ".cm-markdown-preview em": {
    fontStyle: "italic"
  },
  ".cm-markdown-preview del": {
    textDecoration: "line-through"
  },
  ".cm-markdown-preview .md-highlight, .cm-markdown-preview mark": {
    backgroundColor: "#fde68a",
    color: "inherit",
    padding: "0 2px",
    borderRadius: "3px"
  },
  ".cm-markdown-preview .md-subscript, .cm-markdown-preview sub": {
    fontSize: "0.85em",
    verticalAlign: "sub"
  },
  ".cm-markdown-preview .md-superscript, .cm-markdown-preview sup": {
    fontSize: "0.85em",
    verticalAlign: "super"
  },
  // Inline code
  ".cm-markdown-preview code": {
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Links
  ".cm-markdown-preview a": {
    textDecoration: "none",
    cursor: "pointer"
  },
  ".cm-markdown-preview a:hover": {
    textDecoration: "underline"
  },
  // Images
  ".cm-markdown-preview img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "4px"
  },
  // Blockquotes
  ".cm-markdown-preview .md-blockquote": {
    display: "inline",
    fontStyle: "italic",
    paddingLeft: "16px",
    marginLeft: "0"
  },
  // List items
  ".cm-markdown-preview .md-list-item": {
    display: "inline"
  },
  ".cm-markdown-preview .md-list-marker": {
    marginRight: "4px"
  },
  // Horizontal rule
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    display: "block",
    border: "none",
    margin: "16px 0",
    height: "1px"
  },
  // Checkboxes
  '.cm-markdown-preview input[type="checkbox"]': {
    width: "19.2px",
    height: "19.2px",
    marginRight: "6px",
    cursor: "pointer"
  },
  ".cm-markdown-preview .md-task-icon": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.2em",
    marginRight: "6px",
    cursor: "pointer",
    userSelect: "none"
  },
  ".cm-markdown-preview .md-task-idea": {
    color: "#0ea5e9"
  },
  ".cm-markdown-preview .md-task-urgent": {
    color: "#ef4444"
  },
  ".cm-markdown-preview .md-task-question": {
    color: "#a855f7"
  },
  ".cm-markdown-preview .md-task-important": {
    color: "#ec4899"
  },
  ".cm-markdown-preview .md-task-forwarded": {
    color: "#3b82f6"
  },
  ".cm-markdown-preview .md-task-scheduled": {
    color: "#f59e0b"
  },
  // Code block lines
  ".cm-code-block-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Highlighted code
  ".cm-highlighted-code": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace'
  },
  // Table preview container
  ".cm-table-preview": {
    display: "block",
    margin: "0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  // Definition list preview
  ".cm-definition-list-preview": {
    display: "block",
    margin: "0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".md-definition-list": {
    margin: "4px 0 8px 0"
  },
  ".md-definition-list dt": {
    fontWeight: "600"
  },
  ".md-definition-list dd": {
    margin: "2px 0 6px 16px"
  },
  // Footnote preview
  ".cm-footnote-preview": {
    display: "block",
    margin: "4px 0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".md-footnote-block": {
    display: "block"
  },
  ".md-footnote-line": {
    display: "block"
  },
  ".md-footnote-backref": {
    display: "block"
  },
  ".md-footnote-backref-link": {
    cursor: "pointer",
    fontSize: "0.85em"
  },
  ".md-wikilink": {
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "2px"
  },
  ".cm-wikilink": {
    textDecoration: "underline",
    textUnderlineOffset: "2px"
  },
  // Table styling
  ".md-table": {
    borderCollapse: "collapse",
    borderRadius: "6px",
    overflow: "hidden"
  },
  ".md-table th, .md-table td": {
    padding: "8px 12px",
    textAlign: "left"
  },
  ".md-table th": {
    fontWeight: "600"
  },
  // Legacy single-line table styles
  ".cm-markdown-preview .md-table-row": {
    display: "inline-flex",
    borderRadius: "4px"
  },
  ".cm-markdown-preview .md-table-cell": {
    display: "inline-block",
    padding: "6px 12px",
    minWidth: "80px"
  },
  ".cm-markdown-preview .md-table-cell:last-child": {
    borderRight: "none"
  },
  ".cm-markdown-preview .md-table-separator": {
    display: "none"
  },
  // Math block preview
  ".cm-math-preview": {
    display: "block",
    padding: "8px 0",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-math-preview .katex-display": {
    textAlign: "left !important",
    margin: "0 !important",
    justifyContent: "flex-start !important"
  },
  ".cm-math-preview .katex-display > .katex": {
    textAlign: "left !important"
  },
  // Mermaid diagram preview
  ".cm-mermaid-preview": {
    display: "block",
    padding: "16px 0",
    cursor: "pointer",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-mermaid-preview svg": {
    maxWidth: "100%",
    height: "auto"
  },
  ".cm-mermaid-preview .mermaid-error": {
    color: "#d73a49",
    fontFamily: "monospace",
    fontSize: "0.9em"
  },
  ".cm-mermaid-block-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em"
  },
  // Hidden lines (for multi-line blocks like tables, math, mermaid)
  ".cm-hidden-line": {
    height: "0 !important",
    padding: "0 !important",
    minHeight: "0 !important"
  },
  // Collapsed heading content (animated)
  ".cm-collapsed-line": {
    height: "0 !important",
    minHeight: "0 !important",
    padding: "0 !important",
    margin: "0 !important",
    overflow: "hidden !important",
    opacity: "0",
    lineHeight: "0 !important",
    transition: "height 0.15s ease-out, opacity 0.1s ease-out, padding 0.15s ease-out"
  },
  // Heading preview with collapse toggle
  ".cm-heading-preview": {
    display: "inline-flex",
    alignItems: "center",
    animation: "cmFadeIn 0.12s ease-out"
  },
  // Collapse toggle button
  ".cm-collapse-toggle": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    fontSize: "0.8em",
    opacity: "0",
    transition: "opacity 0.15s ease, transform 0.15s ease",
    marginLeft: "-20px",
    width: "20px",
    height: "1em",
    flexShrink: "0"
  },
  // Collapsed: always visible
  ".cm-collapse-toggle.collapsed": {
    transform: "rotate(0deg)",
    opacity: "0.4"
  },
  ".cm-collapse-toggle.collapsed:hover": {
    opacity: "1"
  },
  // Expanded: only visible on hover
  ".cm-collapse-toggle.expanded": {
    transform: "rotate(90deg)"
  },
  ".cm-line:hover .cm-collapse-toggle.expanded": {
    opacity: "0.4"
  },
  ".cm-line:hover .cm-collapse-toggle.expanded:hover": {
    opacity: "1"
  },
  // Footnotes
  ".footnote-ref .footnote-link": {
    cursor: "pointer",
    fontSize: "0.85em"
  },
  ".footnote-def": {
    display: "inline",
    fontSize: "0.9em"
  },
  ".footnote-def sup": {
    marginRight: "4px"
  },
  // Syntax highlighting (base classes)
  ".tok-keyword": {},
  ".tok-operator": {},
  ".tok-variableName": {},
  ".tok-function, .tok-definition": {},
  ".tok-string, .tok-string2": {},
  ".tok-number": {},
  ".tok-bool, .tok-null": {},
  ".tok-comment": { fontStyle: "italic" },
  ".tok-punctuation": {},
  ".tok-propertyName": {},
  ".tok-typeName, .tok-className": {},
  ".tok-tagName": {},
  ".tok-attributeName": {},
  ".tok-attributeValue": {},
  ".tok-regexp": {},
  ".tok-meta": {},
  // Inline image preview
  ".cm-image-preview": {
    display: "block",
    padding: "8px 0",
    cursor: "pointer",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-image-preview img": {
    maxWidth: "100%",
    maxHeight: "400px",
    objectFit: "contain",
    borderRadius: "6px",
    display: "block"
  },
  ".cm-image-alt": {
    display: "block",
    fontSize: "0.8em",
    marginTop: "4px",
    fontStyle: "italic"
  },
  ".cm-image-error": {
    display: "block",
    padding: "12px",
    fontSize: "0.85em",
    borderRadius: "6px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace'
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    display: "block",
    margin: "0",
    padding: "8px 12px",
    borderRadius: "6px",
    animation: "cmFadeIn 0.15s ease-out"
  },
  ".cm-frontmatter-table": {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9em"
  },
  ".cm-frontmatter-table td": {
    padding: "3px 8px",
    verticalAlign: "middle"
  },
  ".cm-frontmatter-key": {
    fontWeight: "600",
    whiteSpace: "nowrap",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em",
    width: "1%",
    paddingRight: "16px"
  },
  ".cm-frontmatter-key-input": {
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontSize: "inherit",
    color: "inherit",
    background: "transparent",
    border: "none",
    outline: "none",
    padding: "2px 4px",
    borderRadius: "3px",
    boxSizing: "border-box",
    minWidth: "3ch",
    appearance: "none",
    MozAppearance: "none",
    WebkitAppearance: "none"
  },
  ".cm-frontmatter-key-input::-webkit-calendar-picker-indicator": {
    display: "none !important"
  },
  ".cm-frontmatter-value-cell": {
    width: "100%"
  },
  ".cm-frontmatter-value": {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center"
  },
  ".cm-frontmatter-input": {
    border: "none",
    background: "transparent",
    width: "100%",
    font: "inherit",
    fontSize: "1em",
    outline: "none",
    padding: "2px 4px",
    borderRadius: "3px"
  },
  ".cm-frontmatter-input:focus": {
    outline: "none"
  },
  ".cm-frontmatter-checkbox": {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    margin: "0"
  },
  ".cm-frontmatter-tag": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    fontSize: "0.9em",
    cursor: "text",
    outline: "none",
    lineHeight: "1.5"
  },
  ".cm-frontmatter-add-tag": {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "0.85em",
    opacity: "0.4",
    userSelect: "none"
  },
  ".cm-frontmatter-add-tag:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-action-cell": {
    width: "1%",
    whiteSpace: "nowrap"
  },
  ".cm-frontmatter-delete": {
    cursor: "pointer",
    opacity: "0",
    fontSize: "1.1em",
    padding: "0 4px",
    userSelect: "none",
    transition: "opacity 0.1s ease"
  },
  ".cm-frontmatter-table tr:hover .cm-frontmatter-delete": {
    opacity: "0.3"
  },
  ".cm-frontmatter-table tr:hover .cm-frontmatter-delete:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-add": {
    cursor: "pointer",
    opacity: "0.4",
    fontSize: "0.85em",
    padding: "4px 8px",
    userSelect: "none"
  },
  ".cm-frontmatter-add:hover": {
    opacity: "0.8"
  },
  ".cm-frontmatter-error": {
    fontStyle: "italic",
    fontSize: "0.9em",
    padding: "4px 0",
    cursor: "pointer"
  },
  ".cm-frontmatter-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.9em",
    animation: "cmFadeIn 0.1s ease-out"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "10",
    opacity: "0",
    transition: "opacity 0.2s ease"
  },
  ".cm-frontmatter-sheet-backdrop-visible": {
    opacity: "1"
  },
  ".cm-frontmatter-sheet": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    zIndex: "11",
    maxHeight: "70%",
    overflowY: "auto",
    transform: "translateY(-100%)",
    transition: "transform 0.2s ease",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px"
  },
  ".cm-frontmatter-sheet-open": {
    transform: "translateY(0)"
  },
  ".cm-frontmatter-sheet-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px 0"
  },
  ".cm-frontmatter-sheet-title": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.9em",
    fontWeight: "600"
  },
  ".cm-frontmatter-sheet-close": {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: "1",
    opacity: "0.5"
  },
  ".cm-frontmatter-sheet-close:hover": {
    opacity: "1"
  },
  ".cm-frontmatter-sheet-content": {
    padding: "8px 20px 16px"
  },
  ".cm-frontmatter-sheet-content .cm-frontmatter-preview": {
    border: "none",
    padding: "0",
    margin: "0",
    borderRadius: "0",
    animation: "none"
  },
  ".cm-frontmatter-sheet-empty": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.9em",
    padding: "8px 0",
    opacity: "0.6"
  },
  ".cm-frontmatter-sheet-add-btn": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.85em",
    padding: "6px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "1px solid",
    marginTop: "8px"
  },
  // Word count panel
  ".cm-word-count-panel": {
    display: "flex",
    alignItems: "center",
    gap: "0",
    padding: "4px 16px",
    fontSize: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: "none"
  },
  ".cm-word-count-stat": {
    display: "inline-flex",
    alignItems: "center",
    padding: "0 10px"
  },
  ".cm-word-count-value": {
    fontWeight: "600",
    fontVariantNumeric: "tabular-nums"
  },
  ".cm-word-count-label": {
    fontWeight: "400"
  },
  ".cm-word-count-divider": {
    width: "1px",
    height: "12px",
    flexShrink: "0"
  },
  // Tag pills
  ".md-tag": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    fontSize: "0.9em",
    cursor: "pointer",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: "1.5",
    verticalAlign: "baseline"
  },
  ".cm-tag-mark": {
    borderRadius: "3px"
  },
  // Smooth transitions: focused lines fade in when raw markdown appears
  ".cm-selectedLine": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-table-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-math-block-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  ".cm-mermaid-block-line": {
    animation: "cmFadeIn 0.1s ease-out"
  },
  // Backlinks panel
  ".cm-backlinks-panel": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 16px",
    fontSize: "12px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    userSelect: "none"
  },
  ".cm-backlinks-label": {
    fontWeight: "600",
    flexShrink: "0"
  },
  ".cm-backlinks-list": {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center"
  },
  ".cm-backlinks-link": {
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "11px",
    lineHeight: "1.5"
  },
  ".cm-backlinks-link:hover": {
    textDecoration: "underline"
  },
  ".cm-backlinks-empty": {
    fontStyle: "italic",
    opacity: "0.6"
  },
  // Focus mode: unfocused lines
  ".cm-unfocused-line": {
    opacity: "var(--cm-unfocused-opacity, 0.25)",
    transition: "opacity 0.2s ease"
  },
  // Writing mode sheet overlay
  ".cm-writing-mode-sheet-backdrop": {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "10",
    opacity: "0",
    transition: "opacity 0.2s ease"
  },
  ".cm-writing-mode-sheet-backdrop-visible": {
    opacity: "1"
  },
  ".cm-writing-mode-sheet": {
    position: "absolute",
    bottom: "48px",
    left: "0",
    right: "0",
    zIndex: "11",
    maxHeight: "70%",
    overflowY: "auto",
    transform: "translateY(100%)",
    transition: "transform 0.2s ease",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px"
  },
  ".cm-writing-mode-sheet-open": {
    transform: "translateY(0)"
  },
  ".cm-writing-mode-sheet-header": {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 0"
  },
  ".cm-writing-mode-sheet-title": {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "0.95em",
    fontWeight: "600"
  },
  ".cm-writing-mode-sheet-close": {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: "1",
    opacity: "0.5"
  },
  ".cm-writing-mode-sheet-close:hover": {
    opacity: "1"
  },
  ".cm-writing-mode-sheet-content": {
    padding: "12px 20px 20px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-writing-mode-section": {
    marginBottom: "16px"
  },
  ".cm-writing-mode-section-label": {
    display: "block",
    fontSize: "0.7em",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px"
  },
  ".cm-writing-mode-options": {
    display: "flex",
    gap: "8px"
  },
  ".cm-writing-mode-option": {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "10px 8px",
    borderRadius: "8px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "0.85em",
    background: "none",
    transition: "background 0.15s ease, border-color 0.15s ease"
  },
  ".cm-writing-mode-option-icon": {
    fontSize: "1.4em",
    lineHeight: "1"
  },
  ".cm-writing-mode-option-label": {
    fontSize: "0.8em"
  },
  ".cm-writing-mode-pills": {
    display: "flex",
    gap: "6px"
  },
  ".cm-writing-mode-pill": {
    padding: "5px 14px",
    borderRadius: "16px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "0.82em",
    fontWeight: "500",
    background: "none",
    transition: "background 0.15s ease, border-color 0.15s ease",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-writing-mode-slider-wrap": {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  ".cm-writing-mode-slider": {
    width: "100%",
    height: "4px",
    appearance: "none",
    WebkitAppearance: "none",
    borderRadius: "2px",
    outline: "none",
    cursor: "pointer"
  },
  ".cm-writing-mode-slider-labels": {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7em"
  },
  ".cm-writing-mode-shortcuts": {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.75em",
    flexWrap: "wrap",
    marginTop: "4px",
    paddingTop: "12px"
  },
  ".cm-writing-mode-shortcuts-label": {
    fontWeight: "500"
  },
  ".cm-writing-mode-kbd": {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.9em",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    lineHeight: "1.4"
  },
  ".cm-writing-mode-kbd-desc": {
    marginRight: "8px"
  }
}), ko = z.theme({
  // Editor background
  "&": {
    backgroundColor: "#fff"
  },
  ".cm-content": {
    caretColor: "#333"
  },
  ".cm-cursor": {
    borderLeftColor: "#333",
    borderLeftWidth: "2px"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#b4d5fe"
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#b4d5fe"
  },
  // Header colors
  ".cm-markdown-preview .md-h1": { color: "#1a1a2e" },
  ".cm-markdown-preview .md-h2": { color: "#2d2d3f" },
  ".cm-markdown-preview .md-h3": { color: "#3d3d4d" },
  ".cm-markdown-preview .md-h4": { color: "#555566" },
  ".cm-markdown-preview .md-h5": { color: "#666677" },
  ".cm-markdown-preview .md-h6": { color: "#777788" },
  // Text colors
  ".cm-markdown-preview del": { color: "#868e96" },
  ".cm-markdown-preview code": {
    backgroundColor: "#f1f3f5",
    color: "#e83e8c"
  },
  ".cm-markdown-preview a": { color: "#228be6" },
  ".cm-markdown-preview .md-blockquote": {
    color: "#555",
    borderLeft: "3px solid #c0c8d0"
  },
  ".cm-markdown-preview .md-list-marker": { color: "#888" },
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    background: "linear-gradient(to right, transparent, #c0c8d0, transparent)"
  },
  // Code block lines
  ".cm-code-block-line": {
    backgroundColor: "#f6f8fa !important",
    borderLeft: "3px solid #e1e4e8"
  },
  ".cm-code-block-line.cm-code-block-focused": {
    backgroundColor: "#e8f4fc !important",
    borderLeft: "3px solid #228be6"
  },
  // Selected lines: no background change, keep serif font, blue caret
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line": {
    caretColor: "#228be6 !important"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#e8f4fc !important",
    borderLeft: "3px solid #228be6"
  },
  // Inline image preview
  ".cm-image-preview img": {
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)"
  },
  ".cm-image-alt": {
    color: "#888"
  },
  ".cm-image-error": {
    backgroundColor: "#fff3f3",
    color: "#d73a49",
    border: "1px solid #fdd"
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    backgroundColor: "#f8f9fa",
    border: "1px solid #e1e4e8"
  },
  ".cm-frontmatter-table td": {
    borderBottom: "1px solid #eee"
  },
  ".cm-frontmatter-table tr:last-child td": {
    borderBottom: "none"
  },
  ".cm-frontmatter-key": {
    color: "#555"
  },
  ".cm-frontmatter-key-input:focus": {
    backgroundColor: "#fff",
    boxShadow: "0 0 0 1px #228be6"
  },
  ".cm-frontmatter-input:focus": {
    backgroundColor: "#fff",
    boxShadow: "0 0 0 1px #228be6"
  },
  ".cm-frontmatter-tag": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    border: "1px solid #d2e3fc"
  },
  ".cm-frontmatter-add-tag": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8"
  },
  ".cm-frontmatter-delete": {
    color: "#d73a49"
  },
  ".cm-frontmatter-error": {
    color: "#d73a49"
  },
  ".cm-frontmatter-line": {
    backgroundColor: "#f6f8fa !important",
    borderLeft: "3px solid #e1e4e8"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  ".cm-frontmatter-sheet": {
    backgroundColor: "#fff",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)"
  },
  ".cm-frontmatter-sheet-title": {
    color: "#333"
  },
  ".cm-frontmatter-sheet-close": {
    color: "#666"
  },
  ".cm-frontmatter-sheet-add-btn": {
    backgroundColor: "#f8f9fa",
    borderColor: "#e1e4e8",
    color: "#333"
  },
  ".cm-frontmatter-sheet-add-btn:hover": {
    backgroundColor: "#e9ecef"
  },
  // Word count panel
  ".cm-word-count-panel": {
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e1e4e8",
    color: "#555"
  },
  ".cm-word-count-value": {
    color: "#333"
  },
  ".cm-word-count-label": {
    color: "#888"
  },
  ".cm-word-count-divider": {
    backgroundColor: "#dee2e6"
  },
  ".cm-word-count-selection": {
    color: "#228be6"
  },
  ".cm-word-count-selection .cm-word-count-value": {
    color: "#228be6"
  },
  ".cm-word-count-selection .cm-word-count-label": {
    color: "#228be6",
    opacity: "0.7"
  },
  // Gutters
  ".cm-gutters": {
    background: "#f8f9fa",
    borderRight: "1px solid #dee2e6"
  },
  // Table styling
  ".md-table": { border: "1px solid #d0d7de" },
  ".md-table th, .md-table td": { border: "1px solid #d0d7de" },
  ".md-table th": { background: "#f6f8fa" },
  ".md-table tbody tr:hover": { background: "#f6f8fa" },
  ".cm-markdown-preview .md-table-row": {
    background: "#fff",
    border: "1px solid #d0d7de"
  },
  ".cm-markdown-preview .md-table-cell": {
    borderRight: "1px solid #d0d7de"
  },
  // Syntax highlighting (light theme colors)
  ".tok-keyword": { color: "#d73a49" },
  ".tok-operator": { color: "#d73a49" },
  ".tok-variableName": { color: "#24292e" },
  ".tok-function, .tok-definition": { color: "#6f42c1" },
  ".tok-string, .tok-string2": { color: "#032f62" },
  ".tok-number": { color: "#005cc5" },
  ".tok-bool, .tok-null": { color: "#005cc5" },
  ".tok-comment": { color: "#6a737d" },
  ".tok-punctuation": { color: "#24292e" },
  ".tok-propertyName": { color: "#005cc5" },
  ".tok-typeName, .tok-className": { color: "#22863a" },
  ".tok-tagName": { color: "#22863a" },
  ".tok-attributeName": { color: "#6f42c1" },
  ".tok-attributeValue": { color: "#032f62" },
  ".tok-regexp": { color: "#032f62" },
  ".tok-meta": { color: "#6a737d" },
  // Backlinks panel
  ".cm-backlinks-panel": {
    backgroundColor: "#f8f9fa",
    borderTop: "1px solid #e1e4e8",
    color: "#555"
  },
  ".cm-backlinks-label": {
    color: "#333"
  },
  ".cm-backlinks-link": {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    border: "1px solid #d2e3fc"
  },
  // Tag pills
  ".md-tag": {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #c8e6c9"
  },
  ".cm-tag-mark": {
    color: "#2e7d32"
  },
  // Writing mode sheet
  ".cm-writing-mode-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  },
  ".cm-writing-mode-sheet": {
    backgroundColor: "#fff",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.12)"
  },
  ".cm-writing-mode-sheet-title": {
    color: "#333"
  },
  ".cm-writing-mode-sheet-close": {
    color: "#666"
  },
  ".cm-writing-mode-section-label": {
    color: "#888"
  },
  ".cm-writing-mode-option": {
    color: "#555",
    backgroundColor: "#f5f5f5"
  },
  ".cm-writing-mode-option:hover": {
    backgroundColor: "#eee"
  },
  ".cm-writing-mode-option-active": {
    backgroundColor: "#e8f0fe !important",
    borderColor: "#1a73e8 !important",
    color: "#1a73e8 !important"
  },
  ".cm-writing-mode-pill": {
    color: "#555",
    backgroundColor: "#f5f5f5"
  },
  ".cm-writing-mode-pill:hover": {
    backgroundColor: "#eee"
  },
  ".cm-writing-mode-pill-active": {
    backgroundColor: "#e8f0fe !important",
    borderColor: "#1a73e8 !important",
    color: "#1a73e8 !important"
  },
  ".cm-writing-mode-slider": {
    background: "#ddd"
  },
  ".cm-writing-mode-slider-labels": {
    color: "#999"
  },
  ".cm-writing-mode-shortcuts": {
    color: "#888",
    borderTop: "1px solid #eee"
  },
  ".cm-writing-mode-kbd": {
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    color: "#555"
  },
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#666" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), bo = z.theme({
  // Editor background
  "&": {
    backgroundColor: "#1e1e1e"
  },
  ".cm-content": {
    caretColor: "#fff",
    color: "#d4d4d4"
  },
  ".cm-cursor": {
    borderLeftColor: "#fff",
    borderLeftWidth: "2px"
  },
  ".cm-selectionBackground": {
    backgroundColor: "#264f78"
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "#264f78"
  },
  // Header colors
  ".cm-markdown-preview .md-h1": { color: "#e8e8ec" },
  ".cm-markdown-preview .md-h2": { color: "#d5d5db" },
  ".cm-markdown-preview .md-h3": { color: "#c2c2ca" },
  ".cm-markdown-preview .md-h4": { color: "#acacb8" },
  ".cm-markdown-preview .md-h5": { color: "#9696a4" },
  ".cm-markdown-preview .md-h6": { color: "#808090" },
  // Text colors
  ".cm-markdown-preview del": { color: "#777" },
  ".cm-markdown-preview code": {
    backgroundColor: "#2d2d2d",
    color: "#ce9178"
  },
  ".cm-markdown-preview a": { color: "#228be6" },
  ".cm-markdown-preview .md-blockquote": {
    color: "#aaa",
    borderLeft: "3px solid #4a4a5a"
  },
  ".cm-markdown-preview .md-list-marker": { color: "#888" },
  ".cm-markdown-preview .md-hr, .cm-markdown-preview hr": {
    background: "linear-gradient(to right, transparent, #4a4a5a, transparent)"
  },
  // Code block lines
  ".cm-code-block-line": {
    backgroundColor: "#2d2d2d !important",
    borderLeft: "3px solid #444"
  },
  ".cm-code-block-line.cm-code-block-focused": {
    backgroundColor: "#3a3d41 !important",
    borderLeft: "3px solid #569cd6"
  },
  // Selected lines: no background change, keep serif font, blue caret
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line": {
    caretColor: "#228be6 !important"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#3a3d41 !important",
    borderLeft: "3px solid #569cd6"
  },
  // Inline image preview
  ".cm-image-preview img": {
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.3)"
  },
  ".cm-image-alt": {
    color: "#888"
  },
  ".cm-image-error": {
    backgroundColor: "#3a2020",
    color: "#f48771",
    border: "1px solid #5a3030"
  },
  // Frontmatter property editor
  ".cm-frontmatter-preview": {
    backgroundColor: "#2d2d2d",
    border: "1px solid #444"
  },
  ".cm-frontmatter-table td": {
    borderBottom: "1px solid #3c3c3c"
  },
  ".cm-frontmatter-table tr:last-child td": {
    borderBottom: "none"
  },
  ".cm-frontmatter-key": {
    color: "#9cdcfe"
  },
  ".cm-frontmatter-input": {
    color: "#d4d4d4"
  },
  ".cm-frontmatter-key-input:focus": {
    backgroundColor: "#3a3d41",
    boxShadow: "0 0 0 1px #569cd6"
  },
  ".cm-frontmatter-input:focus": {
    backgroundColor: "#3a3d41",
    boxShadow: "0 0 0 1px #569cd6"
  },
  ".cm-frontmatter-tag": {
    backgroundColor: "#264f78",
    color: "#9cdcfe",
    border: "1px solid #3a6ea5"
  },
  ".cm-frontmatter-add-tag": {
    backgroundColor: "#264f78",
    color: "#9cdcfe"
  },
  ".cm-frontmatter-delete": {
    color: "#f48771"
  },
  ".cm-frontmatter-error": {
    color: "#f48771"
  },
  ".cm-frontmatter-line": {
    backgroundColor: "#2d2d2d !important",
    borderLeft: "3px solid #444"
  },
  // Frontmatter sheet overlay
  ".cm-frontmatter-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  ".cm-frontmatter-sheet": {
    backgroundColor: "#252526",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)"
  },
  ".cm-frontmatter-sheet-title": {
    color: "#d4d4d4"
  },
  ".cm-frontmatter-sheet-close": {
    color: "#aaa"
  },
  ".cm-frontmatter-sheet-add-btn": {
    backgroundColor: "#3c3c3c",
    borderColor: "#555",
    color: "#d4d4d4"
  },
  ".cm-frontmatter-sheet-add-btn:hover": {
    backgroundColor: "#4a4a4a"
  },
  // Word count panel
  ".cm-word-count-panel": {
    backgroundColor: "#252526",
    borderTop: "1px solid #3c3c3c",
    color: "#aaa"
  },
  ".cm-word-count-value": {
    color: "#d4d4d4"
  },
  ".cm-word-count-label": {
    color: "#777"
  },
  ".cm-word-count-divider": {
    backgroundColor: "#444"
  },
  ".cm-word-count-selection": {
    color: "#569cd6"
  },
  ".cm-word-count-selection .cm-word-count-value": {
    color: "#569cd6"
  },
  ".cm-word-count-selection .cm-word-count-label": {
    color: "#569cd6",
    opacity: "0.7"
  },
  // Gutters
  ".cm-gutters": {
    background: "#252526",
    borderRight: "1px solid #3c3c3c"
  },
  // Table styling
  ".md-table": { border: "1px solid #444" },
  ".md-table th, .md-table td": { border: "1px solid #444" },
  ".md-table th": { background: "#2d2d2d" },
  ".md-table tbody tr:hover": { background: "#2d2d2d" },
  ".cm-markdown-preview .md-table-row": {
    background: "#1e1e1e",
    border: "1px solid #444"
  },
  ".cm-markdown-preview .md-table-cell": {
    borderRight: "1px solid #444"
  },
  // Syntax highlighting (dark theme colors)
  ".tok-keyword": { color: "#569cd6" },
  ".tok-operator": { color: "#d4d4d4" },
  ".tok-variableName": { color: "#9cdcfe" },
  ".tok-function, .tok-definition": { color: "#dcdcaa" },
  ".tok-string, .tok-string2": { color: "#ce9178" },
  ".tok-number": { color: "#b5cea8" },
  ".tok-bool, .tok-null": { color: "#569cd6" },
  ".tok-comment": { color: "#6a9955" },
  ".tok-punctuation": { color: "#d4d4d4" },
  ".tok-propertyName": { color: "#9cdcfe" },
  ".tok-typeName, .tok-className": { color: "#4ec9b0" },
  ".tok-tagName": { color: "#569cd6" },
  ".tok-attributeName": { color: "#9cdcfe" },
  ".tok-attributeValue": { color: "#ce9178" },
  ".tok-regexp": { color: "#d16969" },
  ".tok-meta": { color: "#6a9955" },
  // Backlinks panel
  ".cm-backlinks-panel": {
    backgroundColor: "#252526",
    borderTop: "1px solid #3c3c3c",
    color: "#aaa"
  },
  ".cm-backlinks-label": {
    color: "#d4d4d4"
  },
  ".cm-backlinks-link": {
    backgroundColor: "#264f78",
    color: "#9cdcfe",
    border: "1px solid #3a6ea5"
  },
  // Tag pills
  ".md-tag": {
    backgroundColor: "#1b3a1b",
    color: "#81c784",
    border: "1px solid #2e5a2e"
  },
  ".cm-tag-mark": {
    color: "#81c784"
  },
  // Writing mode sheet
  ".cm-writing-mode-sheet-backdrop": {
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  ".cm-writing-mode-sheet": {
    backgroundColor: "#252526",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.4)"
  },
  ".cm-writing-mode-sheet-title": {
    color: "#d4d4d4"
  },
  ".cm-writing-mode-sheet-close": {
    color: "#aaa"
  },
  ".cm-writing-mode-section-label": {
    color: "#777"
  },
  ".cm-writing-mode-option": {
    color: "#aaa",
    backgroundColor: "#2d2d2d"
  },
  ".cm-writing-mode-option:hover": {
    backgroundColor: "#3a3a3a"
  },
  ".cm-writing-mode-option-active": {
    backgroundColor: "#264f78 !important",
    borderColor: "#569cd6 !important",
    color: "#9cdcfe !important"
  },
  ".cm-writing-mode-pill": {
    color: "#aaa",
    backgroundColor: "#2d2d2d"
  },
  ".cm-writing-mode-pill:hover": {
    backgroundColor: "#3a3a3a"
  },
  ".cm-writing-mode-pill-active": {
    backgroundColor: "#264f78 !important",
    borderColor: "#569cd6 !important",
    color: "#9cdcfe !important"
  },
  ".cm-writing-mode-slider": {
    background: "#444"
  },
  ".cm-writing-mode-slider-labels": {
    color: "#666"
  },
  ".cm-writing-mode-shortcuts": {
    color: "#666",
    borderTop: "1px solid #3c3c3c"
  },
  ".cm-writing-mode-kbd": {
    backgroundColor: "#3c3c3c",
    border: "1px solid #555",
    color: "#aaa"
  },
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#aaa" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), wo = z.theme({
  // Use monospace font everywhere in raw mode
  ".cm-scroller, .cm-content, .cm-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important'
  },
  // No inversion on selected lines - just subtle highlight
  ".cm-selectedLine, .cm-selectedLine.cm-code-block-line": {
    backgroundColor: "rgba(0, 0, 0, 0.05) !important",
    color: "inherit !important",
    caretColor: "#333 !important",
    filter: "none !important",
    borderRadius: "0",
    fontSize: "inherit !important"
  }
}), Co = z.theme({
  // Use monospace font everywhere in raw mode
  ".cm-scroller, .cm-content, .cm-line": {
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace !important'
  },
  // Dark mode: subtle highlight
  ".cm-selectedLine, .cm-selectedLine.cm-code-block-line": {
    backgroundColor: "rgba(255, 255, 255, 0.1) !important",
    color: "inherit !important",
    caretColor: "#fff !important",
    filter: "none !important",
    borderRadius: "0",
    fontSize: "inherit !important"
  }
});
function jo({ tags: e = [] } = {}) {
  return (t) => {
    const n = t.matchBefore(/#[\w/-]*$/);
    if (!n) return null;
    const r = t.state.doc.lineAt(n.from).text;
    if (/^#{1,6}\s/.test(r)) return null;
    const s = n.text.slice(1).toLowerCase(), a = e.filter((i) => i.toLowerCase().includes(s)).sort((i, l) => {
      const c = i.toLowerCase(), d = l.toLowerCase(), m = c.startsWith(s) ? 0 : 1, f = d.startsWith(s) ? 0 : 1;
      return m !== f ? m - f : c.localeCompare(d);
    }).map((i) => ({
      label: `#${i}`,
      apply: `#${i}`,
      type: "keyword"
    }));
    return {
      from: n.from,
      to: n.to,
      options: a,
      validFor: /^#[\w/-]*$/
    };
  };
}
function _o(e = []) {
  const t = e.map((n) => ({
    title: n.title,
    aliases: Array.isArray(n.aliases) ? n.aliases : [],
    normalizedTitle: n.title.toLowerCase(),
    normalizedAliases: Array.isArray(n.aliases) ? n.aliases.map((o) => o.toLowerCase()) : []
  }));
  return {
    search(n) {
      const o = n.trim().toLowerCase();
      return o ? t.map((s) => {
        const a = s.normalizedTitle.indexOf(o), i = s.normalizedAliases.length ? Math.min(
          ...s.normalizedAliases.map((c) => c.indexOf(o)).filter((c) => c !== -1)
        ) : -1, l = Math.min(
          a === -1 ? Number.POSITIVE_INFINITY : a,
          i === -1 ? Number.POSITIVE_INFINITY : i
        );
        return { entry: s, score: l };
      }).filter((s) => Number.isFinite(s.score)).sort((s, a) => s.score - a.score).map((s) => s.entry) : t;
    },
    resolve(n) {
      const o = n.trim().toLowerCase();
      return t.find((r) => r.normalizedTitle === o) || t.find((r) => r.normalizedAliases.includes(o)) || null;
    }
  };
}
function xo(e) {
  return `${e.title}]]`;
}
function qo(e, t) {
  return !e || !t || !t.title ? null : e.resolve(t.title);
}
function Ko({ noteIndex: e, formatLink: t } = {}) {
  const n = typeof t == "function" ? t : xo;
  return (o) => {
    if (!e) return null;
    const r = o.matchBefore(/\[\[[^\[\]\n]*$/);
    if (!r) return null;
    const s = r.text.slice(2), i = e.search(s).map((l) => ({
      label: l.title,
      detail: l.aliases.length ? `aliases: ${l.aliases.join(", ")}` : void 0,
      apply: n(l),
      type: "text"
    }));
    return {
      from: r.from + 2,
      to: r.to,
      options: i,
      validFor: /^[^\[\]\n]*$/
    };
  };
}
const yo = z.baseTheme({
  ".cm-more-menu-container": {
    position: "absolute",
    top: "8px",
    right: "8px",
    zIndex: "6"
  },
  ".cm-more-menu-trigger": {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ".cm-more-menu-trigger:hover": {
    background: "rgba(0, 0, 0, 0.1)"
  },
  ".cm-more-menu-dropdown": {
    position: "absolute",
    top: "100%",
    right: "0",
    marginTop: "4px",
    minWidth: "180px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06)",
    padding: "4px 0",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "14px",
    overflow: "hidden"
  },
  ".cm-more-menu-item": {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    color: "#333",
    fontSize: "inherit",
    fontFamily: "inherit",
    lineHeight: "1.3"
  },
  ".cm-more-menu-item:hover": {
    background: "rgba(0, 0, 0, 0.05)"
  },
  ".cm-more-menu-check": {
    width: "16px",
    textAlign: "center",
    flexShrink: "0",
    fontSize: "13px",
    color: "#555"
  },
  // Dark mode
  "&dark .cm-more-menu-trigger": {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#aaa"
  },
  "&dark .cm-more-menu-trigger:hover": {
    background: "rgba(255, 255, 255, 0.14)"
  },
  "&dark .cm-more-menu-dropdown": {
    background: "#2d2d2d",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)"
  },
  "&dark .cm-more-menu-item": {
    color: "#d4d4d4"
  },
  "&dark .cm-more-menu-item:hover": {
    background: "rgba(255, 255, 255, 0.08)"
  },
  "&dark .cm-more-menu-check": {
    color: "#aaa"
  },
  ".cm-more-menu-separator": {
    height: "1px",
    margin: "4px 8px",
    backgroundColor: "#e1e4e8"
  },
  "&dark .cm-more-menu-separator": {
    backgroundColor: "#3c3c3c"
  }
});
function Vo(e = {}) {
  const t = e.items || [];
  return [N.fromClass(class {
    constructor(o) {
      this.view = o, this.open = !1, this.container = document.createElement("div"), this.container.className = "cm-more-menu-container", Object.assign(this.container.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: "6"
      }), this.trigger = document.createElement("button"), this.trigger.className = "cm-more-menu-trigger", this.trigger.textContent = "⋯", this.trigger.title = "More options", this.trigger.addEventListener("click", (r) => {
        r.preventDefault(), r.stopPropagation(), this.toggle();
      }), this.container.appendChild(this.trigger), this.dropdown = document.createElement("div"), this.dropdown.className = "cm-more-menu-dropdown", this.dropdown.style.display = "none", this.container.appendChild(this.dropdown), this.checkEls = [];
      for (const r of t) {
        if (r.type === "separator") {
          const a = document.createElement("div");
          a.className = "cm-more-menu-separator", this.dropdown.appendChild(a);
          continue;
        }
        const s = document.createElement("button");
        if (s.className = "cm-more-menu-item", r.type === "action") {
          const a = document.createElement("span");
          a.textContent = r.label, s.appendChild(a), s.addEventListener("click", (i) => {
            i.preventDefault(), i.stopPropagation(), r.handler(o), this.close();
          });
        } else {
          const a = document.createElement("span");
          a.className = "cm-more-menu-check", a.textContent = r.getState && r.getState(o) ? "✓" : "", this.checkEls.push({ check: a, item: r });
          const i = document.createElement("span");
          i.textContent = r.label, s.appendChild(a), s.appendChild(i), s.addEventListener("click", (l) => {
            l.preventDefault(), l.stopPropagation(), r.handler(o), this.refreshChecks();
          });
        }
        this.dropdown.appendChild(s);
      }
      this._onDocClick = (r) => {
        this.open && !this.container.contains(r.target) && this.close();
      }, this._onKeyDown = (r) => {
        this.open && r.key === "Escape" && this.close();
      }, document.addEventListener("click", this._onDocClick, !0), document.addEventListener("keydown", this._onKeyDown), o.dom.appendChild(this.container);
    }
    toggle() {
      this.open ? this.close() : this.show();
    }
    show() {
      this.open = !0, this.refreshChecks(), this.dropdown.style.display = "";
    }
    close() {
      this.open = !1, this.dropdown.style.display = "none";
    }
    refreshChecks() {
      for (const { check: o, item: r } of this.checkEls)
        o.textContent = r.getState && r.getState(this.view) ? "✓" : "";
    }
    update(o) {
      this.open && this.refreshChecks();
    }
    destroy() {
      document.removeEventListener("click", this._onDocClick, !0), document.removeEventListener("keydown", this._onKeyDown), this.container.remove();
    }
  }), yo];
}
const me = H.define({
  combine(e) {
    return {
      enablePreview: e.reduce((t, n) => n.enablePreview ?? t, !0),
      enableKeymap: e.reduce((t, n) => n.enableKeymap ?? t, !0),
      enableCollapse: e.reduce((t, n) => n.enableCollapse ?? t, !0),
      enableCustomTasks: e.reduce((t, n) => n.enableCustomTasks ?? t, !1),
      customTaskTypes: e.reduce((t, n) => n.customTaskTypes ?? t, void 0),
      enableWikiLinks: e.reduce((t, n) => n.enableWikiLinks ?? t, !1),
      enableTags: e.reduce((t, n) => n.enableTags ?? t, !1),
      onTagClick: e.reduce((t, n) => n.onTagClick ?? t, void 0),
      renderWikiLinks: e.reduce((t, n) => n.renderWikiLinks ?? t, !0),
      onWikiLinkClick: e.reduce((t, n) => n.onWikiLinkClick ?? t, void 0),
      readOnly: e.reduce((t, n) => n.readOnly ?? t, !1),
      typewriter: e.reduce((t, n) => n.typewriter ?? t, !1),
      focusMode: e.reduce((t, n) => n.focusMode ?? t, !1),
      focusLevel: e.reduce((t, n) => n.focusLevel ?? t, "paragraph"),
      dimIntensity: e.reduce((t, n) => n.dimIntensity ?? t, 30),
      toolbar: e.reduce((t, n) => n.toolbar ?? t, !0),
      wordCount: e.reduce((t, n) => n.wordCount ?? t, !1),
      backlinks: e.reduce((t, n) => n.backlinks ?? t, !1),
      docTitle: e.reduce((t, n) => n.docTitle ?? t, void 0),
      onBacklinksRequested: e.reduce((t, n) => n.onBacklinksRequested ?? t, void 0),
      onBacklinkClick: e.reduce((t, n) => n.onBacklinkClick ?? t, void 0),
      frontmatterKeys: e.reduce((t, n) => n.frontmatterKeys ?? t, void 0),
      theme: e.reduce((t, n) => n.theme ?? t, "light")
    };
  }
}), Me = D.define(), Fe = D.define(), Ne = D.define(), Re = D.define(), Ie = D.define(), De = D.define(), S = Z.define({
  create(e) {
    const t = e.facet(me);
    return {
      theme: t.theme || "light",
      mode: t.enablePreview !== !1 ? "hybrid" : "raw",
      readOnly: t.readOnly === !0,
      typewriter: t.typewriter === !0,
      focusMode: t.focusMode === !0,
      focusLevel: t.focusLevel || "paragraph",
      dimIntensity: t.dimIntensity != null ? t.dimIntensity : 30,
      writingModeSheet: !1,
      toolbar: t.toolbar !== !1,
      wordCount: t.wordCount === !0,
      backlinks: t.backlinks === !0
    };
  },
  update(e, t) {
    for (const n of t.effects)
      n.is(Me) ? e = { ...e, theme: n.value } : n.is(Fe) ? e = { ...e, mode: n.value } : n.is(Ne) ? e = { ...e, readOnly: n.value } : n.is(j) ? e = { ...e, typewriter: n.value } : n.is(_) ? e = { ...e, focusMode: n.value } : n.is(ee) ? e = { ...e, focusLevel: n.value } : n.is(te) ? e = { ...e, dimIntensity: n.value } : n.is(K) ? e = { ...e, writingModeSheet: n.value } : n.is(Re) ? e = { ...e, toolbar: n.value } : n.is(Ie) ? e = { ...e, wordCount: n.value } : n.is(De) && (e = { ...e, backlinks: n.value });
    return e;
  }
}), We = new B(), le = new B(), ne = new B(), Be = new B(), Ae = new B(), St = new B(), Et = new B(), Pe = new B(), Oe = new B(), $e = new B(), Lo = J.transactionFilter.of((e) => !e.startState.readOnly || !e.docChanged || e.annotation(W) ? e : { changes: [] }), vo = J.transactionExtender.of((e) => {
  const t = [];
  let n = null, o = null, r = null, s = null;
  for (const i of e.effects)
    i.is(j) && (n = i.value), i.is(_) && (o = i.value), i.is(ee) && (r = i.value), i.is(te) && (s = i.value);
  const a = e.startState.field(S);
  if (n !== null && t.push(St.reconfigure(n ? Lt : [])), o !== null || r !== null || s !== null) {
    const i = o !== null ? o : a.focusMode, l = r !== null ? r : a.focusLevel, c = s !== null ? s : a.dimIntensity;
    t.push(Et.reconfigure(i ? ve(l, c) : []));
  }
  return t.length > 0 ? { effects: t } : null;
});
function ze(e) {
  return e === "dark" ? bo : ko;
}
function oe(e, t) {
  return t ? e === "dark" ? Co : wo : [];
}
function Uo(e = {}) {
  const {
    enablePreview: t = !0,
    enableKeymap: n = !0,
    enableCollapse: o = !0,
    theme: r = "light",
    enableCustomTasks: s = !1,
    customTaskTypes: a,
    enableWikiLinks: i = !1,
    renderWikiLinks: l = !0,
    onWikiLinkClick: c,
    enableTags: d = !1,
    onTagClick: m,
    readOnly: f = !1,
    typewriter: u = !1,
    focusMode: k = !1,
    focusLevel: h = "paragraph",
    dimIntensity: b = 30,
    toolbar: g = !0,
    wordCount: x = !1,
    backlinks: w = !1,
    docTitle: y,
    onBacklinksRequested: L,
    onBacklinkClick: C,
    frontmatterKeys: E
  } = e, v = [
    // Store configuration in facet (for StateField to read initial values)
    me.of(e),
    // StateField for tracking theme/mode per editor instance
    S,
    // Read-only enforcement
    Lo,
    // Auto-reconfigure compartments when writing mode effects are dispatched
    vo,
    Ae.of(J.readOnly.of(f)),
    // Core functionality
    Bt(),
    it.of([...At, ...Pt, ...$t]),
    // Search panel + keybindings
    zt(),
    // Multiple selections (rectangular selection + crosshair cursor)
    Tt(),
    Mt(),
    // Markdown language support
    Nt(),
    // Base theme (required styles)
    go,
    // Theme (in compartment for dynamic switching)
    We.of(ze(r)),
    // Raw mode theme (in compartment for toggling)
    ne.of(oe(r, !t)),
    // Highlight selected lines (disabled in raw mode)
    Be.of(t ? Le : []),
    // Typewriter mode (cursor stays vertically centered)
    St.of(u ? Lt : []),
    // Focus mode (dims non-active paragraphs)
    Et.of(k ? ve(h, b) : []),
    // Bottom formatting toolbar
    Pe.of(g ? Ee() : []),
    // Word count panel (bottom status bar)
    Oe.of(x ? Se : []),
    // Backlinks panel (bottom panel showing incoming links)
    ae.of({
      docTitle: y || null,
      onBacklinksRequested: typeof L == "function" ? L : null,
      onBacklinkClick: typeof C == "function" ? C : null
    }),
    $e.of(w ? Te : []),
    // Frontmatter sheet overlay (always loaded, just hidden when closed)
    vt.of(Array.isArray(E) ? E : []),
    uo,
    // Writing mode shared state (used by writing-mode-sheet plugin)
    yt.of({ typewriter: u, focusMode: k, focusLevel: h, dimIntensity: b }),
    X,
    // Writing mode sheet overlay (always loaded, just hidden when closed)
    ho,
    // Line wrapping
    z.lineWrapping
  ];
  return t ? v.push(le.of(ye({
    enableCollapse: o,
    enableCustomTasks: s,
    customTaskTypes: a,
    enableWikiLinks: i,
    renderWikiLinks: l,
    onWikiLinkClick: c,
    enableTags: d,
    onTagClick: m
  }))) : v.push(le.of([])), n && v.push(eo), v;
}
function Yo(e) {
  const t = e.state.field(S), n = t.theme === "light" ? "dark" : "light";
  return e.dispatch({
    effects: [
      Me.of(n),
      We.reconfigure(ze(n)),
      ne.reconfigure(oe(n, t.mode === "raw"))
    ]
  }), n === "dark";
}
function Xo(e) {
  const t = e.state.field(S), n = t.mode === "hybrid" ? "raw" : "hybrid", o = n === "hybrid", r = e.state.facet(me);
  return e.dispatch({
    effects: [
      Fe.of(n),
      le.reconfigure(o ? ye({
        enableCollapse: r.enableCollapse,
        enableCustomTasks: r.enableCustomTasks,
        customTaskTypes: r.customTaskTypes
      }) : []),
      ne.reconfigure(oe(t.theme, !o)),
      Be.reconfigure(o ? Le : [])
    ]
  }), o;
}
function Go(e) {
  const n = !e.state.field(S).readOnly;
  return e.dispatch({
    effects: [
      Ne.of(n),
      Ae.reconfigure(J.readOnly.of(n))
    ]
  }), n;
}
function Zo(e, t) {
  e.dispatch({
    effects: [
      Ne.of(t),
      Ae.reconfigure(J.readOnly.of(t))
    ]
  });
}
function Jo(e) {
  const n = !e.state.field(S).typewriter;
  return e.dispatch({ effects: j.of(n) }), n;
}
function Qo(e, t) {
  e.dispatch({ effects: j.of(t) });
}
function er(e) {
  return e.state.field(S).typewriter;
}
function tr(e) {
  const n = !e.state.field(S).focusMode;
  return e.dispatch({ effects: _.of(n) }), n;
}
function nr(e, t) {
  e.dispatch({ effects: _.of(t) });
}
function or(e) {
  return e.state.field(S).focusMode;
}
function rr(e, t) {
  e.dispatch({ effects: ee.of(t) });
}
function ir(e) {
  return e.state.field(S).focusLevel;
}
function sr(e, t) {
  e.dispatch({ effects: te.of(t) });
}
function ar(e) {
  return e.state.field(S).dimIntensity;
}
function cr(e) {
  const t = e.state.field(S);
  return t.typewriter && t.focusMode ? "both" : t.typewriter ? "typewriter" : t.focusMode ? "focus" : "normal";
}
function lr(e, t) {
  const n = t === "typewriter" || t === "both", o = t === "focus" || t === "both";
  e.dispatch({
    effects: [
      j.of(n),
      _.of(o)
    ]
  });
}
function dr(e) {
  const t = e.state.field(S).writingModeSheet;
  return e.dispatch({ effects: K.of(!t) }), !t;
}
function mr(e, t) {
  e.dispatch({ effects: K.of(t) });
}
function fr(e) {
  return e.state.field(S).writingModeSheet;
}
function ur(e) {
  const n = !e.state.field(S).toolbar;
  return e.dispatch({
    effects: [
      Re.of(n),
      Pe.reconfigure(n ? Ee() : [])
    ]
  }), n;
}
function pr(e, t) {
  e.dispatch({
    effects: [
      Re.of(t),
      Pe.reconfigure(t ? Ee() : [])
    ]
  });
}
function hr(e) {
  return e.state.field(S).toolbar;
}
function gr(e) {
  const n = !e.state.field(S).wordCount;
  return e.dispatch({
    effects: [
      Ie.of(n),
      Oe.reconfigure(n ? Se : [])
    ]
  }), n;
}
function kr(e, t) {
  e.dispatch({
    effects: [
      Ie.of(t),
      Oe.reconfigure(t ? Se : [])
    ]
  });
}
function br(e) {
  return e.state.field(S).wordCount;
}
function wr(e) {
  const n = !e.state.field(S).backlinks;
  return e.dispatch({
    effects: [
      De.of(n),
      $e.reconfigure(n ? Te : [])
    ]
  }), n;
}
function Cr(e, t) {
  e.dispatch({
    effects: [
      De.of(t),
      $e.reconfigure(t ? Te : [])
    ]
  });
}
function xr(e) {
  return e.state.field(S).backlinks;
}
function yr(e) {
  const t = e.state.field(G);
  return e.dispatch({ effects: Y.of(!t) }), !t;
}
function Lr(e, t) {
  e.dispatch({ effects: Y.of(t) });
}
function vr(e) {
  return e.state.field(G);
}
function Sr(e, t) {
  const n = e.state.field(S);
  e.dispatch({
    effects: [
      Me.of(t),
      We.reconfigure(ze(t)),
      ne.reconfigure(oe(t, n.mode === "raw"))
    ]
  });
}
function Er(e, t) {
  const n = e.state.field(S), o = t === "hybrid", r = e.state.facet(me);
  e.dispatch({
    effects: [
      Fe.of(t),
      le.reconfigure(o ? ye({
        enableCollapse: r.enableCollapse,
        enableCustomTasks: r.enableCustomTasks,
        customTaskTypes: r.customTaskTypes
      }) : []),
      ne.reconfigure(oe(n.theme, !o)),
      Be.reconfigure(o ? Le : [])
    ]
  });
}
function Tr(e) {
  return e.state.field(S).readOnly;
}
function Mr(e) {
  return e.state.field(S).theme;
}
function Fr(e) {
  return e.state.field(S).mode;
}
export {
  me as HybridMarkdownConfig,
  F as actions,
  Te as backlinksPanel,
  go as baseTheme,
  Ee as bottomToolbar,
  ve as createFocusModePlugin,
  _o as createNoteIndex,
  bo as darkTheme,
  Ho as focusModePlugin,
  ar as getDimIntensity,
  ir as getFocusLevel,
  Fr as getMode,
  Mr as getTheme,
  cr as getWritingMode,
  Le as highlightSelectedLines,
  Uo as hybridMarkdown,
  ye as hybridPreview,
  xr as isBacklinks,
  or as isFocusMode,
  vr as isFrontmatterSheet,
  Tr as isReadOnly,
  hr as isToolbar,
  er as isTypewriter,
  br as isWordCount,
  fr as isWritingModeSheet,
  ko as lightTheme,
  eo as markdownKeymap,
  Vo as moreMenu,
  qo as resolveWikiLink,
  Cr as setBacklinks,
  sr as setDimIntensity,
  rr as setFocusLevel,
  nr as setFocusMode,
  Lr as setFrontmatterSheet,
  Er as setMode,
  Zo as setReadOnly,
  Sr as setTheme,
  pr as setToolbar,
  Qo as setTypewriter,
  kr as setWordCount,
  lr as setWritingMode,
  mr as setWritingModeSheet,
  jo as tagAutocomplete,
  wr as toggleBacklinks,
  tr as toggleFocusMode,
  yr as toggleFrontmatterSheet,
  Xo as toggleHybridMode,
  Go as toggleReadOnly,
  Yo as toggleTheme,
  ur as toggleToolbar,
  Jo as toggleTypewriter,
  gr as toggleWordCount,
  dr as toggleWritingModeSheet,
  Lt as typewriterPlugin,
  Ko as wikiLinkAutocomplete,
  Se as wordCountPanel,
  ho as writingModeSheetPlugin
};
//# sourceMappingURL=index.js.map
