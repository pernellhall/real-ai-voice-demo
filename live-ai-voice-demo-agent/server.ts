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
