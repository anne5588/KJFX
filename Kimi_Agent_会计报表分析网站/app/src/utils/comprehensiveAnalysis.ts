// ==================== 智能综合分析引擎 ====================
// 结合四大报表、科目余额表、明细账，生成综合结论和重点关注事项

import type { FinancialData } from './excelParser';
import type { ReconciliationResult } from './reportReconciliation';
import type { DetailedSubjectAnalysis } from './detailedSubjectAnalysis';

export interface ComprehensiveAnalysis {
  // 整体健康度评分
  healthScore: HealthScore;
  
  // 综合结论
  overallAssessment: OverallAssessment;
  
  // 重点关注事项
  keyConcerns: KeyConcern[];
  
  // 风险矩阵
  riskMatrix: RiskMatrix;
  
  // 管理建议
  managementSuggestions: ManagementSuggestion[];
  
  // 深度洞察
  insights: Insight[];
}

// 健康度评分
export interface HealthScore {
  overall: number;           // 0-100
  profitability: number;     // 盈利能力
  liquidity: number;         // 流动性
  solvency: number;          // 偿债能力
  operation: number;         // 营运能力
  growth: number;            // 成长能力
  assessment: string;
}

// 综合结论
export interface OverallAssessment {
  summary: string;           // 一句话总结
  businessStatus: string;    // 经营状况
  financialStatus: string;   // 财务状况
  cashFlowStatus: string;    // 现金流状况
  riskLevel: 'high' | 'medium' | 'low';
}

// 重点关注事项
export interface KeyConcern {
  priority: number;          // 优先级 1-10
  category: 'cash' | 'receivable' | 'inventory' | 'debt' | 'profit' | 'operation' | 'compliance';
  title: string;
  description: string;
  impact: string;
  suggestion: string;
}

// 风险矩阵
export interface RiskMatrix {
  strategicRisks: RiskItem[];    // 战略风险
  operationalRisks: RiskItem[];  // 经营风险
  financialRisks: RiskItem[];    // 财务风险
  complianceRisks: RiskItem[];   // 合规风险
}

export interface RiskItem {
  name: string;
  level: 'high' | 'medium' | 'low';
  probability: number;       // 发生概率 0-100
  impact: number;            // 影响程度 0-100
  description: string;
  mitigation: string;
}

// 管理建议
export interface ManagementSuggestion {
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  action: string;
  expectedBenefit: string;
  timeline: string;
}

// 深度洞察
export interface Insight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'threat';
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
}

/**
 * 执行智能综合分析
 */
export const performComprehensiveAnalysis = (
  data: FinancialData,
  _reconciliation?: ReconciliationResult,
  detailedAnalysis?: DetailedSubjectAnalysis
): ComprehensiveAnalysis => {
  
  // 1. 计算健康度评分
  const healthScore = calculateHealthScore(data);
  
  // 2. 生成综合结论
  const overallAssessment = generateOverallAssessment(data, healthScore);
  
  // 3. 识别重点关注事项
  const keyConcerns = identifyKeyConcerns(data, detailedAnalysis);
  
  // 4. 构建风险矩阵
  const riskMatrix = buildRiskMatrix(data, detailedAnalysis);
  
  // 5. 生成管理建议
  const managementSuggestions = generateManagementSuggestions(data, keyConcerns);
  
  // 6. 生成深度洞察
  const insights = generateInsights(data, detailedAnalysis);
  
  return {
    healthScore,
    overallAssessment,
    keyConcerns,
    riskMatrix,
    managementSuggestions,
    insights,
  };
};

