import { NextRequest, NextResponse } from 'next/server';

const getTargetBackendUrl = () => {
  const envUrl = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return null;
};

async function handleProxy(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');
  const backendBase = getTargetBackendUrl();

  if (!backendBase) {
    return NextResponse.json(
      {
        statusCode: 404,
        error: 'Backend API Not Configured',
        message: 'No se encontró la URL del Backend NestJS. Por favor configura NEXT_PUBLIC_API_URL o BACKEND_URL en Railway, o ingresa la URL pública de tu Backend en el botón ⚙️ Servidor API del Login.',
      },
      { status: 404 }
    );
  }

  const targetUrl = `${backendBase}/${path}${req.nextUrl.search}`;

  try {
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
        headers.set(key, value);
      }
    });

    let body: any = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: 'no-store',
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        resHeaders.set(key, value);
      }
    });

    const data = await backendRes.arrayBuffer();
    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[Next.js API Proxy Error] Failed to proxy to ${targetUrl}:`, err);
    return NextResponse.json(
      {
        statusCode: 502,
        error: 'Bad Gateway',
        message: `No se pudo conectar al servidor Backend NestJS (${targetUrl}). Verifique que el servicio Backend en Railway esté corriendo.`,
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
