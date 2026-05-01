export interface UserProfile {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  workHistory?: WorkHistory[];
  education?: Education[];
  skills?: string[];
  preferredLocations?: string[];
  jobTitles?: string[];
  updatedAt?: string;
}

export interface WorkHistory {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}

export interface Resume {
  id?: string;
  userId: string;
  jobType: string;
  content: string;
  skills?: string[];
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: 'LinkedIn' | 'Indeed' | 'Dice' | 'ZipRecruiter' | 'Manual';
  isRemote: boolean;
  discoveredAt: string;
}

export interface Application {
  id?: string;
  userId: string;
  jobId: string;
  status: 'Draft' | 'Tailoring' | 'Applied' | 'Rejected' | 'Interviewing' | 'Failed';
  error?: string;
  tailoredResume?: string;
  coverLetter?: string;
  appliedAt?: string;
}
