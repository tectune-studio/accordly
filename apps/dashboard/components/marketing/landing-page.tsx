import { DM_Sans, Manrope } from 'next/font/google';
import { ArrowUpRight, Asterisk } from 'lucide-react';
import {
  FEATURES,
  CTACOMP,
  FOOTER,
  SIDEHERO,
  OPENSOURCE,
  features,
} from '@/components/marketing/landing-elements';
import { Pricing } from '@/components/marketing/pricing';
import LandingHeader from '@/components/marketing/landing-header';

const github = 'https://github.com/tectune-studio/accordly';
// Add a onboarding link instead of direct signup
const app = '/sign-up';

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

export default function Home() {
  return (
    <div
      data-marketing
      className={`${bodyFont.variable} ${headingFont.variable} m-0 bg-white scroll-smooth scroll-pt-[40px]  font-[family-name:var(--font-marketing-body)] text-[16px] leading-[1.5] text-[var(--ink)] [--paper:#f9f8f3] [--ink:#202122] [--muted:#626560] [--purple:#5143d9] [--line:#deded5] [&_*]:box-border [&_a]:[-webkit-tap-highlight-color:transparent] [&_button]:[-webkit-tap-highlight-color:transparent] [&_button]:cursor-pointer [&_:is(a,button,input):focus-visible]:outline-[3px] [&_:is(a,button,input):focus-visible]:outline-solid [&_:is(a,button,input):focus-visible]:outline-[#9687ff] [&_:is(a,button,input):focus-visible]:outline-offset-[5px] motion-reduce:scroll-auto motion-reduce:[&_*]:[animation:none]! motion-reduce:[&_*]:[transition:none]! motion-reduce:[&_*::before]:[animation:none]! motion-reduce:[&_*::before]:[transition:none]! motion-reduce:[&_*::after]:[animation:none]! motion-reduce:[&_*::after]:[transition:none]!`}
    >
      <LandingHeader>
        <nav
          aria-label="Main navigation"
          className="grid w-full grid-cols-1 items-center gap-y-4 px-6 sm:h-24 sm:grid-cols-3 sm:gap-y-0 md:px-12 lg:px-16 [@media(max-width:720px)]:h-fit [@media(max-width:720px)]:pt-5 [@media(max-width:720px)]:pb-2"
        >
          {/* LEFT: Logo & Mobile Github */}
          <div className="flex w-full items-center justify-between gap-x-5 justify-self-stretch sm:w-auto sm:justify-self-start">
            <a
              className="flex items-center gap-[9px] font-[family-name:var(--font-marketing-heading)] text-[30px] font-extrabold tracking-[-1.5px] text-inherit no-underline [@media(max-width:720px)]:text-[25px]"
              href={
                process.env.NEXT_PUBLIC_APP_URL === undefined
                  ? '/'
                  : process.env.NEXT_PUBLIC_APP_URL
              }
              aria-label="Accordly home"
            >
              <img src="/accordly.png" width="35" height="20" alt="" />
              accordly
            </a>

            <a
              className="inline-flex items-center gap-x-2 text-inherit no-underline sm:hidden"
              href={github}
              target="_blank"
              rel="noopener noreferrer"
            >
              Github
              <img width="20" height="20" src="/github.png" alt="github" />
            </a>
          </div>

          {/* MIDDLE: Nav Links */}
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 sm:flex-nowrap sm:justify-self-center sm:gap-x-14">
            <a
              className="relative text-inherit md:after:absolute md:after:-bottom-1 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-current md:after:content-[''] md:after:transition-[width] md:after:duration-400 md:hover:after:w-full"
              href="#product"
            >
              Product
            </a>
            <a
              className="relative text-inherit md:after:absolute md:after:-bottom-1 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-current md:after:content-[''] md:after:transition-[width] md:after:duration-400 md:hover:after:w-full"
              href="#enterprise"
            >
              Enterprise
            </a>
            <a
              className="relative text-inherit md:after:absolute md:after:-bottom-1 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-current md:after:content-[''] md:after:transition-[width] md:after:duration-400 md:hover:after:w-full"
              href="#pricing"
            >
              Pricing
            </a>
            <a
              className="relative text-inherit md:after:absolute md:after:-bottom-1 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-current md:after:content-[''] md:after:transition-[width] md:after:duration-400 md:hover:after:w-full"
              href="#"
            >
              Documentation
            </a>
          </div>

          {/* RIGHT: Auth Buttons */}
          <div className="hidden items-center gap-x-4 sm:flex sm:justify-self-end">
            <a
              className="relative hidden text-[16px] text-inherit underline underline-offset-[5px] hover:no-underline sm:block md:after:absolute md:after:-bottom-1 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-current md:after:content-[''] md:after:transition-[width] md:after:duration-400 md:hover:after:w-full"
              href="/sign-in"
            >
              Log In
            </a>
            <a
              className="hidden items-center justify-center gap-x-1 rounded-full border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] sm:inline-flex [@media(max-width:720px)]:p-[10px] [@media(max-width:720px)]:text-[10px]"
              href="/sign-up"
            >
              Sign Up <ArrowUpRight size={15} />
            </a>
          </div>
        </nav>
      </LandingHeader>
      <main id="main" className="bg-white">
        <section
          data-hero
          className="mx-auto grid bg-white w-[calc(100%-100px)] max-w-[1320px] grid-cols-[1.15fr_1fr] items-center gap-10 pt-10 sm:pt-18 pb-24 [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:1000px)]:gap-[20px] [@media(max-width:720px)]:grid-cols-1 [@media(max-width:720px)]:gap-[60px] [@media(max-width:720px)]:pt-[45px] [@media(max-width:720px)]:pb-[80px]"
        >
          <div data-hero-copy className="min-w-0">
            <h1 className="sm:my-7 my-2 space-x-3 font-[family-name:var(--font-marketing-heading)] text-[clamp(48px,5.5vw,90px)] leading-[1.07] font-semibold tracking-[-4px] text-[var(--ink)] [@media(max-width:1000px)]:tracking-[-2.5px] [@media(max-width:720px)]:text-[clamp(4px,12vw,55px)]">
              <span> Collect consent.</span>
              <br />
              <em className="font-[Georgia,serif] font-normal text-primary ">Block the rest.</em>
            </h1>
            <p className="max-w-[475px] text-[17px] sm:leading-[1.8] text-[var(--muted)]">
              Build cookie banners, collect visitor preferences, and block scripts until consent is
              approved.
            </p>
            <div className="mt-[30px] flex flex-wrap items-center gap-2">
              <a
                className="text-[14px] rounded-full inline-flex items-center gap-x-1 bg-black text-white! underline underline-offset-[5px]  py-3 px-6 transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220] border "
                href={github}
              >
                View GitHub{' '}
                <img width="15" height="15" src="/github.png" alt="github" className="invert" />
              </a>
              <a
                className="inline-flex items-center justify-center gap-x-1 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)]  py-3 px-6 text-[14px] font-semibold text-white! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
                href={app}
              >
                Build Your Banner <ArrowUpRight size={15} />
              </a>
            </div>
            <p className="mt-[23px] hidden sm:block text-sm text-[var(--muted)]">
              Free and open source. Self-host the core or use Accordly Cloud.
            </p>
          </div>
          <SIDEHERO />
        </section>
        <div id="product" className=" h-1 pb-10" />

        <div className="hidden sm:block border-y border-[var(--line)]">
          <div className="mx-auto flex w-[calc(100%-100px)] max-w-[1320px] justify-between gap-[20px] py-[25px] text-[12px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:flex-wrap [@media(max-width:720px)]:gap-[14px]">
            <span className="text-[10px] tracking-[1px] text-[var(--muted)] [@media(max-width:720px)]:w-full">
              CHOICE IS THE STARTING POINT
            </span>
            <span>No pre-ticked boxes</span>
            <span>Equal access to reject</span>
            <span>Preferences you can revisit</span>
          </div>
        </div>
        {/* App Features */}
        <FEATURES
          title={
            <span>
              Less friction.
              <br />
              <em className="font-[Georgia,serif] font-normal text-[var(--brand-primary)]">
                More understanding.
              </em>
            </span>
          }
          description="Consent is more than a pop-up. It’s what happens before a tag runs, when a visitor decides, and when your team needs to understand that decision."
          cta={{ label: 'Start building with Accordly', href: app }}
          features={features}
        />
        <section id="regions" className="bg-white">
          <div className="mx-auto w-[calc(100%-100px)] max-w-[1320px] sm:pt-25 pt-10 [@media(max-width:1000px)]:w-[calc(100%-48px)] ">
            <div className="max-w-[800px]" data-reveal>
              <h2 className="my-[25px] font-[family-name:var(--font-marketing-heading)] text-[clamp(36px,4vw,57px)] leading-[1.12] font-medium tracking-[-2.5px] text-[var(--ink)] [@media(max-width:720px)]:tracking-[-1.5px]">
                One thoughtful foundation.
              </h2>
              <p className="max-w-[560px] text-[16px] leading-[1.8] text-[var(--muted)]">
                Build consent experiences for European and US audiences with regional rules and
                meaningful controls.
              </p>
            </div>
            <div className="mt-[45px] grid grid-cols-2 gap-[25px] [@media(max-width:720px)]:grid-cols-1">
              <article
                className="relative rounded-[12px] border border-dull-white bg-dull-white p-[38px] [@media(max-width:720px)]:p-[25px]"
                data-reveal
              >
                <span className="float-right grid h-[65px] w-[65px] place-items-center rounded-full border border-primary text-[22px] text-black">
                  EU
                </span>
                <h3 className="text-2xl sm:text-[34px] leading-[1.15] font-medium tracking-[-1px] text-black">
                  Ask before
                  <br />
                  optional tracking.
                </h3>
                <p className="text-[13px] sm:text-[14px] pt-5 leading-[1.9] text-[var(--muted)]">
                  Support GDPR and ePrivacy consent workflows with opt-in regional rules,
                  purpose-based choices, rejection, withdrawal and versioned consent records.
                </p>
                <ul className="flex items-start flex-col pt-5 gap-y-2">
                  <li className="text-[14px] inline-flex items-start leading-[1.9] text-[var(--muted)]">
                    <Asterisk size={25} className="pr-2" /> Gate optional integrations until a
                    choice
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)] inline-flex items-start">
                    <Asterisk size={25} className="pr-2" /> Give accept and reject equal prominence
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)] inline-flex items-start">
                    <Asterisk size={25} className="pr-2" />
                    Record the configuration a visitor saw
                  </li>
                </ul>
              </article>
              <article
                className="relative rounded-[12px] border border-dull-white bg-dull-white p-[38px] [@media(max-width:720px)]:p-[25px]"
                data-reveal
              >
                <span className="float-right grid h-[65px] w-[65px] place-items-center rounded-full border border-primary text-[22px] text-black">
                  US
                </span>
                <h3 className="text-2xl sm:text-[34px] leading-[1.15] font-medium tracking-[-1px] text-black">
                  Respect the right
                  <br />
                  to opt out.
                </h3>
                <p className="text-[13px] sm:text-[14px] pt-5 leading-[1.9] text-[var(--muted)]">
                  Support state privacy workflows, including California's CCPA/CPRA, with opt-out
                  regional rules and Global Privacy Control handling where configured.
                </p>
                <ul className="flex items-start flex-col gap-y-2 pt-5">
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)] inline-flex items-start">
                    <Asterisk size={25} className="pr-2" /> Honor GPC for configured categories
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)] inline-flex items-start">
                    <Asterisk size={25} className="pr-2" /> Keep privacy choices easy to revisit
                  </li>
                  <li className="text-[14px] leading-[1.9] text-[var(--muted)] inline-flex items-start">
                    <Asterisk size={25} className="pr-2" />
                    Adapt choices to your processing purposes
                  </li>
                </ul>
              </article>
            </div>
          </div>
        </section>
        <OPENSOURCE github={github} />
        <section id="enterprise" className="bg-[#232b25] text-[#f1f3e9]">
          <div className="mx-auto w-[calc(100%-100px)] max-w-[1320px] py-[100px] [@media(max-width:1000px)]:w-[calc(100%-48px)] [@media(max-width:720px)]:py-[65px]">
            <div data-reveal>
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
                className="mt-[20px] inline-flex items-center justify-center gap-[24px] rounded-full border border-[#d9e9bc] bg-[#d9e9bc] px-[24px] py-[17px] text-[14px] font-semibold text-[#202122]! no-underline transition-[transform,translate,box-shadow] duration-200 ease-[ease] hover:-translate-y-[3px] hover:shadow-[0_5px_0_#20212220]"
                href="#pricing"
              >
                Explore Enterprise
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
                  <span className="float-right text-[#c9dfab]"></span>
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
        <Pricing />
        <CTACOMP app={app} />
      </main>
      <FOOTER github={github} />
    </div>
  );
}
