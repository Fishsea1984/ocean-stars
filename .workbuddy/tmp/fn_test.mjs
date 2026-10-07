
import * as fn from "file:///F:/ocean-stars-v2/functions/xuanmen-save.js";
const store = new Map();
const env = { SAVES: {
  async get(n){ const v = store.get(n); return v ? { async json(){ return JSON.parse(v); } } : null; },
  async put(n, v){ store.set(n, v); },
}};
const req = (url, opts) => new Request(url, opts);
const show = async (r) => { const j = await r.json(); return JSON.stringify(j).slice(0,130); };

console.log("ping  ->", await show(await fn.onRequestGet({ request: req("https://x.pages.dev/xuanmen-save?action=ping"), env })));
console.log("坏码  ->", await show(await fn.onRequestGet({ request: req("https://x.pages.dev/xuanmen-save?action=load&key=abc"), env })));
console.log("空读  ->", await show(await fn.onRequestGet({ request: req("https://x.pages.dev/xuanmen-save?action=load&key=ABCDEFGHJKLMNPQRSTUV"), env })));
const body = JSON.stringify({ key: "ABCDEFGHJKLMNPQRSTUV", data: JSON.stringify({ state: { daoName: "守朴子" } }) });
console.log("写入  ->", await show(await fn.onRequestPost({ request: req("https://x.pages.dev/xuanmen-save", { method: "POST", body }), env })));
console.log("读取  ->", await show(await fn.onRequestGet({ request: req("https://x.pages.dev/xuanmen-save?action=load&key=ABCDEFGHJKLMNPQRSTUV"), env })));
console.log("超大  ->", await show(await fn.onRequestPost({ request: req("https://x.pages.dev/xuanmen-save", { method: "POST", body: JSON.stringify({ key: "ABCDEFGHJKLMNPQRSTUV", data: "x".repeat(600000) }) }), env })));
console.log("无绑定->", await show(await fn.onRequestGet({ request: req("https://x.pages.dev/xuanmen-save?action=load&key=ABCDEFGHJKLMNPQRSTUV"), env: {} })));
console.log("对象名:", [...store.keys()]);
