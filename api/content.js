const repository = "omarelbedawy/omarelbedawy.github.io";

function json(response, status, body) {
  response.status(status);
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  if (request.method === "GET") {
    const result = await fetch(`https://api.github.com/repos/${repository}/contents/content.json`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "omarelbedawy-portfolio"
      }
    });
    if (!result.ok) return json(response, result.status, { error: "Content could not be loaded." });
    const file = await result.json();
    return json(response, 200, JSON.parse(Buffer.from(file.content, "base64").toString("utf8")));
  }

  if (request.method !== "POST") return json(response, 405, { error: "Method not allowed." });

  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) {
    return json(response, 503, { error: "Vercel admin environment is not configured yet." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  if (!body || body.password !== process.env.ADMIN_PASSWORD) {
    return json(response, 401, { error: "Incorrect studio password." });
  }

  const required = ["settings", "hero", "about", "journey", "projects", "archive"];
  if (!body.content || required.some((key) => !(key in body.content))) {
    return json(response, 400, { error: "Content is missing a required section." });
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer " + process.env["GITHUB_TOKEN"],
    "User-Agent": "omarelbedawy-portfolio"
  };

  const current = await fetch(`https://api.github.com/repos/${repository}/contents/content.json`, { headers });
  if (!current.ok) return json(response, current.status, { error: "Could not read the current content file." });

  const file = await current.json();
  const update = await fetch(`https://api.github.com/repos/${repository}/contents/content.json`, {
    method: "PUT",
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update portfolio content",
      content: Buffer.from(`${JSON.stringify(body.content, null, 2)}\n`).toString("base64"),
      sha: file.sha,
      branch: "main"
    })
  });

  if (!update.ok) return json(response, update.status, { error: "GitHub rejected the content update." });
  return json(response, 200, { ok: true });
};
