import { normalizeGuideName } from '@/lib/portal';

export interface GuideProfile {
  name: string;
  division: string;
  reportingOfficer: string;
  email: string;
  phone: string;
  dd: string;
}

const guideEmailOverrides = new Map<string, string>([
  ['drjayasaxena', 'jayasaxena@nrsc.gov.in'],
  ['dricdas', 'ic@nrsc.gov.in'],
  ['drsrinivasr', 'srinivasr@nrsc.gov.in'],
  ['drswapnam', 'swapna_m@nrsc.gov.in'],
  ['drmanjusreep', 'manju.sree@nrsc.gov.in'],
  ['drhareefbabashaebk', 'hareefbaba_k@nrsc.gov.in'],
  ['dranimabiswal', 'animai_d@nrsc.gov.in'],
  ['shrianilyadav', 'anil_y@nrsc.gov.in'],
  ['shrishashankkumarmishra', 'shashank_m@nrsc.gov.in'],
  ['shrivenkataraghavendrak', 'raghavendra_kv@nrsc.gov.in'],
  ['shripavankumarbairavarasu', 'pavankumar_b@nrsc.gov.in'],
  ['shripriyomroy', 'priyom_roy@nrsc.gov.in'],
  ['shrivenkateshd', 'venkatesh_d@nrsc.gov.in'],
  ['shrinkhilkumarbaranval', 'nikhilkumar_b@nrsc.gov.in'],
  ['shrisurajreddyr', 'surajr@nrsc.gov.in'],
  ['shrisrinivasreddyp', 'srinivasreddy_p@nrsc.gov.in'],
  ['shrisrinivasaraok', 'srinivasrao_k@nrsc.gov.in'],
  ['shrisrinivasaraokarri', 'srinivasrao_kv@nrsc.gov.in'],
  ['shrisatyasomashekark', 'satya.singh@nrsc.gov.in'],
  ['shribharathkumarreddyk', 'bharath_k@nrsc.gov.in'],
  ['shribhrahimshaik', 'ibrahim_s@nrsc.gov.in'],
  ['shriibrahimshaik', 'ibrahim_s@nrsc.gov.in'],
  ['shrishivashakarm', 'shivashankar_mr@nrsc.gov.in'],
  ['shrishivvaiah', 'shivvaiah@nrsc.gov.in'],
  ['shrikrishnakishoresvsr', 'krishnakishore_svsr@nrsc.gov.in'],
  ['shriggopi', 'gopi@nrsc.gov.in'],
  ['shrinagapraneethk', 'praneeth_k@nrsc.gov.in'],
  ['shriankitchoudhary', 'ankit_c@nrsc.gov.in'],
  ['shriaakashneelbasak', 'aakashneel_b@nrsc.gov.in'],
  ['shrisubratkacharya', 'subrat_k@nrsc.gov.in'],
  ['shrisatishkumarb', 'satishkumar_b@nrsc.gov.in'],
  ['shrisrikanthyadavm', 'srikanthyadav_m@nrsc.gov.in'],
  ['shrisrikanthp', 'srikanth_p@nrsc.gov.in'],
  ['shritusharpande', 'tushar_p@nrsc.gov.in'],
  ['shritusharwankhede', 'tushar_w@nrsc.gov.in'],
  ['shrirajarshisaha', 'rajarshi_saha@nrsc.gov.in'],
  ['shridhirojkumarbehera', 'dhiroj_kb@nrsc.gov.in'],
  ['shriaravindakumarp', 'aravinda_p@nrsc.gov.in'],
  ['shriadityabhardwaj', 'aditya_b@nrsc.gov.in'],
  ['shrinareshn', 'nareshn@nrsc.gov.in'],
  ['smtjayabharathi', 'jaya_bh@nrsc.gov.in'],
  ['smtstuteegupta', 'stutee@nrsc.gov.in'],
  ['smtshafalitandon', 'shafali_t@nrsc.gov.in'],
  ['smtlathajames', 'latha_james@nrsc.gov.in'],
  ['smtsavithas', 'savita_s@nrsc.gov.in'],
  ['smtjayasudhat', 'jayasudha_t@nrsc.gov.in'],
  ['smtsailajap', 'sailaja_p@nrsc.gov.in'],
  ['smtsobinajana', 'sobinaj@nrsc.gov.in'],
  ['smtkaminij', 'kamini_j@nrsc.gov.in'],
  ['smtreedhishukla', 'reedhi.shukla@nrsc.gov.in'],
  ['smtrunjhunchandra', 'runjhun_c@nrsc.gov.in'],
  ['smtanniemariaisac', 'annie_mi@nrsc.gov.in'],
  ['smtradhikat', 'radhika_t@nrsc.gov.in'],
  ['smtsrisudhas', 'srisudha@nrsc.gov.in'],
  ['smtsrisudha', 'srisudha@nrsc.gov.in'],
]);

