'use client';
import { useEffect, useRef, useState } from 'react';
import { DM_Sans, Manrope } from 'next/font/google';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Pricing from './pricing';
import {  ArrowUpRight } from 'lucide-react';

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-marketing-body',
});
const headingFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-marketing-heading',
});
const github = 'https://github.com/tectune-studio/accordly';
const app = '/sign-up';
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
        gsap.from('[data-hero-copy] > *', {
          y: 24,
          opacity: 0,
          stagger: 0.11,
          duration: 0.8,
          ease: 'power3.out',
        });
        gsap.from('[data-consent-card]', {
          y: 35,
          rotation: -4,
          opacity: 0,
          duration: 1,
          delay: 0.3,
          ease: 'power3.out',
        });
        gsap.to('[data-orbit]', {
          rotation: 90,
          ease: 'none',
          scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: 1 },
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
    <div
      ref={root}
      data-marketing
      className={`${bodyFont.variable} ${headingFont.variable} m-0 scroll-smooth scroll-pt-[40px] bg-[var(--paper)] font-[family-name:var(--font-marketing-body)] text-[16px] leading-[1.5] text-[var(--ink)] [--paper:#f9f8f3] [--ink:#202122] [--muted:#626560] [--purple:#5143d9] [--line:#deded5] [&_*]:box-border [&_a]:[-webkit-tap-highlight-color:transparent] [&_button]:[-webkit-tap-highlight-color:transparent] [&_button]:cursor-pointer [&_:is(a,button,input):focus-visible]:outline-[3px] [&_:is(a,button,input):focus-visible]:outline-solid [&_:is(a,button,input):focus-visible]:outline-[#9687ff] [&_:is(a,button,input):focus-visible]:outline-offset-[5px] motion-reduce:scroll-auto motion-reduce:[&_*]:[animation:none]! motion-reduce:[&_*]:[transition:none]! motion-reduce:[&_*::before]:[animation:none]! motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::after]:[animation:none]! motion-reduce:[&_*::after]:[transition:none]!`}
    >
      <a
        className="absolute -top-[100px] left-[20px] z-10 bg-white p-[15px] text-inherit no-underline focus:top-[10px]"
        href="#main"
      >
        Skip to content
      </a>
      <header className="mx-auto flex h-[108px] w-[calc(100%-100px)] max-w-[1320px] items-center justify-between gap-[20px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:h-auto [@media(max-width:720px)]:min-h-[90px] [@media(max-width:720px)]:flex-wrap [@media(max-width:720px)]:py-[20px]">
        <a
          className="flex items-center gap-[9px] font-[family-name:var(--font-marketing-heading)] text-[30px] font-extrabold tracking-[-1.5px] text-inherit no-underline [@media(max-width:720px)]:text-[25px]"
          href="#"
          aria-label="Accordly home"
        >
          <img src="/accordly.png" width="35" height="35" alt="" />
          accordly
        </a>
        <nav
          aria-label="Main navigation"
          className="flex gap-[26px] text-[13px] [@media(max-width:1000px)]:gap-[12px] [@media(max-width:1000px)]:text-[11px] [@media(max-width:720px)]:order-3 [@media(max-width:720px)]:w-full [@media(max-width:720px)]:justify-between [@media(max-width:720px)]:overflow-auto [@media(max-width:720px)]:pb-[4px]"
        >
          {/* <a className="text-inherit no-underline" href="#product">Product</a>*/}
          <a className="text-inherit no-underline" href="#regions">
            Built for your region
          </a>
          <a className="text-inherit no-underline" href="#enterprise">
            Enterprise
          </a>
          <a className="text-inherit no-underline" href="#pricing">
            Pricing
          </a>
          <a
            className="text-inherit no-underline inline-flex items-center gap-x-2"
            href="#opensource"
          >
            Open Source{' '}
            <img
              width="15"
              height="15"
              src="https://img.icons8.com/ios-glyphs/30/github.png"
              alt="github"
            />
            <ArrowUpRight size={15} />
          </a>
        </nav>
        <div className="flex items-center gap-[16px]">
          <a className="text-[14px] text-inherit underline underline-offset-[5px]" href="/sign-in">
            Log in
          </a>
          <a
            className="inline-flex items-center justify-center gap-x-2 text-white! rounded-[8px] border border-[var(--purple)] bg-[var(--purple)] px-[17px] py-[12px] text-[12px] font-semibold no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] [@media(max-width:720px)]:p-[10px] [@media(max-width:720px)]:text-[10px]"
            href="/sign-up"
          >
            Sign up <ArrowUpRight size={15} />
          </a>
        </div>
      </header>
      <main id="main">
        <section
          data-hero
          className="mx-auto grid w-[calc(100%-100px)] max-w-[1320px] grid-cols-[1.15fr_1fr] items-center gap-[55px] pt-[70px] pb-[110px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:1000px)]:gap-[20px] [@media(max-width:720px)]:grid-cols-1 [@media(max-width:720px)]:gap-[60px] [@media(max-width:720px)]:pt-[45px] [@media(max-width:720px)]:pb-[80px]"
        >
          <div data-hero-copy className="min-w-0">
            {/* <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#77915d]" /> OPEN CORE. OPEN CHOICE.
            </p>*/}
            <h1 className="my-[30px] font-[family-name:var(--font-marketing-heading)] text-[clamp(48px,5.5vw,79px)] leading-[1.07] font-medium tracking-[-4px] text-[var(--ink)] [@media(max-width:1000px)]:tracking-[-2.5px] [@media(max-width:720px)]:text-[clamp(42px,12vw,55px)]">
              Good relationships
              <br />
              start with
              <br />
              <em className="font-[Georgia,serif] font-normal text-[var(--purple)]">permission.</em>
            </h1>
            <p className="max-w-[475px] text-[17px] leading-[1.8] text-[var(--muted)]">
              Make consent feel human. Give visitors a clear choice, developers a transparent
              foundation, and your team a place to bring it all together.
            </p>
            <div className="mt-[30px] flex flex-wrap items-center gap-[24px]">
              <a
                className="inline-flex items-center justify-center gap-[24px] rounded-[8px] border border-[var(--purple)] bg-[var(--purple)] px-[24px] py-[17px] text-[14px] font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
                href={app}
              >
                Build Your Banner
              </a>
              <a
                className="text-[14px] text-inherit underline underline-offset-[5px]"
                href={github}
              >
                Explore the source ↗
              </a>
            </div>
            <p className="mt-[23px] text-[11px] text-[var(--muted)]">
              Self-host the core. Or build with Accordly Cloud.
            </p>
          </div>
          <div className="relative flex min-h-[510px] min-w-0 items-center justify-center bg-[radial-gradient(ellipse,#dfdfcb_0,transparent_68%)] [@media(max-width:720px)]:min-h-[480px] [@media(max-width:720px)]:overflow-visible">
            <div
              data-orbit
              className="absolute aspect-square h-auto w-[490px] max-w-[70%] rounded-full border border-dashed border-[#c5c7b3] [transform:rotate(-15deg)] [@media(max-width:720px)]:w-[70%]"
              aria-hidden="true"
            >
              <span className="absolute top-[20px] left-[70px] text-[55px] text-[#a1b67b]">✳</span>
            </div>
            <span className="absolute top-0 right-0 rounded-[30px] bg-[#eceee1] px-[20px] py-[12px] text-[11px] [transform:rotate(6deg)] [@media(max-width:720px)]:text-[10px]">
              A little respect. A lot of trust.
            </span>
            <div
              data-consent-card
              className="z-[1] w-[360px] max-w-[94%] rounded-[17px] border border-[#deded5] bg-white p-[26px] shadow-[0_30px_70px_#34432915] [transform:rotate(-3deg)]"
            >
              <div className="flex items-center justify-between text-[8px] tracking-[1px]">
                <span className="text-[25px] font-bold text-[var(--purple)]">a.</span>
                <span>YOUR WEBSITE, YOUR VOICE</span>
              </div>

              <h2 className="my-[12px] text-[35px] leading-[1.1] font-medium tracking-[-1.5px] text-[var(--ink)]">
                Your space.
                <br />
                Your choice.
              </h2>
              <p className="text-[12px] leading-[1.8] text-[var(--muted)]">
                We use cookies to keep things running. You decide what else you’re comfortable with.
              </p>
              {preferences && (
                <label className="flex justify-between py-[12px] text-[12px]">
                  <span>Optional analytics</span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                </label>
              )}
              <div className="mt-[22px] flex gap-[10px]">
                <button
                  className="flex-1 rounded-[5px] border-0 bg-gray-200 px-[5px] py-[13px] text-[11px] "
                  onClick={() => choose('Optional categories rejected')}
                >
                  Reject all
                </button>
                <button
                  className="flex-1 rounded-[5px] border-0 bg-green-600 px-[5px] py-[13px] text-[11px] text-white!"
                  onClick={() => choose('All optional categories accepted')}
                >
                  Accept all
                </button>
              </div>
              <button
                className="block w-full border-0 bg-transparent p-[16px] text-[10px] underline"
                onClick={() =>
                  preferences
                    ? choose(analytics ? 'Analytics enabled' : 'Optional categories rejected')
                    : setPreferences(true)
                }
              >
                {preferences ? 'Save preferences' : 'Customize my choices'}
              </button>
              <div className="flex justify-between border-t border-[#eee] pt-[15px] text-[8px]">
                <span>Privacy, with a little personality.</span>
                <strong>accordly</strong>
              </div>
            </div>
            <span
              className="absolute -bottom-[27px] text-center text-[11px] text-[var(--muted)] [@media(max-width:720px)]:-bottom-[22px] [@media(max-width:720px)]:text-[10px]"
              role="status"
            >
              {decision ? `✓ ${decision}` : '↳ Try it. This is an interactive preview.'}
            </span>
          </div>
        </section>
        <div className="border-y border-[var(--line)]">
          <div className="mx-auto flex w-[calc(100%-100px)] max-w-[1320px] justify-between gap-[20px] py-[25px] text-[12px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:flex-wrap [@media(max-width:720px)]:gap-[14px]">
            <span className="text-[10px] tracking-[1px] text-[var(--muted)] [@media(max-width:720px)]:w-full">
              CHOICE IS THE STARTING POINT
            </span>
            <span>No pre-ticked boxes</span>
            <span>Equal access to reject</span>
            <span>Preferences you can revisit</span>
          </div>
        </div>
        <section
          id="product"
          className="mx-auto w-[calc(100%-100px)] max-w-[1320px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]"
        >
          <div className="max-w-[800px]" data-reveal>
            <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
              01 / THE PRODUCT
            </p>
            <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
              Less friction.
              <br />
              <em className="font-[Georgia,serif] font-normal text-[var(--purple)]">
                More understanding.
              </em>
            </h2>
            <p className="max-w-[560px] text-[16px] leading-[1.8] text-[var(--muted)]">
              Consent is more than a pop-up. It’s what happens before a tag runs, when a visitor
              decides, and when your team needs to understand that decision.
            </p>
          </div>
          <div className="mt-[45px] grid grid-cols-3 gap-0 [@media(max-width:720px)]:grid-cols-1">
            {features.map(([n, title, body]) => (
              <article
                className="mr-[25px] border-t border-[var(--line)] py-[30px] pr-[25px] [@media(max-width:720px)]:mr-0"
                data-reveal
                key={n}
              >
                <span className="text-[11px] text-[var(--purple)]">{n} /</span>
                <h3 className="text-[20px] font-medium tracking-[-0.5px] text-[var(--ink)]">
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.8] text-[var(--muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="regions" className="bg-[#eeefe6]">
          <div className="mx-auto w-[calc(100%-100px)] max-w-[1320px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]">
            <div className="max-w-[800px]" data-reveal>
              <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
                02 / DIFFERENT PLACES. SAME RESPECT.
              </p>
              <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
                Local expectations.
                <br />
                One thoughtful foundation.
              </h2>
              <p className="max-w-[560px] text-[16px] leading-[1.8] text-[var(--muted)]">
                Build consent experiences for European and US audiences with regional rules and
                meaningful controls.
              </p>
            </div>
            <div className="mt-[45px] grid grid-cols-2 gap-[25px] [@media(max-width:720px)]:grid-cols-1">
              <article
                className="relative rounded-[12px] border border-[#d5d8c9] bg-[#f9faf4] p-[38px] [@media(max-width:720px)]:p-[25px]"
                data-reveal
              >
                <span className="float-right grid h-[65px] w-[65px] place-items-center rounded-full border border-[#d1d8be] text-[22px] text-[#656f52]">
                  EU
                </span>
                <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
                  EUROPEAN UNION
                </p>
                <h3 className="text-[34px] leading-[1.15] font-medium tracking-[-1px] text-[var(--ink)]">
                  Ask before
                  <br />
                  optional tracking.
                </h3>
                <p className="text-[14px] leading-[1.9] text-[var(--muted)]">
                  Support GDPR and ePrivacy consent workflows with opt-in regional rules,
                  purpose-based choices, rejection, withdrawal and versioned consent records.
                </p>
                <ul className="pl-[18px]">
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Gate optional integrations until a choice
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Give accept and reject equal prominence
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Record the configuration a visitor saw
                  </li>
                </ul>
              </article>
              <article
                className="relative rounded-[12px] border border-[#d5d8c9] bg-[#f9faf4] p-[38px] [@media(max-width:720px)]:p-[25px]"
                data-reveal
              >
                <span className="float-right grid h-[65px] w-[65px] place-items-center rounded-full border border-[#d1d8be] text-[22px] text-[#656f52]">
                  US
                </span>
                <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
                  UNITED STATES
                </p>
                <h3 className="text-[34px] leading-[1.15] font-medium tracking-[-1px] text-[var(--ink)]">
                  Respect the right
                  <br />
                  to opt out.
                </h3>
                <p className="text-[14px] leading-[1.9] text-[var(--muted)]">
                  Support state privacy workflows, including California’s CCPA/CPRA, with opt-out
                  regional rules and Global Privacy Control handling where configured.
                </p>
                <ul className="pl-[18px]">
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Honor GPC for configured categories
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Keep privacy choices easy to revisit
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)]">
                    Adapt choices to your processing purposes
                  </li>
                </ul>
              </article>
            </div>
            <p className="mt-[30px] max-w-[930px] text-[11px] leading-[1.8] text-[var(--muted)]">
              Accordly provides technical controls, not a guarantee of legal compliance. Your
              notices, regional configuration, tag setup and processing practices need review for
              the laws that apply to your business.
            </p>
          </div>
        </section>
        <section
          id="opensource"
          className="mx-auto grid w-[calc(100%-100px)] max-w-[1320px] grid-cols-2 items-center gap-[60px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:1000px)]:gap-[25px] [@media(max-width:720px)]:grid-cols-1 [@media(max-width:720px)]:py-[65px]"
        >
          <div className="min-w-0" data-reveal>
            <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
              03 / NOTHING TO HIDE
            </p>
            <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
              Your infrastructure.
              <br />
              <em className="font-[Georgia,serif] font-normal text-[var(--purple)]">Your rules.</em>
            </h2>
            <p className="max-w-[475px] text-[17px] leading-[1.8] text-[var(--muted)]">
              The consent core is open source. Read it, adapt it, self-host it. No hosted
              subscription is required to run the core.
            </p>
            <div className="mt-[30px] flex flex-wrap items-center gap-[24px]">
              <a
                className="inline-flex items-center justify-center gap-[24px] rounded-[8px] border border-[var(--purple)] bg-[var(--purple)] px-[24px] py-[17px] text-[14px] font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
                href={github}
              >
                ⭐ Give us a star on GitHub
              </a>
              <a
                className="text-[14px] text-inherit underline underline-offset-[5px]"
                href={`${github}/tree/main/packages/consent-core`}
              >
                Read the core ↗
              </a>
            </div>
            <p className="mt-[23px] text-[11px] text-[var(--muted)]">
              Consent engine · React integration · Versioned schemas
            </p>
          </div>
          <div
            className="min-w-0 overflow-hidden rounded-[12px] bg-[#242830] text-[#d1d7d1] shadow-[0_25px_45px_#181e2210] [@media(max-width:720px)]:mt-[20px]"
            data-reveal
          >
            <div className="flex items-center gap-[6px] border-b border-[#42454a] p-[18px]">
              <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
              <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
              <i className="h-[7px] w-[7px] rounded-full bg-[#69716f]" />
              <span className="ml-auto font-[monospace] text-[11px] leading-[normal]">
                your-site.js
              </span>
            </div>
            <pre className="overflow-auto p-[25px] text-[13px] leading-[2] text-[#d5e4b7] [@media(max-width:1000px)]:text-[11px]">
              <code>{`// A choice your code can respect.\nconst cmp = createConsentManager({\n  config: publishedConfiguration\n}).initialize();\n\n// Ask first.\nif (!cmp.hasDecision()) {\n  cmp.showPreferences();\n}`}</code>
            </pre>
            <footer className="flex justify-between border-t border-[#42454a] p-[18px] text-[10px]">
              <span>Readable by design.</span>
              <span>↗ Inspect. Adapt. Contribute.</span>
            </footer>
          </div>
        </section>
        <section id="enterprise" className="bg-[#232b25] text-[#f1f3e9]">
          <div className="mx-auto w-[calc(100%-100px)] max-w-[1320px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]">
            <div data-reveal>
              <p className="flex items-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
                04 / ROOM FOR YOUR AMBITION
              </p>
              <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-inherit [@media(max-width:720px)]:tracking-[-1.5px]">
                Big responsibilities.
                <br />
                <em className="font-[Georgia,serif] font-normal text-[#c9dfab]">
                  A considered approach.
                </em>
              </h2>
              <p className="max-w-[650px] text-[17px] leading-[1.8] text-[#bac4b9]">
                Planning consent across brands, teams and markets? Explore the enterprise roadmap
                for deeper identity, governance and deployment requirements.
              </p>
              <a
                className="mt-[20px] inline-flex items-center justify-center gap-[24px] rounded-[8px] border border-[#d9e9bc] bg-[#d9e9bc] px-[24px] py-[17px] text-[14px] font-semibold text-[#202122]! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
                href="#pricing"
              >
                Explore Enterprise ↗
              </a>
            </div>
            <div className="mt-[65px] grid grid-cols-3 gap-[35px] [@media(max-width:720px)]:grid-cols-1 [@media(max-width:720px)]:gap-[25px]">
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
                <article className="border-t border-[#4c584b] pt-[25px]" key={t} data-reveal>
                  <span className="float-right text-[#c9dfab]">↗</span>
                  <h3 className="text-[20px] font-medium text-inherit">{t}</h3>
                  <p className="text-[13px] leading-[1.8] text-[#bac4b9]">{b}</p>
                  <small className="text-[8px] tracking-[1px] text-[#c9dfab]">
                    PLANNED ENTERPRISE CAPABILITIES
                  </small>
                </article>
              ))}
            </div>
            <p className="mt-[40px] max-w-[900px] text-[13px] leading-[1.8] text-[#bac4b9]">
              Available foundation: verified organization membership, roles, tenant row-level
              policies, domain verification and publishing audit records. Enterprise SSO, residency
              commitments, SLAs, mobile SDKs and certified TCF support are not yet available.
            </p>
          </div>
        </section>
        <section
          className="mx-auto w-[calc(100%-100px)] max-w-[800px] py-[100px] text-center [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]"
          data-reveal
        >
          <p className="flex items-center justify-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
            BUILT IN THE OPEN. STILL MOVING FORWARD.
          </p>
          <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
            A foundation today.
            <br />
            More possibilities ahead.
          </h2>
          <p className="leading-[1.9] text-[var(--muted)]">
            Hosted plans range from Cloud Free to Enterprise. Visual configuration, consent records
            and team controls form the foundation. Scheduled scanning, A/B testing, analytics
            connectors, webhooks, universal consent and agency white-label tools are on the roadmap.
          </p>
          <a className="text-[14px] text-inherit underline underline-offset-[5px]" href="#pricing">
            See proposed plans and availability ↗
          </a>
        </section>
        <Pricing />
        <section
          className="mx-auto w-[calc(100%-100px)] max-w-[1320px] border-t border-[var(--line)] pt-[80px] pb-[100px] text-center [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[60px]"
          data-reveal
        >
          <p className="flex items-center justify-center gap-[8px] text-[11px] font-semibold tracking-[2px]">
            MAKE YOUR NEXT FIRST IMPRESSION COUNT
          </p>
          <h2 className="mt-[25px] mb-[40px] font-[family-name:var(--font-marketing-heading)] text-[clamp(50px,7vw,90px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)]">
            Trust starts
            <br />
            with{' '}
            <em className="font-[Georgia,serif] font-normal text-[var(--purple)]">a choice.</em>
          </h2>
          <a
            href={app}
            className="inline-flex items-center justify-center gap-[24px] rounded-[8px] border border-[var(--purple)] bg-[var(--purple)] px-[24px] py-[17px] text-[14px] font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
          >
            Start with Accordly ↗
          </a>
        </section>
      </main>
      <footer className="mx-auto flex w-[calc(100%-100px)] max-w-[1320px] items-center justify-between gap-[20px] border-t border-[var(--line)] py-[30px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:flex-wrap">
        <a
          className="flex items-center gap-[9px] font-[family-name:var(--font-marketing-heading)] text-[30px] font-extrabold tracking-[-1.5px] text-inherit no-underline [@media(max-width:720px)]:text-[25px]"
          href="#"
        >
          <img src="/accordly.png" width="28" height="28" alt="" />
          accordly
        </a>
        <span className="text-[11px] text-[var(--muted)]">Open by design. Built for choice.</span>
        <div className="flex gap-[25px] text-[11px] text-[var(--muted)] [@media(max-width:720px)]:w-full">
          <a className="text-inherit no-underline" href={github}>
            GitHub ↗
          </a>
          <a className="text-inherit no-underline" href={`${github}#readme`}>
            Documentation ↗
          </a>
          <a className="text-inherit no-underline" href="/dashboard">
            Workspace ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
