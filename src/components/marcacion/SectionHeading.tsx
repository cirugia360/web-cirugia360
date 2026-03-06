type SectionHeadingProps = {
  label: string;
  title: string;
  description?: string;
  centered?: boolean;
  inverted?: boolean;
};

const SectionHeading = ({
  label,
  title,
  description,
  centered = true,
  inverted = false,
}: SectionHeadingProps) => (
  <div className={centered ? "text-center" : "text-left"}>
    <p className="subtitle-premium mb-4">{label}</p>
    <h2
      className={`heading-section ${
        inverted ? "text-background" : "text-foreground"
      }`}
    >
      {title}
    </h2>
    <div className={`divider-accent mt-5 ${centered ? "mx-auto" : ""}`} />
    {description ? (
      <p className={`mt-6 text-base leading-8 ${inverted ? "text-background/72" : "text-muted-foreground"}`}>
        {description}
      </p>
    ) : null}
  </div>
);

export default SectionHeading;
