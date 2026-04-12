import { ApplicationProvider, useApplication } from '@/context/ApplicationContext';
import PreQualification from '@/components/steps/PreQualification';
import { useNavigate } from 'react-router-dom';

const PreAppContent = () => {
  const navigate = useNavigate();
  const { data, updateData } = useApplication();

  const handleQualified = () => {
    const pq = data.preQualification;
    // Populate processing profile from pre-app
    updateData('processingProfile', {
      monthlyVolume: pq.monthlyVolume ? Number(pq.monthlyVolume) : '',
      averageTicket: pq.averageTicket ? Number(pq.averageTicket) : '',
    });
    // Populate business profile from pre-app
    updateData('businessProfile', {
      legalName: pq.companyName || '',
      phoneNumber: pq.principals[0]?.phone || '',
    });
    // Populate owners from principals
    const owners = pq.principals.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      title: p.title,
      ownershipPercent: p.ownershipPercent,
      dob: '',
      ssn: '',
      streetAddress: '',
      city: '',
      state: '',
      zip: '',
    }));
    updateData('owners', owners);
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
