/**
 * Proxies Google Translate TTS so the browser can play natural EN/UR speech
 * without cross-origin blocks. Deployed as a Vercel serverless function.
 *
 * GET /api/tts?tl=ur|en&q=text&ie=UTF-8&client=gtx
 * (also accepts lang=ur|en as an alias for tl)
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET, OPTIONS').end('Method Not Allowed');
    return;
  }

  const raw = typeof req.query.q === 'string' ? req.query.q : '';
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 200);
  const tlRaw = typeof req.query.tl === 'string' ? req.query.tl : req.query.lang;
  const lang = tlRaw === 'ur' ? 'ur' : 'en';

  if (!text) {
    res.status(400).json({ error: 'missing q' });
    return;
  }

  const upstreamUrl =
    'https://translate.googleapis.com/translate_tts?' +
    new URLSearchParams({
      ie: 'UTF-8',
      client: 'gtx',
      tl: lang,
      q: text,
    }).toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: 'upstream_failed', status: upstream.status });
      return;
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 64) {
      res.status(502).json({ error: 'empty_audio' });
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buf);
  } catch (err) {
    res.status(502).json({ error: 'fetch_failed', message: String(err?.message || err) });
  }
}
