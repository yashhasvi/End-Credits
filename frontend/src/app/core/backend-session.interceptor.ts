import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

const backendOrigin = 'http://localhost:8080';
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const backendSessionInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(backendOrigin)) {
    return next(request);
  }

  const csrfToken = unsafeMethods.has(request.method)
    ? readCookie('XSRF-TOKEN')
    : undefined;

  return next(request.clone({
    withCredentials: true,
    setHeaders: csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {},
  }));
};

function readCookie(name: string): string | undefined {
  const document = inject(DOCUMENT);
  const cookie = document.cookie
    .split('; ')
    .find((value) => value.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : undefined;
}
