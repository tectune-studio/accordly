import { Suspense } from 'react';
import Demo from './site';
export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="my-1.5 text-xs leading-normal text-muted-foreground">Loading consent demo…</p>
      }
    >
      <Demo />
    </Suspense>
  );
}
