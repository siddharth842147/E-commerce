import { describe, it, expect } from "vitest";
import { shippingAddressSchema, checkoutSchema } from "./checkout";

describe("shippingAddressSchema", () => {
  it("should validate a correct shipping address", () => {
    const validAddress = {
      recipientName: "John Doe",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      addressLine2: "Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("should validate address without optional addressLine2", () => {
    const validAddress = {
      recipientName: "Jane Smith",
      phone: "8765432109",
      addressLine1: "456 Park Avenue",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
    };

    const result = shippingAddressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("should reject recipient name shorter than 2 characters", () => {
    const invalidAddress = {
      recipientName: "J",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 2 characters");
    }
  });

  it("should reject invalid phone number (not starting with 6-9)", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "5876543210", // starts with 5
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("valid Indian mobile number");
    }
  });

  it("should reject phone number with less than 10 digits", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "987654321", // 9 digits
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
  });

  it("should reject phone number with more than 10 digits", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "98765432101", // 11 digits
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
  });

  it("should reject empty addressLine1", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "9876543210",
      addressLine1: "",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("required");
    }
  });

  it("should reject postal code with less than 6 digits", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "40001", // 5 digits
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("exactly 6 digits");
    }
  });

  it("should reject postal code with more than 6 digits", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "4000011", // 7 digits
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
  });

  it("should reject postal code with non-numeric characters", () => {
    const invalidAddress = {
      recipientName: "John Doe",
      phone: "9876543210",
      addressLine1: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "40000A",
    };

    const result = shippingAddressSchema.safeParse(invalidAddress);
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  it("should validate complete checkout data with all fields", () => {
    const validCheckout = {
      shippingAddress: {
        recipientName: "John Doe",
        phone: "9876543210",
        addressLine1: "123 Main Street",
        addressLine2: "Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      email: "john.doe@example.com",
      phone: "9876543210",
      couponCode: "SAVE10",
    };

    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("should validate checkout data without optional fields", () => {
    const validCheckout = {
      shippingAddress: {
        recipientName: "Jane Smith",
        phone: "8765432109",
        addressLine1: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
      },
    };

    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidCheckout = {
      shippingAddress: {
        recipientName: "John Doe",
        phone: "9876543210",
        addressLine1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      email: "invalid-email",
    };

    const result = checkoutSchema.safeParse(invalidCheckout);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Invalid email");
    }
  });

  it("should reject invalid phone in optional phone field", () => {
    const invalidCheckout = {
      shippingAddress: {
        recipientName: "John Doe",
        phone: "9876543210",
        addressLine1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      phone: "1234567890", // doesn't start with 6-9
    };

    const result = checkoutSchema.safeParse(invalidCheckout);
    expect(result.success).toBe(false);
  });

  it("should reject checkout data with invalid shipping address", () => {
    const invalidCheckout = {
      shippingAddress: {
        recipientName: "J", // too short
        phone: "9876543210",
        addressLine1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
    };

    const result = checkoutSchema.safeParse(invalidCheckout);
    expect(result.success).toBe(false);
  });

  it("should validate checkout with empty coupon code string", () => {
    const checkoutData = {
      shippingAddress: {
        recipientName: "John Doe",
        phone: "9876543210",
        addressLine1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
      },
      couponCode: "",
    };

    const result = checkoutSchema.safeParse(checkoutData);
    // Empty string should fail min(1) validation
    expect(result.success).toBe(false);
  });
});
