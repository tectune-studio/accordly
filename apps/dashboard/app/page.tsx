import type { Metadata } from 'next';
import LandingPage from '@/components/marketing/landing-page';
import { landingMetadata, landingStructuredData, serializeJsonLd } from '@/lib/landing/seo';

export const metadata: Metadata = landingMetadata;

export default function Page() {
  return (
    <>
      <script
        id="landing-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingStructuredData) }}
      />
      <LandingPage />
    </>
  );
}
