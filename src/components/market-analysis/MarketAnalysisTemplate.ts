export const MarketAnalysisTemplate = `{
  "schema_version": "1.0",
  "instructions": {
    "purpose": "Populate this JSON with market analysis data to understand market opportunities and derive realistic volume estimates. Use results to inform business case volume assumptions.",
    "rules": [
      "Replace TODOs with actual values.",
      "Every numeric datum must have value, unit, and rationale.",
      "Focus on market sizing, competitive landscape, and penetration strategy.",
      "The output volume estimates can be used to validate business case assumptions.",
      "Market share progression follows the penetration strategy over the defined timeframe."
    ],
    "penetration_strategies": {
      "linear": "Steady, consistent market share growth over time",
      "exponential": "Rapid early growth that slows down over time",
      "s_curve": "Slow start, rapid middle phase, then gradual approach to target"
    },
    "usage_flow": [
      "1. Define your Total Addressable Market (TAM)",
      "2. Narrow down to Serviceable Addressable Market (SAM)",
      "3. Estimate realistic Serviceable Obtainable Market (SOM)",
      "4. Set current and target market share with timeframe",
      "5. Analyze competitive landscape",
      "6. Review calculated volume projections",
      "7. Use insights to inform business case volume assumptions"
    ]
  },
  "meta": {
    "title": "TODO-Market Analysis Title",
    "description": "TODO-Market analysis description",
    "currency": "EUR",
    "base_year": 2024,
    "analysis_horizon_years": 5,
    "created_date": "TODO-YYYY-MM-DD",
    "analyst": "TODO-Analyst Name"
  },
  "market_sizing": {
    "total_addressable_market": {
      "base_value": { "value": 0.0, "unit": "EUR", "rationale": "TODO-Total market size in base year with supporting data sources" },
      "growth_rate": { "value": 0.0, "unit": "percentage_per_year", "rationale": "TODO-Annual market growth rate with historical trends and forecasts" },
      "market_definition": "TODO-Clear definition of what constitutes the total addressable market",
      "data_sources": [
        "TODO-Source 1 (e.g., Industry reports, government data)",
        "TODO-Source 2 (e.g., Company research, analyst reports)"
      ]
    },
    "serviceable_addressable_market": {
      "percentage_of_tam": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Portion of TAM that is addressable given geographic, regulatory, or capability constraints" },
      "geographic_constraints": "TODO-Geographic limitations",
      "regulatory_constraints": "TODO-Regulatory or compliance limitations",
      "capability_constraints": "TODO-Technical or operational capability limitations"
    },
    "serviceable_obtainable_market": {
      "percentage_of_sam": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Realistic obtainable portion considering competition and resources" },
      "resource_constraints": "TODO-Financial, human, or operational resource limitations",
      "competitive_barriers": "TODO-Competitive barriers to market entry or expansion",
      "time_constraints": "TODO-Time-to-market or timing considerations"
    }
  },
  "market_share": {
    "current_position": {
      "current_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Current market position with supporting data" },
      "market_entry_date": "TODO-When did you enter this market",
      "current_revenue": { "value": 0.0, "unit": "EUR_per_year", "rationale": "TODO-Current annual revenue from this market" }
    },
    "target_position": {
      "target_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Target market share with justification for achievability" },
      "target_timeframe": { "value": 5, "unit": "years", "rationale": "TODO-Timeframe to reach target with supporting strategy" },
      "penetration_strategy": "linear",
      "key_milestones": [
        {
          "year": 1,
          "milestone": "TODO-Year 1 milestone",
          "target_share": 0.0,
          "rationale": "TODO-Why this milestone is achievable"
        },
        {
          "year": 3,
          "milestone": "TODO-Year 3 milestone", 
          "target_share": 0.0,
          "rationale": "TODO-Mid-term progress expectations"
        }
      ]
    },
    "penetration_drivers": [
      {
        "driver": "TODO-Driver name (e.g., Product differentiation)",
        "impact": "high|medium|low",
        "description": "TODO-How this driver will help gain market share",
        "timeline": "TODO-When this driver becomes effective"
      }
    ]
  },
  "competitive_landscape": {
    "market_structure": {
      "concentration_level": "fragmented|moderately_concentrated|highly_concentrated",
      "concentration_rationale": "TODO-Explanation of market concentration level",
      "barriers_to_entry": "low|medium|high",
      "barriers_description": "TODO-Description of entry barriers"
    },
    "competitors": [
      {
        "name": "TODO-Competitor name",
        "market_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Competitor's market position and trend" },
        "positioning": "TODO-Competitor's positioning strategy and value proposition",
        "strengths": ["TODO-Key strength 1", "TODO-Key strength 2"],
        "weaknesses": ["TODO-Key weakness 1", "TODO-Key weakness 2"],
        "threat_level": "high|medium|low",
        "competitive_response": "TODO-Expected response to your market entry/expansion"
      }
    ],
    "competitive_advantages": [
      {
        "advantage": "TODO-Your competitive advantage",
        "sustainability": "high|medium|low",
        "rationale": "TODO-Why this advantage is sustainable and valuable"
      }
    ]
  },
  "customer_analysis": {
    "market_segments": [
      {
        "id": "segment_1",
        "name": "TODO-Market segment name",
        "size_percentage": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Segment size as % of TAM" },
        "growth_rate": { "value": 0.0, "unit": "percentage_per_year", "rationale": "TODO-Segment-specific growth rate" },
        "target_share": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Target share in this segment" },
        "customer_profile": "TODO-Description of typical customers in this segment",
        "value_drivers": ["TODO-What drives value for these customers"],
        "entry_strategy": "TODO-How you plan to enter/expand in this segment"
      }
    ],
    "customer_economics": {
      "average_customer_value": {
        "annual_value": { "value": 0.0, "unit": "EUR_per_customer_per_year", "rationale": "TODO-Average annual customer value with calculation basis" },
        "lifetime_value": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-Customer lifetime value calculation" },
        "acquisition_cost": { "value": 0.0, "unit": "EUR_per_customer", "rationale": "TODO-Estimated customer acquisition cost in this market" }
      },
      "customer_behavior": {
        "purchase_frequency": { "value": 0.0, "unit": "purchases_per_year", "rationale": "TODO-How often customers make purchases" },
        "loyalty_rate": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Customer retention/loyalty rate" },
        "referral_rate": { "value": 0.0, "unit": "percentage", "rationale": "TODO-Rate at which customers refer others" }
      }
    }
  },
  "market_dynamics": {
    "growth_drivers": [
      {
        "driver": "TODO-Growth driver name",
        "impact": "high|medium|low",
        "timeline": "TODO-When this driver takes effect",
        "description": "TODO-How this driver affects market growth"
      }
    ],
    "market_risks": [
      {
        "risk": "TODO-Market risk",
        "probability": "high|medium|low",
        "impact": "high|medium|low",
        "mitigation": "TODO-How to mitigate this risk"
      }
    ],
    "technology_trends": [
      {
        "trend": "TODO-Technology trend",
        "relevance": "high|medium|low",
        "impact_timeline": "TODO-When this trend affects the market",
        "strategic_response": "TODO-How to respond to this trend"
      }
    ]
  },
  "volume_projections": {
    "calculation_method": "market_share_based",
    "assumptions": {
      "market_growth_compounds": true,
      "share_growth_independent": false,
      "customer_value_stable": true
    },
    "sensitivity_factors": [
      {
        "factor": "market_growth_rate",
        "base_case": 0.0,
        "optimistic": 0.0,
        "pessimistic": 0.0,
        "rationale": "TODO-Sensitivity of market growth rate"
      },
      {
        "factor": "penetration_speed",
        "base_case": "linear",
        "optimistic": "exponential", 
        "pessimistic": "s_curve",
        "rationale": "TODO-Sensitivity of market penetration strategy"
      }
    ]
  }
}`;
