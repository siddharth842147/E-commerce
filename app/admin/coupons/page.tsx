import { getAdminCoupons } from "@/actions/admin";
import { CouponsClient } from "./CouponsClient";

export const metadata = {
  title: "Coupon Management | Kartiva Admin",
};

export const instant = false;

export default async function AdminCouponsPage() {
  const res = await getAdminCoupons();
  const coupons = res.success ? res.data : [];

  return (
    <div className="max-w-7xl mx-auto">
      <CouponsClient initialCoupons={coupons} />
    </div>
  );
}
