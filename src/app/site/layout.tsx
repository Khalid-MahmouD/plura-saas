import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/ui/themes';

import Navigation from '@/components/site/navigation';
import React from 'react';
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      <main className="min-h-full">
        <Navigation />
        {children}
      </main>
    </ClerkProvider>
  );
};

export default layout;
