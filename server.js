import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "1mb" }));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Simple helper: keep only reasonable context size on the server-side (client also keeps it)
function clampMessages(messages, maxTurns = 20) {
  if (!Array.isArray(messages)) return [];
  // keep last N user+assistant messages (turns)
  const sliced = messages.slice(-maxTurns * 2);
  return sliced.map(m => ({ role: m.role, content: String(m.content || "") }));
}

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY env var on server." });
    }

    const { messages, web_search } = req.body || {};
    const safeMessages = clampMessages(messages);

    // Build Responses API request.
    // Docs: https://platform.openai.com/docs/api-reference/responses/create
    // Web search tool: https://platform.openai.com/docs/guides/tools-web-search
    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: safeMessages,
      // Ask model to provide citations when web search is enabled.
      // The tool will return annotations; we expose them as citations list to the UI.
      tools: web_search ? [{ type: "web_search" }] : [],
    };

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "OpenAI request failed", raw: data });
    }

    // Extract text from Responses API output
    let text = "";
    // The responses API returns output items; we try common shapes
    if (typeof data.output_text === "string") {
      text = data.output_text;
    } else if (Array.isArray(data.output)) {
      // find first text output
      for (const item of data.output) {
        if (item?.type === "message") {
          const content = item?.content || [];
          const t = content.find(c => c?.type === "output_text")?.text;
          if (t) { text = t; break; }
        }
      }
    }

    // Extract citations from annotations when web_search is used
    const citations = [];
    // Look through output for annotations arrays
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item?.type === "message") {
          for (const c of (item.content || [])) {
            if (c?.type === "output_text" && Array.isArray(c.annotations)) {
              for (const a of c.annotations) {
                // web search annotations often include url/title
                const url = a?.url || a?.source?.url;
                if (url) citations.push({ url, title: a?.title || a?.source?.title || "" });
              }
            }
          }
        }
      }
    }

    // De-dupe citations by URL
    const seen = new Set();
    const deduped = citations.filter(c => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    }).slice(0, 8);

    res.json({ text, citations: deduped });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Smart AI Chat running on http://localhost:${PORT}`);
});
