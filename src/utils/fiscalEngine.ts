/**
 * GNPC Upstream Fiscal Calculation Engine
 * Implements the petroleum fiscal regime under Ghana's Petroleum (Exploration and Production) Act, 2016 (Act 919)
 * and Concession Model Petroleum Agreements (Jubilee, TEN, Sankofa-Gye Nyame).
 */

export interface ConcessionPreset {
  id: string;
  name: string;
  operator: string;
  offshoreBasin: string;
  fpsoName: string;
  statutoryRoyaltyRate: number; // e.g. 0.05 for 5%
  defaultGrossProduction: number; // bbls/month
  defaultAchievedPrice: number; // USD/bbl
  defaultMonthlyCosts: number; // USD
  defaultCarriedInterest: number; // e.g. 0.15 for 15%
  defaultPayingInterest: number; // e.g. 0.00 for 0%
  costRecoveryCap: number; // contractual ceiling, standard 0.70 (70% of Net Production)
  typicalCargoParcelSize: number; // standard lifting cargo e.g. 950,000 bbls
}

export const CONCESSION_PRESETS: Record<string, ConcessionPreset> = {
  jubilee: {
    id: 'jubilee',
    name: 'Jubilee Field (WCTP & DWT Blocks)',
    operator: 'Tullow Ghana Ltd (Operator), Kosmos, GNPC, PetroSA',
    offshoreBasin: 'Tano Deepwater Basin',
    fpsoName: 'FPSO Kwame Nkrumah (MV21)',
    statutoryRoyaltyRate: 0.05, // 5.0%
    defaultGrossProduction: 2850000, // ~95,000 bopd (monthly ~2.85M bbls)
    defaultAchievedPrice: 78.50,
    defaultMonthlyCosts: 62000000, // $62M USD OPEX + amortized CAPEX
    defaultCarriedInterest: 0.1364, // Jubilee contractual carried ~13.64% (or statutory 15%)
    defaultPayingInterest: 0.00,
    costRecoveryCap: 0.70,
    typicalCargoParcelSize: 950000,
  },
  ten: {
    id: 'ten',
    name: 'TEN Fields (Tweneboa, Enyenra, Ntomme)',
    operator: 'Tullow Ghana Ltd, Kosmos, GNPC, PetroSA',
    offshoreBasin: 'Deepwater Tano Basin',
    fpsoName: 'FPSO Prof. John Evans Atta Mills',
    statutoryRoyaltyRate: 0.05, // 5.0%
    defaultGrossProduction: 1200000, // ~40,000 bopd
    defaultAchievedPrice: 78.50,
    defaultMonthlyCosts: 38000000,
    defaultCarriedInterest: 0.15, // Act 919 statutory 15%
    defaultPayingInterest: 0.00,
    costRecoveryCap: 0.70,
    typicalCargoParcelSize: 950000,
  },
  sankofa: {
    id: 'sankofa',
    name: 'Sankofa-Gye Nyame (OCTP Concession)',
    operator: 'Eni Ghana Exploration & Production Ltd, Vitol Upstream, GNPC',
    offshoreBasin: 'Cape Three Points Offshore Basin',
    fpsoName: 'FPSO John Agyekum Kufuor',
    statutoryRoyaltyRate: 0.075, // 7.5%
    defaultGrossProduction: 1650000, // ~55,000 bopd
    defaultAchievedPrice: 78.50,
    defaultMonthlyCosts: 45000000,
    defaultCarriedInterest: 0.15,
    defaultPayingInterest: 0.05, // 5% additional paying interest
    costRecoveryCap: 0.70,
    typicalCargoParcelSize: 950000,
  },
  custom: {
    id: 'custom',
    name: 'Custom Offshore Exploration Block',
    operator: 'Joint Operating Concession',
    offshoreBasin: 'Western / Central Basin Block',
    fpsoName: 'Offshore Production Facility',
    statutoryRoyaltyRate: 0.10, // 10%
    defaultGrossProduction: 1000000,
    defaultAchievedPrice: 80.00,
    defaultMonthlyCosts: 30000000,
    defaultCarriedInterest: 0.15,
    defaultPayingInterest: 0.00,
    costRecoveryCap: 0.70,
    typicalCargoParcelSize: 950000,
  },
};

export interface FiscalInputs {
  concessionId: string;
  concessionName: string;
  grossProductionBarrels: number; // Q_gross
  achievedPriceUSD: number; // $/bbl
  monthlyCostsUSD: number; // OPEX + amortized CAPEX claimed
  statutoryRoyaltyRate: number; // e.g. 0.05 for 5%
  costRecoveryCap: number; // e.g. 0.70 for 70%
  gnpcCarriedInterestRate: number; // e.g. 0.15 for 15%
  gnpcPayingInterestRate: number; // e.g. 0.00 to 0.05
}

export interface FiscalReconciliationOutput {
  inputs: FiscalInputs;

