import ScrollReveal from "@/components/ScrollReveal";
import Counter from "@/components/Counter";
import SectionHeading from "@/components/marcacion/SectionHeading";

type ExperienceMetric = {
  label: string;
  target: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
};

type ExperienceMetricsSectionProps = {
  title: string;
  description?: string;
  label?: string;
  metrics: ExperienceMetric[];
};

const ExperienceMetricsSection = ({
  title,
  description,
  label = "EXPERIENCIA",
  metrics,
}: ExperienceMetricsSectionProps) => (
  <section className="bg-foreground">
    <div className="container-premium section-padding">
      <ScrollReveal>
        <SectionHeading label={label} title={title} description={description} inverted />
      </ScrollReveal>
      <div className="mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <ScrollReveal key={metric.label} delay={index * 0.08}>
            <div className="text-center">
              <div className="text-accent">
                <Counter
                  target={metric.target}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  locale={metric.locale}
                />
              </div>
              <p className="mt-3 text-sm text-background/68">{metric.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default ExperienceMetricsSection;
