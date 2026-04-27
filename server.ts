import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to scrape the website
  app.post('/api/scrape', async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // 1. Check if iframe is blocked
      let iframeBlocked = false;
      try {
        const headRes = await axios.head(url, { timeout: 5000 });
        const xFrameOptions = headRes.headers['x-frame-options'];
        const csp = headRes.headers['content-security-policy'];
        
        if (xFrameOptions && (xFrameOptions.toLowerCase() === 'deny' || xFrameOptions.toLowerCase() === 'sameorigin')) {
          iframeBlocked = true;
        }
        if (csp && csp.toLowerCase().includes('frame-ancestors')) {
           // We'll be conservative. If it has frame-ancestors, it might block us.
           iframeBlocked = true;
        }
      } catch (e) {
        // Ignore head error, we'll try GET
      }

      // 2. Fetch the HTML to build the knowledge base
      const response = await axios.get(url, { timeout: 8000 });
      const html = response.data;
      
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, etc for cleaner text extraction
      $('script, style, noscript, nav, footer, iframe, img, svg').remove();
      
      const title = $('title').text().trim();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Truncate text to avoid massive payloads (roughly 5000 chars)
      const scrapedKnowledge = `Title: ${title}\n\nContent:\n${bodyText.substring(0, 5000)}`;

      res.json({
        success: true,
        iframeBlocked,
        scrapedKnowledge
      });
    } catch (error: any) {
      console.error('Scraping error:', error.message);
      res.status(200).json({ 
        success: false, 
        error: 'Failed to extract data from URL.',
        iframeBlocked: false, // Default to false if we couldn't reach it, let the iframe try anyway
        scrapedKnowledge: 'Unable to pull live data. Rely on general knowledge.'
      });
    }
  });

  // Proxy Route to bypass Iframe restrictions (X-Frame-Options)
  app.get('/api/proxy', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).send('URL is required');
      }

      const response = await axios.get(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      let html = response.data;
      const $ = cheerio.load(html);

      // Fix relative paths by injecting a <base> tag
      if ($('head').length > 0) {
        $('head').prepend(`<base href="${url}">`);
      } else {
        html = `<head><base href="${url}"></head>` + html;
      }

      // Optional: Strip any <meta> or <script> that attempts to frame-break
      $('script').each((i, el) => {
        const content = $(el).html() || '';
        if (content.includes('window.top') || content.includes('top.location')) {
          $(el).remove();
        }
      });

      res.setHeader('Content-Type', 'text/html');
      res.send($.html());
    } catch (error: any) {
      console.error('Proxy error:', error.message);
      res.status(500).send(`
        <div style="background: #18181b; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
          <div>
            <h1 style="font-size: 24px; margin-bottom: 10px;">Unable to Mirror Website Live</h1>
            <p style="color: #a1a1aa;">The website at <b>${req.query.url}</b> is blocking our secure preview or is currently unreachable.</p>
            <p style="margin-top: 20px; font-size: 14px;">The AI Voice Agent is still ready to assist you!</p>
          </div>
        </div>
      `);
    }
  });

  // Securely provide API Key at runtime
  app.get('/api/credentials', (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY || '' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
