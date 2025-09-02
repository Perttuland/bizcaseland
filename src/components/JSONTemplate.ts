export const JSONTemplate = `{
  "schema_version": "0.2",

  "instructions": {
    "purpose": "Populate this JSON with early-stage business case data and rationales. The webapp will expand patterns into 60 months, calculate results, visualize them, and export Excel.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Choose ONE archetype: subscription | transactional | licensing | profit_share | hybrid.",
      "Default horizon is 5 years (60 months). Provide at least Year 1 detail OR a pattern; the engine expands the rest.",
      "Use global pricing only (no per-segment pricing).",
      "If a field does not apply, set unit='n/a' and explain in rationale."
    ],
    "patterns": {
      "geom_growth": "start + monthly_growth rate; engine applies for all periods.",
      "seasonal_growth": "Provide seasonality_index_12 and base_year_total (engine repeats pattern yearly with optional yoy_growth).",
      "piecewise": "Combine multiple rules (e.g., geom_growth in Year 1, seasonal_growth afterward)."
    }
  },

  "meta": {
    "title": "TODO-Short title",
    "description": "TODO-Concept description",
    "archetype": "TODO-subscription|transactional|licensing|profit_share|hybrid",
    "currency": "EUR",
    "start_date": "2026-01-01",
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
            "pattern_type": "geom_growth|seasonal_growth|piecewise",
            "series": [
              { "period": 1, "value": 0, "unit": "units|accounts", "rationale": "TODO" }
            ],
            "fallback_formula": "TODO-optional formula"
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

  "structure": {
    "revenue_streams": [
      {
        "name": "Core Revenue",
        "formula": "sum(customers.segments[*].volume) * (assumptions.pricing.avg_unit_price * (1 - assumptions.pricing.discount_pct))",
        "rationale": "TODO-why this revenue logic applies"
      }
    ],
    "cost_items": [
      {
        "name": "COGS",
        "formula": "revenue.total * assumptions.unit_economics.cogs_pct",
        "rationale": "TODO"
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
      "key": "interest_rate",
      "path": "assumptions.financial.interest_rate.value",
      "range": [0.05, 0.08, 0.10, 0.12, 0.15],
      "rationale": "Discount rate for NPV calculation"
    }
  ],

  "scenarios": [
    { "name": "Baseline", "overrides": {} },
    { "name": "Conservative", "overrides": { "assumptions.unit_economics.cac.value": 0.0 } }
  ]
}`;