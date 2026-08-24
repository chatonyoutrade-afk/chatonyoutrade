type InfoSection = {
  number: string;
  title: string;
  text: string;
  items?: string[];
};

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  mutedTitle: string;
  intro: string;
  sections: InfoSection[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  notice?: string;
};

export default function PublicInfoPage({
  eyebrow,
  title,
  mutedTitle,
  intro,
  sections,
  primaryHref,
  primaryLabel,
  secondaryHref = "/",
  secondaryLabel = "Back to home",
  notice = "ChatOnYou Trade is a paper-trading product operated by NEOCRAFT LLP.",
}: PublicInfoPageProps) {
  return (
    <main className="public-info-shell">
      <header className="public-info-top">
        <a className="public-info-logo" href="/" aria-label="ChatOnYou Trade home">
          <img src="/chatonyou-logo.png" alt="ChatOnYou" />
          <b>TRADE</b>
        </a>
        <nav aria-label="Page navigation">
          <a href="/trade">Paper terminal</a>
          <a href="/">×</a>
        </nav>
      </header>

      <section className="public-info-hero">
        <div className="public-info-glow" />
        <span>{eyebrow}</span>
        <h1>{title}<br /><em>{mutedTitle}</em></h1>
        <p>{intro}</p>
        <div>
          <a href={primaryHref}>{primaryLabel} <b>↗</b></a>
          <a href={secondaryHref}>{secondaryLabel}</a>
        </div>
      </section>

      <section className="public-info-grid">
        {sections.map((section) => (
          <article key={section.number}>
            <span>{section.number}</span>
            <div>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              {section.items ? <ul>{section.items.map((item) => <li key={item}><i>✓</i>{item}</li>)}</ul> : null}
            </div>
          </article>
        ))}
      </section>

      <footer className="public-info-footer">
        <p>{notice}</p>
        <nav aria-label="Legal and support links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/risk-disclosure">Risk</a>
          <a href="/contact">Contact</a>
        </nav>
      </footer>
    </main>
  );
}