// 计算健康度评分
const calculateHealthScore = (data: FinancialData): HealthScore => {
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  
  // 盈利能力评分 (0-25)
  const profitMargin = data.totalIncome > 0 ? (netProfit / data.totalIncome) * 100 : 0;
  // ROE 可用于后续细化评分
  // const roe = data.totalEquity > 0 ? (netProfit / data.totalEquity) * 100 : 0;
  let profitability = 0;
  if (profitMargin > 20) profitability = 25;
  else if (profitMargin > 10) profitability = 20;
  else if (profitMargin > 5) profitability = 15;
  else if (profitMargin > 0) profitability = 10;
  else profitability = Math.max(0, 10 + profitMargin);
  
  // 流动性评分 (0-25)
  const currentRatio = data.totalLiabilities > 0 ? data.totalAssets / data.totalLiabilities : 0;
  let liquidity = 0;
  if (currentRatio > 2) liquidity = 25;
  else if (currentRatio > 1.5) liquidity = 20;
  else if (currentRatio > 1) liquidity = 15;
  else if (currentRatio > 0.8) liquidity = 10;
  else liquidity = Math.max(0, currentRatio * 10);
  
  // 偿债能力评分 (0-20)
  const debtRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  let solvency = 0;
  if (debtRatio < 30) solvency = 20;
  else if (debtRatio < 50) solvency = 18;
  else if (debtRatio < 60) solvency = 15;
  else if (debtRatio < 70) solvency = 10;
  else solvency = Math.max(0, 20 - (debtRatio - 70) / 3);
  
  // 营运能力评分 (0-15)
  const assetTurnover = data.totalAssets > 0 ? data.totalIncome / data.totalAssets : 0;
  let operation = 0;
  if (assetTurnover > 1.5) operation = 15;
  else if (assetTurnover > 1) operation = 12;
  else if (assetTurnover > 0.5) operation = 9;
  else operation = Math.max(0, assetTurnover * 15);
  
  // 成长能力评分 (0-15)
  // 简化处理，假设有一定增长
  let growth = 10;
  if (data.totalIncome > 10000000) growth = 12;
  
  const overall = Math.round(profitability + liquidity + solvency + operation + growth);
  
  let assessment = '';
  if (overall >= 85) assessment = '财务状况优秀，各项指标良好';
  else if (overall >= 70) assessment = '财务状况良好，部分指标需关注';
  else if (overall >= 55) assessment = '财务状况一般，存在改进空间';
  else if (overall >= 40) assessment = '财务状况欠佳，需采取措施改善';
  else assessment = '财务状况较差，存在较大风险';
  
  return {
    overall,
    profitability: Math.round(profitability),
    liquidity: Math.round(liquidity),
    solvency: Math.round(solvency),
    operation: Math.round(operation),
    growth: Math.round(growth),
    assessment,
  };
};

// 生成综合结论
const generateOverallAssessment = (
  data: FinancialData,
  healthScore: HealthScore
): OverallAssessment => {
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  const debtRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  
  // 经营状况
  let businessStatus = '';
  if (netProfit > data.totalIncome * 0.15) {
    businessStatus = '盈利能力强劲，经营状况良好';
  } else if (netProfit > data.totalIncome * 0.08) {
    businessStatus = '盈利能力稳定，经营正常';
  } else if (netProfit > 0) {
    businessStatus = '盈利能力偏弱，需提升运营效率';
  } else {
    businessStatus = '经营亏损，需分析原因并制定扭亏方案';
  }
  
  // 财务状况
  let financialStatus = '';
  if (debtRatio < 40) {
    financialStatus = '资产负债率低，财务结构稳健，偿债压力小';
  } else if (debtRatio < 60) {
    financialStatus = '资产负债率适中，财务结构合理';
  } else {
    financialStatus = '资产负债率偏高，财务杠杆较高，需关注偿债能力';
  }
  
  // 现金流状况
  let cashFlowStatus = '';
  if (healthScore.liquidity >= 20) {
    cashFlowStatus = '流动性充足，短期偿债能力良好';
  } else if (healthScore.liquidity >= 15) {
    cashFlowStatus = '流动性尚可，需关注资金周转';
  } else {
    cashFlowStatus = '流动性紧张，需加强现金流管理';
  }
  
  // 风险等级
  const riskLevel: 'high' | 'medium' | 'low' = 
    healthScore.overall < 50 || debtRatio > 70 || netProfit < 0 ? 'high' :
    healthScore.overall < 70 || debtRatio > 60 ? 'medium' : 'low';
  
  // 一句话总结
  const summary = generateSummary(data, healthScore, riskLevel);
  
  return {
    summary,
    businessStatus,
    financialStatus,
    cashFlowStatus,
    riskLevel,
  };
};

// 生成一句话总结
const generateSummary = (
  data: FinancialData,
  healthScore: HealthScore,
  riskLevel: 'high' | 'medium' | 'low'
): string => {
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  const size = data.totalAssets > 100000000 ? '中大型' : data.totalAssets > 10000000 ? '中型' : '小型';
  const profitDesc = netProfit > 0 ? '盈利' : '亏损';
  const riskDesc = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中等风险' : '低风险';
  
  return `该企业为${size}企业，目前处于${profitDesc}状态，整体健康度${healthScore.overall}分（${riskDesc}），${healthScore.assessment}`;
};

