import React, { createContext, useContext, useState, useCallback } from 'react';
import { MerchantApplication, initialApplication } from '@/types/application';

interface ApplicationContextType {
  data: MerchantApplication;
  updateData: <K extends keyof MerchantApplication>(
    section: K,
    value: Partial<MerchantApplication[K]> | MerchantApplication[K]
  ) => void;
  setData: React.Dispatch<React.SetStateAction<MerchantApplication>>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  direction: number;
  setDirection: (dir: number) => void;
  isSubmitted: boolean;
  setIsSubmitted: (v: boolean) => void;
  confirmationId: string;
  setConfirmationId: (id: string) => void;
  signature: string | null;
  setSignature: (sig: string | null) => void;
  storedAppId: string | null;
  setStoredAppId: (id: string | null) => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<MerchantApplication>(initialApplication);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [storedAppId, setStoredAppId] = useState<string | null>(null);

  const updateData = useCallback(
    <K extends keyof MerchantApplication>(
      section: K,
      value: Partial<MerchantApplication[K]> | MerchantApplication[K]
    ) => {
      setData((prev) => ({
        ...prev,
        [section]: Array.isArray(value)
          ? value
          : typeof value === 'object' && !Array.isArray(value)
          ? { ...prev[section], ...value }
          : value,
      }));
    },
    []
  );

  return (
    <ApplicationContext.Provider
      value={{
        data,
        updateData,
        setData,
        currentStep,
        setCurrentStep,
        direction,
        setDirection,
        isSubmitted,
        setIsSubmitted,
        confirmationId,
        setConfirmationId,
        signature,
        setSignature,
        storedAppId,
        setStoredAppId,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplication must be used within ApplicationProvider');
  return ctx;
};
