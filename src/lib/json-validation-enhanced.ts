import { BusinessData } from '@/contexts/BusinessDataContext';

/**
 * Validation utility to check for common business logic errors in JSON business cases
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export function validateBusinessCaseJSON(data: BusinessData): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check for growth pattern duplication
  const hasGlobalGrowthSettings = checkGlobalGrowthSettings(data);
  const hasSegmentGrowthPatterns = checkSegmentGrowthPatterns(data);
  
  if (hasGlobalGrowthSettings && hasSegmentGrowthPatterns) {
    warnings.push(
      "Growth patterns defined in both global growth_settings AND segment-level patterns. " +
      "Segment-level patterns will take precedence. Consider using only one approach for consistency."
    );
  }

  // Check for multiple growth patterns populated
  const populatedPatterns = countPopulatedGrowthPatterns(data);
  if (populatedPatterns > 1) {
    errors.push(
      `Multiple growth patterns are populated (${populatedPatterns} patterns). ` +
      "Only ONE growth pattern should be used per business case."
    );
  }

  // Validate business model alignment
  const businessModel = data.meta?.business_model;
  validateBusinessModelAlignment(data, businessModel, warnings, errors);

  // Check driver path validity (basic check)
  validateDriverPaths(data, warnings, errors);

  // Check for missing rationales
  validateRationales(data, warnings);

  // Provide suggestions
  if (data.assumptions?.customers?.segments?.length === 1 && hasSegmentGrowthPatterns) {
    suggestions.push(
      "Since you have only one customer segment, consider using global growth_settings instead of segment-level patterns for simplicity."
    );
  }

  if (!data.drivers || data.drivers.length === 0) {
    suggestions.push(
      "Consider adding sensitivity analysis drivers for key parameters like pricing, growth rates, or costs."
    );
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    warnings,
    errors,
    suggestions
  };
}

function checkGlobalGrowthSettings(data: BusinessData): boolean {
  const growth = data.assumptions?.growth_settings;
  if (!growth) return false;

  return !!(
    (growth.geom_growth?.start?.value || 0) > 0 ||
    (growth.geom_growth?.monthly_growth?.value || 0) > 0 ||
    (growth.seasonal_growth?.base_year_total?.value || 0) > 0 ||
    (growth.linear_growth?.start?.value || 0) > 0 ||
    (growth.linear_growth?.monthly_flat_increase?.value || 0) > 0
  );
}

function checkSegmentGrowthPatterns(data: BusinessData): boolean {
  const segments = data.assumptions?.customers?.segments || [];
  return segments.some(segment => 
    segment.volume?.pattern_type || 
    (segment.volume?.series && segment.volume.series.length > 0)
  );
}

function countPopulatedGrowthPatterns(data: BusinessData): number {
  const growth = data.assumptions?.growth_settings;
  if (!growth) return 0;

  let count = 0;

  // Check geometric growth
  if ((growth.geom_growth?.start?.value || 0) > 0 || 
      (growth.geom_growth?.monthly_growth?.value || 0) > 0) {
    count++;
  }

  // Check seasonal growth
  if ((growth.seasonal_growth?.base_year_total?.value || 0) > 0) {
    count++;
  }

  // Check linear growth
  if ((growth.linear_growth?.start?.value || 0) > 0 || 
      (growth.linear_growth?.monthly_flat_increase?.value || 0) > 0) {
    count++;
  }

  return count;
}

function validateBusinessModelAlignment(
  data: BusinessData, 
  businessModel: string | undefined,
  warnings: string[],
  errors: string[]
): void {
  if (!businessModel) {
    errors.push("Business model is not specified in meta.business_model");
    return;
  }

  switch (businessModel) {
    case 'recurring':
      if (!data.assumptions?.customers?.churn_pct) {
        warnings.push("Recurring business model should specify churn_pct for accurate customer lifecycle calculations");
      }
      break;
    
    case 'cost_savings':
      if (!data.assumptions?.cost_savings?.baseline_costs?.length && 
          !data.assumptions?.cost_savings?.efficiency_gains?.length) {
        errors.push("Cost savings business model requires either baseline_costs or efficiency_gains to be defined");
      }
      break;
    
    case 'unit_sales':
      // Unit sales model is more flexible, just check for basic pricing
      if (!data.assumptions?.pricing?.avg_unit_price?.value) {
        warnings.push("Unit sales business model should specify avg_unit_price");
      }
      break;
    
    default:
      errors.push(`Unknown business model: ${businessModel}. Must be 'recurring', 'unit_sales', or 'cost_savings'`);
  }
}

function validateDriverPaths(data: BusinessData, warnings: string[], errors: string[]): void {
  const drivers = data.drivers || [];
  
  for (const driver of drivers) {
    if (!driver.path) {
      errors.push(`Driver '${driver.key}' is missing a path`);
      continue;
    }

    // Basic path validation - check if it looks like a valid path to a .value field
    if (!driver.path.endsWith('.value')) {
      warnings.push(`Driver '${driver.key}' path '${driver.path}' should end with '.value'`);
    }

    // Check for array index paths which are more error-prone
    if (driver.path.includes('[') && driver.path.includes(']')) {
      warnings.push(`Driver '${driver.key}' uses array index path which may be fragile: ${driver.path}`);
    }
  }
}

function validateRationales(data: BusinessData, warnings: string[]): void {
  // Check for TODO placeholders in rationales
  const checkForTodos = (obj: any, path: string = '') => {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (key === 'rationale' && typeof value === 'string' && value.includes('TODO')) {
          warnings.push(`Rationale contains TODO placeholder at ${currentPath}`);
        } else if (typeof value === 'object') {
          checkForTodos(value, currentPath);
        }
      }
    }
  };

  checkForTodos(data);
}
