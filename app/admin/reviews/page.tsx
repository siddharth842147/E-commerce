import { getAdminReviews } from "@/actions/admin";
import { ReviewsClient } from "./ReviewsClient";

export const metadata = {
  title: "Review Moderation | Kartiva Admin",
};

export const instant = false;

export default async function AdminReviewsPage() {
  const res = await getAdminReviews({ limit: 100 });
  const reviews = res.success ? res.data.reviews : [];

  return (
    <div className="max-w-7xl mx-auto">
      <ReviewsClient initialReviews={reviews} />
    </div>
  );
}