  // 1. Gross metrics
  grossProductionBarrels: number;
  achievedPriceUSD: number;
  totalGrossRevenueUSD: number;

  // 2. State Royalty
  royaltyRate: number;
  stateRoyaltyBarrels: number;
  stateRoyaltyUSD: number;
  netProductionBarrels: number; // Q_net = Q_gross - B_royalty

  // 3. Cost Recovery
  costRecoveryCapRate: number;
  maxCostRecoveryBarrelsAllowed: number; // 70% of Q_net
  maxCostRecoveryUSDAllowed: number;
  costsClaimedUSD: number;
  costBarrelsDemanded: number; // costsClaimed / price
  costBarrelsClaimed: number; // min(demanded, maxAllowed)
  costUSDRecovered: number;
  unrecoveredCostUSD: number; // carry forward
  unrecoveredCostBarrels: number;
  isCostCapped: boolean;

  // 4. Profit Oil Split
  profitOilBarrels: number; // Q_profit = Q_net - Cost Barrels Claimed
  profitOilUSD: number;

  // 5. GNPC & Contractor Profit Oil
  gnpcTotalEquityRate: number; // carried + paying
  gnpcProfitBarrels: number;
  gnpcProfitUSD: number;
  contractorProfitBarrels: number;
  contractorProfitUSD: number;

  // 6. Comprehensive Takes
  totalGhanaBarrels: number; // Royalty Barrels + GNPC Profit Barrels
  totalGhanaRevenueUSD: number; // Total Ghana Barrels * Price
  effectiveStateTakePercent: number; // (State Revenue / Gross Revenue) * 100

  contractorTotalBarrels: number; // Cost Barrels + Contractor Profit Barrels
  contractorGrossRevenueUSD: number; // Contractor Barrels * Price
  contractorNetTakeUSD: number; // Profit Oil USD (net of costs)
  effectiveContractorTakePercent: number; // (Contractor Barrels / Gross Barrels) * 100

  // Standard Cargo Liftings (Act 919 standard liftings, e.g. 950k bbl parcel)
  standardParcelsGhana: number;
  standardParcelsContractor: number;

  // PRMA Act 815 Distribution Preview of State Revenue
  prmaDistribution: {
    gnpcLevelAAllocationUSD: number; // e.g. GNPC share for cash calls & exploration (~30%)
    petroleumHoldingFundUSD: number; // Net remaining into PHF (~70%)
    annualBudgetFundingAmountUSD: number; // ABFA (up to 70% of net PHF benchmark)
    ghanaPetroleumFundsUSD: number; // GPFs (min 30% of net PHF)
    ghanaStabilizationFundUSD: number; // GSF (70% of GPF)
    ghanaHeritageFundUSD: number; // GHF (30% of GPF)
  };
}

