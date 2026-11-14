import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

const AVAMET_URL = 'https://www.avamet.org/mxo_i.php?id=c03m027e06';

function extractNumber(text: string): string {
  const match = text.replace(/\s+/g, ' ').match(/-?\d+(?:[.,]\d+)?/);
  return match ? match[0] : 'N/D';
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch(AVAMET_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        Referer: 'https://www.avamet.org/',
      },
    });

    if (!response.ok) {
      return res.status(502).json({
        error: 'Error al consultar AVAMET',
        status: response.status,
        statusText: response.statusText,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const temp = extractNumber($('#temp_mit').text() || $('#temp').text());
    const tempMax = extractNumber($('#temp_max').text());
    const tempMin = extractNumber($('#temp_min').text());
    const humedad = extractNumber($('#hrel').text() || $('#hum').text());
    const presion = extractNumber($('#pres').text());

    const ventText = ($('#vent').first().text() || $('#vel').text()).replace(/\s+/g, ' ').trim();
    const viento = extractNumber(ventText);
    const dirMatch = ventText.match(/km\/h\s*([A-Z]{1,3})/i) || $('#dir').text().trim().match(/^([A-Z]{1,3})$/i);
    const direccion = dirMatch ? dirMatch[1].toUpperCase() : 'N/D';

    const precText = $('#prec').first().text() || $('#lluvia').text();
    const lluvia = extractNumber(precText);

    const actualizado = $('#hora').text().trim() || 'N/D';

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return res.status(200).json({
      temp,
      temperatura: temp,
      humedad,
      viento,
      direccion,
      lluvia,
      presion,
      tempMax,
      tempMin,
      actualizado,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({
      error: 'Error fatal en la función',
      message,
    });
  }
}