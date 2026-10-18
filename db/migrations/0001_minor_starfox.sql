ALTER TYPE "public"."order_status" ADD VALUE 'returned';--> statement-breakpoint
CREATE TABLE "user_coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_coupon_usage_user_id_coupon_id_unique" UNIQUE("user_id","coupon_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "razorpay_order_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "tax_rate" numeric(5, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "user_coupon_usage" ADD CONSTRAINT "user_coupon_usage_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coupon_usage" ADD CONSTRAINT "user_coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_coupon_usage" ADD CONSTRAINT "user_coupon_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id");