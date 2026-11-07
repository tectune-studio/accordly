'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
const github = 'https://github.com/tectune-studio/accordly';
const app = 'https://accordly.tectune.in';
const features = [
  [
    '01',
    'A real choice. Every time.',
    'Accept, reject, customize, or withdraw. Keyboard-accessible controls and a preference center that visitors can reopen.',
  ],
  [
    '02',
    'Permission before execution.',
    'Gate site-owned scripts and iframes by purpose. Set Google Consent Mode v2 defaults before tags load, then update after a decision.',
  ],
  [
    '03',
    'Every decision has context.',
    'Versioned configurations and consent events connect each choice to the banner shown. Unique event IDs make retries deduplicatable.',
  ],
  [
    '04',
    'Small script. Big responsibility.',
    'A lightweight framework-independent core, a lazy-loaded banner, first-party storage, and a React integration.',
  ],
  [
    '05',
    'A workspace for your team.',
    'Clerk organizations, verified membership, invitations and role-based access. PostgreSQL policies isolate tenant data.',
  ],
  [
    '06',
    'Publish with confidence.',
    'Verify domain ownership with DNS or HTTPS. Publish immutable configuration objects with read verification, guarded pointers and audit history.',
  ],
];
export default function Home() {
  const root = useRef(null);
  const [decision, setDecision] = useState('');
  const [preferences, setPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.from('.hero-copy > *', {
          y: 24,
          opacity: 0,
          stagger: 0.11,
          duration: 0.8,
          ease: 'power3.out',
        });
        gsap.from('.consent-card', {
          y: 35,
          rotation: -4,
          opacity: 0,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
        });
        gsap.to('.orbit', {
          rotation: 90,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
        });
        gsap.utils.toArray('[data-reveal]').forEach((el) =>
          gsap.from(el, {
            y: 35,
            opacity: 0,
            duration: 0.75,
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }),
        );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  const choose = (value) => {
    setDecision(value);
    setPreferences(false);
  };
  return (
    <div ref={root}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="nav wrap">
        <a className="logo" href="#" aria-label="Accordly home">
          <img src="/accordly.png" width="35" height="35" alt="" />
          accordly
        </a>
        <nav aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#regions">Built for your region</a>
          <a href="#opensource">Open source</a>
          <a href="#enterprise">Enterprise</a>
        </nav>
        <a className="button small" href={app}>
          Open workspace ↗
        </a>
      </header>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> OPEN CORE. OPEN CHOICE.
            </p>
            <h1>
              Good relationships
              <br />
              start with
              <br />
              <em>permission.</em>
            </h1>
            <p className="lede">
              Make consent feel human. Give visitors a clear choice, developers a transparent
              foundation, and your team a place to bring it all together.
            </p>
            <div className="actions">
              <a className="button primary" href={app}>
                Build a better banner <span>↗</span>
              </a>
              <a className="text-link" href={github}>
                Explore the source ↗
              </a>
            </div>
            <p className="micro">Self-host the core. Or build with Accordly Cloud.</p>
          </div>
          <div className="hero-visual">
            <div className="orbit" aria-hidden="true">
              <span>✳</span>
            </div>
            <span className="floating-label">A little respect. A lot of trust.</span>
            <div className="consent-card">
              <div className="card-top">
                <span className="tiny-logo">a.</span>
                <span>YOUR WEBSITE, YOUR VOICE</span>
                <span>✧</span>
              </div>
              <div className="flower" aria-hidden="true">
                ✳
              </div>
              <h2>
                Your space.
                <br />
                Your choice.
              </h2>
              <p>
                We use cookies to keep things running. You decide what else you’re comfortable with.
              </p>
              {preferences && (
                <label className="preference">
                  <span>Optional analytics</span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                </label>
              )}
              <div className="choices">
                <button onClick={() => choose('All optional categories accepted')}>
                  Accept all
                </button>
                <button onClick={() => choose('Optional categories rejected')}>Reject all</button>
              </div>
              <button
                className="preferences"
                onClick={() =>
                  preferences
                    ? choose(analytics ? 'Analytics enabled' : 'Optional categories rejected')
                    : setPreferences(true)
                }
              >
                {preferences ? 'Save preferences' : 'Customize my choices'}
              </button>
              <div className="card-bottom">
                <span>Privacy, with a little personality.</span>
                <strong>accordly</strong>
              </div>
            </div>
            <span className="status" role="status">
              {decision ? `✓ ${decision}` : '↳ Try it. This is an interactive preview.'}
            </span>
          </div>
        </section>
        <div className="principles">
          <div className="wrap">
            <span>CHOICE IS THE STARTING POINT</span>
            <span>No pre-ticked boxes</span>
            <span>Equal access to reject</span>
            <span>Preferences you can revisit</span>
          </div>
        </div>
        <section id="product" className="section wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">01 / THE PRODUCT</p>
            <h2>
              Less friction.
              <br />
              <em>More understanding.</em>
            </h2>
            <p>
              Consent is more than a pop-up. It’s what happens before a tag runs, when a visitor
              decides, and when your team needs to understand that decision.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(([n, title, body]) => (
              <article data-reveal key={n}>
                <span className="number">{n} /</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="regions" className="region-section">
          <div className="wrap section">
            <div className="section-head" data-reveal>
              <p className="eyebrow">02 / DIFFERENT PLACES. SAME RESPECT.</p>
              <h2>
                Local expectations.
                <br />
                One thoughtful foundation.
              </h2>
              <p>
                Build consent experiences for European and US audiences with regional rules and
                meaningful controls.
              </p>
            </div>
            <div className="region-grid">
              <article data-reveal>
                <span className="region-symbol">EU</span>
                <p className="eyebrow">EUROPEAN UNION</p>
                <h3>
                  Ask before
                  <br />
                  optional tracking.
                </h3>
                <p>
                  Support GDPR and ePrivacy consent workflows with opt-in regional rules,
                  purpose-based choices, rejection, withdrawal and versioned consent records.
                </p>
                <ul>
                  <li>Gate optional integrations until a choice</li>
                  <li>Give accept and reject equal prominence</li>
                  <li>Record the configuration a visitor saw</li>
                </ul>
              </article>
              <article data-reveal>
                <span className="region-symbol">US</span>
                <p className="eyebrow">UNITED STATES</p>
                <h3>
                  Respect the right
                  <br />
                  to opt out.
                </h3>
                <p>
                  Support state privacy workflows, including California’s CCPA/CPRA, with opt-out
                  regional rules and Global Privacy Control handling where configured.
                </p>
                <ul>
                  <li>Honor GPC for configured categories</li>
                  <li>Keep privacy choices easy to revisit</li>
                  <li>Adapt choices to your processing purposes</li>
                </ul>
              </article>
            </div>
            <p className="legal">
              Accordly provides technical controls, not a guarantee of legal compliance. Your
              notices, regional configuration, tag setup and processing practices need review for
              the laws that apply to your business.
            </p>
          </div>
        </section>
        <section id="opensource" className="section wrap open-section">
          <div data-reveal>
            <p className="eyebrow">03 / NOTHING TO HIDE</p>
            <h2>
              Your infrastructure.
              <br />
              <em>Your rules.</em>
            </h2>
            <p className="lede">
              The consent core is open source. Read it, adapt it, self-host it. No hosted
              subscription is required to run the core.
            </p>
            <div className="actions">
              <a className="button primary" href={github}>
                ☆ Give us a star on GitHub
              </a>
              <a className="text-link" href={`${github}/tree/main/packages/consent-core`}>
                Read the core ↗
              </a>
            </div>
            <p className="micro">Consent engine · React integration · Versioned schemas</p>
          </div>
          <div className="code-window" data-reveal>
            <div>
              <i />
              <i />
              <i />
              <span>your-site.js</span>
            </div>
            <pre>
              <code>{`// A choice your code can respect.\nconst cmp = createConsentManager({\n  config: publishedConfiguration\n}).initialize();\n\n// Ask first.\nif (!cmp.hasDecision()) {\n  cmp.showPreferences();\n}`}</code>
            </pre>
            <footer>
              <span>Readable by design.</span>
              <span>↗ Inspect. Adapt. Contribute.</span>
            </footer>
          </div>
        </section>
        <section id="enterprise" className="enterprise">
          <div className="wrap section">
            <div data-reveal>
              <p className="eyebrow">04 / ROOM FOR YOUR AMBITION</p>
              <h2>
                Big responsibilities.
                <br />
                <em>A considered approach.</em>
              </h2>
              <p className="lede">
                Planning consent across brands, teams and markets? Explore the enterprise roadmap
                for deeper identity, governance and deployment requirements.
              </p>
              <a className="button light" href={`${app}/billing`}>
                Explore Enterprise ↗
              </a>
            </div>
            <div className="enterprise-grid">
              {[
                [
                  'Identity & governance',
                  'SSO / SAML, advanced organization controls and contractual requirements.',
                ],
                [
                  'Control over your data',
                  'EU data residency options, a DPA and tailored retention policies.',
                ],
                ['Support at your scale', 'An SLA, dedicated customer success and mobile SDKs.'],
              ].map(([t, b]) => (
                <article key={t} data-reveal>
                  <span>↗</span>
                  <h3>{t}</h3>
                  <p>{b}</p>
                  <small>PLANNED ENTERPRISE CAPABILITIES</small>
                </article>
              ))}
            </div>
            <p className="enterprise-note">
              Available foundation: verified organization membership, roles, tenant row-level
              policies, domain verification and publishing audit records. Enterprise SSO, residency
              commitments, SLAs, mobile SDKs and certified TCF support are not yet available.
            </p>
          </div>
        </section>
        <section className="section wrap roadmap" data-reveal>
          <p className="eyebrow">BUILT IN THE OPEN. STILL MOVING FORWARD.</p>
          <h2>
            A foundation today.
            <br />
            More possibilities ahead.
          </h2>
          <p>
            Hosted plans range from Cloud Free to Enterprise. Visual configuration, consent records
            and team controls form the foundation. Scheduled scanning, A/B testing, analytics
            connectors, webhooks, universal consent and agency white-label tools are on the roadmap.
          </p>
          <a className="text-link" href={`${app}/billing`}>
            See proposed plans and availability ↗
          </a>
        </section>
        <section className="closing wrap" data-reveal>
          <p className="eyebrow">MAKE YOUR NEXT FIRST IMPRESSION COUNT</p>
          <h2>
            Trust starts
            <br />
            with <em>a choice.</em>
          </h2>
          <a href={app} className="button primary">
            Start with Accordly ↗
          </a>
        </section>
      </main>
      <footer className="site-footer wrap">
        <a className="logo" href="#">
          <img src="/accordly.png" width="28" height="28" alt="" />
          accordly
        </a>
        <span>Open by design. Built for choice.</span>
        <div>
          <a href={github}>GitHub ↗</a>
          <a href={`${github}#readme`}>Documentation ↗</a>
          <a href={app}>Workspace ↗</a>
        </div>
      </footer>
    </div>
  );
}
