// V2 content: taxonomy for contextual onboarding, more (fictional) stories across
// categories, photo/keyword/context metadata, community threads and simulated markets.
// Photos: Unsplash (free licence), hotlinked and credited. All people, companies and stories are made up.

export type Category = 'Markets' | 'Sports' | 'Tech' | 'Climate' | 'Cities' | 'Culture'

export const CATEGORY_LIST: { id: Category; blurb: string; keywords: string[] }[] = [
  { id: 'Markets', blurb: 'Companies, money, EVs', keywords: ['Stock market', 'EVs', 'Banking', 'Commodities', 'Lithium', 'Auto industry', 'IPOs', 'Startups'] },
  { id: 'Sports', blurb: 'Football, cricket and more', keywords: ['Football', 'Indian football', 'World Cup qualifiers', 'Cricket', 'Women’s cricket', 'Kabaddi', 'Chess', 'Athletics'] },
  { id: 'Tech', blurb: 'AI, gadgets, data', keywords: ['AI', 'Smartphones', 'Data centres', 'Gadget reviews', 'Media & AI', 'Cybersecurity', 'Space'] },
  { id: 'Climate', blurb: 'Monsoon, water, energy', keywords: ['Monsoon', 'Groundwater', 'Farming', 'Solar energy', 'Drought', 'Food prices', 'Air quality'] },
  { id: 'Cities', blurb: 'Where you live', keywords: ['Pune', 'Mumbai', 'Bengaluru', 'Delhi', 'Metro & transport', 'Housing', 'Civic issues'] },
  { id: 'Culture', blurb: 'Films, music, books', keywords: ['Films', 'Marathi cinema', 'Music', 'Books', 'Food', 'Festivals'] },
]

