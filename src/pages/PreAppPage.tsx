import { ApplicationProvider, useApplication } from '@/context/ApplicationContext';
import PreQualification from '@/components/steps/PreQualification';
import { useNavigate } from 'react-router-dom';

const PreAppContent = () => {
  const navigate = useNavigate();
  const { data, updateData, setPreFilledFields } = useApplication();

  const handleQualified = (appId: string) => {
    const pq = data.preQualification;
    const filled = new Set<string>();

    // Populate processing profile from pre-app
    if (pq.monthlyVolume) filled.add('processingProfile.monthlyVolume');
    if (pq.averageTicket) filled.add('processingProfile.averageTicket');
    updateData('processingProfile', {
      monthlyVolume: pq.monthlyVolume ? Number(pq.monthlyVolume) : '',
      averageTicket: pq.averageTicket ? Number(pq.averageTicket) : '',
    });

    // Populate business profile from pre-app
    if (pq.companyName) filled.add('businessProfile.legalName');
    if (pq.principals[0]?.phone) filled.add('businessProfile.phoneNumber');
    updateData('businessProfile', {
      legalName: pq.companyName || '',
      phoneNumber: pq.principals[0]?.phone || '',
    });

    // Populate owners from principals
    const owners = pq.principals.map((p, i) => {
      if (p.firstName) filled.add(`owner.${i}.firstName`);
      if (p.lastName) filled.add(`owner.${i}.lastName`);
      if (p.email) filled.add(`owner.${i}.email`);
      if (p.phone) filled.add(`owner.${i}.phone`);
      if (p.title) filled.add(`owner.${i}.title`);
      if (p.ownershipPercent) filled.add(`owner.${i}.ownershipPercent`);
      return {
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
      };
    });
    updateData('owners', owners);
    setPreFilledFields(filled);
    navigate('/application/1', { state: { appId } });
  };

  return <PreQualification onQualified={handleQualified} />;
};

const PreAppPage = () => (
  <ApplicationProvider>
    <PreAppContent />
  </ApplicationProvider>
);

export default PreAppPage;
