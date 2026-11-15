// api/aemet.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { gunzipSync } from 'node:zlib';

const URL_AEMET = 'https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/77';

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

    if (res.status === 404) {
      const sinAvisos: EstadoAvisos = {
        tipo: 'SIN_AVISOS',
        actualizado: new Date().toISOString(),
      };
      cache = { datos: sinAvisos, expira: ahora + TTL_MS };
      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return response.status(200).json(sinAvisos);
    }

    if (!res.ok) {
      throw new Error(`AEMET respondió HTTP ${res.status} ${res.statusText}`);
    }

    const rawText = (await res.text()).trim();
    if (!rawText) {
      const sinAvisos: EstadoAvisos = {
        tipo: 'SIN_AVISOS',
        actualizado: new Date().toISOString(),
      };
      cache = { datos: sinAvisos, expira: ahora + TTL_MS };
      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return response.status(200).json(sinAvisos);
    }

    const data = JSON.parse(rawText);

    let resultado: EstadoAvisos;

    if (!data || (Array.isArray(data) && data.length === 0) || data.estado === 404 || (data.estado === 200 && !data.datos)) {
      resultado = {
        tipo: 'SIN_AVISOS',
        actualizado: new Date().toISOString(),
      };
    } else if (data.estado === 200 && data.datos) {
      const datosRes = await fetch(data.datos);
      if (datosRes.status === 404) {
        resultado = {
          tipo: 'SIN_AVISOS',
          actualizado: new Date().toISOString(),
        };
      } else if (!datosRes.ok) {
        throw new Error(`AEMET datos respondió HTTP ${datosRes.status} ${datosRes.statusText}`);
      } else {
        const arrayBuf = await datosRes.arrayBuffer();
        const rawBytes = new Uint8Array(arrayBuf);
        const contentBuf =
          rawBytes.length >= 2 && rawBytes[0] === 0x1f && rawBytes[1] === 0x8b
            ? gunzipSync(arrayBuf)
            : Buffer.from(arrayBuf);
        const payload = contentBuf.toString('utf8').replace(/\0/g, '').trim();

        const sinContenido =
          !payload ||
          payload === '[]' ||
          payload === '{}' ||
          (payload.includes('<') && !/<alert\b/i.test(payload));

        if (sinContenido) {
          resultado = {
            tipo: 'SIN_AVISOS',
            actualizado: new Date().toISOString(),
          };
        } else {
          resultado = {
            tipo: 'HAY_AVISOS',
            actualizado: new Date().toISOString(),
            enlace: 'https://www.aemet.es/es/eltiempo/prediccion/avisos',
          };
        }
      }
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