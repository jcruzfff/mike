import { createContext, useContext, ReactNode } from 'react';

interface DynamicContextType {
  primaryWallet: {
    address: string;
  } | null;
}

const DynamicContext = createContext<DynamicContextType>({
  primaryWallet: null,
});

interface DynamicProviderProps {
  children: ReactNode;
  wallet?: {
    address: string;
  } | null;
}

export function DynamicProvider({ children, wallet = null }: DynamicProviderProps) {
  return (
    <DynamicContext.Provider value={{ primaryWallet: wallet }}>
      {children}
    </DynamicContext.Provider>
  );
}

export function useDynamicContext() {
  const context = useContext(DynamicContext);
  if (context === undefined) {
    throw new Error('useDynamicContext must be used within a DynamicProvider');
  }
  return context;
} 