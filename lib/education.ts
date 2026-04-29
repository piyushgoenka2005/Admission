export const UNDERGRAD_DEGREE_OPTIONS = [
  'B.Tech',
  'B.Sc',
  'BCA',
  'Other',
] as const;

export const POSTGRAD_DEGREE_OPTIONS = [
  'M.Sc',
  'M.Tech',
  'PhD',
  'Other',
] as const;

export const SPECIALIZATION_OPTIONS = [
  'CSE',
  'ECE',
  'Physics',
  'Remote Sensing',
  'Geospatial',
  'Other',
] as const;

export const SCHOOL_LEVELS = ['10th', '10+2'] as const;

export const isStandardOption = (value: string, options: readonly string[]) => options.includes(value);
