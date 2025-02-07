'use client';

import * as React from 'react';
import type { PropsWithChildren } from 'react';

export function LayoutContent({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
} 