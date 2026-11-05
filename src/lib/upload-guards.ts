import { extname } from 'node:path'
import { fileTypeFromBuffer } from 'file-type'
import { APIError, type CollectionBeforeValidateHook } from 'payload'

export const MIB = 1024 * 1024

/** Allowed content types, the file extensions each may use, and a size cap per type. */
export type AllowedUploads = Record<string, { extensions: string[]; maxBytes: number }>

export const IMAGE_UPLOADS: AllowedUploads = {
  'image/jpeg': { extensions: ['jpg', 'jpeg'], maxBytes: 8 * MIB },
  'image/png': { extensions: ['png'], maxBytes: 8 * MIB },
  'image/webp': { extensions: ['webp'], maxBytes: 8 * MIB },
  'image/avif': { extensions: ['avif'], maxBytes: 8 * MIB },
}

export const VIDEO_UPLOADS: AllowedUploads = {
  'video/mp4': { extensions: ['mp4'], maxBytes: 25 * MIB },
}

/**
 * Validates the actual uploaded bytes, not just the browser-declared MIME type:
 *  - the content must be recognised by its magic bytes (SVG and other text formats never are);
 *  - the detected type must be in the allow-list and must match the declared type;
 *  - the file extension must agree with the detected type;
 *  - the file must respect the per-type size cap.
 * Payload's `mimeTypes` option only filters the file picker, so this hook is the real check.
 */
export const validateUploadedFile = (allowed: AllowedUploads): CollectionBeforeValidateHook => {
  return async ({ req, data, operation }) => {
    const file = req.file
    if (!file) {
      if (operation === 'create') throw new APIError('A file is required.', 400)
      return data
    }
    const detected = await fileTypeFromBuffer(file.data)
    if (!detected) throw new APIError('The uploaded file content is not a recognised image or video.', 400)
    const rule = allowed[detected.mime]
    if (!rule) throw new APIError(`Files of type ${detected.mime} are not allowed.`, 400)
    if (file.mimetype !== detected.mime) {
      throw new APIError(`Declared type ${file.mimetype} does not match the file content (${detected.mime}).`, 400)
    }
    const ext = extname(file.name).toLowerCase().replace(/^\./, '')
    if (!rule.extensions.includes(ext)) {
      throw new APIError(`File extension .${ext} does not match the file content (${detected.mime}).`, 400)
    }
    if (file.size > rule.maxBytes) {
      throw new APIError(`File is too large. Maximum for ${detected.mime} is ${Math.round(rule.maxBytes / MIB)} MiB.`, 400)
    }
    return data
  }
}
