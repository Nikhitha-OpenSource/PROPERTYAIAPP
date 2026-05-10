// ── Mock Data for Propiq AI (No backend required) ─────────────────────────

const mkProp = (o: Record<string, unknown>): any => ({
  bathrooms: (o as any).bhk ? Number((o as any).bhk) : 1,
  parking: (o as any).listing_type === 'LAND' ? 'NONE' : 'COVERED',
  floor: (o as any).listing_type === 'LAND' ? 'G' : Math.floor(Math.random() * 8 + 1),
  total_floors: (o as any).listing_type === 'LAND' ? 'G' : 14,
  facing: ['East','West','North','South'][Math.floor(Math.random()*4)],
  address: `${(o as any).locality}, Hyderabad, Telangana`,
  ...o,
});

export const MOCK_PROPERTIES: any[] = [
  mkProp({ property_id:'prop-001', title:'Spacious 3BHK in Kondapur', locality:'Kondapur', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:3, area_sqft:1650, price:8500000, price_per_sqft:5151, furnishing:'SEMI', age_years:4, amenity_count:8, verified:true, latitude:17.4590, longitude:78.3534, description:'Premium 3BHK with excellent connectivity to HITEC City. Clubhouse, gym, and swimming pool.', images:[] }),
  mkProp({ property_id:'prop-002', title:'2BHK Apartment in Gachibowli', locality:'Gachibowli', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:2, area_sqft:1100, price:5500000, price_per_sqft:5000, furnishing:'FURNISHED', age_years:2, amenity_count:6, verified:true, latitude:17.4401, longitude:78.3489, description:'Fully furnished 2BHK near financial district. Modern amenities, 24/7 security.', images:[] }),
  mkProp({ property_id:'prop-003', title:'4BHK Villa in Jubilee Hills', locality:'Jubilee Hills', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:4, area_sqft:3200, price:25000000, price_per_sqft:7812, furnishing:'FURNISHED', age_years:1, amenity_count:12, verified:true, latitude:17.4256, longitude:78.4096, description:'Luxurious 4BHK villa with private garden in Jubilee Hills. Best schools and hospitals nearby.', images:[] }),
  mkProp({ property_id:'prop-004', title:'Commercial Office Space HITEC City', locality:'HITEC City', city:'Hyderabad', listing_type:'COMMERCIAL', bhk:0, area_sqft:5000, price:45000000, price_per_sqft:9000, furnishing:'SEMI', age_years:3, amenity_count:10, verified:true, latitude:17.4477, longitude:78.3763, description:'Grade-A commercial office space in HITEC City. Ideal for IT companies. Ample parking.', images:[] }),
  mkProp({ property_id:'prop-005', title:'1BHK Studio Apartment Madhapur', locality:'Madhapur', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:1, area_sqft:620, price:3200000, price_per_sqft:5161, furnishing:'FURNISHED', age_years:5, amenity_count:4, verified:false, latitude:17.4504, longitude:78.3908, description:'Cozy 1BHK studio in Madhapur, walking distance from Cyber Towers.', images:[] }),
  mkProp({ property_id:'prop-006', title:'Residential Plot in Miyapur', locality:'Miyapur', city:'Hyderabad', listing_type:'LAND', bhk:0, area_sqft:2400, price:7200000, price_per_sqft:3000, furnishing:'UNFURNISHED', age_years:0, amenity_count:2, verified:true, latitude:17.4961, longitude:78.3390, description:'HMDA-approved residential plot in Miyapur, near metro station. Clear title.', images:[] }),
  mkProp({ property_id:'prop-007', title:'3BHK Flat in Banjara Hills', locality:'Banjara Hills', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:3, area_sqft:1850, price:14500000, price_per_sqft:7837, furnishing:'SEMI', age_years:6, amenity_count:9, verified:true, latitude:17.4150, longitude:78.4347, description:'Premium 3BHK in Road No. 12, Banjara Hills. Near Apollo hospital and upscale malls.', images:[] }),
  mkProp({ property_id:'prop-008', title:'2BHK in KPHB Colony', locality:'KPHB', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:2, area_sqft:1050, price:4800000, price_per_sqft:4571, furnishing:'UNFURNISHED', age_years:10, amenity_count:3, verified:false, latitude:17.4932, longitude:78.3941, description:'Affordable 2BHK in KPHB Phase 1, well-connected to Kukatpally metro.', images:[] }),
  mkProp({ property_id:'prop-009', title:'Commercial Shop in Kukatpally', locality:'Kukatpally', city:'Hyderabad', listing_type:'COMMERCIAL', bhk:0, area_sqft:800, price:6500000, price_per_sqft:8125, furnishing:'UNFURNISHED', age_years:7, amenity_count:2, verified:true, latitude:17.4940, longitude:78.4060, description:'Prime commercial shop on main road in Kukatpally. High footfall area.', images:[] }),
  mkProp({ property_id:'prop-010', title:'3BHK in Manikonda', locality:'Manikonda', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:3, area_sqft:1450, price:7200000, price_per_sqft:4965, furnishing:'SEMI', age_years:3, amenity_count:7, verified:true, latitude:17.3988, longitude:78.3891, description:'Well-planned 3BHK in Manikonda, near DLF Cyber City. Affordable and spacious.', images:[] }),
  mkProp({ property_id:'prop-011', title:'2BHK Apartment in Uppal', locality:'Uppal', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:2, area_sqft:980, price:3800000, price_per_sqft:3877, furnishing:'UNFURNISHED', age_years:8, amenity_count:3, verified:false, latitude:17.4017, longitude:78.5601, description:'Budget-friendly 2BHK in Uppal, near Ramoji Film City road. Ready to move.', images:[] }),
  mkProp({ property_id:'prop-012', title:'4BHK Penthouse Secunderabad', locality:'Secunderabad', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:4, area_sqft:2800, price:19000000, price_per_sqft:6785, furnishing:'FURNISHED', age_years:2, amenity_count:14, verified:true, latitude:17.4399, longitude:78.4983, description:'Exclusive penthouse in Secunderabad with city skyline views. Rooftop terrace and private lift.', images:[] }),
  mkProp({ property_id:'prop-013', title:'3BHK in Kondapur (New)', locality:'Kondapur', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:3, area_sqft:1700, price:9200000, price_per_sqft:5411, furnishing:'SEMI', age_years:1, amenity_count:9, verified:true, latitude:17.4610, longitude:78.3555, description:'Brand new 3BHK with premium fittings. Gated community, 24/7 CCTV.', images:[] }),
  mkProp({ property_id:'prop-014', title:'Office Complex Gachibowli', locality:'Gachibowli', city:'Hyderabad', listing_type:'COMMERCIAL', bhk:0, area_sqft:8000, price:72000000, price_per_sqft:9000, furnishing:'SEMI', age_years:4, amenity_count:11, verified:true, latitude:17.4430, longitude:78.3510, description:'Multi-floor office complex near Gachibowli stadium. Excellent infrastructure.', images:[] }),
  mkProp({ property_id:'prop-015', title:'1BHK Compact Home Madhapur', locality:'Madhapur', city:'Hyderabad', listing_type:'RESIDENTIAL', bhk:1, area_sqft:580, price:2900000, price_per_sqft:5000, furnishing:'FURNISHED', age_years:3, amenity_count:5, verified:true, latitude:17.4480, longitude:78.3900, description:'Smart 1BHK ideal for IT professionals. Walking to Mindspace tech park.', images:[] }),
  mkProp({ property_id:'prop-016', title:'Agricultural Land Miyapur', locality:'Miyapur', city:'Hyderabad', listing_type:'LAND', bhk:0, area_sqft:4800, price:9600000, price_per_sqft:2000, furnishing:'UNFURNISHED', age_years:0, amenity_count:0, verified:false, latitude:17.5000, longitude:78.3360, description:'Agricultural land with road access, suitable for residential conversion.', images:[] }),
  mkProp({ property_id:'prop-017', title:'Residential Plot in Tellapur', locality:'Tellapur', city:'Hyderabad', listing_type:'LAND', land_use_zone:'RESIDENTIAL', bhk:0, bathrooms:0, floor:'G', total_floors:'G', area_sqft:2400, price:9800000, price_per_sqft:4083, furnishing:'UNFURNISHED', parking:'NONE', age_years:0, amenity_count:3, verified:true, latitude:17.4715, longitude:78.2948, description:'HMDA-approved residential plot in Tellapur with 40 ft road access, clear title, and gated layout development nearby.', images:[] }),
  mkProp({ property_id:'prop-018', title:'Residential Plot in Shadnagar', locality:'Shadnagar', city:'Hyderabad', listing_type:'LAND', land_use_zone:'RESIDENTIAL', bhk:0, bathrooms:0, floor:'G', total_floors:'G', area_sqft:2400, price:4200000, price_per_sqft:1750, furnishing:'UNFURNISHED', parking:'NONE', age_years:0, amenity_count:3, verified:true, latitude:17.0701, longitude:78.2045, description:'DTCP-approved residential plot near Shadnagar growth corridor, suitable for independent house construction or long-term investment.', images:[] }),
  mkProp({ property_id:'prop-019', title:'Commercial Plot in Financial District', locality:'Financial District', city:'Hyderabad', listing_type:'COMMERCIAL', land_use_zone:'COMMERCIAL', bhk:0, bathrooms:0, floor:0, total_floors:0, area_sqft:4800, price:65000000, price_per_sqft:13542, furnishing:'UNFURNISHED', parking:'NONE', age_years:0, amenity_count:3, verified:true, latitude:17.4227, longitude:78.3446, description:'Prime commercial plot near Financial District with wide road frontage, high FSI potential, and strong office redevelopment demand.', images:[] }),
  mkProp({ property_id:'prop-020', title:'Commercial Plot in Kompally', locality:'Kompally', city:'Hyderabad', listing_type:'COMMERCIAL', land_use_zone:'COMMERCIAL', bhk:0, bathrooms:0, floor:0, total_floors:0, area_sqft:3600, price:28500000, price_per_sqft:7917, furnishing:'UNFURNISHED', parking:'NONE', age_years:0, amenity_count:3, verified:true, latitude:17.5433, longitude:78.4788, description:'Road-facing commercial plot in Kompally, suitable for showroom, clinic, retail outlet, or mixed-use development.', images:[] }),
];

