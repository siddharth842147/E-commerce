import { siteConfig } from "@/lib/siteConfig";

export function WhyKartiva() {
  return (
    <section className="w-full py-space-xl bg-surface-container-low" id="why-us">
      <div className="max-w-[1360px] mx-auto px-margin">
        <div className="text-center max-w-2xl mx-auto mb-space-lg">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
            Uncompromising Quality
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mt-1">
            Why India Shops at Kartiva
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Elevating everyday commerce with swift logistics, authentic craft, and heartfelt customer care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {siteConfig.valueProps.map((prop, idx) => {
            const isSecondary = idx % 2 === 1;
            return (
              <div
                key={prop.title}
                className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-3 group hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                    isSecondary
                      ? "bg-secondary-fixed text-secondary"
                      : "bg-primary-fixed text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {prop.icon}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {prop.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {prop.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
