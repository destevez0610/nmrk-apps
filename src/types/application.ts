export interface PreQualPrincipal {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  ownershipPercent: number | '';
  bestTimeToContact: string;
}

export interface PreQualificationData {
  companyName: string;
  principals: PreQualPrincipal[];
  location: string;
  monthlyVolume: number | '';
  averageTicket: number | '';
  currentProvider: string;
  wasKickedOffStripe: boolean | null;
  hasBusinessBankAccount: boolean | null;
  hasPhotoId: boolean;
  hasBankStatement: boolean;
  hasSsnEin: boolean;
}

export interface BusinessProfileData {
  legalName: string;
  dba: string;
  businessStructure: string;
  ein: string;
  ssn: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  websiteUrl: string;
  phoneNumber: string;
  businessStartDate: string;
  industryType: string;
}

export interface ProcessingProfileData {
  monthlyVolume: number | '';
  averageTicket: number | '';
  highTicket: number | '';
  cardPresentPercent: number;
  cardNotPresentPercent: number;
  refundPolicyUrl: string;
  ecommercePercent: number;
  mailOrderPercent: number;
  phoneOrderPercent: number;
}

export interface OwnerData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  ssn: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  ownershipPercent: number | '';
  title: string;
  email: string;
  phone: string;
}

export interface BankingData {
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  voidedCheckFile: File | null;
}

export interface DocumentsData {
  driversLicenseFront: File | null;
  driversLicenseBack: File | null;
  bankStatements: File[];
}

export interface MerchantApplication {
  preQualification: PreQualificationData;
  businessProfile: BusinessProfileData;
  processingProfile: ProcessingProfileData;
  owners: OwnerData[];
  banking: BankingData;
  documents: DocumentsData;
}

/** Stored application record (for the applications page) */
export interface StoredApplication {
  id: string;
  status: 'pre-qual' | 'pre-qual-failed' | 'in-progress' | 'submitted';
  createdAt: string;
  updatedAt: string;
  data: MerchantApplication;
  confirmationId?: string;
  failReason?: string;
}

export const initialApplication: MerchantApplication = {
  preQualification: {
    companyName: '',
    principals: [
      {
        id: crypto.randomUUID(),
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: '',
        ownershipPercent: '',
        bestTimeToContact: '',
      },
    ],
    location: '',
    monthlyVolume: '',
    averageTicket: '',
    currentProvider: '',
    wasKickedOffStripe: null,
    hasBusinessBankAccount: null,
    hasPhotoId: false,
    hasBankStatement: false,
    hasSsnEin: false,
  },
  businessProfile: {
    legalName: '',
    dba: '',
    businessStructure: '',
    ein: '',
    ssn: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    websiteUrl: '',
    phoneNumber: '',
    businessStartDate: '',
    industryType: '',
  },
  processingProfile: {
    monthlyVolume: '',
    averageTicket: '',
    highTicket: '',
    cardPresentPercent: 0,
    cardNotPresentPercent: 0,
    refundPolicyUrl: '',
    ecommercePercent: 0,
    mailOrderPercent: 0,
    phoneOrderPercent: 0,
  },
  owners: [
    {
      id: crypto.randomUUID(),
      firstName: '',
      lastName: '',
      dob: '',
      ssn: '',
      streetAddress: '',
      city: '',
      state: '',
      zip: '',
      ownershipPercent: '',
      title: '',
      email: '',
      phone: '',
    },
  ],
  banking: {
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    voidedCheckFile: null,
  },
  documents: {
    driversLicenseFront: null,
    driversLicenseBack: null,
    bankStatements: [],
  },
};

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

export const CANADIAN_PROVINCES = [
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
];

export const BUSINESS_STRUCTURES = [
  'Sole Proprietorship',
  'Partnership',
  'LLC',
  'Corporation',
  'Non-Profit',
];

export const INDUSTRY_TYPES = [
  'Retail',
  'Restaurant / Food Service',
  'E-Commerce',
  'Professional Services',
  'Healthcare',
  'Hospitality',
  'Transportation',
  'Construction',
  'Education',
  'Technology',
  'Other',
];

export const CURRENT_PROVIDERS = [
  'Stripe',
  'Square',
  'PayPal',
  'Clover',
  'Toast',
  'Shopify Payments',
  'Authorize.net',
  'Braintree',
  'Adyen',
  'WorldPay',
  'First Data / Fiserv',
  'Heartland',
  'Chase Merchant Services',
  'Bank of America Merchant Services',
  'None / New to Processing',
  'Other',
];