export const MOCK_PROPERTY_DETAIL = (id: string) => {
  const base = MOCK_PROPERTIES.find(p => p.property_id === id) || MOCK_PROPERTIES[0];
  return {
    ...base,
    amenities: ['Swimming Pool','Gym','Clubhouse','24/7 Security','Power Backup','Children Play Area','Covered Parking','Lift'],
    owner: { name: 'Rajesh Kumar', verified: true, phone: '+91-98765-43210' },
    price_history: [
      { month: 'Jan 24', avg_price_per_sqft: Math.round(base.price_per_sqft * 0.86) },
      { month: 'Mar 24', avg_price_per_sqft: Math.round(base.price_per_sqft * 0.89) },
      { month: 'May 24', avg_price_per_sqft: Math.round(base.price_per_sqft * 0.91) },
      { month: 'Jul 24', avg_price_per_sqft: Math.round(base.price_per_sqft * 0.94) },
      { month: 'Sep 24', avg_price_per_sqft: Math.round(base.price_per_sqft * 0.97) },
      { month: 'Nov 24', avg_price_per_sqft: base.price_per_sqft },
    ],
    nearby: [
      { name: 'Metro Station', distance_m: 450, category: 'Transit', rating: 4.5 },
      { name: 'Apollo Pharmacy', distance_m: 220, category: 'Medical', rating: 4.2 },
      { name: 'D-Mart', distance_m: 680, category: 'Grocery', rating: 4.1 },
      { name: 'City School', distance_m: 950, category: 'Education', rating: 4.6 },
      { name: 'Starbucks', distance_m: 380, category: 'Dining', rating: 4.3 },
    ],
  };
};

