# Inline Assumptions Editing Implementation

## Overview

The Business Case Analyzer includes a robust inline editing system for assumptions that allows users to modify values and rationales directly in the assumptions table without modal dialogs or separate edit screens.

## Features

### 1. Inline Value Editing
- Click on any editable value cell to enter edit mode
- Automatically handles different value types:
  - **Currency values**: Removes symbols, handles commas
  - **Percentages/Ratios**: Displays as percentage (10% instead of 0.10), converts back to ratio on save
  - **Regular numbers**: Standard numeric input
- **Validation**: Real-time validation with error messages
- **Save triggers**: 
  - Enter key
  - Click outside (blur)
  - ESC key cancels without saving
- **Visual feedback**: Red indicator appears on rationale when value is changed but rationale isn't updated

### 2. Inline Rationale Editing
- Click on rationale text to open textarea editor
- Supports multi-line text
- **Save triggers**:
  - Ctrl+Enter
  - Click outside (blur)
  - ESC key cancels without saving
- **Red indicator system**: Turns red when corresponding value is changed, clears when rationale is updated

### 3. Sensitivity Driver Management
- **Checkbox column**: Add/remove sensitivity drivers directly from assumptions table
- **Driver badge**: Orange "S" badge appears next to values that are sensitivity drivers
- **Range editor**: Click badge to open popover with 5 input fields for range values
- **Remove functionality**: Delete button in popover removes driver
- **Integration**: Drivers automatically sync with sensitivity analysis tools on Cash Flow and Financial Analysis tabs

## Technical Architecture

### Core Components

#### 1. Value Parsers (`src/lib/value-parsers.ts`)
```typescript
// Parse string input to numeric value based on unit type
parseValue(input: string, unit: string): number

// Format numeric value for editing display
formatEditValue(value: any, unit: string): string

// Validate parsed value
validateValue(value: number, unit: string): { isValid: boolean; error?: string }

// Check if unit type should be editable
isEditableUnit(unit: string): boolean
```

**Supported Units**:
- `ratio`, `%`, `pct`, `percentage`, `churn` → Treated as percentages
- Currency units (`EUR`, `USD`, etc.) → Formatted with currency symbols
- `pattern`, `seasonal`, `multiplier`, `frequency`, `n/a` → Not editable

#### 2. EditableValueCell (`src/components/business-case/EditableValueCell.tsx`)
- Single-click to edit
- Handles numeric input with validation
- Shows error messages inline
- Calls `onValueChanged` callback to trigger red indicator on rationale
- Updates data via `updateAssumption` context method

#### 3. EditableRationaleCell (`src/components/business-case/EditableRationaleCell.tsx`)
- Single-click to edit
- Textarea for multi-line text
- `needsUpdate` prop controls red text styling
- Ctrl+Enter or blur to save
- Clears red indicator when updated

#### 4. SensitivityDriverBadge (`src/components/business-case/SensitivityDriverBadge.tsx`)
- Orange "S" badge with Sliders icon
- Popover containing:
  - 5 input fields for range values
  - Labels: Very Low, Low, Base, High, Very High
  - Remove button
- `onUpdateRange` and `onRemove` callbacks

#### 5. AssumptionsTab (`src/components/business-case/AssumptionsTab.tsx`)
Main integration component with:
- **State Management**:
  - `changedValuePaths`: Set<string> - tracks which values changed
  - Helper methods: `handleValueUpdate`, `handleRationaleUpdate`, `rationaleNeedsUpdate`
- **Driver Management**:
  - `isDriver(path)`: Check if path is a driver
  - `getDriver(path)`: Get driver by path
  - `handleToggleDriver(row)`: Add/remove driver via checkbox
- **Table Structure**:
  - Checkbox column (12px width)
  - Label column
  - Value column (EditableValueCell)
  - Unit column (read-only)
  - Rationale column (EditableRationaleCell with red indicator)

### Data Flow

#### Value Update Flow:
```
User clicks value → EditableValueCell enters edit mode
→ User types new value → Enter pressed
→ parseValue() converts input to number
→ validateValue() checks validity
→ updateAssumption() saves to context
→ onValueChanged() adds path to changedValuePaths
→ Rationale turns red (needsUpdate=true)
```

