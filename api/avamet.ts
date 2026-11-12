import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const url = 'https://www.avamet.org/mxo_i.php?id=c03m027e06';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8',
      }
    });
    
    if (!res.ok) {
      throw new Error(`Error al obtener AVAMET: ${res.status} ${res.statusText}`);
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);

    const limpiar = (texto: string, prefijo: string = '') => {
      let limpio = texto.replace(/\s+/g, ' ').trim();
      if (prefijo && limpio.startsWith(prefijo)) {
        limpio = limpio.substring(prefijo.length).trim();
      }
      return limpio || 'N/D';
    };

    const temperatura = limpiar($('#temp_mit').text());
    const humedad = limpiar($('#hrel').text(), 'Humitat');
    const viento = limpiar($('#vent').first().text(), 'Vent');
    const lluvia = limpiar($('#prec').first().text(), 'Pluja hui');
    const actualizado = limpiar($('#hora').text());

    response.status(200).json({
      temperatura,
      humedad,
      viento,
      lluvia,
      actualizado,
    });
  } catch (error: any) {
    console.error('Error en el proxy de AVAMET:', error);
    response.status(500).json({ error: 'No se pudieron obtener los datos de AVAMET', detalle: error.message || error });
  }
}
