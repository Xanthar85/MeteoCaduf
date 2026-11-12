import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const apiKey = process.env.AEMET_API_KEY;
    if (!apiKey) {
      throw new Error('Falta la API Key de AEMET en las variables de entorno.');
    }

    const url = 'https://opendata.aemet.es/opendata/api/avisos_cap/ultimoelaborado/area/12'; 
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'api_key': apiKey,
      }
    });
    
    if (!res.ok) {
      throw new Error(`Error al obtener AEMET: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (data.datos) {
      const resDatos = await fetch(data.datos);
      const datosFinales = await resDatos.json();
      response.status(200).json(datosFinales);
    } else {
      response.status(200).json(data);
    }
  } catch (error: any) {
    console.error('Error en el proxy de AEMET:', error);
    response.status(500).json({ error: 'No se pudieron obtener los avisos de AEMET', detalle: error.message || error });
  }
}
