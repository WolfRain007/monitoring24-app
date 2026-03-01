import { createClient } from "@supabase/supabase-js";
import { htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_LIMIT = Number(process.env.BATCH_LIMIT || "50");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function cleanText(s) {
  return (s || "").replace(/\s+/g, " ").trim();
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
    return { content_html: "", content_text: "" };
  }

  const content_html = article.content;
  const content_text = cleanText(
    htmlToText(content_html, {
      wordwrap: false,
      selectors: [{ selector: "a", options: { ignoreHref: true } }]
    })
  );

  return { content_html, content_text };
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
    const { id, url } = it;

    try {
      const html = await fetchHtml(url);
      const { content_html, content_text } = extractReadable(html, url);

      if (!content_text) {
        await supabase.rpc("set_news_item_content", {
          p_id: id,
          p_status: "error",
          p_content_html: "",
          p_content_text: "",
          p_error: "Readability extracted empty content"
        });
        continue;
      }

      const { error: saveErr } = await supabase.rpc("set_news_item_content", {
        p_id: id,
        p_status: "ok",
        p_content_html: content_html,
        p_content_text: content_text,
        p_error: ""
      });

      if (saveErr) throw saveErr;

      console.log(`ok: ${id}`);
    } catch (e) {
      const msg = e?.message ? e.message : String(e);

      await supabase.rpc("set_news_item_content", {
        p_id: id,
        p_status: "error",
        p_content_html: "",
        p_content_text: "",
        p_error: msg.slice(0, 500)
      });

      console.log(`error: ${id} ${msg}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