export const MOCK_GEOJSON = {
  type: 'FeatureCollection',
  features: MOCK_PROPERTIES.map(p => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
    properties: { id: p.property_id, title: p.title, price: p.price, bhk: p.bhk, area_sqft: p.area_sqft, locality: p.locality, verified: p.verified, type: p.listing_type },
  })),
};

// ── Analytics ──────────────────────────────────────────────────────────────
const MONTHS = ['Jan 24','Feb 24','Mar 24','Apr 24','May 24','Jun 24','Jul 24','Aug 24','Sep 24','Oct 24','Nov 24','Dec 24'];
const genTrend = (base: number) => MONTHS.map((month, i) => ({ month, avg_price_per_sqft: Math.round(base + i * (base * 0.008) + (Math.random() - 0.5) * 200) }));

export const MOCK_MARKET_TRENDS = {
  trends: {
    Kondapur: genTrend(5100),
    Gachibowli: genTrend(4900),
    Madhapur: genTrend(5200),
    'HITEC City': genTrend(8800),
    'Banjara Hills': genTrend(7600),
    'Jubilee Hills': genTrend(8100),
  },
};

export const MOCK_TOP_LOCALITIES = {
  localities: [
    { locality:'HITEC City', overall_score:92, avg_price_per_sqft:9000, appreciation_1yr:11.2 },
    { locality:'Gachibowli', overall_score:89, avg_price_per_sqft:5000, appreciation_1yr:9.8 },
    { locality:'Banjara Hills', overall_score:88, avg_price_per_sqft:7800, appreciation_1yr:8.5 },
    { locality:'Kondapur', overall_score:86, avg_price_per_sqft:5200, appreciation_1yr:8.9 },
    { locality:'Jubilee Hills', overall_score:85, avg_price_per_sqft:8100, appreciation_1yr:7.6 },
    { locality:'Madhapur', overall_score:83, avg_price_per_sqft:5100, appreciation_1yr:9.1 },
    { locality:'Manikonda', overall_score:72, avg_price_per_sqft:4900, appreciation_1yr:7.2 },
    { locality:'Kukatpally', overall_score:68, avg_price_per_sqft:4600, appreciation_1yr:6.8 },
  ],
};

