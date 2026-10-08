import { Question } from '../types';
import { passages } from './passages';

export const initialGATQuestions: Question[] = [
  // GAT Verbal: Analogy
  {
    id: 'gat-an-01',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'FIRE : SMOKE',
    options: ['smoke : fire', 'car : exhaust', 'water : river', 'light : shadow'],
    answer: 1,
    explain: 'Fire generates smoke as a byproduct; a car generates exhaust as an operational byproduct (source : emission).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-02',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'BRICKS : HOUSE',
    options: ['wood : fire', 'roof : wall', 'bones : skeleton', 'pencil : paper'],
    answer: 2,
    explain: 'Bricks are the fundamental structural components that assemble into a house; bones assemble into a skeleton (constituent part : whole structure).',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-an-03',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'TREE : FOREST',
    options: ['star : galaxy', 'galaxy : star', 'planet : orbit', 'sun : solar system'],
    answer: 0,
    explain: 'Individual trees cluster together to form a forest; individual stars cluster to form a galaxy (individual entity : collective group).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-04',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'GYM : EXERCISE',
    options: ['doctor : hospital', 'library : read', 'read : library', 'book : page'],
    answer: 1,
    explain: 'A gym is a dedicated venue designated for exercise; a library is a designated venue for reading (location : primary purpose).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-05',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'SPEAK : SHOUT',
    options: ['talk : listen', 'walk : run', 'run : walk', 'whisper : speak'],
    answer: 1,
    explain: 'Shouting represents an amplified, high-intensity degree of speaking; running is an intensified degree of walking (action : escalated intensity).',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-an-06',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'CATERPILLAR : BUTTERFLY',
    options: ['toad : frog', 'airplane : fly', 'larva : adult', 'butterfly : caterpillar'],
    answer: 2,
    explain: 'A caterpillar metamorphoses into a mature butterfly; a larva develops into an adult insect (juvenile phase : mature organism).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-07',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'FLOOR : CEILING',
    options: ['lemon : sour', 'sugar : sweet', 'sour : sweet', 'cake : dessert'],
    answer: 2,
    explain: 'Floor and ceiling represent polar vertical extremes of a room; sour and sweet represent polar taste opposites (direct antonyms).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-08',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'SUGGEST : DEMAND',
    options: ['ask : answer', 'grab : take', 'take : grab', 'allow : deny'],
    answer: 2,
    explain: 'A demand is an imperative, forceful escalation of a suggestion; grabbing is a forceful escalation of taking (mild action : forceful equivalent).',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-an-09',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'WET : SOAK',
    options: ['rub : scrub', 'glimpse : notice', 'touch : feel', 'scrub : rub'],
    answer: 0,
    explain: 'To soak is to thoroughly saturate with moisture; to scrub is to rub with vigorous intensity (base condition : maximized application).',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-an-10',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Analogy',
    prompt: 'MAMMAL : HUMAN',
    options: ['truck : vehicle', 'vehicle : truck', 'school : book', 'beauty : color'],
    answer: 1,
    explain: 'A human is a specific biological specimen belonging to the broader class of mammals; a truck is a specific vehicle (general category : specific exemplar).',
    src: 'Qudurat Verbal Leaks'
  },

  // GAT Verbal: Sentence Completion
  {
    id: 'gat-sc-01',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'Although it has been over two decades since the supersonic Concorde was retired, its revolutionary design has still ______ the public imagination; it was undeniably a magnificent ______.',
    options: ['emptied … failure', 'captured … innovation', 'evaded … blunder', 'surpassed … disaster'],
    answer: 1,
    explain: 'The concessive conjunction "Although" sets up an expectation of enduring fascination. "Captured the imagination" is the natural idiomatic collocation, and "magnificent innovation" completes the acclaim.',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-sc-02',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'Sharks are ______ to maintaining marine balance; their primary ______ includes keeping consumer populations checked to protect coral habitats.',
    options: ['harmful … weakness', 'crucial … role', 'useless … disadvantage', 'trivial … responsibility'],
    answer: 1,
    explain: 'Regulating marine food chains is an essential function, which makes apex predators "crucial" and controlling populations their primary "role".',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-sc-03',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'Recent technological ______ have transformed accessibility for hearing-impaired audiences, allowing viewers to watch broadcasts without requiring human signers to ______ for them continuously.',
    options: ['breakdowns … perform', 'innovations … interpret', 'mistakes … translate', 'limitations … speak'],
    answer: 1,
    explain: '"Innovations" fits technological breakthroughs that empower deaf audiences, while "interpret" correctly denotes rendering speech into sign language or live captions.',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-sc-04',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'In our digital era, automated delivery and on-demand streaming do not ______ furnish instantaneous gratification; they proactively ______ it.',
    options: ['merely … encourage', 'gradually … reduce', 'reluctantly … eliminate', 'superficially … penalize'],
    answer: 0,
    explain: 'The correlative rhetorical structure "not merely X; they proactively Y" requires a progressive escalation: they do not just provide it, they actively nurture and encourage it.',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-sc-05',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'Determining which world language is the most challenging to master remains ______; even distinguished linguists continuously ______ the criteria for difficulty.',
    options: ['settled … agree on', 'controversial … debate', 'elementary … study', 'unanimous … disregard'],
    answer: 1,
    explain: 'If expert linguists still disagree and question the criteria, the matter is inherently "controversial" and subject to ongoing "debate".',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-sc-06',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Sentence Completion',
    prompt: 'The Grand Canyon in Arizona is an awe-inspiring wonder; photographs and aerial videos do not do it ______, as its staggering scale is impossible to truly ______ without standing at the rim.',
    options: ['harm … forget', 'favors … anticipate', 'justice … comprehend', 'credit … diminish'],
    answer: 2,
    explain: '"To do something justice" is the established idiom meaning to represent its true splendor, and vast natural scale is difficult to fully "comprehend" from pictures.',
    src: 'Tajmeeat Verbal Collection'
  },

  // GAT Verbal: Contextual Error
  {
    id: 'gat-ce-01',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Contextual Error',
    prompt: 'The reintroduction of wolves has been commonly debated. These beloved beasts were once the most populous animals in North America. Farmers frequently petitioned wildlife authorities to restrict their spread.',
    options: ['debated', 'beloved', 'populous', 'restrict'],
    answer: 1,
    explain: 'Because wolves were contested and farmers petitioned against them, calling them "beloved" conflicts with the context. The word should be "feared" or "predatory".',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-ce-02',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Contextual Error',
    prompt: 'Back in 1949, mathematician John von Neumann remarked: "It would appear that we have reached the limits of what it is possible to corrupt with computer technology, though one must be cautious with such predictions."',
    options: ['reached', 'corrupt', 'cautious', 'predictions'],
    answer: 1,
    explain: 'Von Neumann was commenting on the upper frontier of what computing machinery could achieve or calculate, not destroy. "Corrupt" is contextual error for "achieve" or "compute".',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-ce-03',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Contextual Error',
    prompt: 'Speeding and attempts at controlling transit velocity are not a modern solution. When horseless carriages debuted in the nineteenth century, they were legally restricted to walking pace and preceded by a flagman.',
    options: ['velocity', 'solution', 'debuted', 'restricted'],
    answer: 1,
    explain: 'Excessive speed is an ongoing municipal danger and historical dilemma, not a "solution". The proper contextual term is "problem" or "phenomenon".',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-ce-04',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Contextual Error',
    prompt: 'In March 2023, a disgruntled former engineer accessed his unimportant employer\'s testing infrastructure and maliciously purged 180 virtual instances, causing immediate service blackouts.',
    options: ['disgruntled', 'unimportant', 'infrastructure', 'purged'],
    answer: 1,
    explain: 'The sentence describes a targeted retaliation against an enterprise employer whose downtime disrupted major operations. "Unimportant" should be "former" or "previous".',
    src: 'Qudurat Verbal Leaks'
  },
  {
    id: 'gat-ce-05',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Contextual Error',
    prompt: 'To invest successfully over a career does not require genius-level intellect or insider leaks; what is vital is a sound rational framework and the discipline to prevent suspicious from eroding that strategy.',
    options: ['successfully', 'intellect', 'suspicious', 'eroding'],
    answer: 2,
    explain: '"Suspicious" is an adjective used where an abstract noun denoting psychological interference belongs (such as "emotions", "impulsiveness", or "panic").',
    src: 'Tajmeeat Verbal Collection'
  },

  // GAT Verbal: Odd One Out
  {
    id: 'gat-oo-01',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Odd One Out',
    prompt: 'Identify the word that does NOT belong with the others:',
    options: ['Jupiter', 'Saturn', 'Neptune', 'Moon'],
    answer: 3,
    explain: 'Jupiter, Saturn, and Neptune are all major gas/ice giant planets orbiting the sun, whereas the Moon is a natural satellite orbiting a planet.',
    src: 'Qudurat Verbal Foundation'
  },
  {
    id: 'gat-oo-02',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Odd One Out',
    prompt: 'Identify the word that does NOT belong with the others:',
    options: ['Triangle', 'Square', 'Pentagon', 'Sphere'],
    answer: 3,
    explain: 'Triangle, square, and pentagon are two-dimensional planar geometric polygons, whereas a sphere is a three-dimensional curved solid.',
    src: 'Qudurat Verbal Foundation'
  },
  {
    id: 'gat-oo-03',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Odd One Out',
    prompt: 'Identify the word that does NOT belong with the others:',
    options: ['Arabic', 'Spanish', 'Mandarin', 'Algebra'],
    answer: 3,
    explain: 'Arabic, Spanish, and Mandarin are spoken human natural languages; Algebra is a mathematical branch of study.',
    src: 'Qudurat Verbal Foundation'
  },
  {
    id: 'gat-oo-04',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Odd One Out',
    prompt: 'Identify the word that does NOT belong with the others:',
    options: ['Copper', 'Iron', 'Silver', 'Wood'],
    answer: 3,
    explain: 'Copper, iron, and silver are metallic conductive elements; wood is an organic, non-metallic composite material.',
    src: 'Qudurat Verbal Foundation'
  },

  // GAT Verbal: Reading Comprehension
  {
    id: 'gat-rc-01',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p01-industrial-immigration'],
    prompt: 'According to paragraph 2, what motivated European immigrants to cross the Atlantic and settle in burgeoning American urban hubs during the late nineteenth century?',
    options: [
      'Government incentives offering free farmland in the western territories',
      'The opportunity to work in seasonal maritime shipping along river ports',
      'Desperate conditions including famine and persecution paired with city industrial jobs',
      'A decline in industrial manufacturing throughout western Europe'
    ],
    answer: 2,
    explain: 'Paragraph 2 explicitly states that "problems ranging from famine to religious persecution led a new wave of immigrants" who sought work near the cities where they arrived.',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-rc-02',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p01-industrial-immigration'],
    prompt: 'Which technological advancement eliminated the requirement that manufacturing facilities be constructed exclusively adjacent to water bodies?',
    options: [
      'The incandescent electric light bulb',
      'The high-pressure steam engine',
      'Textile water wheels',
      'Refrigerated cargo rail cars'
    ],
    answer: 1,
    explain: 'Paragraph 4 explains that early mills were tethered to riverbanks until "the development of the steam engine transformed this need, allowing businesses to locate their factories near urban centers."',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-rc-03',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p01-maslows-pyramid'],
    prompt: 'According to Maslow\'s motivational hierarchy, why are physiological and safety needs classified as "deficiency needs"?',
    options: [
      'Because they can never be fulfilled by ordinary humans',
      'Because they only occur in individuals suffering from clinical deprivation',
      'Because their absence triggers acute motivation to alleviate the lack',
      'Because they rank above self-actualization in human psychology'
    ],
    answer: 2,
    explain: 'The passage defines deficiency needs (D-needs) as those that "arise due to deprivation and motivate behavior when they are not met."',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-rc-04',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p03-biogeography'],
    prompt: 'Why is the Venus flytrap cited as an example of an "endemic" species in contrast to generalists like the raccoon?',
    options: [
      'It relies entirely on abiotic rainfall patterns for energy conversion',
      'Its natural habitat is restricted to a small geographic region in the Carolinas',
      'It has adapted to survive in extreme northern Arctic tundras',
      'It cannot survive when elevation or temperature fluctuates'
    ],
    answer: 1,
    explain: 'Paragraph 2 clarifies that an endemic species is "naturally found only in a specific geographic area that is usually restricted in size", illustrating this with the Venus flytrap in North and South Carolina.',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-rc-05',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p06-taj-mahal'],
    prompt: 'What primary architectural and historic motivation spurred Emperor Shah Jahan to commission the construction of the Taj Mahal in Agra?',
    options: [
      'To celebrate his conquest over regional northern Indian competitors',
      'To construct an impenetrable fortress on the banks of the Yamuna River',
      'To erect a magnificent memorial tomb honoring his deceased wife, Mumtaz Mahal',
      'To create a universal theological center uniting Persian and Ottoman architects'
    ],
    answer: 2,
    explain: 'The passage explains that upon his beloved wife\'s passing in 1631, Shah Jahan "grieved for his wife and decided to build a giant tomb, or mausoleum, in her memory."',
    src: 'Tajmeeat Verbal Collection'
  },
  {
    id: 'gat-rc-06',
    exam: 'GAT',
    section: 'Verbal',
    skill: 'Reading Comprehension',
    passage: passages['p11-kublai-khan'],
    prompt: 'What foundational economic premise regarding the nature of money did Kublai Khan demonstrate through his chao paper currency decree?',
    options: [
      'Paper money must always be backed by an equivalent weight of silver coins',
      'Currency derives its functional value from public trust and collective consensus rather than intrinsic bullion content',
      'Barter exchange remains inherently superior to state-mandated monetary systems',
      'Regional coinages stimulate faster economic growth than empire-wide standardized currencies'
    ],
    answer: 1,
    explain: 'Paragraph 3 notes that Kublai Khan recognized "what matters about money is not what it looks like, or even what it\'s backed by, but whether people believe in it enough to use it."',
    src: 'Tajmeeat Verbal Collection'
  },

  // GAT Quantitative: Arithmetic
  {
    id: 'gat-qt-01',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Arithmetic',
    prompt: 'If a runner completes a 12-kilometer race in 48 minutes, what was the runner\'s average speed in kilometers per hour?',
    options: ['12 km/h', '14 km/h', '15 km/h', '16 km/h'],
    answer: 2,
    explain: 'Speed = Distance / Time. 48 minutes = 48/60 hour = 0.8 hour. 12 km / 0.8 h = 15 km/h.',
    src: 'Qudurat Math Archive'
  },
  {
    id: 'gat-qt-02',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Arithmetic',
    prompt: 'A jacket originally priced at 250 SAR is discounted by 20%. During a clearance sale, an additional 10% discount is applied to the discounted price. What is the final price of the jacket?',
    options: ['175 SAR', '180 SAR', '185 SAR', '190 SAR'],
    answer: 1,
    explain: 'First discount of 20%: 250 × (1 - 0.20) = 200 SAR. Second discount of 10% on 200 SAR: 200 × (1 - 0.10) = 180 SAR.',
    src: 'Qudurat Math Archive'
  },
  {
    id: 'gat-qt-03',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Arithmetic',
    prompt: 'What is the sum of all prime numbers between 20 and 40?',
    options: ['110', '120', '124', '131'],
    answer: 1,
    explain: 'The prime numbers between 20 and 40 are 23, 29, 31, and 37. Sum = 23 + 29 + 31 + 37 = 120.',
    src: 'Qudurat Math Archive'
  },

  // GAT Quantitative: Algebra
  {
    id: 'gat-qt-04',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Algebra',
    prompt: 'If 3x + 5 = 2(x + 7) - 1, what is the value of x?',
    options: ['6', '7', '8', '9'],
    answer: 2,
    explain: 'Expand the right side: 3x + 5 = 2x + 14 - 1 → 3x + 5 = 2x + 13. Subtract 2x from both sides: x + 5 = 13 → x = 8.',
    src: 'Qudurat Math Archive'
  },
  {
    id: 'gat-qt-05',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Algebra',
    prompt: 'If a/b = 3/4 and b/c = 8/9, what is the value of a/c?',
    options: ['1/2', '2/3', '3/5', '5/6'],
    answer: 1,
    explain: 'Multiply the ratios: (a/b) × (b/c) = (3/4) × (8/9) = 24/36 = 2/3. Therefore a/c = 2/3.',
    src: 'Qudurat Math Archive'
  },

  // GAT Quantitative: Geometry
  {
    id: 'gat-qt-06',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Geometry',
    prompt: 'The area of a circle inscribed inside a square of side length 14 cm is equal to (using π ≈ 22/7):',
    options: ['144 cm²', '154 cm²', '176 cm²', '196 cm²'],
    answer: 1,
    explain: 'An inscribed circle inside a square of side 14 cm has diameter d = 14 cm and radius r = 7 cm. Area = πr² = (22/7) × 7² = 22 × 7 = 154 cm².',
    src: 'Qudurat Math Archive'
  },
  {
    id: 'gat-qt-07',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Geometry',
    prompt: 'In a right-angled triangle, the lengths of the two legs are 9 cm and 12 cm. What is the length of the hypotenuse?',
    options: ['14 cm', '15 cm', '16 cm', '18 cm'],
    answer: 1,
    explain: 'By the Pythagorean theorem: c² = 9² + 12² = 81 + 144 = 225. c = √225 = 15 cm (this is a scaled 3-4-5 right triangle: 3×3, 4×3, 5×3 = 15).',
    src: 'Qudurat Math Archive'
  },

  // GAT Quantitative: Statistics
  {
    id: 'gat-qt-08',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Statistics',
    prompt: 'The average of five consecutive integers is 28. What is the largest of these five integers?',
    options: ['28', '29', '30', '31'],
    answer: 2,
    explain: 'For an odd number of consecutive integers, the arithmetic average equals the middle integer. Thus the five integers are 26, 27, 28, 29, 30. The largest is 30.',
    src: 'Qudurat Math Archive'
  },
  {
    id: 'gat-qt-09',
    exam: 'GAT',
    section: 'Quantitative',
    skill: 'Statistics',
    prompt: 'A box contains 5 red balls, 3 green balls, and 2 blue balls. If one ball is drawn at random, what is the probability that it is NOT blue?',
    options: ['1/5', '2/5', '3/5', '4/5'],
    answer: 3,
    explain: 'Total balls = 5 + 3 + 2 = 10. Non-blue balls = 5 red + 3 green = 8. Probability = 8/10 = 4/5 (or 1 - 2/10 = 8/10 = 4/5).',
    src: 'Qudurat Math Archive'
  }
];

