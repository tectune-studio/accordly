import { Suspense } from 'react';
import Demo from './site';
export default function Page() {
  return (
    <Suspense fallback={<p>Loading consent demo…</p>}>
      <Demo />
    </Suspense>
  );
}
