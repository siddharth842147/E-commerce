import { siteConfig } from "@/lib/siteConfig";

export function Testimonials() {
  return (
    <section className="w-full py-space-xl bg-surface" id="reviews">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-margin">
        <div className="text-center max-w-2xl mx-auto mb-space-lg">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
            Community Voice
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
            Loved by Happy Shoppers Across India
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-space-md">
          {siteConfig.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl shadow-sm border border-outline-variant/35 hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
            >
              <div>
                <div
                  className="flex items-center gap-1 text-amber-500 mb-4"
                  role="img"
                  aria-label={`${t.rating} out of 5 stars rating`}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[18px] fill-1"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true"
                    >
                      star
                    </span>
                  ))}
                </div>

                <p className="font-body-lg text-body-lg text-on-surface italic leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-surface-container">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 text-white flex items-center justify-center font-bold font-label-md text-label-md shrink-0 shadow-sm"
                  aria-hidden="true"
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {t.name}
                    </span>
                    <span
                      className="material-symbols-outlined text-[16px] text-emerald-600 fill-1"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      title="Verified Shopper"
                      aria-label="Verified Shopper"
                    >
                      verified
                    </span>
                  </div>
                  <span className="font-body-sm text-[12px] text-on-surface-variant">
                    {t.city} • Verified Buyer
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
