import { z } from 'zod';
import { insertAudiometrySchema, audiometryResults, billingSyncLogs } from './schema';

export const api = {
  audiometry: {
    list: {
      method: 'GET' as const,
      path: '/api/audiometry',
      responses: {
        200: z.array(z.any()), // Returns AudiometryResultResponse[]
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/audiometry',
      input: insertAudiometrySchema,
      responses: {
        201: z.custom<typeof audiometryResults.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    sync: {
      method: 'POST' as const,
      path: '/api/audiometry/:id/sync',
      responses: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
          log: z.custom<typeof billingSyncLogs.$inferSelect>()
        }),
        404: z.object({ message: z.string() }),
      },
    },
    logs: {
      method: 'GET' as const,
      path: '/api/audiometry/:id/logs',
      responses: {
        200: z.array(z.custom<typeof billingSyncLogs.$inferSelect>()),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
