export type PrepType =
  | "WAEC"
  | "NECO"
  | "JAMB"
  | "SCHOOL"
  | "UNIVERSITY"
  | "OTHER";

export type EducationLevel =
  | "JSS"
  | "SSS"
  | "UNIVERSITY"
  | "POLYTECHNIC"
  | "COE"
  | "OTHER";

export type Confidence = "Very Weak" | "Weak" | "Average" | "Good" | "Very Good";

export const PREP_OPTIONS: { value: PrepType; label: string }[] = [
  { value: "WAEC", label: "WAEC / WASSCE" },
  { value: "NECO", label: "NECO SSCE" },
  { value: "JAMB", label: "JAMB / UTME" },
  { value: "SCHOOL", label: "School / Class Exams" },
  { value: "UNIVERSITY", label: "University / College Exams" },
  { value: "OTHER", label: "Other" },
];

export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: "JSS", label: "Junior Secondary School (JSS)" },
  { value: "SSS", label: "Senior Secondary School (SSS)" },
  { value: "UNIVERSITY", label: "University" },
  { value: "POLYTECHNIC", label: "Polytechnic" },
  { value: "COE", label: "College of Education" },
  { value: "OTHER", label: "Other" },
];

export const CLASS_BY_LEVEL: Record<EducationLevel, string[]> = {
  JSS: ["JSS1", "JSS2", "JSS3"],
  SSS: ["SS1", "SS2", "SS3"],
  UNIVERSITY: ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level+"],
  POLYTECHNIC: ["ND1", "ND2", "HND1", "HND2"],
  COE: ["NCE 100", "NCE 200", "NCE 300"],
  OTHER: ["Year 1", "Year 2", "Year 3", "Year 4+", "Other"],
};

export const EXAM_SESSIONS = ["2026", "2027", "2028", "2029"];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const STUDY_TIMES = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
] as const;

export const COMMITMENTS = [
  "School",
  "Coaching / Lessons",
  "Work",
  "Sports",
  "Family responsibilities",
  "None",
] as const;

export const LEARNING_METHODS = [
  "Reading",
  "Videos",
  "Practice Questions",
  "Flashcards",
  "Notes",
  "Past Questions",
  "Mixed",
] as const;

export const CONFIDENCE_LEVELS: Confidence[] = [
  "Very Weak",
  "Weak",
  "Average",
  "Good",
  "Very Good",
];

export const WAEC_TARGETS = [
  "Pass",
  "Good Grades",
  "Mostly B's",
  "Mostly A's",
  "A1 in selected subjects",
];

export const DAILY_HOURS = [
  { label: "1 hour", value: 1 },
  { label: "2 hours", value: 2 },
  { label: "3 hours", value: 3 },
  { label: "4 hours", value: 4 },
  { label: "5 hours", value: 5 },
  { label: "6+ hours", value: 6 },
];

/** Common Nigerian universities (sample list for target selection) */
export const UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "University of Benin (UNIBEN)",
  "University of Ilorin (UNILORIN)",
  "Lagos State University (LASU)",
  "Covenant University",
  "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Minna (FUTMINNA)",
  "University of Port Harcourt (UNIPORT)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Bayero University Kano (BUK)",
  "University of Jos (UNIJOS)",
  "Federal University of Agriculture, Abeokuta (FUNAAB)",
  "Other / Not listed",
];

export const POPULAR_COURSES = [
  "Computer Science",
  "Medicine and Surgery (MBBS)",
  "Nursing Science",
  "Law",
  "Mass Communication",
  "Accounting",
  "Economics",
  "Business Administration",
  "Electrical / Electronic Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Pharmacy",
  "Biochemistry",
  "Microbiology",
  "Political Science",
  "English Language",
  "Education",
  "Architecture",
  "Other",
];

