import { generateModularTemplate } from '@/components/market-analysis/MarketAnalysisTemplate';

console.log('\n' + '='.repeat(80));
console.log('MODULAR TEMPLATE SIZE COMPARISON');
console.log('='.repeat(80) + '\n');

// Generate templates with different module combinations
const templates = {
  'Single Module (Market Sizing)': generateModularTemplate(['market_sizing']),
  'Two Modules (Market + Competitive)': generateModularTemplate(['market_sizing', 'competitive_intelligence']),
  'Three Modules (Market + Competitive + Customer)': generateModularTemplate(['market_sizing', 'competitive_intelligence', 'customer_analysis']),
  'All Modules (Complete)': generateModularTemplate(['market_sizing', 'competitive_intelligence', 'customer_analysis', 'strategic_planning'])
};

// Display size comparison
Object.entries(templates).forEach(([name, template]) => {
  const parsed = JSON.parse(template);
  const lines = template.split('\n').length;
  const chars = template.length;
  const kb = (chars / 1024).toFixed(2);
  
  const dataModules = [];
  if (parsed.market_sizing) dataModules.push('market_sizing');
  if (parsed.competitive_landscape) dataModules.push('competitive_landscape');
  if (parsed.customer_analysis) dataModules.push('customer_analysis');
  if (parsed.strategic_planning) dataModules.push('strategic_planning');
  
  const instructionModules = Object.keys(parsed.instructions?.module_independence?.modules || {});
  
  console.log(`📄 ${name}`);
  console.log(`   Size: ${lines} lines, ${chars} chars (${kb} KB)`);
  console.log(`   Data sections: [${dataModules.join(', ')}]`);
  console.log(`   Instruction modules: [${instructionModules.join(', ')}]`);
  console.log('');
});

// Calculate reduction
const singleSize = templates['Single Module (Market Sizing)'].length;
const fullSize = templates['All Modules (Complete)'].length;
const reduction = ((1 - singleSize / fullSize) * 100).toFixed(1);

console.log('='.repeat(80));
console.log(`✅ Size Reduction: Single module template is ${reduction}% smaller than full template`);
console.log('='.repeat(80) + '\n');
