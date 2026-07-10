/** Build a redirect Response with mutable headers (safe for Set-Cookie on Vercel/undici). */

export function redirectWithCookies(
  location: string | URL,
  cookies: string[],
  status = 302,
): Response {
  const headers = new Headers();
  headers.set("Location", typeof location === "string" ? location : location.toString());
  for (const value of cookies) {
    headers.append("Set-Cookie", value);
  }
  return new Response(null, { status, headers });
}

export function redirectTo(location: string | URL, status = 302): Response {
  return redirectWithCookies(location, [], status);
}
