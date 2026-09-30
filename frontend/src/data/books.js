export const BOOKS = [
  // --- Self Development ---
  {
    id: 1,
    title: 'Atomic Habits & Daily Mastery',
    author: 'James Clear',
    authorInfo: 'James Clear is an internationally renowned speaker, researcher, and author specializing in habits, decision-making, and continuous improvement. His work is cited by global institutions and Fortune 500 leadership.',
    category: 'Self Development',
    price: 1850,
    rating: 4.9,
    description: 'An actionable guide on building transformative habits, breaking destructive cycles, and mastering daily routines to realize your highest human potential. Clear draws on biology, psychology, and neuroscience to create an easy-to-understand framework for making good habits inevitable and bad habits impossible.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: true,
    createdAt: '2024-03-01',
    tableOfContents: [
      'Chapter 1: The Surprising Power of Atomic Habits',
      'Chapter 2: How Your Habits Shape Your Identity',
      'Chapter 3: The 1st Law — Make It Obvious',
      'Chapter 4: The 2nd Law — Make It Attractive',
      'Chapter 5: The 3rd Law — Make It Easy',
      'Chapter 6: The 4th Law — Make It Satisfying',
      'Chapter 7: Advanced Tactics: Moving from Good to Exceptional'
    ],
    reviews: [
      {
        id: 101,
        user: 'Samuel Kariuki',
        rating: 5,
        date: '2024-03-12',
        comment: 'A masterclass in personal discipline. Implementing the 2-minute rule completely changed my daily morning routine.'
      },
      {
        id: 102,
        user: 'Brenda Wanjiku',
        rating: 5,
        date: '2024-02-28',
        comment: 'Concise, practical, and devoid of fluff. The best book on productivity and behavior change available.'
      }
    ]
  },
  {
    id: 2,
    title: 'Deep Work & Mental Focus',
    author: 'Cal Newport',
    authorInfo: 'Cal Newport is an Associate Professor of Computer Science at Georgetown University and the bestselling author of seven books. His essays on deep work, digital minimalism, and focus have appeared in major international publications.',
    category: 'Self Development',
    price: 1600,
    rating: 4.8,
    description: 'Rules for focused success in a distracted world. Learn how to train your mind for deep cognitive work, eliminate digital distractions, and produce elite value in a fraction of the time.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: false,
    bestseller: true,
    createdAt: '2024-02-14',
    tableOfContents: [
      'Part 1: The Idea — Deep Work is Valuable & Rare',
      'Part 2: Deep Work is Meaningful',
      'Rule #1: Work Deeply and Build Focus Rituals',
      'Rule #2: Embrace Boredom and Resist Distraction',
      'Rule #3: Quit Social Media Time Sinks',
      'Rule #4: Drain the Shallows and Prioritize Real Output'
    ],
    reviews: [
      {
        id: 103,
        user: 'David Mutua',
        rating: 5,
        date: '2024-03-05',
        comment: 'Essential reading for any modern professional. Changed how I structure my calendar and protect my peak energy hours.'
      }
    ]
  },
  {
    id: 3,
    title: 'Mindset: The New Psychology of Success',
    author: 'Carol S. Dweck',
    authorInfo: 'Dr. Carol S. Dweck is a Lewis and Virginia Eaton Professor of Psychology at Stanford University. She is widely regarded as one of the world’s leading researchers in personality, social psychology, and developmental science.',
    category: 'Self Development',
    price: 1750,
    rating: 4.7,
    description: 'Discover how belief systems about talent and capability determine accomplishment in education, sports, business, and personal relationships. Learn how embracing a growth mindset transforms obstacles into stepping stones.',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: false,
    createdAt: '2024-01-20',
    tableOfContents: [
      'Chapter 1: The Mindsets Explained',
      'Chapter 2: Inside the Mindsets: Growth vs. Fixed',
      'Chapter 3: The Truth About Ability and Achievement',
      'Chapter 4: Sports and the Mindset of a Champion',
      'Chapter 5: Business Leadership and Organizational Mindset',
      'Chapter 6: Relationships: Mindsets in Love',
      'Chapter 7: Changing Mindsets: A Framework for Lifelong Growth'
    ],
    reviews: [
      {
        id: 104,
        user: 'Faith Ndung’u',
        rating: 5,
        date: '2024-02-15',
        comment: 'The distinction between fixed and growth mindsets has reshaped how I raise my kids and evaluate my work challenges.'
      }
    ]
  },

  // --- Psychology ---
  {
    id: 4,
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    authorInfo: 'Daniel Kahneman was a Nobel laureate in Economic Sciences and professor of psychology emeritus at Princeton University. His groundbreaking experiments reshaped cognitive psychology and behavioral economics.',
    category: 'Psychology',
    price: 2200,
    rating: 4.8,
    description: 'A monumental tour of the mind explaining the two systems that drive our thought: System 1 (fast, intuitive, emotional) and System 2 (slow, deliberative, logical). Kahneman reveals where we can trust our intuitions and how to tap into slow thinking.',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: true,
    createdAt: '2024-03-10',
    tableOfContents: [
      'Part 1: Two Systems — Characters in the Story',
      'Part 2: Heuristics and Cognitive Biases',
      'Part 3: Overconfidence and Illusion of Validity',
      'Part 4: Choices and Prospect Theory',
      'Part 5: Two Selves — Experiencing vs. Remembering Self'
    ],
    reviews: [
      {
        id: 105,
        user: 'Geoffrey Omondi',
        rating: 5,
        date: '2024-03-18',
        comment: 'A profound, eye-opening read on human irrationality and cognitive architecture. Everyone making critical decisions needs this.'
      }
    ]
  },
  {
    id: 5,
    title: 'Emotional Intelligence 2.0',
    author: 'Travis Bradberry & Jean Greaves',
    authorInfo: 'Dr. Travis Bradberry and Dr. Jean Greaves are the cofounders of TalentSmart, the world’s leading provider of emotional intelligence tests and training, serving more than 75% of Fortune 500 companies.',
    category: 'Psychology',
    price: 1650,
    rating: 4.7,
    description: 'A step-by-step program for increasing emotional intelligence through four core EQ skills: self-awareness, self-management, social awareness, and relationship management to achieve peak personal and professional effectiveness.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: false,
    bestseller: true,
    createdAt: '2024-02-18',
    tableOfContents: [
      'Section 1: The Big Picture of EQ',
      'Section 2: The Four Core Emotional Intelligence Skills',
      'Section 3: Self-Awareness Strategies in Practice',
      'Section 4: Self-Management and Emotional Control',
      'Section 5: Social Awareness and Reading the Room',
      'Section 6: Relationship Management Strategies'
    ],
    reviews: [
      {
        id: 106,
        user: 'Mercy Akinyi',
        rating: 5,
        date: '2024-03-01',
        comment: 'Very practical strategies you can use the same day you read them. Helped me immensely in team communication.'
      }
    ]
  },
  {
    id: 6,
    title: 'Man’s Search for Meaning',
    author: 'Viktor E. Frankl',
    authorInfo: 'Viktor E. Frankl was an Austrian neurologist, psychiatrist, and Holocaust survivor. He was the founder of logotherapy, a form of psychotherapy that focuses on identifying purpose in human existence.',
    category: 'Psychology',
    price: 1400,
    rating: 4.9,
    description: 'A timeless psychological classic on endurance, human dignity, and finding existential purpose even amidst profound suffering. Frankl teaches that while we cannot always control circumstances, we always retain the freedom to choose our attitude.',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: false,
    createdAt: '2024-01-12',
    tableOfContents: [
      'Part 1: Experiences in a Concentration Camp',
      'Part 2: Logotherapy in a Nutshell',
      'Part 3: The Case for a Tragic Optimism',
      'Postscript: The Unheard Cry for Meaning'
    ],
    reviews: [
      {
        id: 107,
        user: 'Peter Njoroge',
        rating: 5,
        date: '2024-01-30',
        comment: 'Life-defining book. You will never view adversity or daily complaints the same way again.'
      }
    ]
  },

  // --- Finance & Business ---
  {
    id: 7,
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    authorInfo: 'Morgan Housel is a partner at Collaborative Fund and a former columnist at The Wall Street Journal and The Motley Fool. He is a two-time winner of the Best in Business Award from the Society of American Business Editors and Writers.',
    category: 'Finance & Business',
    price: 1950,
    rating: 4.9,
    description: 'Timeless lessons on wealth, greed, and happiness. Doing well with money isn’t necessarily about what you know. It’s about how you behave. And behavior is hard to teach, even to really smart people. Housel shares 19 short stories exploring the strange ways people think about money.',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: true,
    createdAt: '2024-03-05',
    tableOfContents: [
      'Story 1: No One’s Crazy',
      'Story 2: Luck & Risk',
      'Story 3: Never Enough',
      'Story 4: Confounding Compounding',
      'Story 5: Getting Wealthy vs. Staying Wealthy',
      'Story 6: Tails, You Win',
      'Story 7: Freedom: Controlling Your Time',
      'Story 8: Man in the Car Paradox'
    ],
    reviews: [
      {
        id: 108,
        user: 'Collins Otieno',
        rating: 5,
        date: '2024-03-22',
        comment: 'Brilliant read on why human psychology beats financial spreadsheets every time. Made me rethink savings and long-term security.'
      }
    ]
  },
  {
    id: 8,
    title: 'Zero to One: Notes on Startups',
    author: 'Peter Thiel with Blake Masters',
    authorInfo: 'Peter Thiel is an entrepreneur and investor. He co-founded PayPal and Palantir, made the first outside investment in Facebook, and funded companies like SpaceX and LinkedIn.',
    category: 'Finance & Business',
    price: 2100,
    rating: 4.8,
    description: 'How to build companies that create new things. The next Bill Gates will not build an operating system. The next Larry Page won’t make a search engine. If you are copying these guys, you aren’t learning from them. Thiel reveals how to escape competition and build valuable monopolies.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: false,
    bestseller: true,
    createdAt: '2024-02-22',
    tableOfContents: [
      'Chapter 1: The Challenge of the Future',
      'Chapter 2: Party Like It’s 1999',
      'Chapter 3: All Happy Companies Are Different',
      'Chapter 4: The Ideology of Competition',
      'Chapter 5: Last Mover Advantage',
      'Chapter 6: You Are Not a Lottery Ticket',
      'Chapter 7: The Secrets of Power Law Distributions'
    ],
    reviews: [
      {
        id: 109,
        user: 'Kelvin Mwangi',
        rating: 5,
        date: '2024-03-14',
        comment: 'Sharp, contrary, and deeply informative on building enduring commercial enterprises.'
      }
    ]
  },
  {
    id: 9,
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    authorInfo: 'Benjamin Graham (1894–1976) was the father of value investing and the mentor of Warren Buffett. His concepts of intrinsic value and margin of safety remain the gold standard in capital allocation.',
    category: 'Finance & Business',
    price: 2400,
    rating: 4.7,
    description: 'The definitive book on value investing. Graham teaches investors how to protect themselves from substantial error and develop long-term rational strategies that safeguard capital in any economic cycle.',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: false,
    bestseller: false,
    createdAt: '2024-01-15',
    tableOfContents: [
      'Chapter 1: Investment vs. Speculation',
      'Chapter 2: The Investor and Inflation',
      'Chapter 3: General Portfolio Policy',
      'Chapter 4: Security Analysis for the Lay Investor',
      'Chapter 5: Per-Share Earnings Factor',
      'Chapter 6: Margin of Safety as the Central Concept'
    ],
    reviews: [
      {
        id: 110,
        user: 'Isaac Cheruiyot',
        rating: 5,
        date: '2024-02-10',
        comment: 'The definitive foundation for investing without panic or FOMO. A timeless masterpiece.'
      }
    ]
  },

  // --- Christianity ---
  {
    id: 10,
    title: 'Mere Christianity',
    author: 'C.S. Lewis',
    authorInfo: 'Clive Staples Lewis (1898–1963) was a British writer and lay theologian who held academic positions in English literature at Oxford and Cambridge University. His writings on faith and reason have influenced millions worldwide.',
    category: 'Christianity',
    price: 1500,
    rating: 4.9,
    description: 'A forceful and rational defense of the Christian faith. Lewis unpacks the common ground upon which all Christian convictions stand, beginning with moral law, human conscience, the divine reality, and the transformative doctrine of redemption.',
    coverImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: true,
    createdAt: '2024-03-08',
    tableOfContents: [
      'Book 1: Right and Wrong as a Clue to the Meaning of the Universe',
      'Book 2: What Christians Believe',
      'Book 3: Christian Behavior and Cardinal Virtues',
      'Book 4: Beyond Personality: First Steps in the Doctrine of the Trinity'
    ],
    reviews: [
      {
        id: 111,
        user: 'Grace Wambui',
        rating: 5,
        date: '2024-03-19',
        comment: 'Clear, brilliant reasoning. Lewis explains deep theological concepts in down-to-earth everyday language.'
      }
    ]
  },
  {
    id: 11,
    title: 'The Purpose Driven Life',
    author: 'Rick Warren',
    authorInfo: 'Rick Warren is an author, global pastor, and philanthropist who founded Saddleback Church in Lake Forest, California. His book has spent more than 90 weeks on the New York Times bestseller list.',
    category: 'Christianity',
    price: 1650,
    rating: 4.8,
    description: 'A 40-day spiritual roadmap that will help you understand why you are alive and discover God’s specific plan for your life. Knowing your purpose reduces stress, focuses your energy, simplifies decisions, and prepares you for eternity.',
    coverImage: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: false,
    bestseller: true,
    createdAt: '2024-02-10',
    tableOfContents: [
      'Pillar 1: What on Earth Am I Here For?',
      'Pillar 2: Purpose #1 — Planned for God’s Pleasure (Worship)',
      'Pillar 3: Purpose #2 — Formed for God’s Family (Fellowship)',
      'Pillar 4: Purpose #3 — Created to Become Like Christ (Discipleship)',
      'Pillar 5: Purpose #4 — Shaped for Serving God (Ministry)',
      'Pillar 6: Purpose #5 — Made for a Mission (Evangelism)'
    ],
    reviews: [
      {
        id: 112,
        user: 'Daniel Kipkoech',
        rating: 5,
        date: '2024-02-25',
        comment: 'Transformative study. Guided my personal devotional life and renewed my sense of direction.'
      }
    ]
  },
  {
    id: 12,
    title: 'Celebration of Discipline',
    author: 'Richard J. Foster',
    authorInfo: 'Richard J. Foster is an author, theologian, and founder of Renovaré. His writings focus on spiritual formation and classic spiritual disciplines, drawing from centuries of Christian historical practice.',
    category: 'Christianity',
    price: 1700,
    rating: 4.8,
    description: 'The path to spiritual growth. Foster explores the central spiritual practices of the Christian life, divided into three categories: inward disciplines (meditation, prayer, fasting, study), outward disciplines (simplicity, solitude, submission, service), and corporate disciplines (confession, worship, guidance, celebration).',
    coverImage: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=600&auto=format&fit=crop&q=80',
    pdfUrl: '#',
    featured: true,
    bestseller: false,
    createdAt: '2024-01-25',
    tableOfContents: [
      'Inward Disciplines: Meditation, Prayer, Fasting, Study',
      'Outward Disciplines: Simplicity, Solitude, Submission, Service',
      'Corporate Disciplines: Confession, Worship, Guidance, Celebration'
    ],
    reviews: [
      {
        id: 113,
        user: 'Miriam Chebet',
        rating: 5,
        date: '2024-02-02',
        comment: 'A profoundly enriching guide that rescues discipline from legalism and restores it as the gateway to spiritual freedom.'
      }
    ]
  }
];

export const REVIEWS = [];