// 识别重点关注事项
const identifyKeyConcerns = (
  data: FinancialData,
  _detailedAnalysis?: DetailedSubjectAnalysis
): KeyConcern[] => {
  const concerns: KeyConcern[] = [];
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  
  // 1. 现金流风险
  let cash = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金')) cash += value;
  });
  
  const monthlyExpense = data.totalExpenses / 12;
  if (cash < monthlyExpense * 2) {
    concerns.push({
      priority: 10,
      category: 'cash',
      title: '现金流紧张',
      description: `现金余额${formatAmount(cash)}仅能支撑${(cash/monthlyExpense).toFixed(1)}个月运营`,
      impact: '可能导致资金链断裂，影响正常经营',
      suggestion: '加快应收账款回收，压缩库存，考虑短期融资',
    });
  }
  
  // 2. 应收账款风险
  let receivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收')) receivables += value;
  });
  
  if (receivables > data.totalIncome * 0.4) {
    concerns.push({
      priority: 9,
      category: 'receivable',
      title: '应收账款占比过高',
      description: `应收账款${formatAmount(receivables)}占收入${(receivables/data.totalIncome*100).toFixed(1)}%`,
      impact: '资金被客户大量占用，回款压力大，坏账风险高',
      suggestion: '建立客户信用评级，差异化信用政策，加强催收，考虑保理融资',
    });
  }
  
  // 3. 其他应收款风险
  let otherReceivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收')) otherReceivables += value;
  });
  
  if (otherReceivables > data.totalAssets * 0.05) {
    concerns.push({
      priority: 8,
      category: 'compliance',
      title: '其他应收款异常',
      description: `其他应收款${formatAmount(otherReceivables)}占比${(otherReceivables/data.totalAssets*100).toFixed(1)}%`,
      impact: '可能存在关联方资金占用，存在税务风险（视同分红）',
      suggestion: '逐笔核查款项性质，要求限期归还，签订借款协议约定利息',
    });
  }
  
  // 4. 存货风险
  let inventory = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) inventory += value;
  });
  
  if (inventory > data.totalAssets * 0.25) {
    concerns.push({
      priority: 7,
      category: 'inventory',
      title: '存货占比偏高',
      description: `存货${formatAmount(inventory)}占资产${(inventory/data.totalAssets*100).toFixed(1)}%`,
      impact: '资金占用大，存在跌价和滞销风险',
      suggestion: '优化采购计划，加强销售预测，及时处理呆滞库存',
    });
  }
  
  // 5. 偿债风险
  const debtRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  if (debtRatio > 65) {
    concerns.push({
      priority: 8,
      category: 'debt',
      title: '资产负债率偏高',
      description: `资产负债率${debtRatio.toFixed(1)}%，超过警戒线`,
      impact: '财务杠杆过高，偿债压力大，融资困难',
      suggestion: '优化资本结构，控制负债规模，提升盈利能力',
    });
  }
  
  // 6. 盈利风险
  if (netProfit < 0) {
    concerns.push({
      priority: 9,
      category: 'profit',
      title: '经营亏损',
      description: `本期亏损${formatAmount(Math.abs(netProfit))}`,
      impact: '持续经营能力存疑，影响企业信用和融资',
      suggestion: '分析亏损原因（收入不足/成本过高），制定扭亏方案',
    });
  }
  
  return concerns.sort((a, b) => b.priority - a.priority);
};

// 构建风险矩阵
const buildRiskMatrix = (
  data: FinancialData,
  _detailedAnalysis?: DetailedSubjectAnalysis
): RiskMatrix => {
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  const debtRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  
  // 战略风险
  const strategicRisks: RiskItem[] = [];
  if (netProfit < 0) {
    strategicRisks.push({
      name: '持续经营风险',
      level: 'high',
      probability: 70,
      impact: 90,
      description: '连续亏损可能导致资金链断裂',
      mitigation: '制定扭亏方案，寻求外部融资',
    });
  }
  
  // 经营风险
  const operationalRisks: RiskItem[] = [];
  
  let receivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收')) receivables += value;
  });
  
  if (receivables > data.totalIncome * 0.3) {
    operationalRisks.push({
      name: '应收账款坏账风险',
      level: receivables > data.totalIncome * 0.5 ? 'high' : 'medium',
      probability: 50,
      impact: 60,
      description: '应收账款回收困难，坏账风险增加',
      mitigation: '加强信用管理，建立催收机制',
    });
  }
  
  // 财务风险
  const financialRisks: RiskItem[] = [];
  if (debtRatio > 60) {
    financialRisks.push({
      name: '偿债风险',
      level: debtRatio > 70 ? 'high' : 'medium',
      probability: 60,
      impact: 80,
      description: '高负债率导致偿债压力大',
      mitigation: '优化债务结构，控制负债规模',
    });
  }
  
  // 合规风险
  const complianceRisks: RiskItem[] = [];
  let otherReceivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收')) otherReceivables += value;
  });
  
  if (otherReceivables > 100000) {
    complianceRisks.push({
      name: '税务合规风险',
      level: 'medium',
      probability: 40,
      impact: 70,
      description: '大额其他应收款可能被认定为视同分红',
      mitigation: '完善借款协议，约定利息，按期归还',
    });
  }
  
  return {
    strategicRisks,
    operationalRisks,
    financialRisks,
    complianceRisks,
  };
};