#### Rationale Update Flow:
```
User clicks rationale → EditableRationaleCell enters edit mode
→ User types new text → Ctrl+Enter pressed
→ updateAssumption() saves to context
→ onRationaleChanged() removes path from changedValuePaths
→ Red indicator clears (needsUpdate=false)
```

#### Driver Management Flow:
```
User checks checkbox → handleToggleDriver()
→ If checked: addDriver() creates new driver with default range
→ If unchecked: removeDriver() deletes driver
→ SensitivityDriverBadge appears/disappears
→ Badge click opens popover for range editing
→ Range changes call updateDriverRange()
→ All changes sync to Cash Flow & Financial Analysis tabs
```

## BusinessDataContext Integration

### Methods Used:
```typescript
// Update any nested field in assumptions
updateAssumption(path: string, value: any): void

// Add new sensitivity driver
addDriver(label: string, path: string, range: number[], rationale: string): void

// Remove sensitivity driver by path
removeDriver(path: string): void

// Update driver range values
updateDriverRange(path: string, range: number[]): void
```

### Data Paths:
Examples of paths used for nested updates:
- `assumptions.revenue.unit_price.value`
- `assumptions.unit_economics.cogs_pct.value`
- `assumptions.growth.monthly_growth_rate.value`
- `assumptions.financial.interest_rate.value`
- `assumptions.opex[0].value.value`
- `assumptions.capex[0].timeline.series[0].value`

## User Experience Design

### Visual Indicators:
1. **Editable cells**: Subtle hover effect, cursor changes to pointer
2. **Edit mode**: Input/textarea with border, focus ring
3. **Red rationale**: Bright red text when value changed but rationale not updated
4. **Driver checkbox**: Standard checkbox, checked when field is a driver
5. **Driver badge**: Orange "S" badge with hover effect
6. **Validation errors**: Red error message below input field

### Keyboard Shortcuts:
- **Enter**: Save value edit
- **Ctrl+Enter**: Save rationale edit
- **ESC**: Cancel edit without saving
- **Tab**: Not implemented (could navigate between cells)

## Best Practices

### For Developers:

1. **Always use value-parsers utilities**: Don't parse values manually
2. **Use path-based updates**: Leverage `updateAssumption` with dot notation paths
3. **Track changed values**: Use Set for O(1) lookups
4. **Clear indicators on save**: Always remove paths from `changedValuePaths` when rationale updated
5. **Validate before save**: Use `validateValue` to catch errors early

### For Users:

1. **Update rationales when changing values**: Red text indicates stale rationale
2. **Use sensitivity drivers**: Checkbox approach makes it easy to test scenarios
3. **Edit ranges after adding driver**: Click orange badge to customize range values
4. **Watch for validation errors**: System will prevent invalid values
5. **ESC to cancel**: No changes saved if you press ESC while editing

## Future Enhancements

### Potential Improvements:
- [ ] Undo/Redo functionality
- [ ] Keyboard navigation (Tab between cells)
- [ ] Batch edit multiple values
- [ ] Copy/paste values between cells
- [ ] History of changes with timestamps
- [ ] Export edited assumptions as JSON
- [ ] Validation rules per field type
- [ ] Custom range presets for drivers
- [ ] Bulk driver management
- [ ] Search/filter in assumptions table

## Testing Notes

### Manual Testing Checklist:
- [ ] Edit currency values (removes €, $, etc.)
- [ ] Edit percentages (displays as %, saves as ratio)
- [ ] Edit regular numbers
- [ ] Validate error messages for invalid input
- [ ] Red indicator appears when value changed
- [ ] Red indicator clears when rationale updated
- [ ] Checkbox adds/removes drivers
- [ ] Driver badge appears for active drivers
- [ ] Range editor saves changes correctly
- [ ] ESC cancels edits
- [ ] Enter/Ctrl+Enter saves edits
- [ ] Click outside saves edits
- [ ] Interest rate with '%' unit works correctly (NPV calculation fix)

### Known Issues:
- None currently identified

## Related Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [SHARED_DATA_MANAGEMENT.md](./SHARED_DATA_MANAGEMENT.md) - Context and data flow
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Usage examples