export const initialSATQuestions: Question[] = [
  // SAT Reading & Writing: Words in Context
  {
    id: 'sat-rw-01',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Words in Context',
    prompt: 'Recent geological surveys of dormant volcanic calderas suggest that deep subterranean magma chambers often cool over millennia rather than centuries. Because the rate of thermal dissipation is so gradual, adjacent rock strata retain anomalous heat signatures that remain ______ to modern surface sensors.',
    options: ['inconsequential', 'discernible', 'obsolete', 'superfluous'],
    answer: 1,
    explain: '"Discernible" means detectable or distinguishable. Since the passage notes that anomalous heat signatures persist over millennia due to slow thermal dissipation, surface sensors are still able to detect ("discern") them.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-02',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Words in Context',
    prompt: 'While literary historians initially dismissed the seventeenth-century poet\'s obscure pamphlets as mere political ephemera, contemporary archival scholars have discovered that her treatises were ______ in shaping regional constitutional conventions.',
    options: ['instrumental', 'negligible', 'detrimental', 'peripheral'],
    answer: 0,
    explain: 'The contrast word "While" pivots from initial dismissal ("mere political ephemera") to modern scholars discovering significant influence. "Instrumental" correctly denotes playing a crucial, effective role.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-03',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Words in Context',
    prompt: 'Despite critics who warned that the experimental civic architecture would alienate pedestrians, the public plaza\'s flowing walkways and accessible pergolas have proven remarkably ______, attracting vibrant community gatherings daily.',
    options: ['austere', 'hospitable', 'clandestine', 'monotonous'],
    answer: 1,
    explain: '"Hospitable" means welcoming and conducive to social gatherings, which directly counters critics\' fears of alienating pedestrians.',
    src: 'Digital SAT Practice Suite'
  },

  // SAT Reading & Writing: Conventions
  {
    id: 'sat-rw-04',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Conventions',
    prompt: 'In 1928, bacteriologist Alexander Fleming returned from holiday to discover mold growing in a petri dish of Staphylococcus ______ contamination had inadvertently killed the surrounding bacterial colonies, unveiling penicillin.',
    options: [
      'bacteria, this',
      'bacteria; this',
      'bacteria this',
      'bacteria, which this'
    ],
    answer: 1,
    explain: 'Both clauses ("In 1928, bacteriologist... petri dish of Staphylococcus bacteria" and "this contamination had inadvertently killed...") are independent clauses. A semicolon correctly joins two independent clauses without a coordinating conjunction.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-05',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Conventions',
    prompt: 'Neither the lead astrophysicist nor the software engineers ______ capable of explaining the irregular gravitational pulse recorded by the deep-space telescope array.',
    options: ['were', 'was', 'are being', 'have been'],
    answer: 0,
    explain: 'In subject-verb agreement with correlative conjunctions ("neither... nor"), the verb agrees with the closer subject noun phrase. "Software engineers" is plural, so the plural past verb "were" is grammatically standard.',
    src: 'Digital SAT Practice Suite'
  },

  // SAT Reading & Writing: Transitions
  {
    id: 'sat-rw-06',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Transitions',
    prompt: 'Many commercial airlines implemented composite carbon-fiber fuselages to lower aircraft weight and conserve fuel. ______, the reduced operating mass allowed carriers to extend nonstop intercontinental flight ranges by over twenty percent.',
    options: ['Conversely', 'Furthermore', 'Nevertheless', 'Meanwhile'],
    answer: 1,
    explain: '"Furthermore" signals an addition of supporting benefit that compounds the first advantage (weight reduction and fuel savings + extended flight range).',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-07',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Transitions',
    prompt: 'Agricultural engineers projected that automated robotic weeders would eliminate the need for chemical herbicides within two harvest cycles. Field testing, ______, revealed that high wind gusts and dense foliage regularly obstructed the robots\' optical sensors.',
    options: ['for instance', 'however', 'consequently', 'similarly'],
    answer: 1,
    explain: 'The first sentence states an optimistic projection; the second sentence presents contradictory real-world field complications. "However" provides the requisite adversarial contrast.',
    src: 'Digital SAT Practice Suite'
  },

  // SAT Reading & Writing: Central Ideas
  {
    id: 'sat-rw-08',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Central Ideas',
    prompt: 'Marine biologist Dr. Elena Vance investigated how acoustic telemetry can monitor endangered right whale migration corridors along shipping lanes. Her team demonstrated that underwater hydrophone buoys could automatically detect low-frequency whale vocalizations within a 15-mile radius and broadcast automated nautical alerts to commercial freighters in real time, dramatically curbing vessel collisions without closing marine freight channels.\n\nWhich choice best summarizes the main idea of the text?',
    options: [
      'Right whale vocalizations have grown weaker over the past decade due to marine vessel acoustic pollution.',
      'Commercial freight channels should be closed permanently along all known right whale migration corridors.',
      'Autonomous acoustic hydrophone systems provide a viable method to safeguard migratory whales while maintaining maritime commercial shipping.',
      'Dr. Vance\'s team discovered that right whales deliberately avoid commercial freighters when hydrophone buoys are deployed.'
    ],
    answer: 2,
    explain: 'The passage centers on showing that acoustic detection buoys warn freighters in real time to prevent collisions while keeping maritime channels open.',
    src: 'Digital SAT Practice Suite'
  },

  // SAT Math: Algebra
  {
    id: 'sat-mt-01',
    exam: 'SAT',
    section: 'Math',
    skill: 'Algebra',
    prompt: 'If 3(2x - 1) = 2(x + 5) + 3, what is the value of x?',
    options: ['3', '4', '5', '6'],
    answer: 1,
    explain: 'Expand both sides: 6x - 3 = 2x + 10 + 3 → 6x - 3 = 2x + 13. Subtract 2x from both sides: 4x - 3 = 13. Add 3: 4x = 16. Divide by 4: x = 4.',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-02',
    exam: 'SAT',
    section: 'Math',
    skill: 'Algebra',
    prompt: 'A car rental service charges a flat fee of $45 plus $0.25 per mile driven. If Marcus paid $82.50 before taxes, how many miles did he drive?',
    options: ['130 miles', '140 miles', '150 miles', '160 miles'],
    answer: 2,
    explain: 'Total cost = 45 + 0.25m = 82.50. 0.25m = 82.50 - 45 = 37.50. m = 37.50 / 0.25 = 150 miles.',
    src: 'Digital SAT Math Archive'
  },

  // SAT Math: Advanced Math
  {
    id: 'sat-mt-03',
    exam: 'SAT',
    section: 'Math',
    skill: 'Advanced Math',
    prompt: 'For what positive value of k does the quadratic equation x² - kx + 36 = 0 have exactly one real solution?',
    options: ['6', '9', '12', '18'],
    answer: 2,
    explain: 'A quadratic ax² + bx + c = 0 has exactly one real solution when its discriminant b² - 4ac = 0. Here, (-k)² - 4(1)(36) = 0 → k² - 144 = 0 → k² = 144. For positive k, k = 12.',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-04',
    exam: 'SAT',
    section: 'Math',
    skill: 'Advanced Math',
    prompt: 'If f(x) = 2x² - 5x + 3, what is the value of f(a - 1)?',
    options: [
      '2a² - 9a + 10',
      '2a² - 5a + 2',
      '2a² - 9a + 6',
      '2a² - 7a + 10'
    ],
    answer: 0,
    explain: 'f(a - 1) = 2(a - 1)² - 5(a - 1) + 3 = 2(a² - 2a + 1) - 5a + 5 + 3 = 2a² - 4a + 2 - 5a + 8 = 2a² - 9a + 10.',
    src: 'Digital SAT Math Archive'
  },

  // SAT Math: Data Analysis
  {
    id: 'sat-mt-05',
    exam: 'SAT',
    section: 'Math',
    skill: 'Data Analysis',
    prompt: 'In a medical trial of 250 patients, 160 reported symptom relief within 48 hours. If 400 additional patients undergo the same treatment under identical conditions, approximately how many of the 400 would be expected to experience relief?',
    options: ['240', '256', '264', '280'],
    answer: 1,
    explain: 'Sample relief rate = 160 / 250 = 0.64 (64%). Expected relief among 400 patients = 400 × 0.64 = 256 patients.',
    src: 'Digital SAT Math Archive'
  },

  // SAT Math: Geometry & Trig
  {
    id: 'sat-mt-06',
    exam: 'SAT',
    section: 'Math',
    skill: 'Geometry & Trig',
    prompt: 'In triangle ABC, angle B is a right angle. If sin(A) = 5/13, what is the value of cos(C)?',
    options: ['5/13', '12/13', '5/12', '13/12'],
    answer: 0,
    explain: 'In any right triangle where angle B is 90°, angles A and C are complementary (A + C = 90°). By cofunction identity, cos(C) = cos(90° - A) = sin(A). Since sin(A) = 5/13, cos(C) = 5/13.',
    src: 'Digital SAT Math Archive'
  },

  // Additional SAT Questions for full practice and mock test pools
  {
    id: 'sat-rw-09',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Words in Context',
    prompt: 'Because the original manuscript contained numerous ink smudges and torn margins, the archivist cautioned that any transcriptions of the centuries-old diary would be necessarily ______.\n\nWhich choice completes the text with the most logical and precise word or phrase?',
    options: ['provisional', 'definitive', 'redundant', 'prestigious'],
    answer: 0,
    explain: '"Provisional" means temporary or subject to further confirmation, fitting an incomplete, damaged manuscript with torn margins.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-10',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Conventions',
    prompt: 'Astronomer Maria Mitchell gained international acclaim in 1847 after discovering a new comet through a two-inch equatorial ______ her breakthrough earned her a gold medal from the King of Denmark.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?',
    options: [
      'telescope,',
      'telescope; and',
      'telescope;',
      'telescope'
    ],
    answer: 2,
    explain: 'The two independent clauses ("Astronomer Maria Mitchell gained..." and "her breakthrough earned her...") must be separated by a semicolon or a comma plus coordinating conjunction. A semicolon alone properly joins them.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-11',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Transitions',
    prompt: 'Geologists originally hypothesized that tectonic subduction zones remained stationary over hundred-million-year epochs. Paleomagnetic mapping in the western Pacific, ______, demonstrated that trench rollbacks cause subduction hinge lines to migrate laterally at measurable rates of several centimeters per year.\n\nWhich choice completes the text with the most logical transition?',
    options: ['furthermore', 'nevertheless', 'consequently', 'for example'],
    answer: 1,
    explain: '"Nevertheless" or contrastive transition marks the pivot between the initial static hypothesis and the empirical discovery of lateral migration.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-rw-12',
    exam: 'SAT',
    section: 'Reading & Writing',
    skill: 'Central Ideas',
    prompt: 'In his landmark 1935 essay, Walter Benjamin contended that mechanical reproduction strips a work of art of its "aura"—its unique presence in time and space. Yet contemporary digital museum initiatives reveal that high-resolution interactive scans actually heighten viewer curiosity, driving record in-person attendance to witness the physical originals.\n\nWhich choice best summarizes the main idea of the passage?',
    options: [
      'Walter Benjamin correctly predicted that digital scans would render physical art museums obsolete.',
      'Modern digital exhibits demonstrate that reproductions can enhance rather than diminish the appeal of original artworks.',
      'Physical art exhibitions should cease creating digital scans to safeguard the authenticity of their collections.',
      'Museum attendance has declined because audiences prefer viewing digital reproductions from home.'
    ],
    answer: 1,
    explain: 'The passage illustrates that contrary to Benjamin\'s view that reproductions ruin the "aura", digital reproductions in fact stimulate greater appreciation and in-person attendance for original artworks.',
    src: 'Digital SAT Practice Suite'
  },
  {
    id: 'sat-mt-07',
    exam: 'SAT',
    section: 'Math',
    skill: 'Algebra',
    prompt: 'If 2x + 5y = 19 and 3x - 2y = 0, what is the value of x + y?',
    options: ['5', '7', '8', '10'],
    answer: 0,
    explain: 'From 3x - 2y = 0, y = 1.5x. Substitute into 2x + 5(1.5x) = 19 → 2x + 7.5x = 9.5x = 19 → x = 2. Then y = 1.5(2) = 3. Therefore, x + y = 2 + 3 = 5.',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-08',
    exam: 'SAT',
    section: 'Math',
    skill: 'Advanced Math',
    prompt: 'A quadratic function is given by g(x) = (x - 4)² - 9. What are the x-intercepts of the graph of g?',
    options: ['(1, 0) and (7, 0)', '(-1, 0) and (7, 0)', '(3, 0) and (-3, 0)', '(4, 0) and (-9, 0)'],
    answer: 0,
    explain: 'Set g(x) = 0: (x - 4)² - 9 = 0 → (x - 4)² = 9 → x - 4 = ±3. Thus x = 4 + 3 = 7 or x = 4 - 3 = 1. The intercepts are (1, 0) and (7, 0).',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-09',
    exam: 'SAT',
    section: 'Math',
    skill: 'Data Analysis',
    prompt: 'The mean score of 8 students on a mathematics quiz was 84. When a 9th student\'s score was included, the mean score became 85. What was the score of the 9th student?',
    options: ['89', '91', '93', '95'],
    answer: 2,
    explain: 'Sum for 8 students = 8 × 84 = 672. Sum for 9 students = 9 × 85 = 765. Ninth student\'s score = 765 - 672 = 93.',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-10',
    exam: 'SAT',
    section: 'Math',
    skill: 'Geometry & Trig',
    prompt: 'A circle in the xy-plane has equation (x - 3)² + (y + 5)² = 49. What are the coordinates of the center and the radius of this circle?',
    options: [
      'Center (3, -5), radius 7',
      'Center (-3, 5), radius 7',
      'Center (3, -5), radius 49',
      'Center (-3, 5), radius 49'
    ],
    answer: 0,
    explain: 'Standard circle equation is (x - h)² + (y - k)² = r². Here h = 3, k = -5, and r² = 49 → r = 7. Center is (3, -5) and radius is 7.',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-11',
    exam: 'SAT',
    section: 'Math',
    skill: 'Algebra',
    prompt: 'Line L passes through the points (2, 7) and (6, 15). What is the y-intercept of Line L?',
    options: ['(0, 1)', '(0, 2)', '(0, 3)', '(0, 4)'],
    answer: 2,
    explain: 'Slope m = (15 - 7) / (6 - 2) = 8 / 4 = 2. Using point-slope form: y - 7 = 2(x - 2) → y = 2x - 4 + 7 → y = 2x + 3. The y-intercept is (0, 3).',
    src: 'Digital SAT Math Archive'
  },
  {
    id: 'sat-mt-12',
    exam: 'SAT',
    section: 'Math',
    skill: 'Geometry & Trig',
    prompt: 'A right circular cylinder has a height of 10 cm and a base radius of 3 cm. What is its total volume in terms of π?',
    options: ['30π cm³', '60π cm³', '90π cm³', '120π cm³'],
    answer: 2,
    explain: 'Volume of cylinder = πr²h = π(3²)(10) = π(9)(10) = 90π cm³.',
    src: 'Digital SAT Math Archive'
  }
];
