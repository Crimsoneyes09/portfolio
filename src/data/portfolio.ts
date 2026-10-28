export const profile: {
  name: string;
  role: string;
  location: string;
  email: string;
} = {
  name: 'Alexander Parayno',
  role: 'Full-stack Software Developer',
  location: 'Metro Manila, Philippines',
  email: 'parayno.alexander.m@gmail.com',
};

export interface Project {
  slug: 'primis' | 'cinepop';
  title: string;
  summary: string;
  role: string;
  context: string;
  clientTitle: string;
  clientSummary: string;
}

export const projects: Project[] = [
  {
    slug: 'primis',
    title: 'Payroll history and payment recovery.',
    summary: 'I built payroll rate history, attendance correction workflows and a Go payment collection service for Primis, an HR and payroll platform.',
    role: 'Full-stack contributor',
    context: 'Coral System Technologies · Employer product',
    clientTitle: 'Payroll records and payment collection.',
    clientSummary: 'For Primis, I built features that retain the rate used for earlier work, support attendance corrections and handle payment updates when checkout links expire or requests repeat.',
  },
  {
    slug: 'cinepop',
    title: 'Account access to protected playback.',
    summary: 'I led CinePop’s mobile development, connecting registration, sign-in and protected video playback, and helped support the app in production.',
    role: 'Led mobile application development',
    context: 'Go8 Technology · Employer product',
    clientTitle: 'From signing in to watching a video.',
    clientSummary: 'For CinePop, I led mobile development across account registration, sign-in and protected video playback, connecting the app to the services behind it.',
  },
];
