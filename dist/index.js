import { ViewPlugin as F, Decoration as p, WidgetType as B, keymap as Qe, showPanel as fe, EditorView as P, rectangularSelection as gt, crosshairCursor as bt } from "@codemirror/view";
import { Annotation as wt, StateField as ne, Facet as H, StateEffect as W, RangeSet as Ae, Compartment as I, EditorState as oe } from "@codemirror/state";
import { markdown as Ct } from "@codemirror/lang-markdown";
import { redo as xt, undo as yt, undoDepth as Lt, redoDepth as vt, history as St, defaultKeymap as Tt, historyKeymap as Et } from "@codemirror/commands";
import { selectNextOccurrence as $e, selectSelectionMatches as Ft, openSearchPanel as Pe, searchKeymap as Mt, search as Rt } from "@codemirror/search";
import et from "js-yaml";
import Nt from "markdown-it";
import { full as Dt } from "markdown-it-emoji";
import tt from "katex";
import { highlightTree as Bt, classHighlighter as Wt } from "@lezer/highlight";
import { javascript as _ } from "@codemirror/lang-javascript";
import { python as Oe } from "@codemirror/lang-python";
import { css as It } from "@codemirror/lang-css";
import { html as At } from "@codemirror/lang-html";
import { json as $t } from "@codemirror/lang-json";
import nt from "mermaid";
const R = wt.define(), ot = ["i", "!", "?", "*", ">", "<"], Pt = {
  i: { emoji: "🧠", label: "Idea", className: "idea" },
  "!": { emoji: "⚠️", label: "Urgent", className: "urgent" },
  "?": { emoji: "❓", label: "Question", className: "question" },
  "*": { emoji: "⭐", label: "Important", className: "important" },
  ">": { emoji: "➡️", label: "Forwarded", className: "forwarded" },
  "<": { emoji: "📅", label: "Scheduled", className: "scheduled" }
}, rt = "[[", ue = "]]";
function G(e) {
  return e === e.trim();
}
function it(e) {
  if (!e || !G(e) || e.includes(`
`) || e.includes("[") || e.includes("]")) return null;
  const t = e.indexOf("|"), n = t === -1 ? e : e.slice(0, t), o = t === -1 ? null : e.slice(t + 1);
  if (!n || o !== null && (!o || !G(o))) return null;
  const r = n.indexOf("#"), i = r === -1 ? n : n.slice(0, r), a = r === -1 ? null : n.slice(r + 1);
  if (!i || !G(i) || a !== null && (!a || !G(a))) return null;
  const s = o ?? a ?? i;
  return {
    raw: `${rt}${e}${ue}`,
    title: i,
    section: a,
    alias: o,
    display: s
  };
}
function st(e, t, n) {
  const o = "`".repeat(n);
  return e.indexOf(o, t + n);
}
function Ot(e) {
  const t = [];
  let n = 0;
  for (; n < e.length; ) {
    if (e[n] === "`") {
      let o = 1;
      for (; e[n + o] === "`"; )
        o += 1;
      const r = st(e, n, o);
      if (r === -1) {
        n += o;
        continue;
      }
      n = r + o;
      continue;
    }
    if (e.startsWith(rt, n)) {
      const o = e.indexOf(ue, n + 2);
      if (o === -1) {
        n += 2;
        continue;
      }
      const r = e.slice(n + 2, o), i = it(r);
      if (i) {
        t.push({ from: n, to: o + 2, meta: i }), n = o + 2;
        continue;
      }
      n += 2;
      continue;
    }
    n += 1;
  }
  return t;
}
const ze = new RegExp("(?:^|(?<=\\s))#([a-zA-Z][\\w/-]*)", "g");
function zt(e) {
  const t = [], n = [];
  let o;
  const r = /`+/g;
  for (; (o = r.exec(e)) !== null; ) {
    const s = o[0].length, l = st(e, o.index, s);
    l !== -1 && (n.push({ from: o.index, to: l + s }), r.lastIndex = l + s);
  }
  const i = (s) => n.some((l) => s >= l.from && s < l.to);
  ze.lastIndex = 0;
  let a;
  for (; (a = ze.exec(e)) !== null; ) {
    const s = a.index + (a[0].startsWith("#") ? 0 : a[0].indexOf("#"));
    i(s) || t.push({ from: s, to: s + 1 + a[1].length, tag: a[1] });
  }
  return t;
}
const A = new Nt({
  html: !1,
  linkify: !0,
  breaks: !1,
  typographer: !1
});
A.use(Dt);
function Ht(e) {
  e.inline.ruler.before("link", "wikilink", (t, n) => {
    if (!t.env || t.env.enableWikiLinks !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 91)
      return !1;
    const r = t.src.indexOf(ue, o + 2);
    if (r === -1) return !1;
    const i = t.src.slice(o + 2, r), a = it(i);
    if (!a) return !1;
    if (!n) {
      const s = t.push("wikilink", "", 0);
      s.meta = a;
    }
    return t.pos = r + 2, !0;
  }), e.renderer.rules.wikilink = (t, n) => {
    const o = t[n].meta || {}, r = e.utils.escapeHtml, i = [
      'class="md-wikilink"',
      `data-wikilink="${r(o.raw || "")}"`,
      `data-wikilink-title="${r(o.title || "")}"`
    ];
    o.section && i.push(`data-wikilink-section="${r(o.section)}"`), o.alias && i.push(`data-wikilink-alias="${r(o.alias)}"`);
    const a = r(o.display || o.title || "");
    return `<span ${i.join(" ")}>${a}</span>`;
  };
}
const jt = /^#([a-zA-Z][\w/-]*)/;
function _t(e) {
  e.inline.ruler.before("link", "tag", (t, n) => {
    if (!t.env || t.env.enableTags !== !0) return !1;
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 35) return !1;
    if (o > 0) {
      const s = t.src.charCodeAt(o - 1);
      if (s !== 32 && s !== 9 && s !== 10 && s !== 13) return !1;
    }
    const i = t.src.slice(o).match(jt);
    if (!i) return !1;
    const a = i[1];
    if (!n) {
      const s = t.push("tag", "", 0);
      s.meta = { tag: a };
    }
    return t.pos = o + 1 + a.length, !0;
  }), e.renderer.rules.tag = (t, n) => {
    const o = t[n].meta || {}, r = e.utils.escapeHtml, i = r(o.tag || "");
    return `<span class="md-tag" data-tag="${i}">#${i}</span>`;
  };
}
function qt(e) {
  e.inline.ruler.before("escape", "katex_inline", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 36 || t.src.charCodeAt(o + 1) === 36) return !1;
    let r = o + 1;
    for (; (r = t.src.indexOf("$", r)) !== -1 && t.src.charCodeAt(r - 1) === 92; )
      r += 1;
    if (r === -1) return !1;
    const i = t.src.slice(o + 1, r);
    if (!i || i.includes(`
`)) return !1;
    if (!n) {
      const a = t.push("math_inline", "", 0);
      a.content = i;
    }
    return t.pos = r + 1, !0;
  }), e.renderer.rules.math_inline = (t, n) => {
    try {
      return tt.renderToString(t[n].content, { displayMode: !1, throwOnError: !1 });
    } catch {
      return t[n].content;
    }
  };
}
function Kt(e) {
  e.inline.ruler.before("emphasis", "highlight", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 61 || t.src.charCodeAt(o + 1) !== 61)
      return !1;
    let r = o + 2;
    for (; (r = t.src.indexOf("==", r)) !== -1 && !(r > o + 2); )
      r += 2;
    if (r === -1) return !1;
    const i = t.src.slice(o + 2, r);
    return !i || i.includes(`
`) ? !1 : (n || (t.push("mark_open", "mark", 1).attrSet("class", "md-highlight"), e.inline.parse(i, e, t.env, t.tokens), t.push("mark_close", "mark", -1)), t.pos = r + 2, !0);
  });
}
function Vt(e) {
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
    const i = t.src.slice(o + 1, r);
    return !i || i.includes(`
`) ? !1 : (n || (t.push("sub_open", "sub", 1).attrSet("class", "md-subscript"), e.inline.parse(i, e, t.env, t.tokens), t.push("sub_close", "sub", -1)), t.pos = r + 1, !0);
  });
}
function Ut(e) {
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
    const i = t.src.slice(o + 1, r);
    return !i || i.includes(`
`) ? !1 : (n || (t.push("sup_open", "sup", 1).attrSet("class", "md-superscript"), e.inline.parse(i, e, t.env, t.tokens), t.push("sup_close", "sup", -1)), t.pos = r + 1, !0);
  });
}
function Xt(e) {
  e.inline.ruler.before("link", "footnote_ref", (t, n) => {
    const o = t.pos;
    if (t.src.charCodeAt(o) !== 91 || t.src.charCodeAt(o + 1) !== 94) return !1;
    const r = t.src.indexOf("]", o + 2);
    if (r === -1) return !1;
    const i = t.src.slice(o + 2, r);
    if (!i) return !1;
    if (!n) {
      const a = t.push("footnote_ref", "", 0);
      a.meta = { id: i };
    }
    return t.pos = r + 1, !0;
  }), e.renderer.rules.footnote_ref = (t, n) => {
    const o = t[n].meta.id;
    return `<sup class="footnote-ref"><span class="footnote-link" data-footnote="${o}">[${o}]</span></sup>`;
  };
}
qt(A);
Kt(A);
Vt(A);
Ut(A);
Xt(A);
Ht(A);
_t(A);
function Yt(e) {
  try {
    return tt.renderToString(e, { displayMode: !0, throwOnError: !1 });
  } catch {
    return `<span class="math-error">${e}</span>`;
  }
}
function Gt(e, t, n = {}) {
  const o = M(t, n);
  return `<span class="footnote-def">[${e}]: ${o} <span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></span>`;
}
function M(e, t = {}) {
  const n = {
    enableWikiLinks: t.enableWikiLinks === !0,
    enableTags: t.enableTags === !0
  };
  return A.renderInline(e, n);
}
function Zt(e, t, n = {}) {
  if (!t.length) return "";
  const o = t[0].match(/^\[\^([^\]]+)\]:\s*(.*)$/), r = o ? o[2] : t[0], i = [], a = M(r, n);
  i.push(`<div class="md-footnote-line md-footnote-first">[${e}]: ${a}</div>`);
  for (let s = 1; s < t.length; s++) {
    const l = t[s].replace(/^\s{2,}|\t/, ""), c = l.trim() ? M(l, n) : "";
    i.push(`<div class="md-footnote-line md-footnote-continuation">${c}</div>`);
  }
  return i.push(`<div class="md-footnote-backref"><span class="md-footnote-backref-link" data-footnote-ref="${e}" title="Back to reference">↩</span></div>`), `<div class="md-footnote-block" data-footnote="${e}">${i.join("")}</div>`;
}
function Jt(e, t = {}) {
  if (e.length === 0) return "";
  const n = e[0].trim(), o = [];
  let r = null;
  for (let s = 1; s < e.length; s++) {
    const l = e[s], c = l.match(/^\s*:\s*(.*)$/);
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
  const i = M(n, t), a = o.map((s) => `<dd>${s.map((c) => M(c, t)).join("<br>")}</dd>`).join("");
  return `<dl class="md-definition-list"><dt>${i}</dt>${a}</dl>`;
}
function ct(e, t = {}) {
  if (!e.trim())
    return e;
  const n = t.enableCustomTasks === !0, o = Array.isArray(t.customTaskTypes) ? t.customTaskTypes : ot, r = t.customTaskTypeSet ?? new Set(o), i = t.enableWikiLinks === !0, a = { ...t, enableWikiLinks: i }, s = e.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
  if (s)
    return Gt(s[1], s[2], a);
  const l = e.match(/^(#{1,6})\s+(.*)$/);
  if (l) {
    const d = l[1].length;
    let m = l[2], f = null;
    const u = m.match(/^(.*)\s+(?:\[#([A-Za-z0-9_-]+)\]|\{#([A-Za-z0-9_-]+)\})\s*$/);
    u && (m = u[1], f = u[2] || u[3]);
    const k = f ? ` id="${f}" data-heading-id="${f}"` : "";
    return `<span class="md-header md-h${d}"${k}>${M(m, a)}</span>`;
  }
  if (e.startsWith(">")) {
    const d = e.replace(/^>\s*/, "");
    return `<span class="md-blockquote">${M(d, a)}</span>`;
  }
  const c = e.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
  if (c) {
    const d = c[2], m = c[3], f = m.match(/^\[([ xX])\]\s*(.*)$/);
    if (f) {
      const u = f[1].toLowerCase() === "x", k = u ? "✅" : "⬜️", h = u ? "Completed" : "Incomplete";
      return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${u ? "complete" : "incomplete"}" data-task="${u ? "x" : " "}" role="button" aria-label="${h}" title="${h}">${k}</span> ${M(f[2], a)}</span>`;
    }
    if (n) {
      const u = m.match(/^\[([!?>i*<])\]\s*(.*)$/);
      if (u) {
        const k = u[1], h = Pt[k];
        if (h && r.has(k))
          return `<span class="md-list-item md-task-item"><span class="md-list-marker">${d}</span> <span class="md-task-icon md-task-${h.className}" data-task="${k}" role="button" aria-label="${h.label}" title="${h.label}">${h.emoji}</span> ${M(u[2], a)}</span>`;
      }
    }
    return `<span class="md-list-item"><span class="md-list-marker">${d}</span> ${M(m, a)}</span>`;
  }
  if (/^(-{3,}|_{3,}|\*{3,})$/.test(e.trim()))
    return '<hr class="md-hr">';
  if (e.trim().startsWith("|") && e.trim().endsWith("|")) {
    const d = e.trim();
    return /^\|[-:\s|]+\|$/.test(d) && d.includes("-") ? '<span class="md-table-separator"></span>' : `<span class="md-table-row">${d.slice(1, -1).split("|").map((u) => u.trim()).map((u) => `<span class="md-table-cell">${M(u, a)}</span>`).join("")}</span>`;
  }
  return M(e, a);
}
function Qt(e, t = {}) {
  if (e.length === 0) return "";
  const n = (l) => {
    const c = l.trim();
    return !c.startsWith("|") || !c.endsWith("|") ? null : c.slice(1, -1).split("|").map((d) => d.trim());
  }, o = (l) => {
    const c = l.trim();
    return /^\|[-:\s|]+\|$/.test(c) && c.includes("-");
  };
  let r = null, i = [], a = !1;
  for (const l of e) {
    if (o(l)) {
      a = !0;
      continue;
    }
    const c = n(l);
    c && (!a && !r ? r = c : i.push(c));
  }
  let s = '<table class="md-table">';
  if (r) {
    s += "<thead><tr>";
    for (const l of r)
      s += `<th>${M(l, t)}</th>`;
    s += "</tr></thead>";
  }
  if (i.length > 0) {
    s += "<tbody>";
    for (const l of i) {
      s += "<tr>";
      for (const c of l)
        s += `<td>${M(c, t)}</td>`;
      s += "</tr>";
    }
    s += "</tbody>";
  }
  return s += "</table>", s;
}
const en = {
  javascript: _,
  js: _,
  typescript: () => _({ typescript: !0 }),
  ts: () => _({ typescript: !0 }),
  jsx: () => _({ jsx: !0 }),
  tsx: () => _({ jsx: !0, typescript: !0 }),
  python: Oe,
  py: Oe,
  css: It,
  html: At,
  json: $t
};
function Z(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function tn(e, t) {
  const n = en[t == null ? void 0 : t.toLowerCase()];
  if (!n)
    return Z(e);
  const r = n().language.parser.parse(e);
  let i = "", a = 0;
  return Bt(r, Wt, (s, l, c) => {
    s > a && (i += Z(e.slice(a, s))), i += `<span class="${c}">${Z(e.slice(s, l))}</span>`, a = l;
  }), a < e.length && (i += Z(e.slice(a))), i;
}
const at = H.define({
  combine(e) {
    return e.length > 0 ? e[e.length - 1] : !0;
  }
}), me = ot, lt = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX!?>i*<])\]/;
function nn(e) {
  if (!Array.isArray(e))
    return [...me];
  const t = [], n = /* @__PURE__ */ new Set();
  for (const o of e) {
    if (typeof o != "string" || o.length === 0) continue;
    const r = o.toLowerCase();
    me.includes(r) && (n.has(r) || (n.add(r), t.push(r)));
  }
  return t;
}
function on(e) {
  return [" ", "x", ...e];
}
function dt(e, t) {
  const n = nn(t);
  return {
    enableCustomTasks: e === !0,
    customTaskTypes: n,
    customTaskTypeSet: new Set(n),
    taskCycle: on(n)
  };
}
const ee = H.define({
  combine(e) {
    return e.length === 0 ? dt(!1, me) : e[e.length - 1];
  }
});
function mt(e, t, n) {
  const o = e === !0;
  return {
    enableWikiLinks: o,
    renderWikiLinks: o && t !== !1,
    onWikiLinkClick: typeof n == "function" ? n : null
  };
}
const j = H.define({
  combine(e) {
    return e.length === 0 ? mt(!1, !1, null) : e[e.length - 1];
  }
});
function ft(e, t) {
  return { enableTags: e === !0, onTagClick: typeof t == "function" ? t : null };
}
const re = H.define({
  combine(e) {
    return e.length === 0 ? ft(!1, null) : e[e.length - 1];
  }
});
function rn(e, t) {
  const n = e.match(lt);
  if (!n) return null;
  const o = n[2].toLowerCase();
  return o === " " || o === "x" || t.enableCustomTasks && t.customTaskTypeSet.has(o) ? o : null;
}
function sn(e, t) {
  if (!Array.isArray(t) || t.length === 0) return e;
  const n = t.indexOf(e);
  return n === -1 ? t[0] : t[(n + 1) % t.length];
}
function cn(e, t) {
  return e.replace(lt, `$1[${t}]`);
}
function V(e) {
  return {
    raw: e.getAttribute("data-wikilink") || "",
    title: e.getAttribute("data-wikilink-title") || "",
    section: e.getAttribute("data-wikilink-section") || "",
    alias: e.getAttribute("data-wikilink-alias") || "",
    display: e.textContent || ""
  };
}
const pe = W.define(), ut = ne.define({
  create() {
    return /* @__PURE__ */ new Set();
  },
  update(e, t) {
    let n = e;
    for (const o of t.effects)
      o.is(pe) && (n = new Set(e), n.has(o.value) ? n.delete(o.value) : n.add(o.value));
    if (t.docChanged && n.size > 0) {
      const o = /* @__PURE__ */ new Set();
      for (const r of n) {
        const i = t.startState.doc;
        if (r <= i.lines) {
          const a = i.line(r), s = t.changes.mapPos(a.from), l = t.newDoc.lineAt(s).number, c = t.newDoc.line(l).text;
          /^#{1,6}\s/.test(c) && o.add(l);
        }
      }
      n = o;
    }
    return n;
  }
});
nt.initialize({
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
class an extends B {
  constructor(t, n, o) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-markdown-preview";
    const o = t.state.facet(ee), r = t.state.facet(j), i = t.state.facet(re);
    n.innerHTML = ct(this.content, {
      ...o,
      enableWikiLinks: r.renderWikiLinks,
      enableTags: i.enableTags
    });
    const a = this.lineFrom, s = this.lineTo, l = this.content;
    return n.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && i.onTagClick) {
        c.preventDefault(), c.stopPropagation(), i.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-footnote]");
      if (m) {
        c.preventDefault(), c.stopPropagation();
        const x = m.getAttribute("data-footnote"), S = t.state.doc;
        for (let T = 1; T <= S.lines; T++) {
          const N = S.line(T);
          if (N.text.match(new RegExp(`^\\[\\^${x}\\]:`))) {
            t.dispatch({
              selection: { anchor: N.from },
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
        const x = f.getAttribute("data-footnote-ref"), S = t.state.doc;
        for (let T = 1; T <= S.lines; T++) {
          const N = S.line(T);
          if (N.text.match(new RegExp(`\\[\\^${x}\\](?!:)`))) {
            t.dispatch({
              selection: { anchor: N.from },
              scrollIntoView: !0
            }), t.focus();
            return;
          }
        }
        return;
      }
      const u = c.target.closest("[data-wikilink]");
      if (u && r.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), r.onWikiLinkClick(V(u));
        return;
      }
      const k = c.target.closest("a");
      if (k && k.href) {
        c.preventDefault(), c.stopPropagation(), window.open(k.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (c.target.closest('input[type="checkbox"], .md-task-icon')) {
        c.preventDefault(), c.stopPropagation();
        const x = t.state.facet(ee), S = rn(l, x);
        if (!S)
          return;
        const T = x.enableCustomTasks ? sn(S, x.taskCycle) : S === "x" ? " " : "x", N = cn(l, T);
        N !== l && t.dispatch({
          changes: { from: a, to: s, insert: N },
          annotations: R.of(!0)
        });
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const C = n.getBoundingClientRect(), b = c.clientX - C.left, w = C.width, g = l.length;
      let L;
      if (w > 0 && g > 0) {
        const x = b / w;
        L = Math.round(x * g), L = Math.max(0, Math.min(L, g));
      } else
        L = 0;
      const v = a + L;
      t.dispatch({
        selection: { anchor: v },
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
class ln extends B {
  constructor(t, n, o, r, i, a, s) {
    super(), this.content = t, this.lineFrom = n, this.lineTo = o, this.lineNumber = r, this.level = i, this.isCollapsed = a, this.hasContent = s;
  }
  toDOM(t) {
    const n = document.createElement("span");
    if (n.className = "cm-markdown-preview cm-heading-preview", this.hasContent) {
      const c = document.createElement("span");
      c.className = `cm-collapse-toggle ${this.isCollapsed ? "collapsed" : "expanded"}`, c.textContent = "›", c.title = this.isCollapsed ? "Expand" : "Collapse";
      const d = this.lineNumber;
      c.addEventListener("click", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation(), t.dispatch({
          effects: pe.of(d)
        });
      }), c.addEventListener("mousedown", (m) => {
        m.preventDefault(), m.stopPropagation(), m.stopImmediatePropagation();
      }), n.appendChild(c);
    }
    const o = document.createElement("span"), r = t.state.facet(ee), i = t.state.facet(j), a = t.state.facet(re);
    o.innerHTML = ct(this.content, {
      ...r,
      enableWikiLinks: i.renderWikiLinks,
      enableTags: a.enableTags
    }), n.appendChild(o);
    const s = this.lineFrom;
    this.lineTo;
    const l = this.content;
    return o.addEventListener("mousedown", (c) => {
      const d = c.target.closest("[data-tag]");
      if (d && a.onTagClick) {
        c.preventDefault(), c.stopPropagation(), a.onTagClick(d.getAttribute("data-tag"));
        return;
      }
      const m = c.target.closest("[data-wikilink]");
      if (m && i.onWikiLinkClick) {
        c.preventDefault(), c.stopPropagation(), i.onWikiLinkClick(V(m));
        return;
      }
      const f = c.target.closest("a");
      if (f && f.href) {
        c.preventDefault(), c.stopPropagation(), window.open(f.href, "_blank", "noopener,noreferrer");
        return;
      }
      c.preventDefault(), c.stopPropagation();
      const u = o.getBoundingClientRect(), k = c.clientX - u.left, h = u.width, C = l.length;
      let b;
      if (h > 0 && C > 0) {
        const g = k / h;
        b = Math.round(g * C), b = Math.max(0, Math.min(b, C));
      } else
        b = 0;
      const w = s + b;
      t.dispatch({
        selection: { anchor: w },
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
function D(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e.selection.ranges) {
    const o = e.doc.lineAt(n.from).number, r = e.doc.lineAt(n.to).number;
    for (let i = o; i <= r; i++)
      t.add(i);
  }
  return t;
}
function dn(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...")
      return { start: 1, end: n };
  }
  return null;
}
function mn(e) {
  const t = [];
  let n = !1, o = 0, r = "";
  for (let i = 1; i <= e.lines; i++) {
    const s = e.line(i).text;
    s.startsWith("```") && (n ? (t.push({ start: o, end: i, language: r }), n = !1, r = "") : (n = !0, o = i, r = s.slice(3).trim()));
  }
  return n && t.push({ start: o, end: e.lines, language: r }), t;
}
function fn(e, t) {
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
function un(e, t) {
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
function pt(e) {
  return /^(\s{2,}|\t)/.test(e);
}
function pn(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const i = e.line(o).text.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!i) continue;
    const a = i[1];
    let s = o;
    for (let l = o + 1; l <= e.lines && !t.has(l); l++) {
      const c = e.line(l).text;
      if (!pt(c))
        break;
      s = l;
    }
    n.push({ start: o, end: s, id: a }), o = s;
  }
  return n;
}
function hn(e, t, n) {
  const o = [], r = (a) => /^\s*:\s*/.test(a), i = (a) => {
    if (!a.trim() || /^\s/.test(a) || /^[-*+]\s+/.test(a) || /^\d+\.\s+/.test(a) || /^>/.test(a) || /^#{1,6}\s+/.test(a)) return !1;
    const s = a.trim();
    return !(s.startsWith("|") && s.endsWith("|") || /^\[\^([^\]]+)\]:/.test(a));
  };
  for (let a = 1; a <= e.lines; a++) {
    if (t.has(a) || n.has(a)) continue;
    const s = e.line(a).text;
    if (!i(s)) continue;
    const l = a + 1;
    if (l > e.lines || t.has(l) || n.has(l)) continue;
    const c = e.line(l).text;
    if (!r(c)) continue;
    let d = l;
    for (let m = l + 1; m <= e.lines && !(t.has(m) || n.has(m)); m++) {
      const f = e.line(m).text;
      if (r(f) || pt(f)) {
        d = m;
        continue;
      }
      break;
    }
    o.push({ start: a, end: d }), a = d;
  }
  return o;
}
function O(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of e)
    for (let o = n.start; o <= n.end; o++)
      t.add(o);
  return t;
}
function kn(e, t) {
  const n = [];
  for (let o = 1; o <= e.lines; o++) {
    if (t.has(o)) continue;
    const i = e.line(o).text.match(/^(#{1,6})\s+/);
    i && n.push({
      line: o,
      level: i[1].length,
      endLine: e.lines
      // Will be adjusted in second pass
    });
  }
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    for (let i = o + 1; i < n.length; i++)
      if (n[i].level <= r.level) {
        r.endLine = n[i].line - 1;
        break;
      }
  }
  return n;
}
function gn(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e)
    for (let o = n.line + 1; o <= n.endLine; o++)
      t.has(o) || t.set(o, n.line);
  return t;
}
const y = ne.define({
  create(e) {
    return He(e.doc);
  },
  update(e, t) {
    return t.docChanged ? He(t.newDoc) : e;
  }
});
function He(e) {
  const t = dn(e), n = t ? O([t]) : /* @__PURE__ */ new Set(), o = mn(e), r = O(o), i = fn(e, r), a = O(i), s = un(e, r), l = O(s), c = pn(e, r), d = O(c), m = hn(e, r, d), f = O(m), u = o.filter((b) => b.language === "mermaid"), k = O(u), h = kn(e, r), C = gn(h);
  return {
    frontmatter: t,
    frontmatterLines: n,
    codeBlocks: o,
    codeBlockLines: r,
    mathBlocks: i,
    mathBlockLines: a,
    tables: s,
    tableLines: l,
    footnoteBlocks: c,
    footnoteBlockLines: d,
    definitionLists: m,
    definitionListLines: f,
    mermaidBlocks: u,
    mermaidBlockLines: k,
    headings: h,
    headingMap: C
  };
}
class bn extends B {
  constructor(t, n, o) {
    super(), this.content = t, this.mathFrom = n, this.mathTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-math-preview", n.innerHTML = Yt(this.content);
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
class wn extends B {
  constructor(t, n, o) {
    super(), this.content = t, this.mermaidFrom = n, this.mermaidTo = o, this.id = "mermaid-" + Math.random().toString(36).substr(2, 9);
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-mermaid-preview";
    const o = this.mermaidFrom, r = this.content, i = this.id;
    return (async () => {
      try {
        const { svg: a } = await nt.render(i, r);
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
class Cn extends B {
  constructor(t, n, o) {
    super(), this.rows = t, this.tableFrom = n, this.tableTo = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-table-preview";
    const o = t.state.facet(j);
    n.innerHTML = Qt(this.rows, { enableWikiLinks: o.renderWikiLinks });
    const r = this.tableFrom;
    return n.addEventListener("mousedown", (i) => {
      const a = i.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        i.preventDefault(), i.stopPropagation(), o.onWikiLinkClick(V(a));
        return;
      }
      i.preventDefault(), i.stopPropagation(), t.dispatch({
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
class xn extends B {
  constructor(t, n, o, r) {
    super(), this.id = t, this.lines = n, this.from = o, this.to = r;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-footnote-preview";
    const o = t.state.facet(j);
    n.innerHTML = Zt(this.id, this.lines, { enableWikiLinks: o.renderWikiLinks });
    const r = this.from;
    return n.addEventListener("mousedown", (i) => {
      const a = i.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        i.preventDefault(), i.stopPropagation(), o.onWikiLinkClick(V(a));
        return;
      }
      const s = i.target.closest("[data-footnote-ref]");
      if (s) {
        i.preventDefault(), i.stopPropagation();
        const l = s.getAttribute("data-footnote-ref"), c = t.state.doc;
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
      i.preventDefault(), i.stopPropagation(), t.dispatch({
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
class yn extends B {
  constructor(t, n, o) {
    super(), this.lines = t, this.from = n, this.to = o;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-definition-list-preview";
    const o = t.state.facet(j);
    n.innerHTML = Jt(this.lines, { enableWikiLinks: o.renderWikiLinks });
    const r = this.from;
    return n.addEventListener("mousedown", (i) => {
      const a = i.target.closest("[data-wikilink]");
      if (a && o.onWikiLinkClick) {
        i.preventDefault(), i.stopPropagation(), o.onWikiLinkClick(V(a));
        return;
      }
      i.preventDefault(), i.stopPropagation(), t.dispatch({
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
function Ln(e, t, n) {
  for (const o of t)
    if (n.has(o.line) && e > o.line && e <= o.endLine)
      return !0;
  return !1;
}
function vn(e, t) {
  for (const n of t)
    if (n.line === e)
      return n;
  return null;
}
function je(e, t) {
  const { state: n } = e, r = e.hasFocus ? D(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: i,
    codeBlockLines: a,
    tableLines: s,
    mathBlockLines: l,
    footnoteBlockLines: c,
    definitionListLines: d,
    headings: m
  } = t, f = [], u = n.facet(at), k = u ? n.field(ut) : /* @__PURE__ */ new Set();
  for (const { from: h, to: C } of e.visibleRanges) {
    const b = n.doc.lineAt(h).number, w = n.doc.lineAt(C).number;
    for (let g = b; g <= w; g++) {
      if (u && Ln(g, m, k)) {
        const x = n.doc.line(g);
        f.push(
          p.line({ class: "cm-collapsed-line" }).range(x.from)
        );
        continue;
      }
      if (i.has(g) || r.has(g) || a.has(g) || s.has(g) || l.has(g) || c.has(g) || d.has(g))
        continue;
      const L = n.doc.line(g), v = L.text;
      if (!ht(v) && v.trim()) {
        if (u) {
          const x = vn(g, m);
          if (x) {
            const S = x.endLine > x.line, T = k.has(g);
            f.push(
              p.replace({
                widget: new ln(
                  v,
                  L.from,
                  L.to,
                  g,
                  x.level,
                  T,
                  S
                ),
                inclusive: !1,
                block: !1
              }).range(L.from, L.to)
            );
            continue;
          }
        }
        f.push(
          p.replace({
            widget: new an(v, L.from, L.to),
            inclusive: !1,
            block: !1
          }).range(L.from, L.to)
        );
      }
    }
  }
  return p.set(f, !0);
}
function _e(e, t) {
  if (!e.state.facet(j).enableWikiLinks)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, r = D(o), { codeBlockLines: i } = t, a = [];
  for (const { from: s, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(s).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!r.has(m) || i.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("[[")) continue;
      const u = Ot(f.text);
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
const Sn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = je(e, t);
    }
    update(e) {
      const t = e.transactions.some(
        (n) => n.effects.some((o) => o.is(pe))
      );
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged || t) {
        const n = e.state.field(y);
        this.decorations = je(e.view, n);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), Tn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = _e(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = _e(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function qe(e, t) {
  if (!e.state.facet(re).enableTags)
    return p.none;
  if (!e.hasFocus)
    return p.none;
  const { state: o } = e, r = D(o), { codeBlockLines: i } = t, a = [];
  for (const { from: s, to: l } of e.visibleRanges) {
    const c = o.doc.lineAt(s).number, d = o.doc.lineAt(l).number;
    for (let m = c; m <= d; m++) {
      if (!r.has(m) || i.has(m)) continue;
      const f = o.doc.line(m);
      if (!f.text.includes("#")) continue;
      const u = zt(f.text);
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
const En = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = qe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = qe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
class Fn extends B {
  constructor(t, n, o, r) {
    super(), this.content = t, this.language = n, this.lineFrom = o, this.lineTo = r;
  }
  toDOM(t) {
    const n = document.createElement("span");
    n.className = "cm-highlighted-code", n.innerHTML = tn(this.content, this.language);
    const o = this.lineFrom;
    this.lineTo;
    const r = this.content;
    return n.addEventListener("mousedown", (i) => {
      i.preventDefault(), i.stopPropagation();
      const a = n.getBoundingClientRect(), s = i.clientX - a.left, l = a.width, c = r.length;
      let d = 0;
      if (l > 0 && c > 0) {
        const f = s / l;
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
function Ke(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { codeBlocks: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    if (s.language === "mermaid")
      continue;
    let l = !1;
    for (let d = s.start; d <= s.end; d++)
      if (a.has(d)) {
        l = !0;
        break;
      }
    const c = s.end - s.start > 1;
    for (let d = s.start; d <= s.end; d++) {
      const m = n.doc.line(d), f = d === s.start || d === s.end;
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
          widget: new Fn(m.text, s.language, m.from, m.to)
        }).range(m.from, m.to)
      );
    }
  }
  return p.set(r, !0);
}
const Mn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ke(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ke(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ve(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { tables: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    let l = !1;
    for (let c = s.start; c <= s.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = s.start; c <= s.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-table-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = s.start; m <= s.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(s.start);
      r.push(
        p.replace({
          widget: new Cn(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = s.start + 1; m <= s.end; m++) {
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
const Rn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ve(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ve(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ue(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { footnoteBlocks: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    let l = !1;
    for (let c = s.start; c <= s.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = s.start; c <= s.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-footnote-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = s.start; m <= s.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(s.start);
      r.push(
        p.replace({
          widget: new xn(s.id, c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = s.start + 1; m <= s.end; m++) {
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
const Nn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ue(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ue(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Xe(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { definitionLists: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    let l = !1;
    for (let c = s.start; c <= s.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = s.start; c <= s.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-definition-list-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let m = s.start; m <= s.end; m++)
        c.push(n.doc.line(m).text);
      const d = n.doc.line(s.start);
      r.push(
        p.replace({
          widget: new yn(c, d.from, d.to)
        }).range(d.from, d.to)
      );
      for (let m = s.start + 1; m <= s.end; m++) {
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
const Dn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Xe(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Xe(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ye(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { mathBlocks: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    let l = !1;
    for (let c = s.start; c <= s.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = s.start; c <= s.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-math-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = s.start + 1; f < s.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(s.start);
      r.push(
        p.replace({
          widget: new bn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = s.start + 1; f <= s.end; f++) {
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
const Bn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ye(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ye(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Ge(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], { mermaidBlocks: i } = t, a = o ? D(n) : /* @__PURE__ */ new Set();
  for (const s of i) {
    let l = !1;
    for (let c = s.start; c <= s.end; c++)
      if (a.has(c)) {
        l = !0;
        break;
      }
    if (l)
      for (let c = s.start; c <= s.end; c++) {
        const d = n.doc.line(c);
        r.push(
          p.line({ class: "cm-mermaid-block-line" }).range(d.from)
        );
      }
    else {
      const c = [];
      for (let f = s.start + 1; f < s.end; f++)
        c.push(n.doc.line(f).text);
      const d = c.join(`
`), m = n.doc.line(s.start);
      r.push(
        p.replace({
          widget: new wn(d, m.from, m.to)
        }).range(m.from, m.to)
      );
      for (let f = s.start + 1; f <= s.end; f++) {
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
const Wn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ge(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ge(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), In = /^!\[([^\]]*)\]\(([^)]+)\)$/;
function ht(e) {
  const t = e.trim().match(In);
  return t ? { alt: t[1], url: t[2].trim() } : null;
}
class An extends B {
  constructor(t, n, o, r) {
    super(), this.alt = t, this.url = n, this.lineFrom = o, this.lineTo = r;
  }
  toDOM(t) {
    const n = document.createElement("div");
    n.className = "cm-image-preview";
    const o = document.createElement("img");
    if (o.src = this.url, o.alt = this.alt, o.loading = "lazy", o.addEventListener("error", () => {
      n.textContent = "";
      const i = document.createElement("div");
      i.className = "cm-image-error", i.textContent = `Image not found: ${this.url}`, n.appendChild(i);
    }), n.appendChild(o), this.alt) {
      const i = document.createElement("span");
      i.className = "cm-image-alt", i.textContent = this.alt, n.appendChild(i);
    }
    const r = this.lineFrom;
    return n.addEventListener("mousedown", (i) => {
      i.preventDefault(), i.stopPropagation(), t.dispatch({
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
function Ze(e, t) {
  const { state: n } = e, o = e.hasFocus, r = [], i = o ? D(n) : /* @__PURE__ */ new Set(), {
    frontmatterLines: a,
    codeBlockLines: s,
    tableLines: l,
    mathBlockLines: c,
    footnoteBlockLines: d,
    definitionListLines: m,
    mermaidBlockLines: f
  } = t;
  for (const { from: u, to: k } of e.visibleRanges) {
    const h = n.doc.lineAt(u).number, C = n.doc.lineAt(k).number;
    for (let b = h; b <= C; b++) {
      if (i.has(b) || a.has(b) || s.has(b) || l.has(b) || c.has(b) || d.has(b) || m.has(b) || f.has(b)) continue;
      const w = n.doc.line(b), g = ht(w.text);
      g && r.push(
        p.replace({
          widget: new An(g.alt, g.url, w.from, w.to)
        }).range(w.from, w.to)
      );
    }
  }
  return p.set(r, !0);
}
const $n = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Ze(e, t);
    }
    update(e) {
      if (e.docChanged || e.selectionSet || e.viewportChanged || e.focusChanged) {
        const t = e.state.field(y);
        this.decorations = Ze(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
), q = W.define(), K = ne.define({
  create() {
    return !1;
  },
  update(e, t) {
    for (const n of t.effects)
      if (n.is(q))
        return n.value;
    return e;
  }
});
function $(e) {
  return !e || typeof e != "object" || Object.keys(e).length === 0 ? "" : et.dump(e, {
    indent: 2,
    lineWidth: -1,
    noRefs: !0,
    quotingType: '"',
    forceQuotes: !1
  }).trimEnd();
}
function Pn(e, t, n, o, r, i) {
  const a = document.createElement("span");
  if (a.className = "cm-frontmatter-value", typeof t == "boolean") {
    const l = document.createElement("input");
    return l.type = "checkbox", l.checked = t, l.className = "cm-frontmatter-checkbox", l.addEventListener("change", (c) => {
      c.stopPropagation();
      const d = { ...n, [e]: l.checked }, m = $(d);
      i.dispatch({
        changes: { from: o, to: r, insert: m },
        annotations: R.of(!0)
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
        const h = { ...n, [e]: u }, C = $(h);
        i.dispatch({
          changes: { from: o, to: r, insert: C },
          annotations: R.of(!0)
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
      i.dispatch({
        changes: { from: o, to: r, insert: f },
        annotations: R.of(!0)
      });
    }), a.appendChild(l), a;
  }
  if (t !== null && typeof t == "object") {
    const l = document.createElement("input");
    return l.type = "text", l.className = "cm-frontmatter-input", l.value = JSON.stringify(t), l.addEventListener("blur", (c) => {
      c.stopPropagation();
      try {
        const d = JSON.parse(l.value), m = { ...n, [e]: d }, f = $(m);
        i.dispatch({
          changes: { from: o, to: r, insert: f },
          annotations: R.of(!0)
        });
      } catch {
        l.value = JSON.stringify(t);
      }
    }), l.addEventListener("keydown", (c) => {
      c.key === "Enter" && (c.preventDefault(), l.blur()), c.stopPropagation();
    }), l.addEventListener("mousedown", (c) => c.stopPropagation()), a.appendChild(l), a;
  }
  const s = document.createElement("input");
  return s.type = "text", s.className = "cm-frontmatter-input", s.value = t === null ? "" : String(t), s.placeholder = t === null ? "empty" : "", s.addEventListener("blur", (l) => {
    l.stopPropagation();
    const c = s.value;
    let d;
    c === "" || c === "null" ? d = null : c === "true" ? d = !0 : c === "false" ? d = !1 : !isNaN(c) && c.trim() !== "" ? d = Number(c) : d = c;
    const m = { ...n, [e]: d }, f = $(m);
    i.dispatch({
      changes: { from: o, to: r, insert: f },
      annotations: R.of(!0)
    });
  }), s.addEventListener("keydown", (l) => {
    l.key === "Enter" && (l.preventDefault(), s.blur()), l.stopPropagation();
  }), s.addEventListener("mousedown", (l) => l.stopPropagation()), a.appendChild(s), a;
}
function On(e, t, n, o, r, i = {}) {
  const { knownKeys: a = [] } = i, s = document.createElement("div");
  s.className = "cm-frontmatter-preview";
  let l;
  try {
    l = et.load(e);
  } catch {
    const h = document.createElement("div");
    return h.className = "cm-frontmatter-error", h.textContent = "Invalid YAML frontmatter — click to edit", s.appendChild(h), { dom: s, error: !0 };
  }
  (!l || typeof l != "object") && (l = {});
  const c = document.createElement("table");
  c.className = "cm-frontmatter-table";
  const d = "cm-fm-keys-" + Math.random().toString(36).slice(2, 8), m = document.createElement("datalist");
  m.id = d;
  const f = new Set(Object.keys(l));
  for (const h of a)
    if (!f.has(h)) {
      const C = document.createElement("option");
      C.value = h, m.appendChild(C);
    }
  s.appendChild(m);
  const u = Object.keys(l);
  for (const h of u) {
    const C = document.createElement("tr"), b = document.createElement("td");
    b.className = "cm-frontmatter-key";
    const w = document.createElement("input");
    w.type = "text", w.className = "cm-frontmatter-key-input", w.value = h, w.size = Math.max(h.length, 1), w.spellcheck = !1, w.setAttribute("list", d), w.addEventListener("blur", (x) => {
      x.stopPropagation();
      const S = w.value.trim();
      if (S === "" || S === h) {
        w.value = h;
        return;
      }
      const T = {};
      for (const Y of Object.keys(l))
        Y === h ? T[S] = l[Y] : T[Y] = l[Y];
      const N = $(T);
      r.dispatch({
        changes: { from: t, to: n, insert: N },
        annotations: R.of(!0)
      });
    }), w.addEventListener("keydown", (x) => {
      x.key === "Enter" && (x.preventDefault(), w.blur()), x.stopPropagation();
    }), w.addEventListener("mousedown", (x) => x.stopPropagation()), b.appendChild(w), C.appendChild(b);
    const g = document.createElement("td");
    g.className = "cm-frontmatter-value-cell", g.appendChild(
      Pn(h, l[h], l, t, n, r)
    ), C.appendChild(g);
    const L = document.createElement("td");
    L.className = "cm-frontmatter-action-cell";
    const v = document.createElement("span");
    v.className = "cm-frontmatter-delete", v.textContent = "×", v.title = "Remove property", v.addEventListener("mousedown", (x) => {
      x.preventDefault(), x.stopPropagation();
    }), v.addEventListener("click", (x) => {
      x.stopPropagation();
      const S = { ...l };
      delete S[h];
      const T = $(S);
      r.dispatch({
        changes: { from: t, to: n, insert: T },
        annotations: R.of(!0)
      });
    }), L.appendChild(v), C.appendChild(L), c.appendChild(C);
  }
  s.appendChild(c);
  const k = document.createElement("div");
  return k.className = "cm-frontmatter-add", k.textContent = "+ Add property", k.addEventListener("mousedown", (h) => {
    h.preventDefault(), h.stopPropagation();
  }), k.addEventListener("click", (h) => {
    h.stopPropagation();
    let C = "property", b = 1;
    for (; l[C] !== void 0; )
      C = `property${b}`, b++;
    const w = { ...l, [C]: "" }, g = $(w);
    r.dispatch({
      changes: { from: t, to: n, insert: g },
      annotations: R.of(!0)
    });
  }), s.appendChild(k), { dom: s, error: !1 };
}
function Je(e, t) {
  const { state: n } = e, { frontmatter: o } = t;
  if (!o)
    return p.none;
  const r = [], i = n.doc.line(o.start);
  r.push(
    p.replace({}).range(i.from, i.to)
  ), r.push(
    p.line({ class: "cm-hidden-line" }).range(i.from)
  );
  for (let a = o.start + 1; a <= o.end; a++) {
    const s = n.doc.line(a);
    r.push(
      p.line({ class: "cm-hidden-line" }).range(s.from),
      p.replace({}).range(s.from, s.to)
    );
  }
  return p.set(r, !0);
}
const zn = F.fromClass(
  class {
    constructor(e) {
      const t = e.state.field(y);
      this.decorations = Je(e, t);
    }
    update(e) {
      if (e.docChanged) {
        const t = e.state.field(y);
        this.decorations = Je(e.view, t);
      }
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function he(e = {}) {
  const {
    enableCollapse: t = !0,
    enableCustomTasks: n = !1,
    customTaskTypes: o,
    enableWikiLinks: r = !1,
    renderWikiLinks: i = !0,
    onWikiLinkClick: a,
    enableTags: s = !1,
    onTagClick: l
  } = e, c = dt(n, o), d = mt(r, i, a), m = ft(s, l);
  return [
    // Configuration facet for collapse functionality
    at.of(t),
    // Configuration facet for custom task types
    ee.of(c),
    // Configuration facet for wiki links
    j.of(d),
    // Configuration facet for tags
    re.of(m),
    // State for tracking collapsed headings (always included, but only used if collapse enabled)
    ut,
    // Frontmatter sheet open/closed state
    K,
    // Shared state for block ranges (computed once per doc change)
    y,
    // ViewPlugins that read from the shared state
    zn,
    $n,
    Sn,
    Tn,
    En,
    Mn,
    Rn,
    Nn,
    Dn,
    Bn,
    Wn
  ];
}
function Hn(e) {
  requestAnimationFrame(() => {
    const t = e.dom.querySelector(".cm-search"), n = t == null ? void 0 : t.querySelector('input[name="replace"]');
    n instanceof HTMLInputElement && (n.focus(), n.select());
  });
}
function J(e, t, n) {
  const { from: o, to: r } = e.state.selection.main, i = e.state.sliceDoc(o, r);
  e.dispatch({
    changes: { from: o, to: r, insert: t + i + n },
    selection: { anchor: o + t.length, head: r + t.length }
  });
}
function jn(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n);
  e.dispatch({
    changes: { from: o.from, to: o.from, insert: t }
  });
}
function se(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), i = o.text.match(/^(#{1,6})\s/), a = "#".repeat(t) + " ";
  if (i) {
    const s = i[0];
    s === a ? e.dispatch({
      changes: { from: o.from, to: o.from + s.length, insert: "" }
    }) : e.dispatch({
      changes: { from: o.from, to: o.from + s.length, insert: a }
    });
  } else
    e.dispatch({
      changes: { from: o.from, to: o.from, insert: a }
    });
}
function ce(e, t) {
  const { from: n } = e.state.selection.main, o = e.state.doc.lineAt(n), r = o.text, i = r.match(/^(-|\*|\+)\s(?!\[[ xX]\])/), a = r.match(/^(\d+)\.\s/), s = r.match(/^(-|\*|\+)\s\[[ xX]\]\s/), c = {
    bullet: "- ",
    numbered: "1. ",
    task: "- [ ] "
  }[t];
  let d = null, m = null;
  s ? (d = s[0], m = "task") : a ? (d = a[0], m = "numbered") : i && (d = i[0], m = "bullet"), d ? m === t ? e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: "" }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from + d.length, insert: c }
  }) : e.dispatch({
    changes: { from: o.from, to: o.from, insert: c }
  });
}
function _n(e) {
  const { from: t, to: n } = e.state.selection.main;
  return t !== n ? e.state.sliceDoc(t, n) : null;
}
const z = {
  undo(e) {
    yt(e);
  },
  redo(e) {
    xt(e);
  },
  search(e) {
    Pe(e);
  },
  replace(e) {
    Pe(e), Hn(e);
  },
  selectNextOccurrence(e) {
    $e(e);
  },
  selectAllOccurrences(e) {
    e.state.selection.main.empty && $e(e), Ft(e);
  },
  bold(e) {
    J(e, "**", "**");
  },
  italic(e) {
    J(e, "_", "_");
  },
  strikethrough(e) {
    J(e, "~~", "~~");
  },
  h1(e) {
    se(e, 1);
  },
  h2(e) {
    se(e, 2);
  },
  h3(e) {
    se(e, 3);
  },
  link(e) {
    const t = _n(e), n = "https://example.com";
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
    ce(e, "bullet");
  },
  numberedList(e) {
    ce(e, "numbered");
  },
  taskList(e) {
    ce(e, "task");
  },
  inlineCode(e) {
    J(e, "`", "`");
  },
  codeBlock(e) {
    const { from: t, to: n } = e.state.selection.main, o = e.state.sliceDoc(t, n), i = o ? "```\n" + o + "\n```" : "```" + `javascript
function hello() {
  alert("hello world");
}
hello();` + "\n```";
    e.dispatch({
      changes: { from: t, to: n, insert: i },
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
    jn(e, "> ");
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
}, qn = Qe.of([
  {
    key: "Mod-b",
    run: (e) => (z.bold(e), !0)
  },
  {
    key: "Mod-i",
    run: (e) => (z.italic(e), !0)
  },
  {
    key: "Mod-k",
    run: (e) => (z.link(e), !0)
  },
  {
    key: "Mod-`",
    run: (e) => (z.inlineCode(e), !0)
  },
  {
    key: "Mod-Shift-`",
    run: (e) => (z.codeBlock(e), !0)
  }
]), Kn = p.line({ class: "cm-selectedLine" }), ke = F.fromClass(
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
        const i = o.doc.lineAt(r.from).number, a = o.doc.lineAt(r.to).number;
        for (let s = i; s <= a; s++)
          n.add(s);
      }
      for (const r of n) {
        const i = o.doc.line(r);
        t.push(Kn.range(i.from));
      }
      return p.set(t, !0);
    }
  },
  {
    decorations: (e) => e.decorations
  }
), ge = F.fromClass(
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
          const r = t.scrollDOM.getBoundingClientRect(), i = r.top + r.height / 2, a = o.top - i;
          return Math.abs(a) < 2 ? null : a;
        },
        write: (t, n) => {
          t != null && n.scrollDOM.scrollBy({ top: t, behavior: "auto" });
        }
      });
    }
  }
), Vn = p.line({ class: "cm-unfocused-line" });
function Un(e, t) {
  const n = e.lineAt(t);
  let o = n.number, r = n.number;
  for (; o > 1 && e.line(o - 1).text.trim() !== ""; )
    o--;
  for (; r < e.lines && e.line(r + 1).text.trim() !== ""; )
    r++;
  return { from: o, to: r };
}
const be = F.fromClass(
  class {
    constructor(e) {
      this.decorations = this.buildDecorations(e);
    }
    update(e) {
      (e.selectionSet || e.docChanged || e.focusChanged) && (this.decorations = this.buildDecorations(e.view));
    }
    buildDecorations(e) {
      if (!e.hasFocus)
        return Ae.empty;
      const t = e.state.doc, n = /* @__PURE__ */ new Set();
      for (const r of e.state.selection.ranges) {
        const i = Un(t, r.head);
        for (let a = i.from; a <= i.to; a++)
          n.add(a);
      }
      const o = [];
      for (let r = 1; r <= t.lines; r++)
        if (!n.has(r)) {
          const i = t.line(r);
          o.push(Vn.range(i.from));
        }
      return Ae.of(o);
    }
  },
  {
    decorations: (e) => e.decorations
  }
);
function Xn(e, t) {
  const n = e.toString(), o = n.split(/\s+/).filter((d) => d.length > 0).length, r = n.length, i = n.replace(/\s/g, "").length, a = Math.max(1, Math.ceil(o / 238));
  let s = 0, l = 0;
  const c = t && !t.main.empty;
  if (c) {
    const d = e.sliceString(t.main.from, t.main.to);
    s = d.split(/\s+/).filter((m) => m.length > 0).length, l = d.length;
  }
  return { words: o, chars: r, charsNoSpaces: i, readingTime: a, selWords: s, selChars: l, hasSelection: c };
}
function Yn(e) {
  return e < 1 ? "< 1 min read" : e === 1 ? "1 min read" : `${e} min read`;
}
function ae(e, t) {
  const n = document.createElement("span");
  n.className = "cm-word-count-stat";
  const o = document.createElement("span");
  o.className = "cm-word-count-value", o.textContent = t;
  const r = document.createElement("span");
  return r.className = "cm-word-count-label", r.textContent = ` ${e}`, n.appendChild(o), n.appendChild(r), n;
}
function le() {
  const e = document.createElement("span");
  return e.className = "cm-word-count-divider", e;
}
function Gn(e) {
  const t = document.createElement("div");
  t.className = "cm-word-count-panel";
  function n(o) {
    const r = Xn(o.doc, o.selection);
    if (t.textContent = "", t.appendChild(ae("words", r.words.toLocaleString())), t.appendChild(le()), t.appendChild(ae("characters", r.chars.toLocaleString())), t.appendChild(le()), t.appendChild(ae("", Yn(r.readingTime))), r.hasSelection) {
      t.appendChild(le());
      const i = document.createElement("span");
      i.className = "cm-word-count-stat cm-word-count-selection";
      const a = document.createElement("span");
      a.className = "cm-word-count-value", a.textContent = `${r.selWords} words, ${r.selChars} chars`;
      const s = document.createElement("span");
      s.className = "cm-word-count-label", s.textContent = " selected", i.appendChild(a), i.appendChild(s), t.appendChild(i);
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
const we = fe.of(Gn), Q = H.define({
  combine(e) {
    return e.length === 0 ? { docTitle: null, onBacklinksRequested: null, onBacklinkClick: null } : e[e.length - 1];
  }
});
function Zn(e) {
  if (e.lines < 2 || e.line(1).text.trim() !== "---") return null;
  for (let n = 2; n <= e.lines; n++) {
    const o = e.line(n).text.trim();
    if (o === "---" || o === "...") {
      for (let r = 2; r < n; r++) {
        const a = e.line(r).text.match(/^title:\s*(.+)$/);
        if (a) {
          let s = a[1].trim();
          return (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) && (s = s.slice(1, -1)), s;
        }
      }
      return null;
    }
  }
  return null;
}
function de(e, t, n) {
  e.textContent = "";
  const o = document.createElement("span");
  if (o.className = "cm-backlinks-label", o.textContent = "Backlinks", e.appendChild(o), !t || t.length === 0) {
    const i = document.createElement("span");
    i.className = "cm-backlinks-empty", i.textContent = "None", e.appendChild(i);
    return;
  }
  const r = document.createElement("span");
  r.className = "cm-backlinks-list";
  for (const i of t) {
    const a = document.createElement("span");
    a.className = "cm-backlinks-link", a.textContent = i.title, i.excerpt && (a.title = i.excerpt), a.addEventListener("mousedown", (s) => {
      s.preventDefault(), n && n(i);
    }), r.appendChild(a);
  }
  e.appendChild(r);
}
function Jn(e) {
  const t = document.createElement("div");
  t.className = "cm-backlinks-panel", e.state.facet(Q);
  let n = null, o = 0;
  function r(a) {
    const s = a.facet(Q);
    return s.docTitle ? s.docTitle : Zn(a.doc);
  }
  async function i(a) {
    const s = a.facet(Q);
    if (!s.onBacklinksRequested) {
      t.textContent = "";
      return;
    }
    const l = r(a);
    if (l === n) return;
    if (n = l, !l) {
      de(t, [], s.onBacklinkClick);
      return;
    }
    t.textContent = "";
    const c = document.createElement("span");
    c.className = "cm-backlinks-label", c.textContent = "Backlinks", t.appendChild(c);
    const d = document.createElement("span");
    d.className = "cm-backlinks-empty", d.textContent = "Loading…", t.appendChild(d);
    const m = ++o;
    try {
      const f = await s.onBacklinksRequested(l);
      m === o && de(t, f, s.onBacklinkClick);
    } catch {
      m === o && de(t, [], s.onBacklinkClick);
    }
  }
  return i(e.state), {
    dom: t,
    top: !1,
    update(a) {
      a.docChanged && i(a.state);
    }
  };
}
const Ce = fe.of(Jn), kt = H.define({
  combine(e) {
    return e.length === 0 ? [] : e[e.length - 1];
  }
}), Qn = F.fromClass(
  class {
    constructor(e) {
      this.view = e, this.backdrop = null, this.sheet = null, this.escHandler = null, this.isOpen = e.state.field(K), this.isOpen && this.open();
    }
    update(e) {
      const t = this.isOpen;
      this.isOpen = e.state.field(K), !t && this.isOpen ? this.open() : t && !this.isOpen ? this.close() : this.isOpen && e.docChanged && this.rebuildContent();
    }
    open() {
      const e = this.view;
      this.backdrop = document.createElement("div"), this.backdrop.className = "cm-frontmatter-sheet-backdrop", this.backdrop.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: q.of(!1) });
      }), this.sheet = document.createElement("div"), this.sheet.className = "cm-frontmatter-sheet";
      const t = document.createElement("div");
      t.className = "cm-frontmatter-sheet-header";
      const n = document.createElement("span");
      n.className = "cm-frontmatter-sheet-title", n.textContent = "Properties", t.appendChild(n);
      const o = document.createElement("button");
      o.className = "cm-frontmatter-sheet-close", o.textContent = "×", o.title = "Close", o.addEventListener("mousedown", (r) => {
        r.preventDefault(), r.stopPropagation();
      }), o.addEventListener("click", (r) => {
        r.stopPropagation(), e.dispatch({ effects: q.of(!1) });
      }), t.appendChild(o), this.sheet.appendChild(t), this.contentEl = document.createElement("div"), this.contentEl.className = "cm-frontmatter-sheet-content", this.sheet.appendChild(this.contentEl), this.buildContent(), e.dom.appendChild(this.backdrop), e.dom.appendChild(this.sheet), e.scrollDOM.style.overflow = "hidden", this.escHandler = (r) => {
        r.key === "Escape" && (r.preventDefault(), r.stopPropagation(), e.dispatch({ effects: q.of(!1) }));
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
      const e = this.view.state, t = e.field(y), { frontmatter: n } = t;
      if (!n) {
        const m = document.createElement("div");
        m.className = "cm-frontmatter-sheet-empty", m.textContent = "No frontmatter in this document.", this.contentEl.appendChild(m);
        const f = document.createElement("button");
        f.className = "cm-frontmatter-sheet-add-btn", f.textContent = "Add Frontmatter", f.addEventListener("click", (u) => {
          u.stopPropagation(), this.view.dispatch({
            changes: { from: 0, to: 0, insert: `---
---
` },
            annotations: R.of(!0)
          });
        }), this.contentEl.appendChild(f);
        return;
      }
      const o = n.end - n.start > 1, r = o ? e.doc.line(n.start + 1).from : e.doc.line(n.start).to + 1, i = o ? e.doc.line(n.end - 1).to : r, a = [];
      for (let m = n.start + 1; m < n.end; m++)
        a.push(e.doc.line(m).text);
      const s = a.join(`
`), l = e.doc.line(n.start).from, c = this.view.state.facet(kt), { dom: d } = On(
        s,
        r,
        i,
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
);
if (typeof document < "u") {
  const e = document.createElement("style");
  e.textContent = "@keyframes cmFadeIn { from { opacity: 0 } to { opacity: 1 } }", document.head.appendChild(e);
}
const eo = P.baseTheme({
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
    opacity: "0.25",
    transition: "opacity 0.2s ease"
  }
}), to = P.theme({
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
  // Selected lines get dark styling (inverted)
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line": {
    backgroundColor: "#1e1e1e !important",
    color: "#d4d4d4 !important",
    caretColor: "#fff !important",
    borderRadius: "4px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.90em"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#1e1e1e !important",
    borderLeft: "3px solid #569cd6",
    color: "#d4d4d4 !important",
    caretColor: "#fff !important",
    borderRadius: "0"
  },
  // Syntax highlighting for selected code block lines (dark theme colors)
  ".cm-selectedLine.cm-code-block-line .tok-keyword": { color: "#569cd6 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-operator": { color: "#d4d4d4 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-variableName": { color: "#9cdcfe !important" },
  ".cm-selectedLine.cm-code-block-line .tok-function, .cm-selectedLine.cm-code-block-line .tok-definition": { color: "#dcdcaa !important" },
  ".cm-selectedLine.cm-code-block-line .tok-string, .cm-selectedLine.cm-code-block-line .tok-string2": { color: "#ce9178 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-number": { color: "#b5cea8 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-bool, .cm-selectedLine.cm-code-block-line .tok-null": { color: "#569cd6 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-comment": { color: "#6a9955 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-punctuation": { color: "#d4d4d4 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-propertyName": { color: "#9cdcfe !important" },
  ".cm-selectedLine.cm-code-block-line .tok-typeName, .cm-selectedLine.cm-code-block-line .tok-className": { color: "#4ec9b0 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-tagName": { color: "#569cd6 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-attributeName": { color: "#9cdcfe !important" },
  ".cm-selectedLine.cm-code-block-line .tok-attributeValue": { color: "#ce9178 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-regexp": { color: "#d16969 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-meta": { color: "#6a9955 !important" },
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
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#666" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), no = P.theme({
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
  // Selected lines get light styling (inverted)
  ".cm-selectedLine, .cm-table-line, .cm-math-block-line, .cm-mermaid-block-line": {
    backgroundColor: "#fff !important",
    color: "#1e1e1e !important",
    caretColor: "#333 !important",
    borderRadius: "4px",
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", Consolas, monospace',
    fontSize: "0.90em"
  },
  ".cm-selectedLine.cm-code-block-line": {
    backgroundColor: "#fff !important",
    borderLeft: "3px solid #228be6",
    color: "#1e1e1e !important",
    caretColor: "#333 !important",
    borderRadius: "0"
  },
  // Syntax highlighting for selected code block lines (light theme colors)
  ".cm-selectedLine.cm-code-block-line .tok-keyword": { color: "#d73a49 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-operator": { color: "#d73a49 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-variableName": { color: "#24292e !important" },
  ".cm-selectedLine.cm-code-block-line .tok-function, .cm-selectedLine.cm-code-block-line .tok-definition": { color: "#6f42c1 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-string, .cm-selectedLine.cm-code-block-line .tok-string2": { color: "#032f62 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-number": { color: "#005cc5 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-bool, .cm-selectedLine.cm-code-block-line .tok-null": { color: "#005cc5 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-comment": { color: "#6a737d !important" },
  ".cm-selectedLine.cm-code-block-line .tok-punctuation": { color: "#24292e !important" },
  ".cm-selectedLine.cm-code-block-line .tok-propertyName": { color: "#005cc5 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-typeName, .cm-selectedLine.cm-code-block-line .tok-className": { color: "#22863a !important" },
  ".cm-selectedLine.cm-code-block-line .tok-tagName": { color: "#22863a !important" },
  ".cm-selectedLine.cm-code-block-line .tok-attributeName": { color: "#6f42c1 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-attributeValue": { color: "#032f62 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-regexp": { color: "#032f62 !important" },
  ".cm-selectedLine.cm-code-block-line .tok-meta": { color: "#6a737d !important" },
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
  // Footnotes
  ".footnote-ref .footnote-link": { color: "#228be6" },
  ".footnote-def": { color: "#aaa" },
  ".footnote-def sup": { color: "#228be6" },
  ".md-wikilink, .cm-wikilink": { color: "#228be6" }
}), oo = P.theme({
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
}), ro = P.theme({
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
function Eo({ tags: e = [] } = {}) {
  return (t) => {
    const n = t.matchBefore(/#[\w/-]*$/);
    if (!n) return null;
    const r = t.state.doc.lineAt(n.from).text;
    if (/^#{1,6}\s/.test(r)) return null;
    const i = n.text.slice(1).toLowerCase(), a = e.filter((s) => s.toLowerCase().includes(i)).sort((s, l) => {
      const c = s.toLowerCase(), d = l.toLowerCase(), m = c.startsWith(i) ? 0 : 1, f = d.startsWith(i) ? 0 : 1;
      return m !== f ? m - f : c.localeCompare(d);
    }).map((s) => ({
      label: `#${s}`,
      apply: `#${s}`,
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
function Fo(e = []) {
  const t = e.map((n) => ({
    title: n.title,
    aliases: Array.isArray(n.aliases) ? n.aliases : [],
    normalizedTitle: n.title.toLowerCase(),
    normalizedAliases: Array.isArray(n.aliases) ? n.aliases.map((o) => o.toLowerCase()) : []
  }));
  return {
    search(n) {
      const o = n.trim().toLowerCase();
      return o ? t.map((i) => {
        const a = i.normalizedTitle.indexOf(o), s = i.normalizedAliases.length ? Math.min(
          ...i.normalizedAliases.map((c) => c.indexOf(o)).filter((c) => c !== -1)
        ) : -1, l = Math.min(
          a === -1 ? Number.POSITIVE_INFINITY : a,
          s === -1 ? Number.POSITIVE_INFINITY : s
        );
        return { entry: i, score: l };
      }).filter((i) => Number.isFinite(i.score)).sort((i, a) => i.score - a.score).map((i) => i.entry) : t;
    },
    resolve(n) {
      const o = n.trim().toLowerCase();
      return t.find((r) => r.normalizedTitle === o) || t.find((r) => r.normalizedAliases.includes(o)) || null;
    }
  };
}
function io(e) {
  return `${e.title}]]`;
}
function Mo(e, t) {
  return !e || !t || !t.title ? null : e.resolve(t.title);
}
function Ro({ noteIndex: e, formatLink: t } = {}) {
  const n = typeof t == "function" ? t : io;
  return (o) => {
    if (!e) return null;
    const r = o.matchBefore(/\[\[[^\[\]\n]*$/);
    if (!r) return null;
    const i = r.text.slice(2), s = e.search(i).map((l) => ({
      label: l.title,
      detail: l.aliases.length ? `aliases: ${l.aliases.join(", ")}` : void 0,
      apply: n(l),
      type: "text"
    }));
    return {
      from: r.from + 2,
      to: r.to,
      options: s,
      validFor: /^[^\[\]\n]*$/
    };
  };
}
const so = [
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
], co = P.baseTheme({
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
function No(e = {}) {
  const t = e.buttons || so, n = e.extraButtons || [];
  return [fe.of((r) => {
    const i = document.createElement("div");
    i.className = "cm-bottom-toolbar";
    const a = /* @__PURE__ */ new Map();
    for (const c of t) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, c.action && (a.set(c.action, d), d.addEventListener("click", (m) => {
        m.preventDefault(), z[c.action] && (z[c.action](r), r.focus());
      })), i.appendChild(d);
    }
    for (const c of n) {
      const d = document.createElement("button");
      d.className = "cm-bottom-toolbar-btn", d.textContent = c.icon, d.title = c.title, d.addEventListener("click", (m) => {
        m.preventDefault(), c.handler && c.handler(r), r.focus();
      }), i.appendChild(d);
    }
    let s = 0;
    i.addEventListener("touchstart", (c) => {
      s = c.touches[0].clientX;
    }, { passive: !0 }), i.addEventListener("touchmove", (c) => {
      const d = c.touches[0].clientX - s, m = i.scrollLeft <= 0, f = i.scrollLeft + i.clientWidth >= i.scrollWidth - 1;
      (m && d > 0 || f && d < 0) && c.preventDefault();
    }, { passive: !1 });
    const l = (c) => {
      const d = a.get("undo");
      d && (d.disabled = Lt(c) === 0);
      const m = a.get("redo");
      m && (m.disabled = vt(c) === 0);
    };
    return l(r.state), {
      dom: i,
      top: !1,
      update(c) {
        l(c.state);
      }
    };
  }), co];
}
const ao = P.baseTheme({
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
  }
});
function Do(e = {}) {
  const t = e.items || [];
  return [F.fromClass(class {
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
        const i = document.createElement("button");
        i.className = "cm-more-menu-item";
        const a = document.createElement("span");
        a.className = "cm-more-menu-check", a.textContent = r.getState && r.getState(o) ? "✓" : "", this.checkEls.push({ check: a, item: r });
        const s = document.createElement("span");
        s.textContent = r.label, i.appendChild(a), i.appendChild(s), i.addEventListener("click", (l) => {
          l.preventDefault(), l.stopPropagation(), r.handler(o), this.refreshChecks();
        }), this.dropdown.appendChild(i);
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
  }), ao];
}
const ie = H.define({
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
      wordCount: e.reduce((t, n) => n.wordCount ?? t, !1),
      backlinks: e.reduce((t, n) => n.backlinks ?? t, !1),
      docTitle: e.reduce((t, n) => n.docTitle ?? t, void 0),
      onBacklinksRequested: e.reduce((t, n) => n.onBacklinksRequested ?? t, void 0),
      onBacklinkClick: e.reduce((t, n) => n.onBacklinkClick ?? t, void 0),
      frontmatterKeys: e.reduce((t, n) => n.frontmatterKeys ?? t, void 0),
      theme: e.reduce((t, n) => n.theme ?? t, "light")
    };
  }
}), xe = W.define(), ye = W.define(), Le = W.define(), ve = W.define(), Se = W.define(), Te = W.define(), Ee = W.define(), E = ne.define({
  create(e) {
    const t = e.facet(ie);
    return {
      theme: t.theme || "light",
      mode: t.enablePreview !== !1 ? "hybrid" : "raw",
      readOnly: t.readOnly === !0,
      typewriter: t.typewriter === !0,
      focusMode: t.focusMode === !0,
      wordCount: t.wordCount === !0,
      backlinks: t.backlinks === !0
    };
  },
  update(e, t) {
    for (const n of t.effects)
      n.is(xe) ? e = { ...e, theme: n.value } : n.is(ye) ? e = { ...e, mode: n.value } : n.is(Le) ? e = { ...e, readOnly: n.value } : n.is(ve) ? e = { ...e, typewriter: n.value } : n.is(Se) ? e = { ...e, focusMode: n.value } : n.is(Te) ? e = { ...e, wordCount: n.value } : n.is(Ee) && (e = { ...e, backlinks: n.value });
    return e;
  }
}), Fe = new I(), te = new I(), U = new I(), Me = new I(), Re = new I(), Ne = new I(), De = new I(), Be = new I(), We = new I(), lo = oe.transactionFilter.of((e) => !e.startState.readOnly || !e.docChanged || e.annotation(R) ? e : { changes: [] });
function Ie(e) {
  return e === "dark" ? no : to;
}
function X(e, t) {
  return t ? e === "dark" ? ro : oo : [];
}
function Bo(e = {}) {
  const {
    enablePreview: t = !0,
    enableKeymap: n = !0,
    enableCollapse: o = !0,
    theme: r = "light",
    enableCustomTasks: i = !1,
    customTaskTypes: a,
    enableWikiLinks: s = !1,
    renderWikiLinks: l = !0,
    onWikiLinkClick: c,
    enableTags: d = !1,
    onTagClick: m,
    readOnly: f = !1,
    typewriter: u = !1,
    focusMode: k = !1,
    wordCount: h = !1,
    backlinks: C = !1,
    docTitle: b,
    onBacklinksRequested: w,
    onBacklinkClick: g,
    frontmatterKeys: L
  } = e, v = [
    // Store configuration in facet (for StateField to read initial values)
    ie.of(e),
    // StateField for tracking theme/mode per editor instance
    E,
    // Read-only enforcement
    lo,
    Re.of(oe.readOnly.of(f)),
    // Core functionality
    St(),
    Qe.of([...Tt, ...Et, ...Mt]),
    // Search panel + keybindings
    Rt(),
    // Multiple selections (rectangular selection + crosshair cursor)
    gt(),
    bt(),
    // Markdown language support
    Ct(),
    // Base theme (required styles)
    eo,
    // Theme (in compartment for dynamic switching)
    Fe.of(Ie(r)),
    // Raw mode theme (in compartment for toggling)
    U.of(X(r, !t)),
    // Highlight selected lines (disabled in raw mode)
    Me.of(t ? ke : []),
    // Typewriter mode (cursor stays vertically centered)
    Ne.of(u ? ge : []),
    // Focus mode (dims non-active paragraphs)
    De.of(k ? be : []),
    // Word count panel (bottom status bar)
    Be.of(h ? we : []),
    // Backlinks panel (bottom panel showing incoming links)
    Q.of({
      docTitle: b || null,
      onBacklinksRequested: typeof w == "function" ? w : null,
      onBacklinkClick: typeof g == "function" ? g : null
    }),
    We.of(C ? Ce : []),
    // Frontmatter sheet overlay (always loaded, just hidden when closed)
    kt.of(Array.isArray(L) ? L : []),
    Qn,
    // Line wrapping
    P.lineWrapping
  ];
  return t ? v.push(te.of(he({
    enableCollapse: o,
    enableCustomTasks: i,
    customTaskTypes: a,
    enableWikiLinks: s,
    renderWikiLinks: l,
    onWikiLinkClick: c,
    enableTags: d,
    onTagClick: m
  }))) : v.push(te.of([])), n && v.push(qn), v;
}
function Wo(e) {
  const t = e.state.field(E), n = t.theme === "light" ? "dark" : "light";
  return e.dispatch({
    effects: [
      xe.of(n),
      Fe.reconfigure(Ie(n)),
      U.reconfigure(X(n, t.mode === "raw"))
    ]
  }), n === "dark";
}
function Io(e) {
  const t = e.state.field(E), n = t.mode === "hybrid" ? "raw" : "hybrid", o = n === "hybrid", r = e.state.facet(ie);
  return e.dispatch({
    effects: [
      ye.of(n),
      te.reconfigure(o ? he({
        enableCollapse: r.enableCollapse,
        enableCustomTasks: r.enableCustomTasks,
        customTaskTypes: r.customTaskTypes
      }) : []),
      U.reconfigure(X(t.theme, !o)),
      Me.reconfigure(o ? ke : [])
    ]
  }), o;
}
function Ao(e) {
  const n = !e.state.field(E).readOnly;
  return e.dispatch({
    effects: [
      Le.of(n),
      Re.reconfigure(oe.readOnly.of(n))
    ]
  }), n;
}
function $o(e, t) {
  e.dispatch({
    effects: [
      Le.of(t),
      Re.reconfigure(oe.readOnly.of(t))
    ]
  });
}
function Po(e) {
  const n = !e.state.field(E).typewriter;
  return e.dispatch({
    effects: [
      ve.of(n),
      Ne.reconfigure(n ? ge : [])
    ]
  }), n;
}
function Oo(e, t) {
  e.dispatch({
    effects: [
      ve.of(t),
      Ne.reconfigure(t ? ge : [])
    ]
  });
}
function zo(e) {
  return e.state.field(E).typewriter;
}
function Ho(e) {
  const n = !e.state.field(E).focusMode;
  return e.dispatch({
    effects: [
      Se.of(n),
      De.reconfigure(n ? be : [])
    ]
  }), n;
}
function jo(e, t) {
  e.dispatch({
    effects: [
      Se.of(t),
      De.reconfigure(t ? be : [])
    ]
  });
}
function _o(e) {
  return e.state.field(E).focusMode;
}
function qo(e) {
  const n = !e.state.field(E).wordCount;
  return e.dispatch({
    effects: [
      Te.of(n),
      Be.reconfigure(n ? we : [])
    ]
  }), n;
}
function Ko(e, t) {
  e.dispatch({
    effects: [
      Te.of(t),
      Be.reconfigure(t ? we : [])
    ]
  });
}
function Vo(e) {
  return e.state.field(E).wordCount;
}
function Uo(e) {
  const n = !e.state.field(E).backlinks;
  return e.dispatch({
    effects: [
      Ee.of(n),
      We.reconfigure(n ? Ce : [])
    ]
  }), n;
}
function Xo(e, t) {
  e.dispatch({
    effects: [
      Ee.of(t),
      We.reconfigure(t ? Ce : [])
    ]
  });
}
function Yo(e) {
  return e.state.field(E).backlinks;
}
function Go(e) {
  const t = e.state.field(K);
  return e.dispatch({ effects: q.of(!t) }), !t;
}
function Zo(e, t) {
  e.dispatch({ effects: q.of(t) });
}
function Jo(e) {
  return e.state.field(K);
}
function Qo(e, t) {
  const n = e.state.field(E);
  e.dispatch({
    effects: [
      xe.of(t),
      Fe.reconfigure(Ie(t)),
      U.reconfigure(X(t, n.mode === "raw"))
    ]
  });
}
function er(e, t) {
  const n = e.state.field(E), o = t === "hybrid", r = e.state.facet(ie);
  e.dispatch({
    effects: [
      ye.of(t),
      te.reconfigure(o ? he({
        enableCollapse: r.enableCollapse,
        enableCustomTasks: r.enableCustomTasks,
        customTaskTypes: r.customTaskTypes
      }) : []),
      U.reconfigure(X(n.theme, !o)),
      Me.reconfigure(o ? ke : [])
    ]
  });
}
function tr(e) {
  return e.state.field(E).readOnly;
}
function nr(e) {
  return e.state.field(E).theme;
}
function or(e) {
  return e.state.field(E).mode;
}
export {
  ie as HybridMarkdownConfig,
  z as actions,
  Ce as backlinksPanel,
  eo as baseTheme,
  No as bottomToolbar,
  Fo as createNoteIndex,
  no as darkTheme,
  be as focusModePlugin,
  or as getMode,
  nr as getTheme,
  ke as highlightSelectedLines,
  Bo as hybridMarkdown,
  he as hybridPreview,
  Yo as isBacklinks,
  _o as isFocusMode,
  Jo as isFrontmatterSheet,
  tr as isReadOnly,
  zo as isTypewriter,
  Vo as isWordCount,
  to as lightTheme,
  qn as markdownKeymap,
  Do as moreMenu,
  Mo as resolveWikiLink,
  Xo as setBacklinks,
  jo as setFocusMode,
  Zo as setFrontmatterSheet,
  er as setMode,
  $o as setReadOnly,
  Qo as setTheme,
  Oo as setTypewriter,
  Ko as setWordCount,
  Eo as tagAutocomplete,
  Uo as toggleBacklinks,
  Ho as toggleFocusMode,
  Go as toggleFrontmatterSheet,
  Io as toggleHybridMode,
  Ao as toggleReadOnly,
  Wo as toggleTheme,
  Po as toggleTypewriter,
  qo as toggleWordCount,
  ge as typewriterPlugin,
  Ro as wikiLinkAutocomplete,
  we as wordCountPanel
};
//# sourceMappingURL=index.js.map
