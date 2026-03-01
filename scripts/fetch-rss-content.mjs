import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");

// Ограничения, чтобы база не раздувалась
const MAX_TEXT_LEN = Number(process.env.MAX_TEXT_LEN || "60000"); // 60k chars
const MIN_TEXT_LEN = Number(process.env.MIN_TEXT_LEN || "400");   // ниже считаем "пустым"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function collapseSpaces(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function clampText(s, maxLen) {
  const t = s || "";
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + "…";
}

function stripLeadingGarbageLines(text, { url, source_id }) {
  // Работаем построчно: html-to-text часто даёт "шапку" страницы.
  const lines = (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  const urlRe = /^https?:\/\/\S+$/i;

  // шаблоны “шапки” РИА
  const riaTimeRe = /^\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}/; // "19:07 01.03.2026 ..."
  const riaUpdatedRe = /$обновлено:\s*\d{1,2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}$/i;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // выкидываем голые ссылки (часто первая строка)
    if (urlRe.test(l)) continue;

    // выкидываем "Коллаж ..." и "РИА Новости, 1920, ..."
    if (source_id === "ria") {
      if (/^коллаж\b/i.test(l)) continue;
      if (/РИА Новости,\s*\d+/i.test(l)) continue;
      if (riaTimeRe.test(l)) continue;
      if (riaUpdatedRe.test(l)) continue;
    }

    out.push(l);
  }

  // Иногда заголовок повторяется 2 раза подряд — уберём дубликат
  if (out.length >= 2 && out[0] === out[1]) out.splice(1, 1);

  // Уберём строку, которая совпадает с URL статьи (если просочилась)
  if (url) {
    const u = url.trim();
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i] === u) out.splice(i, 1);
    }
  }

  return out.join("\n").trim();
}

function normalizeText(text, ctx) {
  let t = (text || "").trim();

  // html-to-text иногда превращает всё в одну строку — вернём переносы там, где они были
  // (мы ниже всё равно будем сжимать пробелы в каждой строке)
  t = t
    .split(/\r?\n/)
    .map((l) => collapseSpaces(l))
    .filter(Boolean)
    .join("\n");

  t = stripLeadingGarbageLines(t, ctx);

  // финальная нормализация: уберём двойные пустые строки
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; monitoring24-app/1.0; +https://github.com/WolfRain007/monitoring24-app)",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (res.status === 403) {
      const err = new Error("HTTP 403");
      err.code = 403;
      throw err;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.startsWith("text/html")) {
      throw new Error(`Non-HTML content-type: ${ct}`);
    }

    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractReadable(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content) {
    return { content_html: "", content_text_raw: "" };
  }

  const content_html = article.content;

  // Важно: не схлопываем всё в одну строку — переносы полезны для чистки
  const content_text_raw = htmlToText(content_html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" }
    ]
  });

  return { content_html, content_text_raw };
}

async function setStatus(id, status, content_html = "", content_text = "", error = "") {
  const { error: saveErr } = await supabase.rpc("set_news_item_content", {
    p_id: id,
    p_status: status,
    p_content_html: content_html,
    p_content_text: content_text,
    p_error: (error || "").slice(0, 500)
  });
  if (saveErr) throw saveErr;
}

async function main() {
  const limit = Math.min(Math.max(BATCH_LIMIT, 1), 500);

  const { data: items, error } = await supabase.rpc(
    "fetch_next_news_items_for_content",
    { p_limit: limit }
  );
  if (error) throw error;

  if (!items || items.length === 0) {
    console.log("No items to fetch.");
    return;
  }

  console.log(`Fetched batch: ${items.length}`);

  for (const it of items) {
    const { id, url, source_id, lang } = it;

    try {
      const html = await fetchHtml(url);
      const { content_html, content_text_raw } = extractReadable(html, url);

      let content_text = normalizeText(content_text_raw, { url, source_id, lang });
      content_text = clampText(content_text, MAX_TEXT_LEN);

      if (!content_text || content_text.length < MIN_TEXT_LEN) {
        await setStatus(id, "error", "", "", "Extracted content too short/empty");
        continue;
      }

      await setStatus(id, "ok", content_html, content_text, "");
      console.log(`ok: ${source_id} ${id}`);
    } catch (e) {
      const msg = e?.message ? e.message : String(e);

      if (msg.includes("HTTP 403") || e?.code === 403) {
        await setStatus(id, "blocked_403", "", "", "HTTP 403");
        console.log(`blocked_403: ${source_id} ${id}`);
        continue;
      }

      await setStatus(id, "error", "", "", msg);
      console.log(`error: ${source_id} ${id} ${msg}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
