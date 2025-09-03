export const JSONTemplate = `{
  "schema_version": "0.62",
  "instructions": {
    "purpose": "Populate this JSON with early-stage business case data and rationales. The webapp will expand patterns into 60 months, calculate results, visualize them, and enable analysis.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Default horizon is 5 years (60 months). Provide at least Year 1 detail OR a pattern; the engine expands the rest.",
      "Use global pricing only (no per-segment pricing).",
      "If a field does not apply, set unit='n/a' and explain in rationale.",
      "Only one growth model (geom_growth, seasonal_growth, or linear_growth) should be selected and populated per case. Leave the others empty."
    ],
    "growth_patterns": {
      "geom_growth": "start + monthly_growth rate; engine applies for all periods.",
      "seasonal_growth": "Provide seasonality_index_12 and base_year_total (engine repeats pattern yearly with optional yoy_growth).",
      "linear_growth": "start + monthly_flat_increase; engine applies for all periods."
    },
    "drivers_guidance": "Drivers are optional. You can create drivers for ANY numeric field as long as driver.path resolves to a '.value' in this JSON (e.g., 'assumptions.pricing.avg_unit_price.value'). The engine will apply the values in 'range' as scenario test points. If you don't need drivers, leave the 'drivers' array empty."
  },
  "meta": {
    "title": "TODO-Short title",
    "description": "TODO-Concept description",
    "business_model": "TODO-recurring|unit_sales",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },
  "assumptions": {
    "pricing": {
      "avg_unit_price": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-average price rationale" }
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
            ]
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
    "growth_settings": {
      "geom_growth": {
        "start": { "value": 0, "unit": "units|accounts", "rationale": "TODO-starting level at period 1" },
        "monthly_growth": { "value": 0.0, "unit": "ratio_per_month", "rationale": "TODO-monthly compounded growth rate" }
      },
      "seasonal_growth": {
        "base_year_total": { "value": 0, "unit": "units|accounts", "rationale": "TODO-expected total for base year" },
        "seasonality_index_12": { "value": [0,0,0,0,0,0,0,0,0,0,0,0], "unit": "ratio", "rationale": "TODO-12 monthly multipliers that sum to ~1.0" },
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
      "rationale": "TODO"
    },
    {
      "key": "cac",
      "path": "assumptions.unit_economics.cac.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO"
    },
    {
      "key": "cogs_pct",
      "path": "assumptions.unit_economics.cogs_pct.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO"
    },
    {
      "key": "churn_pct",
      "path": "assumptions.customers.churn_pct.value",
      "range": [0, 0, 0, 0, 0],
      "rationale": "TODO"
    }
  ]
}`;