export const MOCK_COMMERCIAL_ZONES = {
  zones: [
    { zone:'HITEC City IT Hub', fsi:3.5, score:95, road_width:45, status:'Prime' },
    { zone:'Gachibowli Financial', fsi:3.0, score:91, road_width:40, status:'Prime' },
    { zone:'Banjara Hills Rd12', fsi:2.5, score:88, road_width:30, status:'Prime' },
    { zone:'Kukatpally KPHB', fsi:2.0, score:74, road_width:24, status:'Good' },
    { zone:'Uppal Industrial', fsi:2.5, score:65, road_width:20, status:'Good' },
    { zone:'Miyapur Outer Ring', fsi:2.0, score:58, road_width:18, status:'Emerging' },
  ],
};

export const MOCK_HEATMAP = {
  type: 'FeatureCollection',
  features: [
    { properties:{ locality:'HITEC City', price_per_sqft:9000, intensity:0.95 } },
    { properties:{ locality:'Jubilee Hills', price_per_sqft:8100, intensity:0.88 } },
    { properties:{ locality:'Banjara Hills', price_per_sqft:7800, intensity:0.84 } },
    { properties:{ locality:'Gachibowli', price_per_sqft:5000, intensity:0.62 } },
    { properties:{ locality:'Kondapur', price_per_sqft:5200, intensity:0.65 } },
    { properties:{ locality:'Madhapur', price_per_sqft:5100, intensity:0.63 } },
    { properties:{ locality:'Manikonda', price_per_sqft:4900, intensity:0.58 } },
    { properties:{ locality:'Kukatpally', price_per_sqft:4600, intensity:0.52 } },
    { properties:{ locality:'KPHB', price_per_sqft:4500, intensity:0.50 } },
    { properties:{ locality:'Miyapur', price_per_sqft:3000, intensity:0.35 } },
    { properties:{ locality:'Uppal', price_per_sqft:3800, intensity:0.42 } },
    { properties:{ locality:'Secunderabad', price_per_sqft:6800, intensity:0.75 } },
  ],
};

