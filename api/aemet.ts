// api/aemet.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const AREA_CV = '77';
const URL_AEMET = `https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/${AREA_CV}`;

type EstadoAvisos =
  | { tipo: 'SIN_AVISOS'; actualizado: string }
  | { tipo: 'HAY_AVISOS'; actualizado: string; enlace: string }
  | { tipo: 'ERROR'; actualizado: string; detalle: string };

let cache: { datos: EstadoAvisos; expira: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const ahora = Date.now();
    if (cache && cache.expira > ahora) {
      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return response.status(200).json(cache.datos);
    }

    const apiKey = process.env.AEMET_API_KEY;
    if (!apiKey) {
      throw new Error('Falta la API Key de AEMET en las variables de entorno.');
    }

    const url = `${URL_AEMET}?api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`AEMET respondió HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    let resultado: EstadoAvisos;

    if (data.estado === 200 && data.datos) {
      resultado = {
        tipo: 'HAY_AVISOS',
        actualizado: new Date().toISOString(),
        enlace: 'https://www.aemet.es/es/eltiempo/prediccion/avisos?w=co',
      };
    } else if (data.estado === 404) {
      resultado = {
        tipo: 'SIN_AVISOS',
        actualizado: new Date().toISOString(),
      };
    } else {
      throw new Error(`AEMET devolvió estado interno ${data.estado ?? 'desconocido'}: ${data.descripcion ?? 'sin descripción'}`);
    }

    cache = { datos: resultado, expira: ahora + TTL_MS };

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    response.status(200).json(resultado);
  } catch (error: any) {
    console.error('Error en el proxy de AEMET:', error);

    const fallback: EstadoAvisos = {
      tipo: 'ERROR',
      actualizado: new Date().toISOString(),
      detalle: 'No se pudo consultar AEMET. Consulta la web oficial.',
    };

    response.status(200).json(fallback);
  }
}
// api/aemet.ts