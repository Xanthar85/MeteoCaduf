// api/avamet.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://www.avamet.org/mxd_estacio.php?id=c03m027e02&tipo=html');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    // LOGS DE DIAGNÓSTICO
    console.log('DEBUG temp_max HTML:', $('#temp_max').html());
    console.log('DEBUG temp_min HTML:', $('#temp_min').html());
    console.log('DEBUG pres HTML:', $('#pres').html());

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
  } catch (error) {
    console.error('Error fetching AVAMET:', error);
    return res.status(500).json({ error: 'Error fetching AVAMET data' });
  }
}
// api/avamet.ts