/** Default UTME combinations by broad course family */
export const UTME_BY_COURSE: Record<string, string[]> = {
  "Computer Science": ["English Language", "Mathematics", "Physics", "Chemistry"],
  "Medicine and Surgery (MBBS)": ["English Language", "Biology", "Chemistry", "Physics"],
  "Nursing Science": ["English Language", "Biology", "Chemistry", "Physics"],
  Law: ["English Language", "Literature-in-English", "Government", "CRS / IRS / History"],
  "Mass Communication": ["English Language", "Literature-in-English", "Government", "CRS / Economics"],
  Accounting: ["English Language", "Mathematics", "Economics", "Accounting / Commerce"],
  Economics: ["English Language", "Mathematics", "Economics", "Government / Geography"],
  "Business Administration": ["English Language", "Mathematics", "Economics", "Commerce / Accounting"],
  "Electrical / Electronic Engineering": ["English Language", "Mathematics", "Physics", "Chemistry"],
  "Mechanical Engineering": ["English Language", "Mathematics", "Physics", "Chemistry"],
  "Civil Engineering": ["English Language", "Mathematics", "Physics", "Chemistry"],
  Pharmacy: ["English Language", "Biology", "Chemistry", "Physics"],
  Biochemistry: ["English Language", "Biology", "Chemistry", "Physics"],
  Microbiology: ["English Language", "Biology", "Chemistry", "Physics"],
  "Political Science": ["English Language", "Government", "History / CRS", "Economics"],
  "English Language": ["English Language", "Literature-in-English", "Government", "CRS / History"],
  Education: ["English Language", "Mathematics", "Government", "CRS / Economics"],
  Architecture: ["English Language", "Mathematics", "Physics", "Geography / Technical Drawing"],
  Other: ["English Language", "Mathematics", "Subject 3", "Subject 4"],
};

export type SubjectGroup = {
  name: string;
  subjects: string[];
};

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    name: "Core / Compulsory",
    subjects: ["English Language", "General Mathematics", "Civic Education"],
  },
  {
    name: "Science",
    subjects: [
      "Biology",
      "Chemistry",
      "Physics",
      "Agricultural Science",
      "Further Mathematics",
      "Geography",
      "Computer Studies / ICT",
      "Technical Drawing",
    ],
  },
  {
    name: "Humanities / Arts",
    subjects: [
      "Government",
      "History",
      "Literature-in-English",
      "CRS",
      "IRS",
      "Economics",
      "French",
      "Yoruba",
      "Igbo",
      "Hausa",
      "Visual Arts",
      "Music",
    ],
  },
  {
    name: "Business",
    subjects: [
      "Accounting",
      "Commerce",
      "Marketing",
      "Office Practice",
      "Insurance",
      "Store Management",
    ],
  },
  {
    name: "Trade / Vocational",
    subjects: [
      "Catering Craft Practice",
      "Garment Making",
      "Data Processing",
      "Welding & Fabrication",
      "Auto Mechanical Work",
      "Electrical Installation",
      "Photography",
      "Painting & Decorating",
    ],
  },
  {
    name: "University / College",
    subjects: [
      "Calculus",
      "Linear Algebra",
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Anatomy",
      "Physiology",
      "Pharmacology",
      "Programming Fundamentals",
      "Data Structures",
      "Constitutional Law",
      "Microeconomics",
      "Macroeconomics",
      "Research Methods",
      "Statistics",
    ],
  },
];

export const DEFAULT_TOPICS: Record<string, string[]> = {
  "English Language": [
    "Comprehension",
    "Summary",
    "Essay / Letter Writing",
    "Lexis & Structure",
    "Oral English / Phonetics",
    "Registers",
  ],
  "General Mathematics": [
    "Number & Numeration",
    "Algebra",
    "Geometry",
    "Trigonometry",
    "Statistics",
    "Probability",
    "Mensuration",
    "Sets",
    "Variation",
  ],
  Mathematics: [
    "Algebra",
    "Geometry",
    "Statistics",
    "Trigonometry",
    "Probability",
    "Calculus",
    "Number Bases",
  ],
  Biology: [
    "Cell Biology",
    "Ecology",
    "Genetics",
    "Nutrition",
    "Reproduction",
    "Excretion",
    "Nervous System",
    "Plant Biology",
  ],
  Chemistry: [
    "Atomic Structure",
    "Periodic Table",
    "Chemical Bonding",
    "Stoichiometry",
    "Acids, Bases & Salts",
    "Organic Chemistry",
    "Electrochemistry",
    "Rates of Reaction",
  ],
  Physics: [
    "Mechanics",
    "Waves",
    "Heat / Thermal Physics",
    "Electricity",
    "Magnetism",
    "Optics",
    "Modern Physics",
    "Measurements",
  ],
  "Further Mathematics": [
    "Pure Maths",
    "Mechanics",
    "Statistics",
    "Vectors",
    "Matrices",
    "Differentiation",
    "Integration",
  ],
  Geography: [
    "Map Reading",
    "Physical Geography",
    "Human Geography",
    "Regional Geography of Nigeria",
    "Economic Geography",
    "Environmental Issues",
  ],
  Government: [
    "Basic Concepts",
    "Constitution",
    "Organs of Government",
    "Citizenship",
    "Political Parties",
    "Public Administration",
    "Nigeria Political Development",
  ],
  History: [
    "Pre-colonial Nigeria",
    "Colonial Rule",
    "Independence Era",
    "West Africa",
    "World History Themes",
  ],
  "Literature-in-English": [
    "Drama",
    "Prose",
    "Poetry",
    "Literary Devices",
    "Unseen Texts",
    "African Literature",
  ],
  CRS: [
    "Old Testament",
    "New Testament",
    "Themes in Christianity",
    "Christian Living",
  ],
  IRS: [
    "Quranic Studies",
    "Hadith",
    "Tawhid",
    "Fiqh",
    "Islamic History",
  ],
  Economics: [
    "Basic Concepts",
    "Demand & Supply",
    "Production",
    "Market Structures",
    "Money & Banking",
    "Public Finance",
    "International Trade",
    "Development Economics",
  ],
  Accounting: [
    "Bookkeeping",
    "Final Accounts",
    "Depreciation",
    "Control Accounts",
    "Partnership",
    "Company Accounts",
  ],
  Commerce: [
    "Trade",
    "Business Units",
    "Transportation",
    "Insurance",
    "Advertising",
    "Warehousing",
  ],
  Marketing: [
    "Marketing Concepts",
    "Product",
    "Price",
    "Promotion",
    "Place / Distribution",
    "Consumer Behaviour",
  ],
  "Agricultural Science": [
    "Soil Science",
    "Crop Production",
    "Animal Husbandry",
    "Agricultural Economics",
    "Farm Tools",
  ],
  Calculus: ["Limits", "Derivatives", "Integrals", "Applications"],
  "Programming Fundamentals": [
    "Variables & Types",
    "Control Flow",
    "Functions",
    "Arrays",
    "OOP Basics",
  ],
};

