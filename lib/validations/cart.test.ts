import { describe, it, expect } from "vitest";
import { addToCartSchema, updateCartSchema } from "./cart";

describe("Cart Validation Schemas", () => {
  describe("addToCartSchema", () => {
    it("should validate correct input with UUID and positive quantity", () => {
      const validInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 5,
      };
      
      const result = addToCartSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variantId).toBe(validInput.variantId);
        expect(result.data.quantity).toBe(validInput.quantity);
      }
    });

    it("should reject invalid UUID format", () => {
      const invalidInput = {
        variantId: "not-a-uuid",
        quantity: 5,
      };
      
      const result = addToCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid variant ID format");
      }
    });

    it("should reject zero quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 0,
      };
      
      const result = addToCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be positive");
      }
    });

    it("should reject negative quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: -5,
      };
      
      const result = addToCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be positive");
      }
    });

    it("should reject non-integer quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 5.5,
      };
      
      const result = addToCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be an integer");
      }
    });

    it("should reject missing fields", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
      };
      
      const result = addToCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCartSchema", () => {
    it("should validate correct input with UUID and positive quantity", () => {
      const validInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 3,
      };
      
      const result = updateCartSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variantId).toBe(validInput.variantId);
        expect(result.data.quantity).toBe(validInput.quantity);
      }
    });

    it("should reject invalid UUID format", () => {
      const invalidInput = {
        variantId: "invalid-uuid",
        quantity: 3,
      };
      
      const result = updateCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid variant ID format");
      }
    });

    it("should reject zero quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 0,
      };
      
      const result = updateCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be positive");
      }
    });

    it("should reject negative quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: -1,
      };
      
      const result = updateCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be positive");
      }
    });

    it("should reject non-integer quantity", () => {
      const invalidInput = {
        variantId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 2.7,
      };
      
      const result = updateCartSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Quantity must be an integer");
      }
    });
  });
});
