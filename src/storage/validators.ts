import type { ExportPayload } from '../types/models';

export function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<ExportPayload>;

  return payload.version === 1 && Array.isArray(payload.categories) && Array.isArray(payload.items);
}
