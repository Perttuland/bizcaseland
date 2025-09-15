/**
 * Test to verify the corrected efficiency gains logic
 * 
 * New Logic: Efficiency Gains = Improved Value × Value per Unit × Implementation Factor
 * 
 * This represents the ongoing value/cost of the improved process,
 * separate from cost savings which represent the difference between baseline and improved costs.
 */

import { describe, it, expect } from 'vitest';
import { calculateEfficiencyGainsForMonth } from '@/lib/calculations';
import { BusinessData } from '@/contexts/BusinessDataContext';

describe('Corrected Efficiency Gains Logic', () => {
  it('should calculate efficiency gains as: improved value × value per unit', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Efficiency Test',
        description: 'Testing corrected efficiency gains logic',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'payroll_efficiency',
              label: 'Payroll Processing Efficiency',
              metric: 'hours_per_month',
              baseline_value: { value: 40, unit: 'hours/month', rationale: 'Manual payroll takes 40 hours' },
              improved_value: { value: 8, unit: 'hours/month', rationale: 'Automated payroll takes 8 hours' },
              value_per_unit: { value: 50, unit: 'EUR/hour', rationale: 'Cost per hour of payroll work' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);
    
    // New logic: 8 hours × 50 EUR/hour = 400 EUR (ongoing cost/value of improved process)
    // This is NOT the savings (which would be 40-8=32 hours × 50 = 1600 EUR)
    // This is the value/cost of running the improved process
    expect(gains).toBe(8 * 50); // 400 EUR
  });

  it('should demonstrate the difference from old logic', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Logic Comparison',
        description: 'Comparing old vs new logic',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'processing_efficiency',
              label: 'Processing Efficiency',
              metric: 'hours_per_month',
              baseline_value: { value: 100, unit: 'hours/month', rationale: 'Baseline processing time' },
              improved_value: { value: 20, unit: 'hours/month', rationale: 'Improved processing time' },
              value_per_unit: { value: 75, unit: 'EUR/hour', rationale: 'Value per hour' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);
    
    // NEW LOGIC: 20 hours × 75 EUR/hour = 1500 EUR (value of improved process)
    expect(gains).toBe(20 * 75); // 1500 EUR
    
    // OLD LOGIC would have been: (100 - 20) × 75 = 6000 EUR (savings amount)
    // The old logic was conceptually wrong - it mixed "savings" with "efficiency gains"
    expect(gains).not.toBe((100 - 20) * 75); // Should NOT be 6000 EUR
  });

  it('should handle multiple efficiency gains correctly', () => {
    const testData: BusinessData = {
      meta: {
        title: 'Multiple Gains',
        description: 'Testing multiple efficiency gains',
        business_model: 'cost_savings',
        currency: 'EUR',
        periods: 12,
        frequency: 'monthly'
      },
      assumptions: {
        cost_savings: {
          efficiency_gains: [
            {
              id: 'gain1',
              label: 'Process A',
              metric: 'hours_per_month',
              baseline_value: { value: 50, unit: 'hours/month', rationale: 'Baseline A' },
              improved_value: { value: 10, unit: 'hours/month', rationale: 'Improved A' },
              value_per_unit: { value: 60, unit: 'EUR/hour', rationale: 'Value A' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            },
            {
              id: 'gain2',
              label: 'Process B',
              metric: 'hours_per_month',
              baseline_value: { value: 30, unit: 'hours/month', rationale: 'Baseline B' },
              improved_value: { value: 5, unit: 'hours/month', rationale: 'Improved B' },
              value_per_unit: { value: 80, unit: 'EUR/hour', rationale: 'Value B' },
              implementation_timeline: {
                start_month: 1,
                ramp_up_months: 0,
                full_implementation_month: 1
              }
            }
          ]
        }
      }
    };

    const gains = calculateEfficiencyGainsForMonth(testData, 0);
    
    // Process A: 10 hours × 60 EUR/hour = 600 EUR
    // Process B: 5 hours × 80 EUR/hour = 400 EUR
    // Total: 600 + 400 = 1000 EUR
    expect(gains).toBe((10 * 60) + (5 * 80)); // 1000 EUR
  });
});
