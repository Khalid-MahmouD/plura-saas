import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/ui/themes';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      {children}
    </ClerkProvider>
  );
};

export default Layout;
