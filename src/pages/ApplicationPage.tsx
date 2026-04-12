import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ApplicationProvider, useApplication } from '@/context/ApplicationContext';
import ProgressBar from '@/components/ProgressBar';
import StepWrapper from '@/components/StepWrapper';
import BusinessProfile from '@/components/steps/BusinessProfile';
import ProcessingProfile from '@/components/steps/ProcessingProfile';
import OwnershipPrincipals from '@/components/steps/OwnershipPrincipals';
import BankingSettlement from '@/components/steps/BankingSettlement';
import DocumentUpload from '@/components/steps/DocumentUpload';
import ReviewSubmit from '@/components/steps/ReviewSubmit';
import { useAutoSave, loadDraft, clearDraft } from '@/hooks/useAutoSave';
import { Save, ClipboardList } from 'lucide-react';
import { useState } from 'react';

const STEP_LABELS = [
  'Business Profile',
  'Processing',
  'Ownership',
  'Banking',
  'Documents',
  'Review',
];

const ApplicationContent = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, direction, setDirection, data, setData } = useApplication();
  const [saveFlash, setSaveFlash] = useState(false);
  const [showResume, setShowResume] = useState(false);

  const stepNum = parseInt(step || '1', 10) - 1;

  useEffect(() => {
    const draft = loadDraft();
    if (draft && stepNum === 0) setShowResume(true);
  }, []);

  useEffect(() => {
    if (stepNum >= 0 && stepNum < 6 && stepNum !== currentStep) {
      setCurrentStep(stepNum);
    }
  }, [stepNum]);

  const { manualSave } = useAutoSave(data, currentStep, true);

  const handleResume = () => {
    const draft = loadDraft();
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
      navigate(`/application/${draft.step + 1}`);
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

  const goToStep = (stepIndex: number) => {
    setDirection(stepIndex > currentStep ? 1 : -1);
    setCurrentStep(stepIndex);
    navigate(`/application/${stepIndex + 1}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAndGoToStep = (stepIndex: number) => {
    manualSave();
    goToStep(stepIndex);
  };

  const goNext = () => {
    setDirection(1);
    const next = currentStep + 1;
    setCurrentStep(next);
    navigate(`/application/${next + 1}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setDirection(-1);
    if (currentStep === 0) {
      navigate('/pre-app');
    } else {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      navigate(`/application/${prev + 1}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (showResume) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wizard-card max-w-md w-full space-y-5 text-center">
          <h2 className="text-xl font-bold text-foreground">Welcome Back!</h2>
          <p className="text-sm text-muted-foreground">
            We found a saved application. Continue where you left off?
          </p>
          <div className="flex gap-3">
            <button onClick={handleDismissResume} className="btn-secondary flex-1">Start Fresh</button>
            <button onClick={handleResume} className="btn-primary flex-1">Resume</button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    <BusinessProfile key={0} onNext={goNext} onPrev={goPrev} />,
    <ProcessingProfile key={1} onNext={goNext} onPrev={goPrev} />,
    <OwnershipPrincipals key={2} onNext={goNext} onPrev={goPrev} />,
    <BankingSettlement key={3} onNext={goNext} onPrev={goPrev} />,
    <DocumentUpload key={4} onNext={goNext} onPrev={goPrev} />,
    <ReviewSubmit key={5} onPrev={goPrev} onGoToStep={goToStep} />,
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

const ApplicationPage = () => (
  <ApplicationProvider>
    <ApplicationContent />
  </ApplicationProvider>
);

export default ApplicationPage;
