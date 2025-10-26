# Business Case Partial Data Support Implementation Plan

## Executive Summary

This document outlines the plan to enable **incremental customer segment updates** for business case analysis.

**Goal:** Add new customer segments to existing business case without replacing other data.

**Status:** ✅ IMPLEMENTED

## Implementation Details

### Data Management Tab Structure
Restructured as tabbed interface with 5 sub-pages:
1. **Copy Template** - Full business case template
2. **Modify Segment Data** - Add/update segments only
3. **Load Sample Data** - Example business cases
4. **Export as JSON** - Download current data
5. **Export as PDF** - Generate report

### Segment Template
- Simplified template for segment-only data (see `SegmentTemplateInstructions.md`)
- Follows same patterns as full template (geometric_growth, linear_growth, seasonal_growth)
- Merges with existing data without affecting pricing/OpEx/CapEx

### User Flow
1. Load complete business case (e.g., "Small Business" segment)
2. Switch to "Modify Segment Data" tab
3. Copy segment template → fill in new segment data
4. Import → automatically redirects to Volume tab to view results

