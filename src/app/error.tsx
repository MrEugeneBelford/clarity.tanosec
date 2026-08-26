'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Clarity] Page boundary caught an error', error.name); }, [error]);
  return <main className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-headline">Something interrupted Clarity</h1><p className="mt-4 leading-7 text-muted-foreground">Your browser can try loading this step again. If the problem continues, restart the assessment; completed reports are never stored in the browser.</p><Button className="mt-7" onClick={reset}>Try again</Button></main>;
}