// ── Predict ────────────────────────────────────────────────────────────────
export const MOCK_PRICE_PREDICTION = (form: { locality: string; area_sqft: number; bhk: number; age_years: number; furnishing: string }) => {
  const basePrices: Record<string,number> = { Kondapur:5200, Gachibowli:5000, Madhapur:5100, 'HITEC City':9000, Miyapur:3000, KPHB:4500, 'Banjara Hills':7800, 'Jubilee Hills':8100, Manikonda:4900, Kukatpally:4600, Uppal:3800, Secunderabad:6800 };
  const base = basePrices[form.locality] || 5000;
  const furnMult = form.furnishing === 'FURNISHED' ? 1.12 : form.furnishing === 'SEMI' ? 1.05 : 1.0;
  const ageMult = Math.max(0.75, 1 - form.age_years * 0.02);
  const bhkMult = 1 + (form.bhk - 2) * 0.03;
  const ppsf = Math.round(base * furnMult * ageMult * bhkMult);
  const total = ppsf * form.area_sqft;
  return { predicted_price: total, predicted_price_per_sqft: ppsf, confidence_low: Math.round(total * 0.92), confidence_high: Math.round(total * 1.08), model_version: 'PropiqML-v2.1', locality: form.locality };
};

export const MOCK_COMMERCIAL_SCORE = (form: { land_use_zone: string; fsi_allowed: number; road_width: number; area_sqft: number }) => {
  const zoneMult: Record<string,number> = { COMMERCIAL:1.0, MIXED:0.88, RESIDENTIAL:0.65, INDUSTRIAL:0.78 };
  const score = Math.min(99, Math.round(((form.fsi_allowed / 6) * 35 + (form.road_width / 60) * 30 + (zoneMult[form.land_use_zone] || 0.8) * 35)));
  const label = score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
  return { score, label, top_factors: ['High FSI ratio allows multi-floor development','Good road width improves accessibility','Strategic land use zone','Proximity to commercial hub','Strong investor demand in area'], nearby_business_count: Math.round(score * 1.2) };
};

export const MOCK_APPRECIATION = (form: { locality: string; current_price_per_sqft: number }) => {
  const rates: Record<string,{y1:number;y3:number;y5:number}> = {
    Kondapur:{y1:8.9,y3:28.5,y5:52.1}, Gachibowli:{y1:9.8,y3:31.2,y5:58.4}, Madhapur:{y1:9.1,y3:29.3,y5:54.7},
    'HITEC City':{y1:11.2,y3:37.8,y5:68.2}, 'Banjara Hills':{y1:8.5,y3:26.8,y5:49.3}, 'Jubilee Hills':{y1:7.6,y3:24.1,y5:44.5},
    Manikonda:{y1:7.2,y3:22.8,y5:41.6}, Kukatpally:{y1:6.8,y3:21.4,y5:39.0}, KPHB:{y1:6.5,y3:20.8,y5:37.5},
    Miyapur:{y1:7.8,y3:25.0,y5:46.2}, Uppal:{y1:6.2,y3:19.5,y5:35.8}, Secunderabad:{y1:7.5,y3:24.0,y5:44.0},
  };
  const r = rates[form.locality] || {y1:8,y3:26,y5:48};
  const cur = form.current_price_per_sqft;
  return {
    locality: form.locality, current_price_per_sqft: cur,
    forecasts: {
      '1yr': { projected_price_per_sqft: Math.round(cur*(1+r.y1/100)), appreciation_pct: r.y1, annual_rate_pct: r.y1, confidence:'HIGH' },
      '3yr': { projected_price_per_sqft: Math.round(cur*(1+r.y3/100)), appreciation_pct: r.y3, annual_rate_pct: +(r.y3/3).toFixed(1), confidence:'HIGH' },
      '5yr': { projected_price_per_sqft: Math.round(cur*(1+r.y5/100)), appreciation_pct: r.y5, annual_rate_pct: +(r.y5/5).toFixed(1), confidence:'MEDIUM' },
    },
  };
};

