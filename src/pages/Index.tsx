import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/useAutoSave';
import { Save, RotateCcw, ClipboardList } from 'lucide-react';

const STEP_LABELS = [
  'Business Profile',
  'Processing',
  'Ownership',
  'Banking',
  'Documents',
  'Review',
];

const WizardContent = () => {
  const { currentStep, setCurrentStep, direction, setDirection, updateData, data, setData } = useApplication();
  const [qualified, setQualified] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  // Check for saved draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setShowResume(true);
  }, []);

  // Auto-save
  const { manualSave } = useAutoSave(data, currentStep, qualified);

  const handleResume = () => {
    const draft = loadDraft();
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
      setQualified(draft.qualified);
    }
    setShowResume(false);
  };

  const handleDismissResume = () => {
    clearDraft();
    setShowResume(false);
  };

  const handleManualSave = () => {
    manualSave();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

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
    if (data.preQualification.monthlyVolume) {
      updateData('processingProfile', { monthlyVolume: Number(data.preQualification.monthlyVolume) });
    }
    setQualified(true);
    setCurrentStep(0);
    setDirection(1);
  };

  // Resume banner
  if (showResume) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wizard-card max-w-md w-full space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto">
            <RotateCcw className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome Back!</h2>
          <p className="text-sm text-muted-foreground">
            We found a saved application in progress. Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button onClick={handleDismissResume} className="btn-secondary flex-1">Start Fresh</button>
            <button onClick={handleResume} className="btn-primary flex-1">Resume Application</button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Merchant Application</h1>
            <p className="text-xs text-muted-foreground">Maverick Payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/applications"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Applications
            </Link>
            <button
              onClick={handleManualSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                saveFlash
                  ? 'bg-accent/10 text-accent'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saveFlash ? 'Saved!' : 'Save Draft'}
            </button>
          </div>
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
