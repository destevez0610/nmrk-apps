import { ApplicationProvider, useApplication } from '@/context/ApplicationContext';
import PreQualification from '@/components/steps/PreQualification';
import { useNavigate } from 'react-router-dom';

const PreAppContent = () => {
  const navigate = useNavigate();
  const { data, updateData } = useApplication();

  const handleQualified = () => {
    if (data.preQualification.monthlyVolume) {
      updateData('processingProfile', { monthlyVolume: Number(data.preQualification.monthlyVolume) });
    }
    navigate('/application/1');
  };

  return <PreQualification onQualified={handleQualified} />;
};

const PreAppPage = () => (
  <ApplicationProvider>
    <PreAppContent />
  </ApplicationProvider>
);

export default PreAppPage;