// ── Agent / Chat ────────────────────────────────────────────────────────────
const AGENT_RESPONSES: { pattern: RegExp; reply: string; gui?: { command: string; params: Record<string,unknown> } }[] = [
  { pattern: /kondapur|3bhk.*kondapur|kondapur.*3bhk/i, reply:'🏠 I found 2 great 3BHK apartments in Kondapur:\n\n• **Spacious 3BHK** — ₹85L, 1,650 sqft, semi-furnished\n• **3BHK in Kondapur (New)** — ₹92L, 1,700 sqft, brand new\n\nBoth are in gated communities with top amenities. Want me to filter the list?', gui:{ command:'APPLY_FILTER', params:{ locality:'Kondapur', bhk:'3' } } },
  { pattern: /commercial.*score|score.*commercial|kphb.*plot/i, reply:'🏢 For a KPHB commercial plot, our AI model gives:\n\n• **Score: 74/100** (GOOD viability)\n• Road width 24m — good accessibility\n• FSI 2.0 — standard commercial\n\nHead to **AI Intelligence → Commercial Score** tab and enter your plot details for a full analysis!' },
  { pattern: /deed|transfer|legal/i, reply:'📄 Deed transfer in Telangana typically takes **21–45 days**. Our AI estimates:\n\n• P(<30 days): 38%\n• P(30–60 days): 52%\n• P(>60 days): 10%\n\nKey steps: Document upload → OCR → Name verification → Legal check → Registration. Use the **Deed Verification** page to track progress.' },
  { pattern: /invest|best.*localit|top.*area/i, reply:'📈 Top investment localities in Hyderabad 2024:\n\n1. **HITEC City** — 11.2% YoY, score 92/100\n2. **Gachibowli** — 9.8% YoY, score 89/100\n3. **Kondapur** — 8.9% YoY, score 86/100\n4. **Madhapur** — 9.1% YoY, score 83/100\n\nAll are IT corridor localities with strong rental demand. Check the **Analytics** page for full market data!' },
  { pattern: /price|predict|valuation/i, reply:'🤖 Our ML model (PropiqML-v2.1) can predict property prices with ±8% confidence. Go to **AI Intelligence → Price Prediction** and enter your property details — locality, area, BHK, age, and furnishing.' },
  { pattern: /stamp.*duty|registration.*fee/i, reply:'🏛️ Stamp duty rates in Telangana:\n\n• Stamp Duty: **4%** of property value\n• Registration Fee: **0.5%**\n• Transfer Duty: **1.5%**\n• Total: **~6%**\n\nFor a ₹50L property, total charges ≈ ₹3L. Use the **Deed → Stamp Duty Calculator** for exact amounts!' },
  { pattern: /rera/i, reply:'📋 RERA ensures builder accountability. All new projects must be registered. Use the **Deed → RERA Check** tab to verify any project by registration number. Telangana RERA portal: rera.telangana.gov.in' },
  { pattern: /hi|hello|hey/i, reply:'👋 Hello! I\'m PropBot, your PROPIQ AI real estate assistant. I can help you:\n\n• 🏠 Find properties\n• 💰 Predict prices\n• 📈 Analyze markets\n• 📄 Verify deeds & RERA\n\nWhat would you like to explore today?' },
];

