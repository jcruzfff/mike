'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Create Account</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Connect your wallet to get started
          </p>
        </div>
        <div className="flex justify-center p-4">
          <DynamicWidget />
        </div>
      </div>
    </div>
  );
}
