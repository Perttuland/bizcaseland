/**
 * JSON Template for adding new customer segments to existing business cases
 * This follows the Business Case data structure, NOT Market Analysis
 */

export const SegmentTemplate = `{
  "instructions": {
    "purpose": "Add a new customer segment to an existing business case. This will be MERGED with your current data - existing segments, pricing, and costs remain unchanged.",
    "rules": [
      "Replace all TODO items with actual values for YOUR new segment",
      "Each field must have: value (number), unit (string), and rationale (explanation)",
      "Choose ONE volume pattern: geometric_growth (percentage compound), linear_growth (fixed increment), or seasonal_growth (yearly with seasonality)",
      "The segment 'id' must be unique (e.g., 'enterprise', 'smb', 'government') - if ID exists, it will UPDATE that segment",
      "Set rationale fields to explain your assumptions clearly - this helps others understand your analysis"
    ],
    "volume_patterns": {
      "geometric_growth": "Compound percentage growth. Example: Start with 50 customers, grow 15% monthly → Month 1: 50, Month 2: 57.5, Month 3: 66...",
      "linear_growth": "Fixed number increase each period. Example: Start with 25 customers, add 10 monthly → Month 1: 25, Month 2: 35, Month 3: 45...",
      "seasonal_growth": "Year-over-year growth with seasonal variations. Example: Start with 100 customers, 20% YoY growth with Q4 peaks"
    },
    "important_notes": [
      "This template ONLY adds customer segments - pricing, OpEx, CapEx from your existing business case are NOT affected",
      "All segments in your business case share the same pricing (avg_unit_price) and cost structure",
      "After import, you'll be automatically redirected to the Volume tab to see your new segment"
    ]
  },
  "assumptions": {
    "customers": {
      "segments": [
        {
          "id": "TODO_unique_segment_id",
          "label": "TODO: Segment Name (e.g., Enterprise Customers)",
          "name": "TODO: Display Name",
          "rationale": "TODO: Explain why this segment is important and how it differs from existing segments",
          "volume": {
            "base_value": 0,
            "unit": "customers_per_month",
            "rationale": "TODO: Explain the starting customer count for this segment",
            "pattern_type": "geometric_growth",
            "growth_rate": 0.10,
            "growth_rationale": "TODO: Explain the expected growth rate (e.g., 10% monthly compound growth due to viral adoption)"
          }
        }
      ]
    }
  }
}`;

export const SegmentTemplateInstructions = {
  title: "Add New Customer Segment",
  description: "Use this template to add new customer segments to your existing business case. The system will merge this with your current data.",
  instructions: [
    "1. Copy the template above or click 'Copy Template to Clipboard'",
    "2. Replace all TODO items with your segment's actual data",
    "3. Set a unique 'id' (e.g., 'enterprise', 'smb', 'government')",
    "4. Choose a growth pattern type (see examples below)",
    "5. Paste the completed JSON in the textarea above",
    "6. Click 'Update Data' - your new segment will be ADDED to existing segments"
  ],
  examples: {
    geometric_growth: {
      description: "Percentage-based growth (compound)",
      pattern: {
        "base_value": 50,
        "unit": "customers_per_month",
        "pattern_type": "geometric_growth",
        "growth_rate": 0.15,
        "rationale": "Starting with 50 customers",
        "growth_rationale": "15% monthly growth through digital marketing"
      }
    },
    linear_growth: {
      description: "Fixed number increase each period",
      pattern: {
        "base_value": 25,
        "unit": "customers_per_month",
        "pattern_type": "linear_growth",
        "growth_rate": 10,
        "rationale": "Starting with 25 customers",
        "growth_rationale": "Adding 10 new customers per month through direct sales"
      }
    },
    seasonal_growth: {
      description: "Year-over-year with seasonal variations",
      pattern: {
        "base_value": 100,
        "unit": "customers_per_month",
        "pattern_type": "seasonal_growth",
        "growth_rate": 0.20,
        "rationale": "Starting with 100 customers",
        "growth_rationale": "20% YoY growth with seasonal peaks in Q4"
      }
    }
  },
  notes: [
    "⚠️ This template ONLY adds customer segments - pricing, OpEx, CapEx remain unchanged",
    "💡 If you use an existing segment 'id', it will UPDATE that segment instead of adding",
    "✓ All segments share the same pricing (avg_unit_price) and cost structure from your business case"
  ]
};

export const generateSegmentOnlyTemplate = (segmentId: string = "new_segment") => {
  return `{
  "assumptions": {
    "customers": {
      "segments": [
        {
          "id": "${segmentId}",
          "label": "TODO: Segment Name",
          "name": "TODO: Display Name",
          "rationale": "TODO: Why this segment matters",
          "volume": {
            "base_value": 0,
            "unit": "customers_per_month",
            "rationale": "TODO: Starting customer count for this segment",
            "pattern_type": "geometric_growth",
            "growth_rate": 0.10,
            "growth_rationale": "TODO: Expected growth (10% monthly shown as example)"
          }
        }
      ]
    }
  }
}`;
};

export const downloadSegmentTemplate = () => {
  const blob = new Blob([SegmentTemplate], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business-case-add-segment.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
