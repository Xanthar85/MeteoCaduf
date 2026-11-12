import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const url = 'https://www.avamet.org/mxo_i.php?id=c03m027e06';
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Error al obtener AVAMET: ${res.status}`);
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extraer datos usando los selectores exactos
    const temperatura = $('#temp_mit').text().trim();
    const humedad = $('#hrel').contents().filter(function() { return this.type === 'text'; }).text().trim() || $('#hrel').text().replace('Humitat', '').trim();
    const viento = $('#vent').first().text().replace('Vent', '').trim();
    const lluvia = $('#prec').first().text().replace('Pluja hui', '').trim();
    const actualizado = $('#hora').text().trim();

    response.status(200).json({
      temperatura: temperatura || 'N/D',
      humedad: humedad || 'N/D',
      viento: viento || 'N/D',
      lluvia: lluvia || 'N/D',
      actualizado: actualizado || 'N/D',
    });
  } catch (error) {
    console.error('Error en el proxy de AVAMET:', error);
    response.status(500).json({ error: 'No se pudieron obtener los datos de AVAMET' });
  }
}
