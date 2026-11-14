// api/avamet.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://www.avamet.org/mxd_estacio.php?id=c03m027e02&tipo=html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Fetch falló en Vercel', 
        status: response.status,
        statusText: response.statusText 
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const tempEl = $('#temp').text().replace(/[º°]|&deg;/gi, '').trim();
    const temp = tempEl || 'N/D';

    const humEl = $('#hum').text().replace(/[%]/g, '').trim();
    const humedad = humEl || 'N/D';

    const vientoEl = $('#vel').text().replace(/[km\/h]/gi, '').trim();
    const viento = vientoEl || 'N/D';

    const dirEl = $('#dir').text().trim();
    const direccion = dirEl || 'N/D';

    const lluviaEl = $('#lluvia').text().replace(/[mm]/gi, '').trim();
    const lluvia = lluviaEl || 'N/D';

    const tempMaxEl = $('#temp_max').clone();
    tempMaxEl.find('.temp_mit_l').remove();
    const tempMax = tempMaxEl.text().replace(/[º°]|&deg;/gi, '').trim() || 'N/D';

    const tempMinEl = $('#temp_min').clone();
    tempMinEl.find('.temp_mit_l').remove();
    const tempMin = tempMinEl.text().replace(/[º°]|&deg;/gi, '').trim() || 'N/D';

    const presEl = $('#pres').clone();
    presEl.find('.dess, br, .unit').remove();
    const presion = presEl.text().trim() || 'N/D';

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json({
      temp,
      humedad,
      viento,
      direccion,
      lluvia,
      presion,
      tempMax,
      tempMin,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Error fatal en la función', 
      message: error.message,
      stack: error.stack 
    });
  }
}
// api/avamet.ts