/** Map the older sections onto interest categories. */
export const SECTION_TO_CATEGORY: Record<string, Category> = {
  Markets: 'Markets', Explainers: 'Markets', Data: 'Climate', Reviews: 'Tech', Cities: 'Cities', Sports: 'Sports', Tech: 'Tech', Climate: 'Climate', Culture: 'Culture',
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=70`

export interface Photo { url: string; alt: string; credit: string }
export interface WorkMeta {
  image: Photo
  keywords: string[]
  context: { why: string; who: string; fact: string }
  refs: { label: string; url: string }[]
  likes: number
  shares: number
  comments: { name: string; text: string; ago: string }[]
}

export const PHOTOS = {
  hero1: { url: u('photo-1554672408-17407e0322ce'), alt: 'A man reading on his phone', credit: 'charlesdeluvio / Unsplash' },
  hero2: { url: u('photo-1582046989896-db5fc3a2d858'), alt: 'Phone on a notebook', credit: 'Nathan Dumlao / Unsplash' },
  creator: { url: u('photo-1581091212991-8891c7d4bd9b'), alt: 'Engineers at work in a factory', credit: 'ThisisEngineering / Unsplash' },
  market: { url: u('photo-1560221328-12fe60f83ab8'), alt: 'Monitor showing a price chart', credit: 'Nicholas Cappello / Unsplash' },
  community: { url: u('photo-1753351055553-dc74d82ea7b5'), alt: 'Two friends looking at a phone together', credit: 'Vitaly Gariev / Unsplash' },
  tractor: { url: u('photo-1706092949220-d526e998b9a6'), alt: 'A red tractor on a dry field', credit: 'Ujwal Sharma / Unsplash' },
  assembly: { url: u('photo-1581091212991-8891c7d4bd9b'), alt: 'Engineers on a car assembly line', credit: 'ThisisEngineering / Unsplash' },
  category: {
    Markets: { url: u('photo-1645226880663-81561dcab0ae'), alt: 'Phone held up in front of a stock chart', credit: 'Adam Śmigielski / Unsplash' },
    Sports: { url: u('photo-1522778119026-d647f0596c20'), alt: 'A football pitch', credit: 'Vienna Reyes / Unsplash' },
    Tech: { url: u('photo-1584169417032-d34e8d805e8b'), alt: 'Server room aisle', credit: 'İsmail Enes Ayhan / Unsplash' },
    Climate: { url: u('photo-1497435334941-8c899ee9e8e9'), alt: 'Solar panels in a green field', credit: 'Andreas Gücklhorn / Unsplash' },
    Cities: { url: u('photo-1718544680326-a96b27112d3b'), alt: 'Train beside a city station', credit: 'Xavier Praillet / Unsplash' },
    Culture: { url: u('photo-1571366657764-16ca342d3284'), alt: 'People on a street at night', credit: 'Lerone Pieters / Unsplash' },
  } as Record<Category, Photo>,
}

export const NEW_CREATORS = {
  aditya: { id: 'aditya', name: 'Aditya Rane', handle: '@aditya.football', beat: 'Football writer', location: 'Kolkata', reputation: 0.74, pastPieces: 58, followers: 4100, joined: '2025', verified: true, avatarHue: 150 },
  ishita: { id: 'ishita', name: 'Ishita Bhave', handle: '@ishita.cricket', beat: 'Cricket and grassroots sport', location: 'Pune', reputation: 0.69, pastPieces: 17, followers: 1300, joined: '2026', verified: true, avatarHue: 330 },
  rohan: { id: 'rohan', name: 'Rohan Iyer', handle: '@rohan.tech', beat: 'Tech and media reporter', location: 'Bengaluru', reputation: 0.77, pastPieces: 39, followers: 2900, joined: '2025', verified: true, avatarHue: 250 },
  meghna: { id: 'meghna', name: 'Meghna Patil', handle: '@meghna.climate', beat: 'Climate and farming reporter', location: 'Aurangabad', reputation: 0.72, pastPieces: 26, followers: 1700, joined: '2025', verified: true, avatarHue: 95 },
  tanvi: { id: 'tanvi', name: 'Tanvi Joshi', handle: '@tanvi.films', beat: 'Film critic', location: 'Pune', reputation: 0.66, pastPieces: 44, followers: 3600, joined: '2025', verified: true, avatarHue: 10 },
}

type NewWork = {
  id: string; creatorId: keyof typeof NEW_CREATORS | 'riya' | 'neha'; kind: 'article' | 'video' | 'dataset'; section: string
  title: string; dek: string; body: string; topics: string[]; publishedAt: string
  disclosure: 'human' | 'ai_assisted' | 'ai_generated'; aiUses: string[]
  readPrice: number; quotePrice: number; trainPermission: 'paid' | 'ask' | 'no'; trainPrice: number; republishPrice: number
}

export const NEW_WORKS: NewWork[] = [
  {
    id: 'tf_idn_0101', creatorId: 'aditya', kind: 'article', section: 'Sports',
    title: 'Indonesia’s home defeat blows Group D of the qualifiers wide open',
    dek: 'A 2–1 loss in Jakarta leaves three teams within two points of second place with two rounds to play.',
    body: `Indonesia lost 2–1 at home on Tuesday night, a result that leaves Group D of the World Cup qualifiers more open than at any point this campaign.

Indonesia had won their previous three home games without conceding. The visitors scored twice in eleven minutes after half-time, and a late header was not enough to rescue a point in front of 61,000 fans.

The defeat leaves Indonesia on 7 points. The two teams below them are on 6 and 5, and only the top two go through to the third round. Both remaining fixtures for every side are against teams in the bottom half of the table.

Indonesia’s coach said his side had "stopped playing for twenty minutes" and that the squad would recover in time for March. Indonesia’s goal difference, +1, is now the weakest of the top three.`,
    topics: ['Football', 'World Cup qualifiers'], publishedAt: '2026-11-24T22:40:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 8, quotePrice: 1.2, trainPermission: 'ask', trainPrice: 1500, republishPrice: 480,
  },
  {
    id: 'tf_ind_0102', creatorId: 'aditya', kind: 'article', section: 'Sports',
    title: 'India’s under-23 football squad will train in Goa for six weeks before the March window',
    dek: 'The federation has booked two pitches and a sports-science team, a first for an age-group side.',
    body: `India’s under-23 football squad will spend six weeks at a training base in Goa from late January, according to a federation circular shared with this writer.

The camp will include 32 players, with the final 23 named after two friendlies in early March. The circular says the federation has hired a four-person sports-science team for the camp, including a nutritionist and a data analyst, a first for an Indian age-group side.

Two coaches said the longer camp was planned after the senior team’s results this autumn. "We are asking players to be ready to step up if the senior squad needs them in March," one said.

Domestic clubs will release players for the camp but have asked for injury data to be shared weekly.`,
    topics: ['Indian football'], publishedAt: '2026-11-23T09:10:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 6, quotePrice: 0.8, trainPermission: 'ask', trainPrice: 900, republishPrice: 360,
  },
  {
    id: 'tf_crk_0103', creatorId: 'ishita', kind: 'article', section: 'Sports',
    title: 'Pune’s newest cricket academy filled 40% of its first batch with girls',
    dek: 'Coaches say a free evening slot and a female head coach made the difference.',
    body: `A new cricket academy in Pune’s Hadapsar has filled 48 of its first 120 places with girls, a share coaches say is unusual for the city.

The academy offers a free evening slot from 5 pm to 7 pm, after school hours, and its head coach is a former state-level player. Parents interviewed for this piece said those two things decided it.

"My daughter had been playing in the lane with her brother for years. This is the first place that came to us," said one parent, who asked that her name not be used.

The academy plans a girls’ under-14 team for the district tournament in February. It will need at least two more coaches to keep its ratio of one coach to twelve players.`,
    topics: ['Cricket', 'Women’s cricket', 'Pune'], publishedAt: '2026-11-22T17:30:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 0, quotePrice: 0.6, trainPermission: 'ask', trainPrice: 700, republishPrice: 240,
  },
  {
    id: 'tf_dc_0104', creatorId: 'neha', kind: 'article', section: 'Tech',
    title: 'Pune’s data-centre boom will need as much power as 300,000 homes, utility filings show',
    dek: 'Four new campuses have asked for 410 megawatts. The grid upgrade to supply them is two years behind.',
    body: `Four data-centre campuses planned around Pune have applied for a combined 410 megawatts of power, according to filings with the state electricity regulator reviewed for this story. That is roughly what 300,000 homes use.

The filings show the distribution company plans two new substations to serve the campuses, but neither has land allocated yet. A utility official said the earliest the upgrade could be ready is 2028.

Operators say demand from AI workloads has doubled the power each rack needs since 2024. Residents in two villages near the proposed sites have objected to new transmission lines across farmland.

The regulator will hear the applications on 9 December.`,
    topics: ['Data centres', 'AI', 'Pune'], publishedAt: '2026-11-21T08:00:00+05:30',
    disclosure: 'ai_assisted', aiUses: ['research'], readPrice: 10, quotePrice: 1.2, trainPermission: 'ask', trainPrice: 1900, republishPrice: 600,
  },
  {
    id: 'tf_aip_0105', creatorId: 'rohan', kind: 'article', section: 'Tech',
    title: 'We tracked 10,000 AI answers. Here is what they paid the people they quoted',
    dek: 'Most answers cited at least one news source. Fewer than one in five sources was paid.',
    body: `For three weeks we asked four AI assistants the same 500 questions about Indian business and civic news, twenty times each, and logged every source they cited.

Of 10,000 answers, 8,140 cited at least one article. But the publishers we could reach said they were paid for fewer than one in five of those citations. Independent writers said they were paid for none.

Answers about fast-moving stories, such as company results or court rulings, leaned most heavily on a small number of original reports. In those cases a single scoop was cited in hundreds of answers within a day.

Two assistant makers said they were "exploring licensing models". None shared rates. This piece is free to read; the data behind it is licensed separately.`,
    topics: ['AI', 'Media & AI'], publishedAt: '2026-11-20T11:00:00+05:30',
    disclosure: 'ai_assisted', aiUses: ['research', 'proofreading'], readPrice: 0, quotePrice: 1.5, trainPermission: 'no', trainPrice: 2500, republishPrice: 700,
  },
  {
    id: 'tf_sol_0106', creatorId: 'meghna', kind: 'article', section: 'Climate',
    title: 'In drought-hit Marathwada, solar parks now pay farmers more than their crops',
    dek: 'Leasing land to solar developers earns ₹75,000 an acre a year, three times a good soybean season.',
    body: `Farmers in three Marathwada districts are leasing dry land to solar developers for about ₹75,000 an acre a year, roughly three times what a good soybean season brings, according to lease agreements and interviews with eleven farmers.

The leases run for 25 years. Developers pay a fixed rent that rises 3% a year, and farmers keep the right to graze animals under the panels.

"After the last two monsoons, I would rather have rent than rain," said one farmer in Latur district.

Agricultural economists warn that a large shift could cut local food production and jobs for farm labourers, who do not share in the rent. The district administration has started mapping how much irrigated land is being leased.`,
    topics: ['Solar energy', 'Farming', 'Drought'], publishedAt: '2026-11-19T07:45:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 9, quotePrice: 1.1, trainPermission: 'ask', trainPrice: 1600, republishPrice: 540,
  },
  {
    id: 'tf_mon_0107', creatorId: 'meghna', kind: 'article', section: 'Climate',
    title: 'Mumbai’s late monsoon added ₹9 to a kilo of tomatoes. Here’s the chain of events',
    dek: 'A nine-day delay in June shifted planting, then supply, then prices, all the way to November.',
    body: `The monsoon reached Mumbai nine days late this June. Five months later, tomatoes at the city’s wholesale market cost ₹9 a kilo more than last November, according to market records.

The delay pushed planting back across the main growing belts. Farmers who planted late harvested into the October rains, which damaged about a fifth of the crop, traders said.

Onion prices rose less, because more stock was stored from the previous season. Leafy vegetables, which grow fast, recovered within weeks.

Traders expect tomato prices to ease by mid-December as the next harvest arrives, if the winter stays dry.`,
    topics: ['Monsoon', 'Food prices', 'Mumbai'], publishedAt: '2026-11-18T06:30:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 7, quotePrice: 0.9, trainPermission: 'ask', trainPrice: 1200, republishPrice: 420,
  },
  {
    id: 'tf_blr_0108', creatorId: 'rohan', kind: 'article', section: 'Cities',
    title: 'Bengaluru’s new bus lanes cut a typical commute by 18% in their first month',
    dek: 'GPS data from 1,900 buses shows the biggest gains on the outer ring road. Car traffic did not get worse.',
    body: `Buses on Bengaluru’s four new dedicated lanes were 18% faster in their first month than in the same weeks last year, according to GPS data from 1,900 buses obtained under the Right to Information Act.

The biggest gain was on the outer ring road, where the average evening trip fell from 64 minutes to 49. Average car speeds on the same stretches changed by less than 2%, the data shows.

Ridership on the four routes rose 11%. The transport corporation says it will add three more corridors next year if enforcement holds; a third of the lane length is still regularly blocked by parked vehicles.`,
    topics: ['Bengaluru', 'Metro & transport'], publishedAt: '2026-11-17T08:20:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 0, quotePrice: 0.8, trainPermission: 'ask', trainPrice: 900, republishPrice: 300,
  },
  {
    id: 'tf_flm_0109', creatorId: 'tanvi', kind: 'article', section: 'Culture',
    title: 'The Marathi indie film that sold out every Pune screen without a trailer',
    dek: 'Word of mouth, two college screenings and a ₹99 ticket did what a marketing budget could not.',
    body: `A ₹1.2 crore Marathi film about a mother running a tea stall outside a Pune bus depot sold out all 34 of its weekend shows in the city, without releasing a trailer.

The director held two free screenings at engineering colleges a fortnight before release and set the first-week ticket at ₹99. Students posted clips of the audience reaction, not of the film.

Cinema managers said the film had the highest weekend occupancy of any Marathi release this year, at 91%. Its distributor has added 60 screens across Maharashtra for next week.

"We had no money for promotion, so we spent it on the audience instead," the director said.`,
    topics: ['Marathi cinema', 'Films', 'Pune'], publishedAt: '2026-11-16T19:00:00+05:30',
    disclosure: 'human', aiUses: [], readPrice: 5, quotePrice: 0.6, trainPermission: 'no', trainPrice: 800, republishPrice: 240,
  },
]

const ref = (label: string, slug: string) => ({ label: `${label} (Wikipedia)`, url: `https://en.wikipedia.org/wiki/${slug}` })

export const META: Record<string, WorkMeta> = {
  tf_vlt_0001: {
    image: { url: u('photo-1567789884554-0b844b597180'), alt: 'Robotic arms on a car assembly line', credit: 'Lenny Kuhne / Unsplash' },
    keywords: ['EVs', 'Lithium', 'Stock market', 'Auto industry', 'Commodities'],
    context: { why: 'A hidden 18% jump in lithium costs could wipe out the cost savings Voltaris promised investors ahead of its share sale.', who: 'Shareholders and buyers in the December share sale, EV makers that buy Voltaris packs, and eventually EV buyers.', fact: 'One tonne of lithium carbonate holds enough lithium for roughly 15–20 mid-size EV battery packs.' },
    refs: [ref('Lithium-ion battery', 'Lithium-ion_battery'), ref('Lithium triangle', 'Lithium_triangle')],
    likes: 1240, shares: 312,
    comments: [
      { name: 'Kunal M.', text: 'This is why I pay for independent reporting. Nobody else had the memo.', ago: '2 d' },
      { name: 'Priya S.', text: 'Will the share sale price change? Would love a follow-up.', ago: '1 d' },
      { name: 'Harsh V.', text: 'FinPilot flagged this to me before I placed an order. Credited Riya too.', ago: '9 h' },
    ],
  },
  tf_sfm_0002: {
    image: { url: u('photo-1708015397568-60ec9b8cde88'), alt: 'Construction site with a bulldozer', credit: 'Christopher / Unsplash' },
    keywords: ['EVs', 'Auto industry', 'Stock market', 'Pune'],
    context: { why: 'Investor forecasts assume the plant adds capacity by 2029; a land gap pushes that out.', who: 'Saffron shareholders, the 63 landowning families, and suppliers planning around the plant.', fact: 'An acre is about 0.4 hectares, roughly three-quarters of a football pitch.' },
    refs: [ref('Land acquisition in India', 'Land_acquisition_in_India')],
    likes: 640, shares: 120,
    comments: [{ name: 'Amol T.', text: 'Chakan farmers have been saying this for months.', ago: '2 w' }],
  },
  tf_lth_0003: {
    image: { url: u('photo-1709489662983-3674d790b224'), alt: 'Truck on a dirt road at a mine', credit: 'Curioso Photography / Unsplash' },
    keywords: ['Lithium', 'Commodities', 'EVs'],
    context: { why: 'Battery costs drive EV prices, and lithium is the most volatile input.', who: 'EV makers, battery makers and anyone buying an EV in the next two years.', fact: 'Most of the world’s lithium brine comes from a high-altitude region spanning three South American countries.' },
    refs: [ref('Lithium', 'Lithium'), ref('Lithium triangle', 'Lithium_triangle')],
    likes: 410, shares: 95, comments: [],
  },
  tf_gw_0004: {
    image: { url: u('photo-1686072368055-7e1be988d358'), alt: 'Red umbrella on cracked dry earth', credit: 'Amritansh Dubey / Unsplash' },
    keywords: ['Groundwater', 'Drought', 'Farming', 'Monsoon'],
    context: { why: 'Monthly village-well data shows water stress years before official twice-yearly readings do.', who: 'Farmers, district planners, crop insurers and lenders in Marathwada.', fact: 'Sugarcane needs roughly 2,000–2,500 mm of water a season, several times what most pulses need.' },
    refs: [ref('Groundwater', 'Groundwater'), ref('Marathwada', 'Marathwada')],
    likes: 520, shares: 210, comments: [{ name: 'Dr. S. Kale', text: 'Would licence this for our crop-insurance model.', ago: '5 d' }],
  },
  tf_ph_0005: {
    image: { url: u('photo-1672413514634-4781b15fd89e'), alt: 'Several phones on a table', credit: 'kuaileqie RE / Unsplash' },
    keywords: ['Smartphones', 'Gadget reviews'],
    context: { why: 'Advertised battery capacity barely predicts real battery life; the modem matters as much.', who: 'Anyone buying a mid-range phone this season.', fact: 'Phones use more power on a weak signal because the radio boosts its transmit power.' },
    refs: [ref('Lithium-ion battery', 'Lithium-ion_battery')],
    likes: 2210, shares: 480, comments: [{ name: 'Rahul P.', text: 'Finally someone tested on weak signal.', ago: '4 d' }],
  },
  tf_mtr_0006: {
    image: { url: u('photo-1718544680232-97cabf5cc1db'), alt: 'Train pulling into a station beside tall buildings', credit: 'Xavier Praillet / Unsplash' },
    keywords: ['Pune', 'Metro & transport', 'Civic issues'],
    context: { why: 'Paying 62% before testing reduces the city’s leverage if the system fails.', who: 'Commuters on the planned line, taxpayers, and the contractor.', fact: 'Signalling decides how close trains can run, which sets a metro line’s real capacity.' },
    refs: [ref('Right to Information Act, 2005', 'Right_to_Information_Act,_2005')],
    likes: 870, shares: 260, comments: [{ name: 'Neeta R.', text: 'Penalty waived twice? Who signed off?', ago: '5 d' }],
  },
  tf_sfd_0007: {
    image: { url: u('photo-1520548729987-7fba97e811c7'), alt: 'Rows of cars, in black and white', credit: 'Noah Negishi / Unsplash' },
    keywords: ['Auto industry', 'Stock market'],
    context: { why: 'High dealer stock often comes before discounts or a production cut.', who: 'Dealers, buyers looking for festive discounts, Saffron shareholders.', fact: '41 days of stock means dealers hold about six weeks of sales on their lots.' },
    refs: [ref('Channel stuffing', 'Channel_stuffing')],
    likes: 380, shares: 70, comments: [],
  },
  tf_idn_0101: {
    image: { url: u('photo-1489944440615-453fc2b6a9a9'), alt: 'A football stadium from above', credit: 'Mario Klassen / Unsplash' },
    keywords: ['Football', 'World Cup qualifiers', 'Indonesia'],
    context: { why: 'With three teams within two points, every remaining result changes who goes through, including teams that did not play.', who: 'Fans and federations of every Group D side.', fact: 'Goal difference is usually the first tie-breaker when teams finish level on points.' },
    refs: [ref('Association football', 'Association_football'), ref('FIFA World Cup qualification', 'FIFA_World_Cup_qualification')],
    likes: 1890, shares: 640,
    comments: [{ name: 'Sourav D.', text: 'Doesn’t this help India? Same group.', ago: '1 h' }, { name: 'Leena F.', text: 'Wild second half.', ago: '2 h' }],
  },
  tf_ind_0102: {
    image: { url: u('photo-1579952363873-27f3bade9f55'), alt: 'A football on green grass', credit: 'Connor Coyne / Unsplash' },
    keywords: ['Indian football', 'Football', 'World Cup qualifiers'],
    context: { why: 'A long camp signals the federation may lean on younger players in the March qualifiers.', who: 'Young players, their clubs, and fans following the qualifiers.', fact: 'Sports-science teams track load (how hard each player trains) to cut soft-tissue injuries.' },
    refs: [ref('Association football', 'Association_football')],
    likes: 960, shares: 210, comments: [{ name: 'Arjun K.', text: 'About time an age-group side got this support.', ago: '1 d' }],
  },
  tf_crk_0103: {
    image: { url: u('photo-1765915550935-578b594ac76b'), alt: 'Groundsmen covering a cricket pitch', credit: 'Khurshid Dustmurodov / Unsplash' },
    keywords: ['Cricket', 'Women’s cricket', 'Pune'],
    context: { why: 'Timing and visible role models change who shows up, more than fees alone.', who: 'Girls who want to play, parents, and coaches in Pune.', fact: 'A cricket pitch is 22 yards long, a measure older than the metric system.' },
    refs: [ref('Women’s cricket', 'Women%27s_cricket')],
    likes: 1320, shares: 400, comments: [{ name: 'Meera J.', text: 'Sharing with every parent in my society group.', ago: '2 d' }],
  },
  tf_dc_0104: {
    image: { url: u('photo-1558494949-ef010cbdcc31'), alt: 'Network cables in a server room', credit: 'Taylor Vick / Unsplash' },
    keywords: ['Data centres', 'AI', 'Pune'],
    context: { why: 'If the grid upgrade lags, either data centres wait or other users face cuts.', who: 'Pune residents, nearby villages, and companies planning AI workloads.', fact: 'A single AI training rack can draw more power than ten homes.' },
    refs: [ref('Data center', 'Data_center')],
    likes: 730, shares: 190, comments: [{ name: 'Vikram S.', text: 'Our society already has two cuts a week.', ago: '3 d' }],
  },
  tf_aip_0105: {
    image: { url: u('photo-1488509082528-cefbba5ad692'), alt: 'Person using a smartphone', credit: 'Priscilla Du Preez / Unsplash' },
    keywords: ['AI', 'Media & AI'],
    context: { why: 'It measures the gap Twofold exists to close: AI cites reporting but rarely pays for it.', who: 'Journalists, publishers, AI companies and their users.', fact: 'In the study, a single scoop could be cited in hundreds of AI answers within a day.' },
    refs: [ref('Generative artificial intelligence', 'Generative_artificial_intelligence')],
    likes: 3010, shares: 1120, comments: [{ name: 'Ananya G.', text: 'This should be required reading for every newsroom.', ago: '4 d' }],
  },
  tf_sol_0106: {
    image: { url: u('photo-1509391366360-2e959784a276'), alt: 'Solar panels on a green field', credit: 'American Public Power Association / Unsplash' },
    keywords: ['Solar energy', 'Farming', 'Drought', 'Groundwater'],
    context: { why: 'Rent beats crops in dry years, which could reshape land use across the region.', who: 'Landowning farmers, landless farm workers, and food supply in the district.', fact: 'One megawatt of ground-mounted solar typically needs four to five acres.' },
    refs: [ref('Solar power in India', 'Solar_power_in_India'), ref('Marathwada', 'Marathwada')],
    likes: 1150, shares: 330, comments: [{ name: 'Ganesh B.', text: 'What happens to the labourers? Good that you asked.', ago: '6 d' }],
  },
  tf_mon_0107: {
    image: { url: u('photo-1519692933481-e162a57d6721'), alt: 'Person with an umbrella on a rainy street', credit: 'Osman Rana / Unsplash' },
    keywords: ['Monsoon', 'Food prices', 'Mumbai', 'Farming'],
    context: { why: 'A weather delay in June still shows up in your vegetable bill in November.', who: 'Households, vegetable vendors and farmers in the supply belt.', fact: 'Tomatoes take about 60–80 days from planting to first harvest.' },
    refs: [ref('Monsoon of South Asia', 'Monsoon_of_South_Asia')],
    likes: 780, shares: 150, comments: [],
  },
  tf_blr_0108: {
    image: { url: u('photo-1487762488615-8a011458b53e'), alt: 'Red bus seen from a window', credit: 'Anjana Menon / Unsplash' },
    keywords: ['Bengaluru', 'Metro & transport', 'Civic issues'],
    context: { why: 'Evidence that bus lanes help buses without slowing cars undercuts the usual objection.', who: 'Bus riders, drivers and other cities weighing the same idea.', fact: 'A full city bus can carry as many people as 40 to 50 cars.' },
    refs: [ref('Bus lane', 'Bus_lane')],
    likes: 1490, shares: 520, comments: [{ name: 'Deepa N.', text: 'Can Pune please copy this.', ago: '1 w' }],
  },
  tf_flm_0109: {
    image: { url: u('photo-1571366657764-16ca342d3284'), alt: 'Crowd on a city street at night', credit: 'Lerone Pieters / Unsplash' },
    keywords: ['Marathi cinema', 'Films', 'Pune'],
    context: { why: 'Audience-first promotion can beat a marketing budget for small regional films.', who: 'Independent filmmakers, cinema owners and Marathi audiences.', fact: '91% occupancy means almost every seat in every show was sold.' },
    refs: [ref('Marathi cinema', 'Marathi_cinema')],
    likes: 2380, shares: 900, comments: [{ name: 'Sneha L.', text: 'Saw it twice. The tea-stall scene!', ago: '1 w' }],
  },
}

/** Fallback metadata for pieces published live in the prototype. */
export function metaFor(id: string, category: Category, topics: string[]): WorkMeta {
  return META[id] || {
    image: id.startsWith('tf_saf') ? PHOTOS.assembly : id.startsWith('tf_mer') ? PHOTOS.tractor : PHOTOS.category[category],
    keywords: topics.length ? topics : [category],
    context: { why: 'Fresh, original reporting that others are only starting to pick up.', who: 'Readers who follow this topic, and people affected by it.', fact: 'Pieces like this are worth most to readers and AI systems in their first 36 hours.' },
    refs: [], likes: 0, shares: 0, comments: [],
  }
}

export interface CommunityPost {
  id: string
  author: string
  hue: number
  tag: 'Question' | 'Discussion' | 'Shared news' | 'Tip'
  title: string
  body: string
  workId?: string
  votes: number
  ts: string
  replies: { author: string; text: string; ts: string }[]
}

export const COMMUNITY: CommunityPost[] = [
  { id: 'cp1', author: 'Sourav D.', hue: 200, tag: 'Shared news', title: 'Indonesia lost at home. Does India actually have a route to the next round now?', body: 'Sharing Aditya’s piece. If I read the table right, two wins in March and one Indonesia slip-up and we are second?', workId: 'tf_idn_0101', votes: 86, ts: '2026-11-24T23:10:00+05:30', replies: [{ author: 'Arjun K.', text: 'Goal difference matters too. We need to win big at home.', ts: '2026-11-24T23:30:00+05:30' }, { author: 'Leena F.', text: 'The under-23 camp in Goa makes more sense now.', ts: '2026-11-25T00:05:00+05:30' }] },
  { id: 'cp2', author: 'Priya S.', hue: 20, tag: 'Question', title: 'How can I tell if a story was written by AI?', body: 'Is the “AI-assisted” badge something the writer chooses? What stops someone lying?', votes: 54, ts: '2026-11-24T18:00:00+05:30', replies: [{ author: 'Twofold team', text: 'Writers declare it and it’s sealed with the text, so it can’t be changed quietly. Undisclosed AI writing is its own report category; upheld reports hit the writer’s reputation.', ts: '2026-11-24T18:20:00+05:30' }] },
  { id: 'cp3', author: 'Harsh V.', hue: 120, tag: 'Discussion', title: 'Is ₹17 fair for a scoop like the Voltaris memo?', body: 'I paid. It moved the stock 4% the next day. Feels cheap honestly.', workId: 'tf_vlt_0001', votes: 41, ts: '2026-11-23T10:00:00+05:30', replies: [{ author: 'Kunal M.', text: 'Price went up to ₹26 after it went viral, so the market agrees with you.', ts: '2026-11-23T12:00:00+05:30' }] },
  { id: 'cp4', author: 'Dr. S. Kale', hue: 280, tag: 'Discussion', title: 'Would you pay for raw village-well data?', body: 'For crop insurance the monthly groundwater set is gold. Curious what others in agri-risk think about the licence price.', workId: 'tf_gw_0004', votes: 29, ts: '2026-11-22T09:00:00+05:30', replies: [] },
  { id: 'cp5', author: 'Deepa N.', hue: 330, tag: 'Tip', title: 'Follow keywords, not sections', body: 'I follow “Metro & transport” and “Civic issues” instead of “Cities”, and my feed got much better.', votes: 67, ts: '2026-11-21T19:00:00+05:30', replies: [] },
  { id: 'cp6', author: 'Ananya G.', hue: 40, tag: 'Discussion', title: 'AI cites us but rarely pays. Rohan’s study has numbers', body: 'Fewer than one in five citations paid. What would a fair per-answer price be?', workId: 'tf_aip_0105', votes: 112, ts: '2026-11-20T14:00:00+05:30', replies: [{ author: 'Riya Deshpande', text: 'I set ₹2 per answer on scoops. It adds up when FinPilot quotes you 500 times a day.', ts: '2026-11-20T15:00:00+05:30' }] },
]

export interface Instrument { sym: string; name: string; price: number; vol: number; unit?: string }
export const INSTRUMENTS: Instrument[] = [
  { sym: 'TF50', name: 'Twofold 50 index', price: 21480, vol: 0.0009 },
  { sym: 'VLTC', name: 'Voltaris Cells', price: 612, vol: 0.004 },
  { sym: 'SAFM', name: 'Saffron Motors', price: 1284, vol: 0.003 },
  { sym: 'MRDB', name: 'Meridian Bank', price: 418, vol: 0.0025 },
  { sym: 'ANLT', name: 'Andes Litio', price: 2140, vol: 0.004 },
  { sym: 'LI2CO3', name: 'Lithium carbonate', price: 1120, vol: 0.003, unit: '/kg' },
  { sym: 'GOLD', name: 'Gold', price: 76840, vol: 0.0012, unit: '/10g' },
]
