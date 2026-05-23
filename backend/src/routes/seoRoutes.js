import express from 'express';
import { MarketplaceListing } from '../app/models/MarketPlace.js';

const router = express.Router();

const BASE_URL = 'https://www.britbooks.co.uk';

// GET /robots.txt
router.get('/robots.txt', (req, res) => {
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    '',
    `Sitemap: ${BASE_URL}/sitemap.xml`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
});

// GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const listings = await MarketplaceListing.find(
      { isPublished: true, isArchived: false },
      { slug: 1, _id: 1, updatedAt: 1 }
    ).lean();

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.6', changefreq: 'monthly' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    ];

    const staticEntries = staticPages
      .map(
        (p) => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join('');

    const listingEntries = listings
      .map((l) => {
        const identifier = l.slug || l._id.toString();
        const lastmod = l.updatedAt
          ? new Date(l.updatedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        return `
  <url>
    <loc>${BASE_URL}/books/${identifier}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${listingEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Failed to generate sitemap');
  }
});

export default router;
