export interface AirlineData {
  code: string;
  name: string;
  programName: string;
  tiers: string[];
}

export const airlines: AirlineData[] = [
  { code: "AA", name: "American Airlines", programName: "AAdvantage", tiers: ["Gold", "Platinum", "Platinum Pro", "Executive Platinum"] },
  { code: "AC", name: "Air Canada", programName: "Aeroplan", tiers: ["25K", "35K", "50K", "75K", "Super Elite"] },
  { code: "AF", name: "Air France", programName: "Flying Blue", tiers: ["Explorer", "Silver", "Gold", "Platinum", "Ultimate"] },
  { code: "AI", name: "Air India", programName: "Flying Returns", tiers: ["Silver", "Gold", "Platinum"] },
  { code: "AS", name: "Alaska Airlines", programName: "Mileage Plan", tiers: ["MVP", "MVP Gold", "MVP Gold 75K"] },
  { code: "AY", name: "Finnair", programName: "Finnair Plus", tiers: ["Silver", "Gold", "Platinum", "Platinum Lumo"] },
  { code: "AZ", name: "ITA Airways", programName: "Volare", tiers: ["Plus", "Premium", "Executive"] },
  { code: "BA", name: "British Airways", programName: "Executive Club", tiers: ["Bronze", "Silver", "Gold", "GGL"] },
  { code: "CX", name: "Cathay Pacific", programName: "Asia Miles", tiers: ["Green", "Silver", "Gold", "Diamond"] },
  { code: "DL", name: "Delta Air Lines", programName: "SkyMiles", tiers: ["Silver", "Gold", "Platinum", "Diamond"] },
  { code: "EK", name: "Emirates", programName: "Skywards", tiers: ["Blue", "Silver", "Gold", "Platinum"] },
  { code: "ET", name: "Ethiopian Airlines", programName: "ShebaMiles", tiers: ["Blue", "Silver", "Gold", "Platinum"] },
  { code: "EY", name: "Etihad Airways", programName: "Etihad Guest", tiers: ["Silver", "Gold", "Platinum"] },
  { code: "IB", name: "Iberia", programName: "Iberia Plus", tiers: ["Classic", "Silver", "Gold", "Platinum"] },
  { code: "JL", name: "Japan Airlines", programName: "JAL Mileage Bank", tiers: ["Crystal", "Sapphire", "JGC Premier", "Diamond"] },
  { code: "KE", name: "Korean Air", programName: "SKYPASS", tiers: ["Morning Calm", "Morning Calm Premium", "Million Miler"] },
  { code: "KL", name: "KLM", programName: "Flying Blue", tiers: ["Explorer", "Silver", "Gold", "Platinum", "Ultimate"] },
  { code: "LH", name: "Lufthansa", programName: "Miles & More", tiers: ["Frequent Traveller", "Senator", "HON Circle"] },
  { code: "LX", name: "Swiss International", programName: "Miles & More", tiers: ["Frequent Traveller", "Senator", "HON Circle"] },
  { code: "NH", name: "ANA", programName: "ANA Mileage Club", tiers: ["Bronze", "Platinum", "Diamond", "Super Flyers"] },
  { code: "QF", name: "Qantas", programName: "Qantas Frequent Flyer", tiers: ["Silver", "Gold", "Platinum", "Platinum One"] },
  { code: "QR", name: "Qatar Airways", programName: "Privilege Club", tiers: ["Burgundy", "Silver", "Gold", "Platinum"] },
  { code: "SK", name: "SAS", programName: "EuroBonus", tiers: ["Silver", "Gold", "Diamond"] },
  { code: "SQ", name: "Singapore Airlines", programName: "KrisFlyer", tiers: ["Elite Silver", "Elite Gold", "PPS Club"] },
  { code: "SU", name: "Aeroflot", programName: "Aeroflot Bonus", tiers: ["Silver", "Gold", "Platinum"] },
  { code: "TG", name: "Thai Airways", programName: "Royal Orchid Plus", tiers: ["Silver", "Gold", "Platinum"] },
  { code: "TK", name: "Turkish Airlines", programName: "Miles&Smiles", tiers: ["Classic Plus", "Elite", "Elite Plus"] },
  { code: "UA", name: "United Airlines", programName: "MileagePlus", tiers: ["Silver", "Gold", "Platinum", "1K", "Global Services"] },
  { code: "VS", name: "Virgin Atlantic", programName: "Flying Club", tiers: ["Red", "Silver", "Gold"] },
  { code: "WN", name: "Southwest Airlines", programName: "Rapid Rewards", tiers: ["A-List", "A-List Preferred"] },
];