// 生成管理建议
const generateManagementSuggestions = (
  _data: FinancialData,
  keyConcerns: KeyConcern[]
): ManagementSuggestion[] => {
  const suggestions: ManagementSuggestion[] = [];
  
  // 基于关注事项生成建议
  keyConcerns.forEach(concern => {
    let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';
    if (concern.priority >= 9) priority = 'urgent';
    else if (concern.priority >= 7) priority = 'high';
    else if (concern.priority >= 5) priority = 'medium';
    else priority = 'low';
    
    suggestions.push({
      category: concern.category,
      priority,
      action: concern.suggestion,
      expectedBenefit: `降低${concern.title}风险，改善财务状况`,
      timeline: priority === 'urgent' ? '立即执行' : priority === 'high' ? '1个月内' : '3个月内',
    });
  });
  
  // 添加通用建议
  suggestions.push({
    category: 'internal_control',
    priority: 'medium',
    action: '建立健全财务分析制度，定期编制管理报表',
    expectedBenefit: '提升财务管理水平，及时发现风险',
    timeline: '3个月内',
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

// 生成深度洞察
const generateInsights = (
  data: FinancialData,
  _detailedAnalysis?: DetailedSubjectAnalysis
): Insight[] => {
  const insights: Insight[] = [];
  
  // 1. 资金变动洞察
  let openingCash = 0;
  let closingCash = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金')) closingCash += value;
  });
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金')) openingCash += value;
  });
  
  if (closingCash < openingCash * 0.7) {
    // 分析资金去向
    let toFixedAssets = 0;
    data.assets.forEach((value, name) => {
      if (name.includes('固定资产')) {
        toFixedAssets += Math.max(0, value - (data.beginningAssets?.get(name) || 0));
      }
    });
    
    let toReceivables = 0;
    data.assets.forEach((value, name) => {
      if (name.includes('应收')) {
        toReceivables += Math.max(0, value - (data.beginningAssets?.get(name) || 0));
      }
    });
    
    const evidence: string[] = [];
    if (toFixedAssets > (openingCash - closingCash) * 0.3) {
      evidence.push(`固定资产投资增加 ${formatAmount(toFixedAssets)}`);
    }
    if (toReceivables > (openingCash - closingCash) * 0.3) {
      evidence.push(`应收账款增加 ${formatAmount(toReceivables)}`);
    }
    
    insights.push({
      type: 'threat',
      title: '现金大幅流出',
      description: `本期现金减少 ${formatAmount(openingCash - closingCash)}，需关注资金去向`,
      evidence,
      recommendation: '核查大额资本支出必要性，加快应收账款回收',
    });
  }
  
  // 2. 营运效率洞察
  const assetTurnover = data.totalAssets > 0 ? data.totalIncome / data.totalAssets : 0;
  if (assetTurnover < 0.5) {
    insights.push({
      type: 'opportunity',
      title: '资产周转效率低',
      description: '总资产周转率低于0.5，资产使用效率有提升空间',
      evidence: [`总资产周转率 ${assetTurnover.toFixed(2)}次/年`],
      recommendation: '优化资产配置，处置闲置资产，提高运营效率',
    });
  }
  
  // 3. 盈利能力洞察
  const netMargin = data.totalIncome > 0 ? ((data.netProfit || 0) / data.totalIncome) * 100 : 0;
  if (netMargin > 20) {
    insights.push({
      type: 'opportunity',
      title: '盈利能力优秀',
      description: `销售净利率 ${netMargin.toFixed(1)}%，高于行业平均水平`,
      evidence: [`销售净利率 ${netMargin.toFixed(1)}%`, `净利润 ${formatAmount(data.netProfit || 0)}`],
      recommendation: '保持现有盈利模式，考虑适度扩张',
    });
  }
  
  return insights;
};

// 工具函数
const formatAmount = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(2) + '万';
  }
  return value.toFixed(2);
};

export default performComprehensiveAnalysis;
