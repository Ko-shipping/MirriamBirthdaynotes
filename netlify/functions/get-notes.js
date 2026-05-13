const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "ok" };
  }

  try {
    const store = getStore("mirriam-notes");
    const { blobs } = await store.list();

    const notes = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: "json" });
        return data;
      })
    );

    const valid = notes.filter(Boolean);

    valid.sort((a, b) => {
      const aR = a.reactions ? Object.values(a.reactions).reduce((x, y) => x + y, 0) : 0;
      const bR = b.reactions ? Object.values(b.reactions).reduce((x, y) => x + y, 0) : 0;
      if (bR !== aR) return bR - aR;
      return b.id - a.id;
    });

    return { statusCode: 200, headers, body: JSON.stringify(valid) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
