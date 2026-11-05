const INTERNAL_ORIGIN = 'http://internal.invalid'

/**
 * Accepts only a plain, same-origin site path such as `/en/projects/foo?x=1`.
 * Rejects anything that could introduce another authority or scheme when a browser resolves the
 * redirect: protocol-relative `//host`, backslashes (`/\host` parses as `//host`), control
 * characters, and non-ASCII tricks. Also rejects system routes that never make sense as targets.
 * The checks run on the NORMALISED path that is returned, not only on the raw input: WHATWG
 * dot-segment removal turns `/.//host`, `/..//host` or `/%2e//host` into the scheme-relative
 * `//host`, which a browser would follow to another origin.
 */
export function safeInternalPath(candidate: string | null | undefined): null | string {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 2048) return null
  if (!/^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#[\]]*$/.test(candidate)) return null
  if (candidate.startsWith('//') || candidate.includes('\\') || /[\u0000-\u001f\u007f]/.test(candidate)) return null
  // Encoded separators are refused too, so no later decoding step can turn the path into an authority.
  if (/%(2f|5c)/i.test(candidate)) return null
  let parsed: URL
  try {
    parsed = new URL(candidate, INTERNAL_ORIGIN)
  } catch {
    return null
  }
  if (parsed.origin !== INTERNAL_ORIGIN || parsed.username || parsed.password) return null
  // Next.js routes on the decoded path, so the system-route check must look at the decoded form too
  // (`/%61dmin` is `/admin`). Malformed escapes are refused outright.
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(parsed.pathname)
  } catch {
    return null
  }
  if (/^\/(api|admin|preview|exit-preview|_next)(\/|$)/i.test(decodedPath)) return null
  // Validate what is actually handed to the browser: exactly one leading slash, no backslash, and a
  // re-parse that keeps our origin and the very same path and query (so it can never read as `//host`).
  const out = `${parsed.pathname}${parsed.search}`
  if (!/^\/(?!\/)/.test(out) || out.includes('\\')) return null
  let reparsed: URL
  try {
    reparsed = new URL(out, INTERNAL_ORIGIN)
  } catch {
    return null
  }
  if (reparsed.origin !== INTERNAL_ORIGIN || reparsed.pathname !== parsed.pathname || reparsed.search !== parsed.search) return null
  return out
}