export function calculateFiscalReconciliation(inputs: FiscalInputs): FiscalReconciliationOutput {
  const grossProduction = Math.max(0, inputs.grossProductionBarrels || 0);
  const price = Math.max(0, inputs.achievedPriceUSD || 0);
  const monthlyCosts = Math.max(0, inputs.monthlyCostsUSD || 0);
  const royaltyRate = Math.min(Math.max(0, inputs.statutoryRoyaltyRate || 0), 0.50); // cap royalty at 50% for safety
  const costCapRate = Math.min(Math.max(0, inputs.costRecoveryCap || 0.70), 1.0);
  const carriedRate = Math.min(Math.max(0, inputs.gnpcCarriedInterestRate || 0), 1.0);
  const payingRate = Math.min(Math.max(0, inputs.gnpcPayingInterestRate || 0), 0.50);
  const gnpcTotalEquityRate = Math.min(1.0, carriedRate + payingRate);

  // 1. Gross Revenue
  const totalGrossRevenueUSD = grossProduction * price;

  // 2. State Royalty (off the top)
  const stateRoyaltyBarrels = grossProduction * royaltyRate;
  const stateRoyaltyUSD = stateRoyaltyBarrels * price;
  const netProductionBarrels = Math.max(0, grossProduction - stateRoyaltyBarrels);

  // 3. Cost Recovery Ceiling
  const maxCostRecoveryBarrelsAllowed = netProductionBarrels * costCapRate;
  const maxCostRecoveryUSDAllowed = maxCostRecoveryBarrelsAllowed * price;

  let costBarrelsDemanded = 0;
  if (price > 0) {
    costBarrelsDemanded = monthlyCosts / price;
  }

  const costBarrelsClaimed = Math.min(costBarrelsDemanded, maxCostRecoveryBarrelsAllowed);
  const costUSDRecovered = costBarrelsClaimed * price;
  const unrecoveredCostUSD = Math.max(0, monthlyCosts - costUSDRecovered);
  const unrecoveredCostBarrels = price > 0 ? unrecoveredCostUSD / price : 0;
  const isCostCapped = costBarrelsDemanded > maxCostRecoveryBarrelsAllowed && monthlyCosts > 0;

  // 4. Profit Oil Pool
  const profitOilBarrels = Math.max(0, netProductionBarrels - costBarrelsClaimed);
  const profitOilUSD = profitOilBarrels * price;

  // 5. GNPC & Contractor Split
  const gnpcProfitBarrels = profitOilBarrels * gnpcTotalEquityRate;
  const gnpcProfitUSD = gnpcProfitBarrels * price;

  const contractorProfitBarrels = Math.max(0, profitOilBarrels - gnpcProfitBarrels);
  const contractorProfitUSD = contractorProfitBarrels * price;

  // 6. Comprehensive Takes
  const totalGhanaBarrels = stateRoyaltyBarrels + gnpcProfitBarrels;
  const totalGhanaRevenueUSD = totalGhanaBarrels * price;

  const contractorTotalBarrels = costBarrelsClaimed + contractorProfitBarrels;
  const contractorGrossRevenueUSD = contractorTotalBarrels * price;
  const contractorNetTakeUSD = contractorProfitUSD; // profit portion after cost reimbursement

  const effectiveStateTakePercent = totalGrossRevenueUSD > 0
    ? (totalGhanaRevenueUSD / totalGrossRevenueUSD) * 100
    : 0;

  const effectiveContractorTakePercent = grossProduction > 0
    ? (contractorTotalBarrels / grossProduction) * 100
    : 0;

  const parcelSize = 950000;
  const standardParcelsGhana = totalGhanaBarrels / parcelSize;
  const standardParcelsContractor = contractorTotalBarrels / parcelSize;

  // PRMA Act 815 Distribution modeling
  // Under PRMA, GNPC receives statutory share for operations & equity financing (typically ~30% of Ghana take)
  // Remaining goes to Petroleum Holding Fund (PHF)
  const gnpcLevelAAllocationUSD = totalGhanaRevenueUSD * 0.30;
  const petroleumHoldingFundUSD = totalGhanaRevenueUSD * 0.70;
  const annualBudgetFundingAmountUSD = petroleumHoldingFundUSD * 0.70; // ABFA (up to 70%)
  const ghanaPetroleumFundsUSD = petroleumHoldingFundUSD * 0.30; // GPFs (at least 30%)
  const ghanaStabilizationFundUSD = ghanaPetroleumFundsUSD * 0.70; // GSF 70% of GPF
  const ghanaHeritageFundUSD = ghanaPetroleumFundsUSD * 0.30; // GHF 30% of GPF

  return {
    inputs,
    grossProductionBarrels: grossProduction,
    achievedPriceUSD: price,
    totalGrossRevenueUSD,

    royaltyRate,
    stateRoyaltyBarrels,
    stateRoyaltyUSD,
    netProductionBarrels,

    costRecoveryCapRate: costCapRate,
    maxCostRecoveryBarrelsAllowed,
    maxCostRecoveryUSDAllowed,
    costsClaimedUSD: monthlyCosts,
    costBarrelsDemanded,
    costBarrelsClaimed,
    costUSDRecovered,
    unrecoveredCostUSD,
    unrecoveredCostBarrels,
    isCostCapped,

    profitOilBarrels,
    profitOilUSD,

    gnpcTotalEquityRate,
    gnpcProfitBarrels,
    gnpcProfitUSD,
    contractorProfitBarrels,
    contractorProfitUSD,

    totalGhanaBarrels,
    totalGhanaRevenueUSD,
    effectiveStateTakePercent,

    contractorTotalBarrels,
    contractorGrossRevenueUSD,
    contractorNetTakeUSD,
    effectiveContractorTakePercent,

    standardParcelsGhana,
    standardParcelsContractor,

    prmaDistribution: {
      gnpcLevelAAllocationUSD,
      petroleumHoldingFundUSD,
      annualBudgetFundingAmountUSD,
      ghanaPetroleumFundsUSD,
      ghanaStabilizationFundUSD,
      ghanaHeritageFundUSD,
    },
  };
}

/**
 * Calculates price sensitivity series from minPrice to maxPrice in steps
 */
export function calculatePriceSensitivity(
  inputs: FiscalInputs,
  minPrice: number = 50,
  maxPrice: number = 120,
  step: number = 5
) {
  const points: {
    price: number;
    stateRevenueUSD: number;
    contractorRevenueUSD: number;
    effectiveStateTakePercent: number;
    gnpcBarrels: number;
    contractorBarrels: number;
  }[] = [];

  for (let p = minPrice; p <= maxPrice; p += step) {
    const res = calculateFiscalReconciliation({
      ...inputs,
      achievedPriceUSD: p,
    });
    points.push({
      price: p,
      stateRevenueUSD: res.totalGhanaRevenueUSD,
      contractorRevenueUSD: res.contractorGrossRevenueUSD,
      effectiveStateTakePercent: res.effectiveStateTakePercent,
      gnpcBarrels: res.totalGhanaBarrels,
      contractorBarrels: res.contractorTotalBarrels,
    });
  }

  return points;
}
