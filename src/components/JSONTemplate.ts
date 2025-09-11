export const JSONTemplate = `{
  "schema_version": "1.0",
  "instructions": {
    "purpose": "Populate this JSON with business case data and rationales. The webapp will expand patterns into 60 months, calculate results, visualize them, and enable analysis.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Default horizon is 5 years (60 months). Provide at least Year 1 detail OR a pattern; the engine expands the rest.",
      "Choose ONE business model: recurring, unit_sales, or cost_savings.",
      "If a field does not apply, set unit='n/a' and explain in rationale.",
      "Only one growth model (geom_growth, seasonal_growth, or linear_growth) should be selected and populated per case."
    ],
    "business_models": {
      "recurring": "Subscription-based revenue (SaaS, memberships, etc.)",
      "unit_sales": "One-time sales of products or services",
      "cost_savings": "Investment that generates savings and efficiency gains"
    },
    "growth_patterns": {
      "geom_growth": "start + monthly_growth rate; engine applies for all periods.",
      "seasonal_growth": "Provide seasonality_index_12 and base_year_total (engine repeats pattern yearly with optional yoy_growth).",
      "linear_growth": "start + monthly_flat_increase; engine applies for all periods."
    },
    "advanced_features": {
      "flexible_pricing": "Use yearly_adjustments.pricing_factors for price changes over time, or price_overrides for specific periods.",
      "flexible_volume": "Use yearly_adjustments.volume_factors for volume changes over time, or volume_overrides for specific periods.",
      "market_analysis": "Define TAM, SAM, SOM and competitive landscape for market-driven analysis.",
      "cost_savings": "For cost_savings business model, define baseline_costs and efficiency_gains instead of revenue."
    },
    "drivers_guidance": "Drivers are optional. You can create drivers for ANY numeric field as long as driver.path resolves to a '.value' in this JSON (e.g., 'assumptions.pricing.avg_unit_price.value'). Market share can be a powerful driver."
  },
  "meta": {
    "title": "TODO-Short title",
    "description": "TODO-Concept description",
    "business_model": "TODO-recurring|unit_sales|cost_savings",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },
  "assumptions": {
    "pricing": {
      "avg_unit_price": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-average price rationale" },
      "yearly_adjustments": {
        "pricing_factors": [
          { "year": 1, "factor": 1.0, "rationale": "TODO-Year 1 pricing strategy" },
          { "year": 2, "factor": 1.0, "rationale": "TODO-Year 2 pricing adjustments" }
        ],
        "price_overrides": [
          { "period": 13, "price": 0.0, "rationale": "TODO-specific period price override" }
        ]
      }
    },
    "financial": {
      "interest_rate": { "value": 0.10, "unit": "ratio", "rationale": "10% discount rate for NPV calculations" }
    },
    "customers": {
      "churn_pct": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO-monthly churn; used only if business_model=recurring" },
      "segments": [
        {
          "id": "TODO-segment_id_snake_case",
          "label": "TODO-Human label",
          "rationale": "TODO-why this segment matters",
          "volume": {
            "type": "pattern|time_series",
            "pattern_type": "geom_growth|seasonal_growth|linear_growth",
            "series": [
              { "period": 1, "value": 0, "unit": "units|accounts", "rationale": "TODO" }
            ],
            "yearly_adjustments": {
              "volume_factors": [
                { "year": 1, "factor": 1.0, "rationale": "TODO-Year 1 volume expectations" },
                { "year": 2, "factor": 1.0, "rationale": "TODO-Year 2 volume adjustments" }
              ],
              "volume_overrides": [
                { "period": 13, "volume": 0, "rationale": "TODO-specific period volume override" }
              ]
            }
          }
        }
      ]
    },
    "unit_economics": {
      "cogs_pct": { "value": 0.0, "unit": "ratio", "rationale": "TODO" },
      "cac": { "value": 0.0, "unit": "EUR", "rationale": "TODO" }
    },
    "opex": [
      { "name": "Sales & Marketing", "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" } },
      { "name": "R&D",              "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" } },
      { "name": "G&A",              "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" } }
    ],
    "capex": [
      {
        "name": "TODO-Asset or project",
        "timeline": {
          "type": "pattern|time_series",
          "pattern_type": "geom_growth|seasonal_growth|linear_growth",
          "series": [
            { "period": 1, "value": 0, "unit": "EUR", "rationale": "TODO-one-off or phased investment" }
          ]
        }
      }
    ],
    "cost_savings": {
      "baseline_costs": [
        {
          "id": "cost_1",
          "label": "TODO-Cost category name",
          "category": "operational|administrative|technology|other",
          "current_monthly_cost": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO-current monthly cost baseline" },
          "savings_potential_pct": { "value": 0.0, "unit": "percentage", "rationale": "TODO-percentage of cost that can be saved" },
          "implementation_timeline": {
            "start_month": 1,
            "ramp_up_months": 6,
            "full_implementation_month": 12
          }
        }
      ],
      "efficiency_gains": [
        {
          "id": "efficiency_1",
          "label": "TODO-Efficiency improvement name",
          "metric": "TODO-units_per_hour|transactions_per_day|etc",
          "baseline_value": { "value": 0.0, "unit": "units_per_hour", "rationale": "TODO-current efficiency baseline" },
          "improved_value": { "value": 0.0, "unit": "units_per_hour", "rationale": "TODO-improved efficiency target" },
          "value_per_unit": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-monetary value per efficiency unit" },
          "implementation_timeline": {
            "start_month": 1,
            "ramp_up_months": 6,
            "full_implementation_month": 12
          }
        }
      ]
    },
    "market_analysis": {
      "total_addressable_market": {
        "base_value": { "value": 0.0, "unit": "EUR", "rationale": "TODO-total market size in base year" },
        "growth_rate": { "value": 0.0, "unit": "percentage_per_year", "rationale": "TODO-annual market growth rate" },
        "currency": "EUR",
        "year": 2024
      },
      "serviceable_addressable_market": {
        "percentage_of_tam": { "value": 0.0, "unit": "percentage", "rationale": "TODO-addressable portion of total market" }
      },
      "serviceable_obtainable_market": {
        "percentage_of_sam": { "value": 0.0, "unit": "percentage", "rationale": "TODO-realistic obtainable portion" }
      },
      "market_share": {
        "current_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-current market position" },
        "target_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-target market share" },
        "target_timeframe": { "value": 5, "unit": "years", "rationale": "TODO-timeframe to reach target" },
        "penetration_strategy": "linear|exponential|s_curve"
      },
      "competitive_landscape": [
        {
          "competitor_name": "TODO-Competitor name",
          "market_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-competitor market position" },
          "positioning": "TODO-competitor positioning strategy"
        }
      ],
      "market_segments": [
        {
          "id": "segment_1",
          "name": "TODO-Market segment name",
          "size_percentage": { "value": 0.0, "unit": "percentage", "rationale": "TODO-segment size as % of TAM" },
          "growth_rate": { "value": 0.0, "unit": "percentage_per_year", "rationale": "TODO-segment specific growth rate" },
          "target_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-target share in this segment" }
        }
      ],
      "avg_customer_value": {
        "annual_value": { "value": 0.0, "unit": "EUR_per_customer_per_year", "rationale": "TODO-average annual customer value" },
        "lifetime_value": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-customer lifetime value" }
      }
    },
    "growth_settings": {
      "geom_growth": {
        "start": { "value": 0, "unit": "units|accounts", "rationale": "TODO-starting level at period 1" },
        "monthly_growth": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO-monthly compounded growth rate" }
      },
      "seasonal_growth": {
        "base_year_total": { "value": 0, "unit": "units|accounts", "rationale": "TODO-expected total for base year" },
        "seasonality_index_12": { "value": [0,0,0,0,0,0,0,0,0,0,0,0], "unit": "ratio", "rationale": "TODO-12 monthly multipliers that sum to ~12.0 (average 1.0)" },
        "yoy_growth": { "value": 0.0, "unit": "ratio_per_year", "rationale": "TODO-year-over-year growth applied to totals" }
      },
      "linear_growth": {
        "start": { "value": 0, "unit": "units|accounts", "rationale": "TODO-starting level at period 1" },
        "monthly_flat_increase": { "value": 0, "unit": "units|accounts_per_month", "rationale": "TODO-fixed monthly increment" }
      }
    }
  },
  "drivers": [
    {
      "key": "price",
      "path": "assumptions.pricing.avg_unit_price.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Price sensitivity analysis"
    },
    {
      "key": "market_share_target",
      "path": "assumptions.market_analysis.market_share.target_share.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Market share impact on volume and revenue"
    },
    {
      "key": "cost_savings_pct",
      "path": "assumptions.cost_savings.baseline_costs[0].savings_potential_pct.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Sensitivity of cost savings percentage"
    },
    {
      "key": "tam_growth",
      "path": "assumptions.market_analysis.total_addressable_market.growth_rate.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Market growth rate impact"
    },
    {
      "key": "cac",
      "path": "assumptions.unit_economics.cac.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO-Customer acquisition cost sensitivity"
    }
  ]
}`;