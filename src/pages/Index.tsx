import { useState } from 'react';
import { ApplicationProvider, useApplication } from '@/context/ApplicationContext';
import ProgressBar from '@/components/ProgressBar';
import StepWrapper from '@/components/StepWrapper';
import PreQualification from '@/components/steps/PreQualification';
import BusinessProfile from '@/components/steps/BusinessProfile';
import ProcessingProfile from '@/components/steps/ProcessingProfile';
import OwnershipPrincipals from '@/components/steps/OwnershipPrincipals';
import BankingSettlement from '@/components/steps/BankingSettlement';
import DocumentUpload from '@/components/steps/DocumentUpload';
import ReviewSubmit from '@/components/steps/ReviewSubmit';

const STEP_LABELS = [
  'Business Profile',
  'Processing',
  'Ownership',
  'Banking',
  'Documents',
  'Review',
];

const WizardContent = () => {
  const { currentStep, setCurrentStep, direction, setDirection, updateData, data } = useApplication();
  const [qualified, setQualified] = useState(false);

  const goNext = () => {
    setDirection(1);
    setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    setDirection(-1);
    if (currentStep === 0) {
      setQualified(false);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleQualified = () => {
    // Pre-fill monthly volume from pre-qualification
    if (data.preQualification.monthlyVolume) {
      updateData('processingProfile', { monthlyVolume: Number(data.preQualification.monthlyVolume) });
    }
    setQualified(true);
    setCurrentStep(0);
    setDirection(1);
  };

  if (!qualified) {
    return <PreQualification onQualified={handleQualified} />;
  }

  const steps = [
    <BusinessProfile key={0} onNext={goNext} onPrev={goPrev} />,
    <ProcessingProfile key={1} onNext={goNext} onPrev={goPrev} />,
    <OwnershipPrincipals key={2} onNext={goNext} onPrev={goPrev} />,
    <BankingSettlement key={3} onNext={goNext} onPrev={goPrev} />,
    <DocumentUpload key={4} onNext={goNext} onPrev={goPrev} />,
    <ReviewSubmit key={5} onPrev={goPrev} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-foreground tracking-tight">Merchant Application</h1>
          <p className="text-xs text-muted-foreground">Maverick Payments</p>
        </div>
        <ProgressBar currentStep={currentStep} totalSteps={STEP_LABELS.length} stepLabels={STEP_LABELS} />
        <StepWrapper stepKey={currentStep} direction={direction}>
          {steps[currentStep]}
        </StepWrapper>
      </div>
    </div>
  );
};

const Index = () => (
  <ApplicationProvider>
    <WizardContent />
  </ApplicationProvider>
);

export default Index;
