import { z } from "zod"
import { NextResponse } from "next/server"

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 400 }
      ),
    }
  }
  return { success: true, data: result.data }
}
