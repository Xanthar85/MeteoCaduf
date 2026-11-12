import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const url = 'https://www.avamet.org/mx-meteo.php?id=c03m027e02';
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Error al obtener AVAMET: ${res.status}`);
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extraer datos básicos (ejemplo de scraping)
    const datos = {
      temperatura: $('.temp').text().trim() || 'N/D',
      humedad: $('.humitat').text().trim() || 'N/D',
      viento: $('.vent').text().trim() || 'N/D',
      lluvia: $('.pluja').text().trim() || 'N/D',
      actualizado: new Date().toISOString(),
    };

    response.status(200).json(datos);
  } catch (error) {
    console.error('Error en el proxy de AVAMET:', error);
    response.status(500).json({ error: 'No se pudieron obtener los datos de AVAMET' });
  }
}
