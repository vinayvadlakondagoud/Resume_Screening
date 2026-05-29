import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

export const config = {
  api: {
    bodyParser: false,
  },
};

const TARGET_BASE = (process.env.API_PROXY_URL || 'http://localhost:8000').replace(/\/+$/, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (typeof req.url !== 'string') {
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  const targetUrl = TARGET_BASE + req.url;
  const parsedUrl = new URL(targetUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options: http.RequestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: parsedUrl.host,
    },
  };

  const hopByHop = ['transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'upgrade'];
  for (const h of hopByHop) {
    delete (options.headers as Record<string, string> | undefined)?.[h];
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    delete (options.headers as Record<string, string> | undefined)?.['content-length'];
  }

  const proxyReq = lib.request(options, (proxyRes) => {
    const chunks: Buffer[] = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode || 500);
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (value) {
          res.setHeader(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      res.end(Buffer.concat(chunks));
    });
  });

  proxyReq.on('error', (err: Error) => {
    console.error('API proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad Gateway', detail: err.message });
    }
  });

  req.pipe(proxyReq);
}