export function topicsForSubject(subject: string): string[] {
  if (DEFAULT_TOPICS[subject]) return DEFAULT_TOPICS[subject];
  if (subject === "General Mathematics") return DEFAULT_TOPICS.Mathematics;
  return [
    "Foundations",
    "Core Topics",
    "Applications",
    "Past Questions Practice",
    "Revision & Weak Areas",
  ];
}

export function suggestUtmeSubjects(course: string): string[] {
  return UTME_BY_COURSE[course] || UTME_BY_COURSE.Other;
}

export type StudyPlannerProfile = {
  preparingFor: PrepType;
  educationLevel: EducationLevel;
  classYear: string;
  examBoard: string;
  examSession: string;
  targetUniversity: string;
  targetCourse: string;
  utmeSubjects: string[];
  subjects: string[];
  customSubject: string;
  subjectTopics: Record<string, string[]>;
  syllabusPaste: string;
  confidence: Record<string, Confidence>;
  weakTopics: string[];
  weakTopicsNotes: string;
  examDate: string;
  subjectExamDates: Record<string, string>;
  dailyHours: number;
  availableDays: string[];
  preferredTimes: string[];
  availableTimeNotes: string;
  targetGrade: string;
  targetUtmeScore: string;
  commitments: string[];
  studyAfterSchoolHours: string;
  learningMethods: string[];
};

export const defaultStudyPlannerProfile = (): StudyPlannerProfile => ({
  preparingFor: "WAEC",
  educationLevel: "SSS",
  classYear: "SS3",
  examBoard: "WAEC",
  examSession: "2027",
  targetUniversity: "",
  targetCourse: "Computer Science",
  utmeSubjects: suggestUtmeSubjects("Computer Science"),
  subjects: ["English Language", "General Mathematics"],
  customSubject: "",
  subjectTopics: {},
  syllabusPaste: "",
  confidence: {},
  weakTopics: [],
  weakTopicsNotes: "",
  examDate: "",
  subjectExamDates: {},
  dailyHours: 2,
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  preferredTimes: ["Evening"],
  availableTimeNotes: "",
  targetGrade: "Mostly A's",
  targetUtmeScore: "250",
  commitments: ["School"],
  studyAfterSchoolHours: "3",
  learningMethods: ["Past Questions", "Videos", "Practice Questions"],
});

export type SavedStudyPlan = {
  id: string;
  title: string;
  summary: string;
  days: {
    day: string;
    date?: string;
    topics?: string;
    timeBlocks?: string;
    focus?: string;
  }[];
  profile: StudyPlannerProfile;
  createdAt?: string;
  updatedAt?: string;
};

export const WIZARD_STEPS = [
  { id: 1, title: "Study Goal", short: "Goal" },
  { id: 2, title: "Your Subjects", short: "Subjects" },
  { id: 3, title: "Your Syllabus", short: "Syllabus" },
  { id: 4, title: "Study Habits", short: "Habits" },
  { id: 5, title: "Your Performance", short: "Performance" },
] as const;
