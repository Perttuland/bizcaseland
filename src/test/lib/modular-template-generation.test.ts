import { describe, it, expect } from 'vitest';
import { generateModularTemplate } from '@/components/market-analysis/MarketAnalysisTemplate';

describe('Modular Template Generation', () => {
  it('should generate template with only market_sizing module', () => {
    const template = generateModularTemplate(['market_sizing']);
    const parsed = JSON.parse(template);
    
    // Should have base sections
    expect(parsed.schema_version).toBeDefined();
    expect(parsed.meta).toBeDefined();
    expect(parsed.instructions).toBeDefined();
    
    // Should have market_sizing data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    
    // Should NOT have other module data sections
    expect(parsed.competitive_landscape).toBeUndefined();
    expect(parsed.customer_analysis).toBeUndefined();
    expect(parsed.strategic_planning).toBeUndefined();
    
    // Instructions should be filtered
    const modulesInInstructions = Object.keys(parsed.instructions.module_independence.modules);
    expect(modulesInInstructions).toHaveLength(1);
    expect(modulesInInstructions).toContain('market_sizing');
    
    const presentationOrder = Object.keys(parsed.instructions.ai_workflow_protocol.collaborative_mode.presentation_order);
    expect(presentationOrder).toHaveLength(1);
    expect(presentationOrder).toContain('market_sizing');
  });
  
  it('should generate template with market_sizing and competitive_intelligence', () => {
    const template = generateModularTemplate(['market_sizing', 'competitive_intelligence']);
    const parsed = JSON.parse(template);
    
    // Should have selected module data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    expect(parsed.competitive_landscape).toBeDefined();
    
    // Should NOT have unselected module data sections
    expect(parsed.customer_analysis).toBeUndefined();
    expect(parsed.strategic_planning).toBeUndefined();
    
    // Instructions should be filtered to 2 modules
    const modulesInInstructions = Object.keys(parsed.instructions.module_independence.modules);
    expect(modulesInInstructions).toHaveLength(2);
    expect(modulesInInstructions).toContain('market_sizing');
    expect(modulesInInstructions).toContain('competitive_intelligence');
    
    const presentationOrder = Object.keys(parsed.instructions.ai_workflow_protocol.collaborative_mode.presentation_order);
    expect(presentationOrder).toHaveLength(2);
  });
  
  it('should generate full template with all modules', () => {
    const template = generateModularTemplate([
      'market_sizing',
      'competitive_intelligence',
      'customer_analysis',
      'strategic_planning'
    ]);
    const parsed = JSON.parse(template);
    
    // Should have all module data sections
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.market_share).toBeDefined();
    expect(parsed.competitive_landscape).toBeDefined();
    expect(parsed.customer_analysis).toBeDefined();
    expect(parsed.strategic_planning).toBeDefined();
    
    // Instructions should include all 4 modules
    const modulesInInstructions = Object.keys(parsed.instructions.module_independence.modules);
    expect(modulesInInstructions).toHaveLength(4);
    
    const presentationOrder = Object.keys(parsed.instructions.ai_workflow_protocol.collaborative_mode.presentation_order);
    expect(presentationOrder).toHaveLength(4);
  });
  
  it('should generate smaller templates for fewer modules', () => {
    const template1 = generateModularTemplate(['market_sizing']);
    const template4 = generateModularTemplate([
      'market_sizing',
      'competitive_intelligence',
      'customer_analysis',
      'strategic_planning'
    ]);
    
    // Single module template should be significantly smaller
    expect(template1.length).toBeLessThan(template4.length);
    
    // Should be at least 30% smaller
    const reductionPercent = (1 - template1.length / template4.length) * 100;
    expect(reductionPercent).toBeGreaterThan(30);
  });
  
  it('should update instructions note to reflect selected modules', () => {
    const template1 = generateModularTemplate(['market_sizing']);
    const parsed1 = JSON.parse(template1);
    expect(parsed1.instructions.module_independence.note).toContain('market sizing');
    
    const template2 = generateModularTemplate(['market_sizing', 'customer_analysis']);
    const parsed2 = JSON.parse(template2);
    expect(parsed2.instructions.module_independence.note).toContain('market sizing');
    expect(parsed2.instructions.module_independence.note).toContain('customer analysis');
  });
  
  it('should update rules to focus on selected modules', () => {
    const template = generateModularTemplate(['competitive_intelligence']);
    const parsed = JSON.parse(template);
    
    const focusRule = parsed.instructions.rules.find((rule: string) => 
      rule.includes('Focus on')
    );
    
    expect(focusRule).toBeDefined();
    expect(focusRule).toContain('competitive intelligence');
  });
});
