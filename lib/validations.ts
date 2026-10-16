import { z } from "zod";

// Common reusable Zod schemas
export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number");
export const uuidSchema = z.string().uuid("Invalid UUID");