const rawGuideProfiles: GuideProfile[] = [
  { name: 'Dr Jaya Saxena', division: 'SPID/TEOG/MSA', reportingOfficer: 'GD, TEOG', email: 'Not available', dd: 'DD MSA' },
  { name: 'Smt Jaya Bharathi', division: 'MPAD/SDPEG/DPA', reportingOfficer: 'Head, MPAD - Smt Sri Sudha S', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr I C Das', division: 'HYDROGEO/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Shashank Kumar Mishra', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Shri Rajesh Sikhakolli', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Dr Srinivas R', division: 'SPOD/TEOG/MSA', reportingOfficer: 'GD, TEOG', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Satya Soma Shekar K', division: 'CR-DPD/ODPG/DPA', reportingOfficer: 'GH, ODPG', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Anil Yadav', division: 'AS&CID/AA&CIG/RSA', reportingOfficer: 'Head, AS&CID - Dr Rama Mohana Rao K', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Shubham Singhal', division: 'SPGD/SPF&PG/DPA', reportingOfficer: 'Head, SPGD - Smt Latha James', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr Swapna M', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Shri Rajesh Sikhakolli', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Smt Stutee Gupta', division: 'RD&WMD/SR&LUM/RSA', reportingOfficer: 'Head, RD&WMD - Dr Anjum Mahatab', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Shafali Tandon', division: 'SPOD/TEOG/MSA', reportingOfficer: 'Head, SPOD - Dr Srinivas R', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Sonu Singh Tomar', division: 'DPS&NAD/DPSG/DPA', reportingOfficer: 'Head, DPS&NAD - Shri Mani Kumar V', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr Manju Sree P', division: 'AA&CIG/RSA', reportingOfficer: 'DD, RSA', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Venkata Raghavendra K', division: 'ITID/SISG/MSA', reportingOfficer: 'GH, SISG - Shri Krishna Kishore SVSR', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Aditya Bhardwaj', division: 'DNASD/SRPG/DPA', reportingOfficer: 'GH, SRPG - Shri Mani Kumar V', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr Karun Kumar Choudhary', division: 'CAD/AS&AG/RSA', reportingOfficer: 'GD, AS&AG - Dr Chowdary VM', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Pavan Kumar Bairavarasu', division: 'ISD/SISG/MSA', reportingOfficer: 'GH, SISG - Shri Krishna Kishore SVSR', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Syed Shadab', division: 'WS&ISD/ECSA', reportingOfficer: 'DD, ECSA', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Ibrahim Shaik', division: 'BOD/OSG/ECSA', reportingOfficer: 'GH, OSG - Dr Nagamani PV', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Dr Nagamani P V', division: 'OSD/OSG/ECSA', reportingOfficer: 'DD, ECSA', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Aravinda Kumar P', division: 'BCGG/BG&WSA', reportingOfficer: 'DD, BG&WSA', email: 'Not available', dd: 'DD BG&WSA' },
  { name: 'Shri Subrat K Acharya', division: 'AAD/AA&CIG/RSA', reportingOfficer: 'GH, AA&CIG - Dr Manjusree P', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Reedhi Shukla', division: 'USD/USAG/RSA', reportingOfficer: 'Head, USD - Smt Kamini J', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Sampath Kumar P', division: 'UHSD/USAG/RSA', reportingOfficer: 'Head, UHSD - Smt Saiveena Suresh', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Srinivas Reddy P', division: 'SPOD/TEOG/MSA', reportingOfficer: 'Head, SPOD - Shri Ganesh VV', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Naresh N', division: 'SSD/S&ASG/SDR&ISA', reportingOfficer: 'Head, Servo Sys Div - Dr Basheerullah Baig G', email: 'Not available', dd: 'DD SDR&ISA' },
  { name: 'Shri Dhiroj Kumar Behera', division: 'LU&CMD/SR&LUM/RSA', reportingOfficer: 'Head, SR&LUM - Dr Girish Kumar Pujar', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Latha James', division: 'SPGD/SPF&PG/DPA', reportingOfficer: 'GH, SPFPG - Shri Anjaneyulu RVG', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Shiva Shakar M', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Dr Rajesh Sikhakolli', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Srinivasa Rao K', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Dr Rajesh Sikhakolli', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Smt Sri Sudha S', division: 'MPAD/SDPEG/DPA', reportingOfficer: 'GH, SDPEG - Smt Santhi Sree B', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Nikhil Kumar Baranval', division: 'HYDROGEO/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Rajarshi Saha', division: 'HYDROGEO/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Krishna Kishore SVSR', division: 'SISG/MSA', reportingOfficer: 'DD, MSA', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Bharath Kumar Reddy K', division: 'WRMD/WATERRE/RSA', reportingOfficer: 'Head, WRMD - Dr K Chandrasekhar', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Rajashekhar S S', division: 'RRSC/NRSC', reportingOfficer: 'CGM, RC - Dr S K Srivastav', email: 'Not available', dd: 'DD NRSC' },
  { name: 'Shri Rama Dasu M', division: 'USD/USAG/RSA', reportingOfficer: 'Head, USD - Smt Kamini J', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Radhika T', division: 'APSDD/ODPG/DPA', reportingOfficer: 'DD, DPA', email: 'Not available', dd: 'DD DPA' },
  { name: 'Smt Shivali Varma', division: 'LSP&CSD/AS&LSPG/ECSA', reportingOfficer: 'Head, LS&CSD - Dr Rabindra Kumar Nayak', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Dr Alok Taori', division: 'ASD/AS&LSPG/ECSA', reportingOfficer: 'GD, ASLSPG - Dr Ramana M V', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Smt Annie Maria Isac', division: 'WRMD/WATERRE/RSA', reportingOfficer: 'Head, WRMD - Shri K Chandrasekhar', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Kamini J', division: 'USD/USAG/RSA', reportingOfficer: 'GD, US&AG - Dr Jayanthi SC', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Suraj Reddy R', division: 'FBED/FEG/RSA', reportingOfficer: 'GD, FEG - Dr Rajashekar G', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Hari Priya S', division: 'APSDD/ODPG/DPA', reportingOfficer: 'Head, APSDD - Smt Radhika T', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Samvram Sahu', division: 'MPSDD/MDPG/DPA', reportingOfficer: 'Head, MPSDD - Smt Jayasri PV', email: 'Not available', dd: 'DD DPA' },
  { name: 'Smt Savitha S', division: 'SPID/TEOG/MSA', reportingOfficer: 'Head, SPID - Dr Jaya Saxena', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Aakashneel Basak', division: 'MPSDD/MDPG/DPA', reportingOfficer: 'GH, MDPG - Smt Usha Sundari', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr Hareef Baba Shaeb K', division: 'ASD/AS&LSPG/ECSA', reportingOfficer: 'Head, ASD - Dr Alok Taori', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Srikanth Yadav M', division: 'DPF/SPFPG/DPA', reportingOfficer: 'GH, SPFPG - Shri Anjaneyulu RVG', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Venkata Sudhakar K', division: 'SSQAD/HSQAG/SR&QA', reportingOfficer: 'GH, HSQAG - Shri Chalapathi Rao', email: 'Not available', dd: 'DD SR&QA' },
  { name: 'Ms Shilpi', division: 'MISD/SISG/MSA', reportingOfficer: 'Head, MISD - Smt Jayanthi T', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Srinivasa Rao Karri', division: 'POD/OSG/ECSA', reportingOfficer: 'Head, POD - Dr Rajesh Sikhakolli', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Dr Kandula V Subrahmanyam', division: 'LSP&CSD/AS&LSPG/ECSA', reportingOfficer: 'Head, LS&CSD - Dr Rabindra Kumar Nayak', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Shivvaiah', division: 'SPOD/TEOG/MSA', reportingOfficer: 'Head, SPOD - Dr Srinivas R', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Priyom Roy', division: 'GMED/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Venkatesh D', division: 'ASD/AS&LSPG/ECSA', reportingOfficer: 'Head, ASD - Dr Alok Taori', email: 'Not available', dd: 'DD ECSA' },
  { name: 'Shri Satish Kumar B', division: 'GSD/NSG/AS&DMA', reportingOfficer: 'GD, NSG - Dr Narendran J', email: 'Not available', dd: 'DD AS&DMA' },
  { name: 'Smt Runjhun Chandra', division: 'ADPD/HRDPG/AS&DMA', reportingOfficer: 'Head, ADPG - Shri Anil Kumar G', email: 'Not available', dd: 'DD AS&DMA' },
  { name: 'Shri Tushar Pande', division: 'GSD/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Tushar Wankhede', division: 'HYDROGEO/GSG/RSA', reportingOfficer: 'GD, GSG - Dr I C Das', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Srikanth P', division: 'AID/ASAG/RSA', reportingOfficer: 'GD, AS&AG - Dr Chowdary VM', email: 'Not available', dd: 'DD RSA' },
  { name: 'Shri Sumanth Kumar P', division: 'BSD/RF&BSG/SDR&ISA', reportingOfficer: 'Head, BSD - Dr Naga Sekhar T', email: 'Not available', dd: 'DD SDR&ISA' },
  { name: 'Shri Mamata Kumari', division: 'AMD/ASAG/RSA', reportingOfficer: 'GD, AS&AG - Dr Chowdary VM', email: 'Not available', dd: 'DD RSA' },
  { name: 'Dr Arjun BM', division: 'AAD/AA&CIG/RSA', reportingOfficer: 'Head, AAD - Shri Subrat Kumar Acharya', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Sobina Jana', division: 'WAMSD/DWAG/DPA', reportingOfficer: 'GH, DWAG - Ms Anupama Sharma', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri Naga Praneeth K', division: 'SPOD/TEOG/MSA', reportingOfficer: 'Head, SPOD - Dr Srinivas R', email: 'Not available', dd: 'DD MSA' },
  { name: 'Shri Ankit Choudhary', division: 'SP&FPG/DPFD/DPA', reportingOfficer: 'GH, SPFPG - Shri Anjaneyulu RVG', email: 'Not available', dd: 'DD DPA' },
  { name: 'Dr Anima Biswal', division: 'AID/ASAG/RSA', reportingOfficer: 'GD, AS&AG - Dr Chowdary VM', email: 'Not available', dd: 'DD RSA' },
  { name: 'Smt Sailaja P', division: 'DNASD/SRPG/DPA', reportingOfficer: 'GH, SRPG - Shri Mani Kumar V', email: 'Not available', dd: 'DD DPA' },
  { name: 'Smt Jaya Sudha T', division: 'DMSD/DWAG/DPA', reportingOfficer: 'GH, DWAG - Ms Anupama Sharma', email: 'Not available', dd: 'DD DPA' },
  { name: 'Shri G Gopi', division: 'ITID/SISG/MSA', reportingOfficer: 'Head, ITID - Shri K V Raghavendra', email: 'Not available', dd: 'DD MSA' },
  { name: 'Dr Chowdary VM', division: 'AG SCI OFF/ASAG/RSA', reportingOfficer: 'DD, RSA', email: 'Not available', dd: 'DD RSA' },
];

export const guideProfiles = Array.from(
  new Map(
    rawGuideProfiles.map((profile) => {
      const normalizedName = normalizeGuideName(profile.name);
      return [
        normalizedName,
        {
          ...profile,
          email: guideEmailOverrides.get(normalizedName) || profile.email,
        },
      ];
    }),
  ).values(),
).sort((a, b) => a.name.localeCompare(b.name));

const guideProfileMap = new Map(
  guideProfiles.map((profile) => [normalizeGuideName(profile.name), profile]),
);

export const getGuideProfile = (guideName: string): GuideProfile => {
  const profile = guideProfileMap.get(normalizeGuideName(guideName));

  if (profile) {
    return profile;
  }

  return {
    name: guideName,
    division: 'Not available',
    reportingOfficer: 'Not available',
    email: 'Not available',
    phone: 'Not available',
    dd: 'Not available',
  };
};
