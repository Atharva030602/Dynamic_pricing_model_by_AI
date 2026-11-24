// Made-up pieces used as editor samples and seed works. Every person, company,
// product and outlet here is fictional.
import type { Kind } from '../engine/demand'

export interface Sample {
  id: string
  label: string
  hint: string
  creatorId: string
  kind: Kind
  title: string
  dek: string
  body: string
  attachments?: { sourceDocs?: boolean; rawData?: boolean }
}

export const SAMPLES: Sample[] = [
  {
    id: 'draft',
    label: 'Your draft',
    hint: 'Riya’s new exclusive, ready to publish',
    creatorId: 'riya',
    kind: 'article',
    title: 'Meridian Bank freezes new tractor loans in three Marathwada districts',
    dek: 'A branch circular seen by this reporter tells managers to stop sanctioning farm-equipment loans in Beed, Latur and Osmanabad until March.',
    body: `Meridian Bank has told branch managers in Beed, Latur and Osmanabad to stop sanctioning new tractor and farm-equipment loans until 31 March, according to an internal circular seen by this reporter.

The circular, dated 18 November and signed by the bank's zonal credit head, says overdue farm-equipment loans in the three districts reached 14.6% in October, against 6.1% a year earlier. It asks managers to "focus on recovery" and to route any exception to the zonal office.

Three branch officials confirmed they had received the circular this week. "We have 40 tractor applications pending and I have told farmers to wait," one manager in Latur said. They asked not to be named because they are not allowed to speak to the press.

Meridian Bank lent about ₹1,180 crore to farm-equipment buyers in Marathwada last year, its annual report shows, roughly a fifth of its agricultural book. A spokesperson said the bank "continuously calibrates credit in line with risk" and did not comment on the circular.

The freeze comes after the weakest monsoon in the region since 2023. Groundwater readings collected by an independent volunteer network show the pre-monsoon water table in these districts is at its lowest in seven years.

Tractor dealers say the timing hurts. "November to January is when farmers buy, after the kharif harvest," said Sunil Patange, who runs a dealership in Beed. He said three of his customers were turned down on Monday.

The bank's shares fell 2% on Friday. Its next results are due on 22 January.`,
  },
  {
    id: 'scoop',
    label: 'Exclusive news',
    hint: 'Original reporting on a listed company',
    creatorId: 'riya',
    kind: 'article',
    title: 'Voltaris Cells quietly reprices its lithium deal as Atacama delay bites',
    dek: 'An internal memo seen by this reporter shows the Pune battery maker agreed to pay 18% more per tonne — a cost it has not disclosed to shareholders.',
    body: `Voltaris Cells, the Pune-based maker of EV battery packs, agreed on 19 November to pay Andes Litio 18% more per tonne of lithium carbonate for the next two years, according to an internal memo seen by this reporter.

The memo, dated 20 November and circulated to the company's procurement committee, says the revised contract covers 3,400 tonnes a year and adds roughly ₹410 crore to annual raw-material costs. Voltaris has not mentioned the change in any exchange filing, and its last investor call on 6 November described lithium costs as "stable through FY27".

Two people familiar with the negotiations told this reporter that Andes Litio pushed for the increase after a permitting delay at its Atacama brine site cut expected output for 2027 by about a quarter. "We either accepted the new price or went to the spot market in a shortage," one of them said. Both asked not to be named because they are not authorised to speak about the contract.

A Voltaris spokesperson confirmed that the company "regularly reviews supply terms" but declined to comment on the memo or the figures. Andes Litio did not respond to questions sent on Monday.

The timing matters. Voltaris is due to price a ₹2,140 crore share sale in early December, and its draft offer document assumes cell costs fall 6% next year. Kavya Iyer, an analyst at Northgate Securities who covers the sector, said an 18% jump in lithium prices "would wipe out most of that assumed saving on its own". She has not seen the memo.

The memo also shows Voltaris considered a second supplier in Australia but rejected it because qualifying new material for its cells would take nine to twelve months.

This week the company's shares closed at ₹612, down 4% since the investor call. Voltaris says its December share sale remains on schedule.`,
  },
  {
    id: 'dataset',
    label: 'Research dataset',
    hint: 'A rare dataset described for buyers',
    creatorId: 'arjun',
    kind: 'dataset',
    title: 'Marathwada groundwater: 412 wells, monthly readings, 2019–2026',
    dek: 'Seven years of hand-measured water-table depth from village wells across eight districts, cleaned and geotagged.',
    body: `This dataset contains 34,608 monthly readings of groundwater depth from 412 open and bore wells across eight districts of Marathwada, collected between June 2019 and October 2026.

How it was collected. We trained 38 village volunteers to measure depth to water with a calibrated tape on the first Sunday of every month. Each reading was logged on a phone form with a photo of the tape and a GPS fix. I ran spot checks on 10% of wells every quarter; readings that differed from our check by more than 15 cm were re-measured.

What is in it. Each row has: well ID, district, village, latitude and longitude (rounded to 100 m to protect owners), well type, depth to water in metres, date, rainfall in the preceding 30 days from the nearest rain gauge, and a quality flag. There are 1,912 flagged readings (5.5%), kept with their flags rather than deleted.

What it shows. Across the period the median pre-monsoon water table fell from 11.2 m to 14.9 m. The drop is steepest in wells within 2 km of sugarcane belts, about 0.9 m a year against 0.4 m elsewhere. After the weak 2023 monsoon, 61 wells were dry by April 2024 for the first time in our records.

Why it is rare. Official monitoring covers fewer than 30 observation wells in these districts and reports twice a year. Our dataset is monthly, ten times denser, and includes the village wells farmers actually depend on.

Methodology notes, the data dictionary and a 500-row sample are attached. The full dataset is available under licence. Source: field readings by the Jalrekha volunteer network, analysis by Dr Arjun Rao.`,
    attachments: { rawData: true },
  },
  {
    id: 'review',
    label: 'Video review',
    hint: 'A hobbyist’s battery test (video description)',
    creatorId: 'kabir',
    kind: 'video',
    title: 'I drained 7 mid-range phones to zero, three times. Here’s what actually lasts.',
    dek: 'A 14-minute test of real-world battery life, with the full spreadsheet.',
    body: `In this video I test seven mid-range phones priced between ₹18,000 and ₹27,000: the Nimbus 8a, Orra Z5, Pixelon Lite 3, Kairo Neo, Trellis M14, Vanta 5G and Solace Air.

I ran my own loop three times on each phone: 30 minutes of video streaming, 30 minutes of maps navigation with the screen on, 20 minutes of camera use and an hour of social scrolling, repeated until the phone switched off. Brightness was fixed at 200 nits with a light meter, and every phone used the same SIM and Wi-Fi network.

Results: the Kairo Neo lasted longest at 11 hours 42 minutes on average, followed by the Orra Z5 at 10 hours 55 minutes. The Pixelon Lite 3 came last at 7 hours 18 minutes despite having the biggest 5,500 mAh battery, because its modem drains heavily on weak signal. The difference between the best and worst runs on the same phone was never more than 6%, so the ranking is consistent.

I also measured charging: the Vanta 5G went from 5% to 80% in 31 minutes, the fastest here.

Chapters: 0:00 why advertised battery numbers mislead, 2:10 my test loop, 6:45 results, 11:30 charging, 13:10 which one I would buy. The spreadsheet with all 21 runs is linked in the description.`,
  },
  {
    id: 'seo',
    label: 'Padded SEO piece',
    hint: 'Keyword-stuffed and repetitive — watch the estimate push back',
    creatorId: 'riya',
    kind: 'article',
    title: 'Top 10 Best AI Stocks, Crypto, IPO and EV Tips for Budget 2026 You Won’t Believe',
    dek: 'Everything you need to know about AI stocks, crypto, IPOs, EVs, lithium and gold price in 2026.',
    body: `In today's fast-paced world, investing in the stock market can be a great way to grow your wealth over time but it is important to do your research before you invest. AI stocks, crypto, IPO, EV, lithium and gold price are the hottest topics for Budget 2026.

AI stocks are one of the hottest sectors for investors right now. AI stocks are changing the way we live and work. Many experts agree that AI stocks could skyrocket in 2026. AI stocks, AI stocks, AI stocks are the future.

Crypto is also a game-changer. Crypto is a digital currency and crypto could skyrocket in Budget 2026. It is important to note that crypto is volatile. Crypto, IPO and EV stocks are all trending.

IPOs are a great way to grow your wealth over time. IPO, IPO, IPO investors should dive into the IPO landscape of 2026. EV and lithium stocks are also trending because electric vehicles are the future of transportation.

Gold price and interest rates also matter. It is important to note that gold price and interest rates are important. Needless to say, AI stocks, crypto, IPO, EV, lithium and gold price are the top 10 best tips for Budget 2026.

In conclusion, AI stocks, crypto, IPOs and EV stocks could skyrocket. It is important to note that you should do your research before you invest. Stay tuned for more AI stocks, crypto and IPO tips.`,
  },
]
