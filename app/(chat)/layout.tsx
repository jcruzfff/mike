import { cookies } from 'next/headers';
import Script from 'next/script';
import * as React from 'react';

import { ClientLayout } from '@/components/client-layout';
import { HeroSection } from '@/components/hero-section';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <ClientLayout isCollapsed={isCollapsed}>
        <HeroSection 
          id="default"
          selectedModelId={selectedModelId}
          selectedVisibilityType="private"
          isReadonly={false}
        >
          {children}
        </HeroSection>
      </ClientLayout>
    </>
  );
}
