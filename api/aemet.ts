// api/aemet.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { gunzipSync } from 'node:zlib';
import * as cheerio from 'cheerio';

const URL_AEMET = 'https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/77';

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function esZonaCastellonLitoralNorte(areaDesc: string): boolean {
  const norm = normalizarTexto(areaDesc);
  if (!norm) return false;
  if (norm.includes('benicarlo')) return true;
  if (norm.includes('litoral norte de castellon') || norm.includes('litoral nord de castello')) return true;
  if (norm.includes('aguas costeras de castellon') || norm.includes('aigues costaneres de castello')) return true;
  if (norm.includes('castellon') || norm.includes('castello')) {
    return !norm.includes('interior') && !norm.includes('litoral sur') && !norm.includes('litoral sud');
  }
  return false;
}

function hayAvisosActivosCastellon(payload: string, ahoraMs: number): boolean {
  const alertasXml = payload.match(/<alert\b[\s\S]*?<\/alert>/gi) ?? [];
  if (alertasXml.length === 0) return false;

  const idsCancelados = new Set<string>();
  const alertas = alertasXml.map((xml) => {
    const $ = cheerio.load(xml, { xmlMode: true });
    const identifier = $('alert > identifier').first().text().trim();
    const status = normalizarTexto($('alert > status').first().text());
    const msgType = normalizarTexto($('alert > msgType').first().text());
    const references = $('alert > references').first().text().trim();

    if (msgType === 'cancel' && references) {
      for (const ref of references.split(/\s+/)) {
        const refId = ref.split(',')[1]?.trim();
        if (refId) idsCancelados.add(refId);
      }
    }

    return { $, identifier, status, msgType };
  });

  for (const { $, identifier, status, msgType } of alertas) {
    if (status && status !== 'actual') continue;
    if (msgType === 'cancel' || msgType === 'error') continue;
    if (identifier && idsCancelados.has(identifier)) continue;

    let tieneInfoActiva = false;
    $('alert > info').each((_, infoEl) => {
      const info = $(infoEl);
      const responseType = normalizarTexto(info.find('responseType').first().text());
      if (responseType === 'allclear') return;

      const expiresStr = info.find('expires').first().text().trim();
      if (!expiresStr) return;
      const expiresMs = Date.parse(expiresStr);
      if (Number.isNaN(expiresMs) || expiresMs <= ahoraMs) return;

      let nivelVerde = false;
      info.find('parameter').each((__, paramEl) => {
        const nombre = normalizarTexto($(paramEl).find('valueName').text());
        const valor = normalizarTexto($(paramEl).find('value').text());
        if (nombre.includes('nivel') && (valor === 'verde' || valor === 'green' || valor.includes('sin riesgo'))) {
          nivelVerde = true;
        }
      });
      if (nivelVerde) return;

      let afectaZona = false;
      info.find('area > areaDesc').each((__, areaEl) => {
        if (esZonaCastellonLitoralNorte($(areaEl).text())) {
          afectaZona = true;
        }
      });

      if (afectaZona) {
        tieneInfoActiva = true;
      }
    });

    if (tieneInfoActiva) return true;
  }

  return false;
}

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

        const hayAvisos = Boolean(payload) && hayAvisosActivosCastellon(payload, ahora);

        if (!hayAvisos) {
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