export const JSONTemplate = `{
  "schema_version": "0.3",

  "meta": {
    "title": "Iconic Ice Cream Helsinki",
    "description": "A centrally located artisanal ice cream shop in Helsinki offering iconic flavours for locals and tourists. Strong summer seasonality balanced with a steady local baseline.",
    "archetype": "transactional",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },

  "assumptions": {
    "pricing": {
      "avg_unit_price": { 
        "value": 4.5, 
        "unit": "EUR_per_unit", 
        "rationale": "Artisanal ice cream in Helsinki is typically 4–6 EUR per scoop; 4.5 EUR chosen to balance local affordability and premium perception for tourists." 
      },
      "discount_pct": { 
        "value": 0.05, 
        "unit": "ratio", 
        "rationale": "Average effective discount from loyalty punch cards, group deals, and occasional promotions (~5%)." 
      }
    },

    "financial": {
      "interest_rate": { 
        "value": 0.10, 
        "unit": "ratio", 
        "rationale": "10% discount rate as a reasonable hurdle for NPV in early-stage retail F&B in Helsinki." 
      }
    },

    "customers": {
      "segments": [
        {
          "id": "locals",
          "label": "Local Customers",
          "kind": "demand",
          "rationale": "Helsinki residents and office workers provide steady baseline demand year-round, less volatile than tourist traffic.",
          "volume": {
            "type": "pattern",
            "pattern_type": "seasonal_growth",
            "seasonality_index_12": [0.6,0.7,0.8,1.0,1.1,1.3,1.4,1.3,1.0,0.8,0.7,0.6],
            "base_year_total": { 
              "value": 12000, 
              "unit": "units", 
              "rationale": "≈1,000 scoops/month average; mild summer uplift consistent with a stable, loyal customer base." 
            },
            "yoy_growth": { 
              "value": 0.02, 
              "unit": "annual_rate", 
              "rationale": "2% YoY growth from loyalty incentives, repeat visits, and word-of-mouth." 
            },
            "fallback_formula": "n/a"
          }
        },
        {
          "id": "tourists",
          "label": "Tourist Customers",
          "kind": "demand",
          "rationale": "Tourist traffic peaks in summer months and represents a large share of sales during May–September.",
          "volume": {
            "type": "pattern",
            "pattern_type": "seasonal_growth",
            "seasonality_index_12": [0.2,0.2,0.5,1.0,1.5,2.5,3.0,2.5,1.2,0.5,0.2,0.1],
            "base_year_total": { 
              "value": 12000, 
              "unit": "units", 
              "rationale": "≈12,000 scoops in Year 1; ~70% sold in May–Sep, reflecting Helsinki's tourist seasonality." 
            },
            "yoy_growth": { 
              "value": 0.04, 
              "unit": "annual_rate", 
              "rationale": "Tourism demand expected to grow ~4% YoY; central location ensures strong capture of this growth." 
            },
            "fallback_formula": "n/a"
          }
        }
      ]
    },

    "unit_economics": {
      "cogs_pct": { 
        "value": 0.35, 
        "unit": "ratio", 
        "rationale": "Premium ice cream targets ~65% gross margin; ingredients, cones/cups, toppings, and supplies ~35% of revenue." 
      },
      "cac": { 
        "value": 1.0, 
        "unit": "EUR", 
        "rationale": "Low acquisition cost due to heavy foot traffic; modest spend on social ads and small promotions (~1 EUR per incremental customer)." 
      }
    },

    "opex": [
      {
        "name": "Sales & Marketing",
        "value": { 
          "value": 2000, 
          "unit": "EUR_per_month", 
          "rationale": "Paid social, influencer partnerships, and seasonal campaigns; heavier in summer, averaged annually." 
        }
      },
      {
        "name": "R&D",
        "value": { 
          "value": 500, 
          "unit": "EUR_per_month", 
          "rationale": "Flavor development, small pilot batches, and seasonal menus; steady innovation budget." 
        }
      },
      {
        "name": "G&A",
        "value": { 
          "value": 8000, 
          "unit": "EUR_per_month", 
          "rationale": "Central Helsinki rent (~6.5–7.0k EUR) plus utilities, insurance, accounting, and admin overhead." 
        }
      }
    ]
  },

  "drivers": [
    {
      "key": "price",
      "path": "assumptions.pricing.avg_unit_price.value",
      "range": [3.5, 4.0, 4.5, 5.0, 5.5],
      "rationale": "Price sensitivity testing: lower range appeals to locals, higher range leverages tourist willingness-to-pay."
    },
    {
      "key": "cac",
      "path": "assumptions.unit_economics.cac.value",
      "range": [0.5, 1.0, 1.5, 2.0, 2.5],
      "rationale": "CAC may vary depending on effectiveness of organic foot traffic vs. reliance on paid digital marketing."
    }
  ]
}`;