export const MOCK_AGENT_CHAT = (message: string, sessionId?: string) => {
  const match = AGENT_RESPONSES.find(r => r.pattern.test(message));
  const reply = match?.reply || `Thanks for your question about "${message}"! 🤖\n\nAs PropBot, I can help with property searches, price predictions, market analytics, and legal document verification.\n\nTry asking:\n• "Best localities for investment"\n• "3BHK in Kondapur under 80L"\n• "Stamp duty calculator"`;
  const lower = message.toLowerCase();
  const navigation_links = lower.includes('rera') || lower.includes('deed') || lower.includes('stamp')
    ? [
        { label: 'Open deed tools', path: '/deeds', description: 'RERA, stamp duty, and document workflow.' },
        { label: 'Browse properties', path: '/properties', description: 'Return to listings after legal checks.' },
      ]
    : lower.includes('invest') || lower.includes('localit')
      ? [
          { label: 'View analytics', path: '/analytics', description: 'Market trends and locality rankings.' },
          { label: 'Browse properties', path: '/properties', description: 'Inspect listings in top areas.' },
        ]
      : [
          { label: 'Browse properties', path: '/properties', description: 'Search by budget, BHK, and locality.' },
          { label: 'Run AI valuation', path: '/predict/commercial', description: 'Predict price or commercial score.' },
        ];
  return {
    reply,
    session_id: sessionId || 'mock-session-001',
    gui_commands: match?.gui ? [match.gui] : [],
    navigation_links,
  };
};

// ── Deed ────────────────────────────────────────────────────────────────────
export const MOCK_DEED_STATUS = (parcelId: string) => ({
  parcel_id: parcelId,
  stage: 'NAME_VERIFY',
  declared_name: 'Rajesh Kumar',
  extracted_name: 'Rajesh Kumar',
  name_match_score: 0.97,
  notes: 'Documents verified. Name match successful. Proceeding to legal check.',
  updated_at: new Date().toISOString(),
});

export const MOCK_DEED_TIMELINE = () => ({
  estimated_days: 28,
  probability_lt_30: 0.62,
  probability_30_60: 0.33,
  probability_gt_60: 0.05,
  stages: ['UPLOAD','OCR_EXTRACTION','NAME_VERIFY','LEGAL_CHECK','APPROVED'],
});

export const MOCK_STAMP_DUTY = (state: string, value: number) => {
  const rates: Record<string,{stamp:number;reg:number;transfer:number}> = {
    Telangana:   { stamp:0.04, reg:0.005, transfer:0.015 },
    Maharashtra: { stamp:0.05, reg:0.01,  transfer:0.01  },
    Karnataka:   { stamp:0.056, reg:0.01, transfer:0.005 },
    'Tamil Nadu':{ stamp:0.07, reg:0.01,  transfer:0.005 },
  };
  const r = rates[state] || rates['Telangana'];
  return {
    state, property_value: value,
    stamp_duty: Math.round(value * r.stamp),
    registration_fee: Math.round(value * r.reg),
    transfer_duty: Math.round(value * r.transfer),
    total_charges: Math.round(value * (r.stamp + r.reg + r.transfer)),
    effective_rate_pct: +((r.stamp + r.reg + r.transfer) * 100).toFixed(1),
  };
};

export const MOCK_RERA = (no: string) => ({
  rera_number: no.toUpperCase(),
  status: 'MANUAL_VERIFICATION_REQUIRED',
  is_registered: null,
  project_name: null,
  promoter: null,
  completion_date: null,
  registered_date: null,
  source: 'Telangana RERA official search portal',
  official_search_url: 'https://rerait.telangana.gov.in/SearchList/Search',
  checked_at: new Date().toISOString(),
  note: 'Open the official TG-RERA search portal and enter this registration number to verify the project.',
});
