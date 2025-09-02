export const JSONTemplate = `{
  "schema_version": "0.5",
  "instructions": {
    "purpose": "Populate this JSON with early-stage business case data and rationales. The webapp will expand patterns into 60 months, calculate results, visualize them, and export Excel.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Default horizon is 5 years (60 months). Provide at least Year 1 detail OR a pattern; the engine expands the rest.",
      "Use global pricing only (no per-segment pricing).",
      "If a field does not apply, set unit='n/a' and explain in rationale."
    ],
    "growth_patterns": {
      "geom_growth": "start + monthly_growth rate; engine applies for all periods.",
      "seasonal_growth": "Provide seasonality_index_12 and base_year_total (engine repeats pattern yearly with optional yoy_growth).",
      "linear_growth": "start + monthly_flat_increase; engine applies for all periods."
    }
  },
  "meta": {
    "title": "TODO-Short title",
    "description": "TODO-Concept description",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },
  "assumptions": {
    "pricing": {
      "avg_unit_price": { "value": 0.0, "unit": "EUR_per_unit", "rationale": "TODO-average price rationale" },
      "discount_pct": { "value": 0.0, "unit": "ratio", "rationale": "TODO-discount policy" }
    },
    "financial": {
      "interest_rate": { "value": 0.10, "unit": "ratio", "rationale": "10% discount rate for NPV calculations" }
    },
    "customers": {
      "segments": [
        {
          "id": "TODO-segment_id_snake_case",
          "label": "TODO-Human label",
          "kind": "demand|accounts",
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
      {
        "name": "Sales & Marketing",
        "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" }
      },
      {
        "name": "R&D",
        "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" }
      },
      {
        "name": "G&A",
        "value": { "value": 0.0, "unit": "EUR_per_month", "rationale": "TODO" }
      }
    ]
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
    }
  ]
}`;