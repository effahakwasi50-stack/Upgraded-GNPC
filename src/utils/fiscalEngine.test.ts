import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFiscalReconciliation,
  calculatePriceSensitivity,
  CONCESSION_PRESETS,
  FiscalInputs,
} from './fiscalEngine';

test('Jubilee preset baseline calculation conforms to Act 919 & Model PA', () => {
  const jubilee = CONCESSION_PRESETS.jubilee;
  const inputs: FiscalInputs = {
    concessionId: jubilee.id,
    concessionName: jubilee.name,
    grossProductionBarrels: 1000000, // 1M bbls for clean numbers
    achievedPriceUSD: 80.0,
    monthlyCostsUSD: 20000000, // $20M
    statutoryRoyaltyRate: 0.05, // 5%
    costRecoveryCap: 0.70, // 70%
    gnpcCarriedInterestRate: 0.15, // 15%
    gnpcPayingInterestRate: 0.00,
  };

  const result = calculateFiscalReconciliation(inputs);

  // 1. Gross revenue
  assert.equal(result.totalGrossRevenueUSD, 80000000);

  // 2. State royalty: 5% of 1,000,000 = 50,000 bbls
  assert.equal(result.stateRoyaltyBarrels, 50000);
  assert.equal(result.stateRoyaltyUSD, 4000000); // 50k * $80 = $4M
  assert.equal(result.netProductionBarrels, 950000); // 1,000,000 - 50,000

  // 3. Cost recovery cap: 70% of 950,000 = 665,000 bbls
  assert.equal(result.maxCostRecoveryBarrelsAllowed, 665000);
  // Barrels needed for $20M at $80/bbl = 250,000 bbls
  assert.equal(result.costBarrelsDemanded, 250000);
  assert.equal(result.costBarrelsClaimed, 250000);
  assert.equal(result.costUSDRecovered, 20000000);
  assert.equal(result.unrecoveredCostUSD, 0);
  assert.equal(result.isCostCapped, false);

  // 4. Profit oil: 950,000 - 250,000 = 700,000 bbls
  assert.equal(result.profitOilBarrels, 700000);
  assert.equal(result.profitOilUSD, 56000000); // 700k * $80

  // 5. GNPC Equity: 15% of 700,000 = 105,000 bbls
  assert.equal(result.gnpcProfitBarrels, 105000);
  assert.equal(result.gnpcProfitUSD, 8400000); // 105k * $80

  // Contractor Profit: 700,000 - 105,000 = 595,000 bbls
  assert.equal(result.contractorProfitBarrels, 595000);
  assert.equal(result.contractorProfitUSD, 47600000);

  // 6. Total State Take: Royalty (50k) + GNPC Profit (105k) = 155,000 bbls
  assert.equal(result.totalGhanaBarrels, 155000);
  assert.equal(result.totalGhanaRevenueUSD, 12400000); // 155k * $80 = $12.4M
  assert.equal(result.effectiveStateTakePercent, 15.5); // 12.4M / 80M = 15.5%

  // Contractor Total Take: Cost (250k) + Profit (595k) = 845,000 bbls
  assert.equal(result.contractorTotalBarrels, 845000);
  assert.equal(result.contractorGrossRevenueUSD, 67600000); // 845k * $80 = $67.6M

  // Physical Barrel Conservation: State Barrels + Contractor Barrels == Gross Barrels
  assert.equal(result.totalGhanaBarrels + result.contractorTotalBarrels, inputs.grossProductionBarrels);
  // Dollar Conservation: State Revenue + Contractor Revenue == Total Gross Revenue
  assert.equal(result.totalGhanaRevenueUSD + result.contractorGrossRevenueUSD, result.totalGrossRevenueUSD);
});

test('Cost recovery cap triggers carry-forward when monthly OPEX/CAPEX exceeds 70% ceiling', () => {
  const inputs: FiscalInputs = {
    concessionId: 'sankofa',
    concessionName: 'Sankofa-Gye Nyame',
    grossProductionBarrels: 1000000,
    achievedPriceUSD: 50.0, // Low price, high costs
    monthlyCostsUSD: 40000000, // $40M claimed -> needs 800,000 bbls
    statutoryRoyaltyRate: 0.075, // 7.5% SGN royalty
    costRecoveryCap: 0.70,
    gnpcCarriedInterestRate: 0.15,
    gnpcPayingInterestRate: 0.05, // 5% paying interest (total 20%)
  };

  const result = calculateFiscalReconciliation(inputs);

  // Royalty = 75,000 bbls; Net = 925,000 bbls
  assert.equal(result.stateRoyaltyBarrels, 75000);
  assert.equal(result.netProductionBarrels, 925000);

  // Max Cost Barrels = 70% of 925,000 = 647,500 bbls
  assert.equal(result.maxCostRecoveryBarrelsAllowed, 647500);
  // Demanded = $40M / $50 = 800,000 bbls
  assert.equal(result.costBarrelsDemanded, 800000);
  // Cap is enforced:
  assert.equal(result.costBarrelsClaimed, 647500);
  assert.equal(result.isCostCapped, true);

  // Cost Recovered = 647,500 * $50 = $32,375,000
  assert.equal(result.costUSDRecovered, 32375000);
  // Unrecovered carry-forward = $40,000,000 - $32,375,000 = $7,625,000
  assert.equal(result.unrecoveredCostUSD, 7625000);
  assert.equal(result.unrecoveredCostBarrels, 7625000 / 50);

  // Profit oil remaining: 925,000 - 647,500 = 277,500 bbls (exactly 30% of Net Production)
  assert.equal(result.profitOilBarrels, 277500);

  // GNPC has 15% carried + 5% paying = 20%
  assert.equal(result.gnpcTotalEquityRate, 0.20);
  assert.equal(result.gnpcProfitBarrels, 277500 * 0.20);

  // Barrel conservation still holds
  assert.equal(result.totalGhanaBarrels + result.contractorTotalBarrels, inputs.grossProductionBarrels);
});

test('Zero and edge cases handled without NaN or throwing errors', () => {
  const zeroInputs: FiscalInputs = {
    concessionId: 'custom',
    concessionName: 'Zero Test',
    grossProductionBarrels: 0,
    achievedPriceUSD: 0,
    monthlyCostsUSD: 0,
    statutoryRoyaltyRate: 0.10,
    costRecoveryCap: 0.70,
    gnpcCarriedInterestRate: 0.15,
    gnpcPayingInterestRate: 0.00,
  };

  const result = calculateFiscalReconciliation(zeroInputs);
  assert.equal(result.totalGrossRevenueUSD, 0);
  assert.equal(result.stateRoyaltyBarrels, 0);
  assert.equal(result.costBarrelsClaimed, 0);
  assert.equal(result.effectiveStateTakePercent, 0);
  assert.equal(Number.isNaN(result.effectiveStateTakePercent), false);

  // Test sensitivity curve does not crash
  const curve = calculatePriceSensitivity(zeroInputs, 50, 120, 10);
  assert.equal(curve.length, 8);
  assert.equal(curve[0].price, 50);
});
