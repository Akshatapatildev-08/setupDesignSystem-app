  const companies = [
    "Infosys",
    "TCS",
    "Wipro",
    "Accenture",
    "Capgemini",
    "Cognizant",
    "IBM",
    "Oracle",
    "SAP",
    "Dell",
    "Amazon",
    "Flipkart",
    "Swiggy",
    "Razorpay",
    "PhonePe",
    "Paytm",
    "Zoho",
    "Freshworks",
    "Juspay",
    "CRED",
    "Postman",
    "BrowserStack",
    "Meesho",
    "Myntra",
    "Nykaa",
    "ClearTax",
    "Groww",
    "Urban Company",
    "Pine Labs",
    "Zeta",
    "OrbitStack Labs",
    "Nexora Systems",
    "BlueBrick AI",
    "SignalLeaf Tech",
    "CodeHarbor Labs"
  ];

  const locations = [
    "Bengaluru",
    "Hyderabad",
    "Pune",
    "Chennai",
    "Mumbai",
    "Gurugram",
    "Noida",
    "Ahmedabad",
    "Kochi",
    "Coimbatore",
    "Jaipur",
    "Kolkata",
    "Indore",
    "Thiruvananthapuram",
    "Remote - India"
  ];

  const roleCatalog = [
    {
      title: "SDE Intern",
      experience: "Fresher",
      salaryRange: "₹15k–₹40k/month Internship",
      skills: ["DSA", "JavaScript", "Node.js", "Git", "REST APIs"]
    },
    {
      title: "Graduate Engineer Trainee",
      experience: "Fresher",
      salaryRange: "3–5 LPA",
      skills: ["Java", "SQL", "OOP", "Git", "Problem Solving"]
    },
    {
      title: "Junior Backend Developer",
      experience: "0-1",
      salaryRange: "6–10 LPA",
      skills: ["Node.js", "Express", "PostgreSQL", "Redis", "API Design"]
    },
    {
      title: "Frontend Intern",
      experience: "Fresher",
      salaryRange: "₹20k–₹35k/month Internship",
      skills: ["HTML", "CSS", "JavaScript", "React", "Accessibility"]
    },
    {
      title: "QA Intern",
      experience: "Fresher",
      salaryRange: "₹15k–₹30k/month Internship",
      skills: ["Manual Testing", "Test Cases", "Bug Reporting", "Jira", "Regression Testing"]
    },
    {
      title: "Data Analyst Intern",
      experience: "0-1",
      salaryRange: "₹25k–₹40k/month Internship",
      skills: ["SQL", "Excel", "Python", "Power BI", "Data Cleaning"]
    },
    {
      title: "Java Developer (0-1)",
      experience: "0-1",
      salaryRange: "6–10 LPA",
      skills: ["Java", "Spring Boot", "MySQL", "Microservices", "Unit Testing"]
    },
    {
      title: "Python Developer (Fresher)",
      experience: "Fresher",
      salaryRange: "3–5 LPA",
      skills: ["Python", "Django", "SQL", "REST APIs", "Git"]
    },
    {
      title: "React Developer (1-3)",
      experience: "1-3",
      salaryRange: "10–18 LPA",
      skills: ["React", "TypeScript", "Redux", "API Integration", "Performance"]
    },
    {
      title: "DevOps Engineer (1-3)",
      experience: "1-3",
      salaryRange: "10–18 LPA",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"]
    },
    {
      title: "QA Automation Engineer (1-3)",
      experience: "1-3",
      salaryRange: "6–10 LPA",
      skills: ["Selenium", "Cypress", "JavaScript", "API Testing", "CI Pipelines"]
    },
    {
      title: "Software Engineer (3-5)",
      experience: "3-5",
      salaryRange: "10–18 LPA",
      skills: ["System Design", "Java", "Distributed Systems", "AWS", "Mentoring"]
    }
  ];

  const modes = ["Remote", "Hybrid", "Onsite"];
  const sources = ["LinkedIn", "Naukri", "Indeed"];

  const focusAreas = [
    "payments reliability",
    "merchant onboarding workflows",
    "checkout latency reduction",
    "order tracking APIs",
    "partner analytics dashboards",
    "notification delivery performance",
    "identity and access controls",
    "data quality monitoring",
    "search relevance improvements",
    "recommendation ranking logic",
    "log processing pipelines",
    "workflow automation tooling",
    "customer support integrations",
    "feature flag rollouts",
    "mobile web performance",
    "error alerting hygiene",
    "release quality checks",
    "internal platform tooling",
    "candidate experience automation",
    "subscription lifecycle events",
    "wallet reconciliation flows",
    "risk signal processing",
    "ML experiment tracking",
    "supply operations metrics",
    "A/B testing setup",
    "CRM data synchronization",
    "incident response tooling",
    "self-serve reporting",
    "fraud detection pipelines",
    "event stream observability",
    "invoice processing APIs",
    "B2C growth experiments",
    "catalog ingestion systems",
    "auth session security",
    "partner SLA tracking",
    "mobile release automation",
    "data warehouse modeling",
    "pricing engine updates",
    "search index refreshes",
    "multi-tenant configuration",
    "test coverage uplift",
    "performance regression checks",
    "cloud cost optimization",
    "user behavior analytics",
    "API gateway modernization",
    "candidate matching quality",
    "career page performance",
    "job alert relevance",
    "resume parsing workflows",
    "lead scoring enrichment",
    "customer churn prediction",
    "risk reporting compliance",
    "payment retry orchestration",
    "developer portal improvements",
    "cross-team release orchestration",
    "microservice resilience hardening",
    "edge cache optimization",
    "SLA reporting automation",
    "data governance controls",
    "platform migration tracking"
  ];

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  export const jobsData = Array.from({ length: 60 }, function (_, index) {
    const role = roleCatalog[index % roleCatalog.length];
    const company = companies[index % companies.length];
    const location = locations[(index * 2) % locations.length];
    const mode = modes[(index + 1) % modes.length];
    const source = sources[index % sources.length];
    const postedDaysAgo = index % 11;
    const track = focusAreas[index];
    const id = "JOB-" + String(index + 1).padStart(3, "0");

    const description = [
      `${company} is hiring a ${role.title} to support ${track} across product and engineering teams.`,
      `You will collaborate from our ${location} office setup with a ${mode.toLowerCase()} operating model.`,
      `The role is best suited for candidates with ${role.experience} years of experience and strong execution discipline.`,
      `You will ship production-ready features, document trade-offs, and contribute to predictable release quality.`,
      `Hands-on comfort with ${role.skills.slice(0, 3).join(", ")} is expected from day one.`
    ].join("\n");

    return {
      id,
      title: role.title,
      company,
      location,
      mode,
      experience: role.experience,
      skills: role.skills,
      source,
      postedDaysAgo,
      salaryRange: role.salaryRange,
      applyUrl: `https://careers.${slugify(company)}.com/jobs/${slugify(role.title)}-${String(index + 1)}`,
      description
    };
  });
