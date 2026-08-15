/* Sample data for the Tsela Farm Market prototype (no backend). */

window.BW = (function () {
  const LOCATIONS = [
    "Gaborone", "Mogoditshane", "Tlokweng", "Molepolole", "Kanye", "Lobatse",
    "Francistown", "Serowe", "Palapye", "Maun", "Kasane", "Ghanzi", "Selebi-Phikwe", "Tonota"
  ];

  /* Botswana growing calendar (simplified, prototype data) */
  const SEASONS = {
    "hot-wet": {
      key: "hot-wet",
      name: "Hot Wet Season",
      months: "November – March",
      note: "Rain-fed planting window. Heat-tolerant crops and fast leafy greens do best; watch for pests after heavy rain."
    },
    "post-rain": {
      key: "post-rain",
      name: "Post-Rain Harvest",
      months: "April – May",
      note: "Soil moisture is still high and days are mild — the biggest harvest window and the best prices before winter."
    },
    "cool-dry": {
      key: "cool-dry",
      name: "Cool Dry Season",
      months: "June – August",
      note: "Frost risk at night inland. Brassicas, roots and hardy greens thrive with irrigation; supply drops so prices lift."
    },
    "hot-dry": {
      key: "hot-dry",
      name: "Hot Dry Season",
      months: "September – October",
      note: "Highest water cost of the year. Shade netting and drip irrigation keep short-cycle crops viable."
    }
  };

  function seasonForMonth(m) {
    if (m >= 10 || m <= 2) return SEASONS["hot-wet"];   // Nov-Mar
    if (m === 3 || m === 4) return SEASONS["post-rain"]; // Apr-May
    if (m >= 5 && m <= 7) return SEASONS["cool-dry"];    // Jun-Aug
    return SEASONS["hot-dry"];                           // Sep-Oct
  }

  function currentSeason() { return seasonForMonth(new Date().getMonth()); }

  function nextSeason() {
    const d = new Date();
    const cur = currentSeason();
    for (let i = 1; i <= 12; i++) {
      const s = seasonForMonth((d.getMonth() + i) % 12);
      if (s.key !== cur.key) return s;
    }
    return cur;
  }

  /* price = BWP per kg (or per unit where noted) */
  const PRODUCE = [
    { name: "Tomatoes",      emoji: "🍅", unit: "kg",     price: 18.50, trend: "up",   seasons: ["hot-wet", "post-rain"] },
    { name: "Morogo (Wild Spinach)", emoji: "🌿", unit: "bunch", price: 8.00, trend: "up", seasons: ["hot-wet", "post-rain"] },
    { name: "Green Maize",   emoji: "🌽", unit: "cob",    price: 6.00,  trend: "flat", seasons: ["hot-wet", "post-rain"] },
    { name: "Watermelon",    emoji: "🍉", unit: "each",   price: 35.00, trend: "down", seasons: ["hot-wet"] },
    { name: "Green Beans",   emoji: "🫘", unit: "kg",     price: 26.00, trend: "up",   seasons: ["hot-wet", "post-rain"] },
    { name: "Butternut",     emoji: "🎃", unit: "kg",     price: 12.00, trend: "flat", seasons: ["post-rain", "cool-dry"] },
    { name: "Cabbage",       emoji: "🥬", unit: "head",   price: 22.00, trend: "up",   seasons: ["cool-dry", "post-rain"] },
    { name: "Spinach",       emoji: "🥬", unit: "bunch",  price: 10.00, trend: "flat", seasons: ["cool-dry", "post-rain", "hot-dry"] },
    { name: "Beetroot",      emoji: "🫜", unit: "kg",     price: 16.00, trend: "up",   seasons: ["cool-dry"] },
    { name: "Carrots",       emoji: "🥕", unit: "kg",     price: 15.00, trend: "flat", seasons: ["cool-dry"] },
    { name: "Onions",        emoji: "🧅", unit: "kg",     price: 14.00, trend: "up",   seasons: ["cool-dry", "hot-dry"] },
    { name: "Rape (Leafy)",  emoji: "🌱", unit: "bunch",  price: 9.00,  trend: "flat", seasons: ["cool-dry", "hot-dry"] },
    { name: "Green Pepper",  emoji: "🫑", unit: "kg",     price: 28.00, trend: "up",   seasons: ["hot-dry", "hot-wet"] },
    { name: "Chillies",      emoji: "🌶️", unit: "kg",    price: 42.00, trend: "up",   seasons: ["hot-dry", "hot-wet"] },
    { name: "Sweet Potato",  emoji: "🍠", unit: "kg",     price: 17.00, trend: "flat", seasons: ["hot-dry", "post-rain"] },
    { name: "Groundnuts",    emoji: "🥜", unit: "kg",     price: 38.00, trend: "up",   seasons: ["post-rain", "cool-dry"] }
  ];

  function produceFor(seasonKey) {
    return PRODUCE.filter(p => p.seasons.includes(seasonKey));
  }

  const WALLETS = {
    orange: { id: "orange", name: "Orange Money", cls: "orange", fee: 0.012 },
    smega:  { id: "smega",  name: "Smega",        cls: "smega",  fee: 0.010 },
    myzaka: { id: "myzaka", name: "MyZaka",       cls: "myzaka", fee: 0.011 }
  };

  const STALLS = [
    {
      id: "s1", name: "Mmapula Fresh Produce", owner: "Mmapula Kgosi",
      location: "Gaborone", area: "Block 8, near Riverwalk",
      img: "/images/stall-1.jpg",
      blurb: "Family plot in Notwane growing tomatoes, morogo and green maize. Fresh cut every morning at 05:00.",
      items: ["Tomatoes", "Morogo (Wild Spinach)", "Green Maize", "Spinach"],
      wallets: { orange: "76 214 889", smega: "71 903 447", myzaka: "" },
      rating: 4.8, delivery: "Free delivery within 10 km"
    },
    {
      id: "s2", name: "Tlokweng Green Gardens", owner: "Kabelo Seretse",
      location: "Tlokweng", area: "Plot 4412, Tlokweng Road",
      img: "/images/stall-2.jpg",
      blurb: "Drip-irrigated market garden. Cabbage, rape and beetroot all winter, chillies through the dry season.",
      items: ["Cabbage", "Rape (Leafy)", "Beetroot", "Chillies"],
      wallets: { orange: "77 552 130", smega: "", myzaka: "74 118 902" },
      rating: 4.6, delivery: "Collect at stall or Gaborone drop-off Fridays"
    },
    {
      id: "s3", name: "Serowe Root Co-op", owner: "Neo Baitshepi",
      location: "Serowe", area: "Main Kgotla road",
      img: "/images/produce-1.jpg",
      blurb: "Eight-farmer co-operative supplying butternut, sweet potato and carrots in bulk crates.",
      items: ["Butternut", "Sweet Potato", "Carrots", "Onions"],
      wallets: { orange: "", smega: "72 447 018", myzaka: "75 220 664" },
      rating: 4.9, delivery: "Bulk crates, transport arranged to Palapye & Gaborone"
    },
    {
      id: "s4", name: "Maun Riverside Veg", owner: "Onalenna Dintwe",
      location: "Maun", area: "Boseja ward, riverside plots",
      img: "/images/hero.jpg",
      blurb: "Thamalakane river plots. Green beans, peppers and salad greens for lodges and households.",
      items: ["Green Beans", "Green Pepper", "Spinach", "Tomatoes"],
      wallets: { orange: "76 880 145", smega: "71 336 209", myzaka: "74 002 771" },
      rating: 4.7, delivery: "Lodge deliveries Tue & Sat"
    },
    {
      id: "s5", name: "Kanye Hillside Farm", owner: "Tebogo Molefe",
      location: "Kanye", area: "Ntsweng, off the A2",
      img: "/images/stall-2.jpg",
      blurb: "Winter brassicas and groundnuts, plus watermelon over the rains. Sells by crate or by kilo.",
      items: ["Cabbage", "Groundnuts", "Watermelon", "Carrots"],
      wallets: { orange: "76 771 553", smega: "", myzaka: "" },
      rating: 4.4, delivery: "Collection only"
    },
    {
      id: "s6", name: "Francistown Urban Greens", owner: "Lesego Phiri",
      location: "Francistown", area: "Tati River industrial edge",
      img: "/images/produce-1.jpg",
      blurb: "Shade-net tunnels producing leafy greens year round, even through the hot dry months.",
      items: ["Spinach", "Rape (Leafy)", "Green Pepper", "Onions"],
      wallets: { orange: "", smega: "71 664 200", myzaka: "74 559 813" },
      rating: 4.5, delivery: "Same-day delivery in Francistown"
    }
  ];

  const TXNS = [
    { title: "Order #TFM-2291 · 12 kg tomatoes", wallet: "Orange Money", dir: "in", amount: 222.0, when: "Today, 07:42" },
    { title: "Order #TFM-2288 · 8 bunches morogo", wallet: "MyZaka", dir: "in", amount: 64.0, when: "Today, 06:15" },
    { title: "Wallet sweep · MyZaka → Orange Money", wallet: "Cross-wallet", dir: "out", amount: 300.0, when: "Yesterday, 18:03" },
    { title: "Order #TFM-2280 · crate of cabbage", wallet: "Smega", dir: "in", amount: 440.0, when: "Yesterday, 11:27" },
    { title: "Seed & seedling supplier payout", wallet: "Orange Money", dir: "out", amount: 780.0, when: "13 Aug, 09:10" },
    { title: "Order #TFM-2264 · 20 kg butternut", wallet: "Smega", dir: "in", amount: 240.0, when: "12 Aug, 15:48" }
  ];

  return {
    LOCATIONS, SEASONS, PRODUCE, STALLS, WALLETS, TXNS,
    seasonForMonth, currentSeason, nextSeason, produceFor
  };
})();
