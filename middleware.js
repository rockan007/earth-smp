// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl.clone();
    const host = request.headers.get('host');
    url.searchParams.set('host', host);

    return NextResponse.rewrite(url);
}
