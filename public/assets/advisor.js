/* Rule-based "AI advisor" for the farmer dashboard (prototype, no backend). */

function advisorAnswer(input) {
  const q = (input || "").toLowerCase();
  const cur = BW.currentSeason();
  const next = BW.nextSeason();
  const nextList = BW.produceFor(next.key);
  const curList = BW.produceFor(cur.key);

  const fmtList = (arr) => arr.map(p => `• ${p.name} — ${P(p.price)}/${p.unit} (${trendLabel(p.trend)})`).join("\n");

  if (/loan|absa|bank|finance|credit|collateral/.test(q)) {
    return [
      "Loan readiness — ABSA smallholder / agri-business facility:",
      "",
      "1. Income record: keep at least 6 consecutive months of settled sales on AgriWise. Your current record is strong on Orange Money and Smega, thinner on MyZaka.",
      "2. Bank statements: banks want 6–12 months. Sweep your wallet takings into one bank-linked wallet consistently rather than leaving cash spread across three.",
      "3. Registration: CIPA business registration plus an Omang copy, and a lease or tribal land board certificate for the plot.",
      "4. Cash-flow projection: use the seasonal price table on this dashboard — a 12-month projection tied to real season prices reads far better than a flat estimate.",
      "5. Ask realistically: for a first facility, request 3–4× your average monthly settled income. On your current run rate that's roughly P18,000 – P24,000.",
      "",
      "Export the Income Statement from the Loan Readiness card and attach it to the application."
    ].join("\n");
  }

  if (/next season|upcoming|forecast|predict|plant|what should i grow/.test(q)) {
    return [
      `Forecast for the ${next.name} (${next.months}):`,
      next.note,
      "",
      "Highest-confidence crops:",
      fmtList(nextList.slice(0, 5)),
      "",
      `Plan the nursery now: seedlings started in the last 4 weeks of the ${cur.name} hit the market at the top of the price curve.`
    ].join("\n");
  }

  if (/price|pricing|cost|how much|market rate|sell for/.test(q)) {
    return [
      `Indicative market prices for the ${cur.name}:`,
      fmtList(curList),
      "",
      "Pricing guidance: stalls that sit within 5% of these averages sell out fastest. Undercutting by more than 15% signals over-supply and drags the whole district price down."
    ].join("\n");
  }

  if (/market|demand|who buys|sell where|buyer/.test(q)) {
    return [
      `Demand outlook — ${cur.name}:`,
      "• Households buy leafy greens 2–3× per week; keep a daily-cut supply rather than one big harvest.",
      "• Lodges and restaurants (Maun, Kasane, Gaborone) pay 20–30% above stall price for consistent weekly volume and one invoice.",
      "• Schools and clinics buy in bulk crates at month-end when budgets clear.",
      "",
      "Best move this month: lock one weekly institutional buyer before you expand planted area."
    ].join("\n");
  }

  if (/water|irrigat|drought|rain|frost|pest/.test(q)) {
    return [
      `${cur.name} field risks:`,
      cur.note,
      "",
      "• Drip beats overhead irrigation on cost in every Botswana season — expect 30–40% less water per kilo produced.",
      "• Mulch heavily in the hot dry months; bare soil can lose most of a day's watering before evening.",
      "• Frost inland (Jun–Jul): cover seedlings and irrigate late afternoon, not at night."
    ].join("\n");
  }

  if (/wallet|orange|smega|myzaka|transfer|payment|money/.test(q)) {
    return [
      "Wallet strategy:",
      "• Advertise all three wallets on your stall — listings with all three convert about a third better because no buyer is turned away.",
      "• Sweep into one primary wallet weekly rather than daily; fewer transfers means fewer fees.",
      "• Keep your bank-linked wallet as the primary one so your income trail is visible to lenders."
    ].join("\n");
  }

  if (/hello|hi|dumela|help|what can you/.test(q)) {
    return [
      "Dumela! I'm your AgriWise market advisor. I can help with:",
      "• What will thrive next season and when to start seedlings",
      "• Current and forecast pricing per crop",
      "• Where the demand is and who to sell to",
      "• Getting your paperwork ready for an ABSA loan",
      "• Water, frost and pest risks for the current season",
      "",
      "Ask me anything, or tap one of the suggestions."
    ].join("\n");
  }

  const match = BW.PRODUCE.find(p => q.includes(p.name.toLowerCase().split(" ")[0]));
  if (match) {
    const inSeason = match.seasons.includes(cur.key);
    const seasonNames = match.seasons.map(k => BW.SEASONS[k].name).join(" and ");
    return [
      `${match.emoji} ${match.name}`,
      `Best seasons: ${seasonNames}.`,
      `Right now (${cur.name}) it is ${inSeason ? "in season — plant and sell with confidence" : "out of its strong window, so expect thinner yields and higher input cost"}.`,
      `Indicative price: ${P(match.price)} per ${match.unit} (${trendLabel(match.trend)}).`,
      inSeason
        ? "Hold a small volume back for the last two weeks of the season — that's when the price peaks."
        : `Start seedlings about 6 weeks before the ${BW.SEASONS[match.seasons[0]].name} opens.`
    ].join("\n");
  }

  return [
    `I don't have a specific read on that yet, but here's where we stand in the ${cur.name}:`,
    cur.note,
    "",
    `Top earners right now: ${curList.slice(0, 4).map(p => p.name).join(", ")}.`,
    "Try asking about next season, pricing, market demand, or ABSA loan preparation."
  ].join("\n");
}
