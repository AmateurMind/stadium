import { z } from 'zod';

/**
 * Zod schema for FanQuery — mirrors the backend Pydantic FanQuery model exactly.
 * Used for client-side validation before sending data to the API.
 */
export const fanQuerySchema = z.object({
  message: z
    .string()
    .min(1, 'Please enter a message')
    .max(1000, 'Message must be 1000 characters or fewer'),
  language: z.enum(['en', 'es', 'fr', 'ar', 'pt', 'de', 'ja', 'ko', 'zh', 'hi']),
  stadium_id: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
  session_id: z
    .string()
    .min(8, 'Session ID must be at least 8 characters')
    .max(64, 'Session ID must be at most 64 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Session ID may only contain letters, numbers, hyphens and underscores'
    ),
  category: z.enum([
    'navigation', 'amenities', 'transport', 'accessibility',
    'schedule', 'safety', 'general',
  ]),
});

export type FanQueryForm = z.infer<typeof fanQuerySchema>;

/**
 * Return the first field-level validation message from a Zod field error map.
 */
export const getFirstFieldError = (
  fieldErrors: Record<string, string[] | undefined>,
  field: string
): string | undefined => fieldErrors[field]?.[0];

/**
 * Validate fan query data. Returns Zod SafeParseResult.
 */
export const validateFanQuery = (data: unknown) => fanQuerySchema.safeParse(data);
