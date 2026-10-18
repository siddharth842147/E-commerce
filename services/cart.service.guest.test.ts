import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock iron-session
const mockSession = {
  items: [] as any[] | undefined,
  save: vi.fn(),
};

vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockResolvedValue(mockSession),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

// Mock the db module
const mockDb = {
  select: vi.fn(),
};

vi.mock("@/db", () => ({
  db: mockDb,
}));

// Import the service after mocks are set up
const { 
  getGuestCart, 
  addToGuestCart, 
  updateGuestCartQuantity, 
  removeFromGuestCart, 
  clearGuestCart 
} = await import("./cart.service");

describe("CartService - Guest Cart Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.items = [];
    mockSession.save.mockClear();
  });

  describe("getGuestCart", () => {
    it("should return empty cart when no items exist", async () => {
      mockSession.items = undefined;
      const result = await getGuestCart();
      expect(result).toEqual({ items: [] });
    });

    it("should return cart with items when they exist", async () => {
      const items = [
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 1 },
      ];
      mockSession.items = items;
      const result = await getGuestCart();
      expect(result).toEqual({ items });
    });
  });

  describe("addToGuestCart", () => {
    it("should add new item to empty cart", async () => {
      mockSession.items = [];
      await addToGuestCart("variant-1", 2);
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 2 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });

    it("should increment quantity when variant already exists", async () => {
      mockSession.items = [{ variantId: "variant-1", quantity: 2 }];
      await addToGuestCart("variant-1", 3);
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 5 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });

    it("should add new item to cart with existing items", async () => {
      mockSession.items = [{ variantId: "variant-1", quantity: 2 }];
      await addToGuestCart("variant-2", 1);
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 1 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });
  });

  describe("updateGuestCartQuantity", () => {
    it("should update quantity of existing item", async () => {
      mockSession.items = [{ variantId: "variant-1", quantity: 2 }];
      await updateGuestCartQuantity("variant-1", 5);
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 5 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });

    it("should not modify cart if item does not exist", async () => {
      mockSession.items = [{ variantId: "variant-1", quantity: 2 }];
      await updateGuestCartQuantity("variant-2", 5);
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 2 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });
  });

  describe("removeFromGuestCart", () => {
    it("should remove item from cart", async () => {
      mockSession.items = [
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 1 },
      ];
      await removeFromGuestCart("variant-1");
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-2", quantity: 1 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });

    it("should not error if item does not exist", async () => {
      mockSession.items = [{ variantId: "variant-1", quantity: 2 }];
      await removeFromGuestCart("variant-2");
      
      expect(mockSession.items).toEqual([
        { variantId: "variant-1", quantity: 2 },
      ]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });
  });

  describe("clearGuestCart", () => {
    it("should clear all items from cart", async () => {
      mockSession.items = [
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 1 },
      ];
      await clearGuestCart();
      
      expect(mockSession.items).toEqual([]);
      expect(mockSession.save).toHaveBeenCalledOnce();
    });
  });
});
