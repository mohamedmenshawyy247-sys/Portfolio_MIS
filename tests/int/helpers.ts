import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { BASE_URL } from './env'
import type { Fixtures } from './global-setup'

export const fixtures = (): Fixtures => JSON.parse(readFileSync(resolve(process.cwd(), 'tests/.tmp/fixtures.json'), 'utf8')) as Fixtures

export type Session = { cookie: string; token: string; userId: number }

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${BASE_URL}/api/users/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`)
  const body = (await res.json()) as { token: string; user: { id: number } }
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  return { token: body.token, cookie, userId: body.user.id }
}

export type ApiOptions = { body?: unknown; headers?: Record<string, string>; method?: string; session?: Session | null; raw?: BodyInit }

export async function api(path: string, options: ApiOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) }
  if (options.session) headers.Authorization = `JWT ${options.session.token}`
  let body: BodyInit | undefined = options.raw
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  return fetch(`${BASE_URL}${path}`, { method: options.method ?? (body ? 'POST' : 'GET'), headers, body, redirect: 'manual' })
}

export const json = async <T = Record<string, unknown>>(res: Response): Promise<T> => (await res.json()) as T

export async function pngBuffer(width = 32, height = 32): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer()
}

/** Multipart upload the way the admin UI does it: a `file` part plus a `_payload` JSON part. */
export function uploadForm(file: { buffer: Buffer; name: string; type: string }, data: Record<string, unknown>): FormData {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.type }), file.name)
  form.append('_payload', JSON.stringify(data))
  return form
}
