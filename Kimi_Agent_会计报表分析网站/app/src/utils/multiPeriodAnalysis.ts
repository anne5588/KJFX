// ==================== 多期对比分析 ====================
// 支持两期或多期财务数据的对比分析

import type { FinancialMetrics } from '@/types/accounting';
import type { FinancialData } from '@/utils/excelParser';

// 对比项目类型
export type ComparisonItemType = 
  | 'balance_sheet'  // 资产负债表项目
  | 'income_statement' // 利润表项目
  | 'financial_ratio'; // 财务指标

// 对比项
export interface ComparisonItem {
  name: string;
  type: ComparisonItemType;
  currentPeriod: number;
  previousPeriod: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  importance: 'high' | 'medium' | 'low';
}

// 对比分析结果
export interface MultiPeriodAnalysisResult {
  summary: {
    totalItems: number;
    increasedItems: number;
    decreasedItems: number;
    stableItems: number;
    significantChanges: number; // 重大变动数量(>20%)
  };
  balanceSheetComparison: ComparisonItem[];
  incomeStatementComparison: ComparisonItem[];
  ratioComparison: ComparisonItem[];
  trendAnalysis: {
    category: string;
    description: string;
    direction: 'positive' | 'negative' | 'neutral';
  }[];
  suggestions: string[];
}

// ==================== 主分析函数 ====================

export const performMultiPeriodAnalysis = (
  data: FinancialData,
  metrics: FinancialMetrics
): MultiPeriodAnalysisResult => {
  if (!data.hasBeginningData) {
    return generateNoDataResult();
  }
  
  const result: MultiPeriodAnalysisResult = {
    summary: {
      totalItems: 0,
      increasedItems: 0,
      decreasedItems: 0,
      stableItems: 0,
      significantChanges: 0,
    },
    balanceSheetComparison: [],
    incomeStatementComparison: [],
    ratioComparison: [],
    trendAnalysis: [],
    suggestions: [],
  };
  
  // 1. 资产负债表对比
  result.balanceSheetComparison = compareBalanceSheet(data);
  
  // 2. 利润表对比
  result.incomeStatementComparison = compareIncomeStatement(data);
  
  // 3. 财务指标对比
  result.ratioComparison = compareFinancialRatios(data, metrics);
  
  // 4. 汇总统计
  calculateSummary(result);
  
  // 5. 趋势分析
  result.trendAnalysis = analyzeTrends(result);
  
  // 6. 生成建议
  result.suggestions = generateSuggestions(result);
  
  return result;
};

// ==================== 具体对比函数 ====================

// 1. 资产负债表对比
const compareBalanceSheet = (data: FinancialData): ComparisonItem[] => {
  const comparisons: ComparisonItem[] = [];
  
  // 总资产
  comparisons.push(createComparisonItem(
    '资产总计',
    'balance_sheet',
    data.totalAssets,
    data.beginningTotalAssets,
    'high'
  ));
  
  // 总负债
  comparisons.push(createComparisonItem(
    '负债总计',
    'balance_sheet',
    data.totalLiabilities,
    data.beginningTotalLiabilities,
    'high'
  ));
  
  // 所有者权益
  comparisons.push(createComparisonItem(
    '所有者权益',
    'balance_sheet',
    data.totalEquity,
    data.beginningTotalEquity,
    'high'
  ));
  
  // 主要资产科目对比（Top 10）
  const topAssets = Array.from(data.assets.entries())
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 10);
  
  topAssets.forEach(([name, currentValue]) => {
    const previousValue = data.beginningAssets.get(name) || 0;
    if (currentValue > data.totalAssets * 0.05 || previousValue > data.beginningTotalAssets * 0.05) {
      comparisons.push(createComparisonItem(
        name,
        'balance_sheet',
        currentValue,
        previousValue,
        'medium'
      ));
    }
  });
  
  // 主要负债科目对比（Top 5）
  const topLiabilities = Array.from(data.liabilities.entries())
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5);
  
  topLiabilities.forEach(([name, currentValue]) => {
    const previousValue = data.beginningLiabilities.get(name) || 0;
    comparisons.push(createComparisonItem(
      name,
      'balance_sheet',
      currentValue,
      previousValue,
      'medium'
    ));
  });
  
  return comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
};

// 2. 利润表对比
const compareIncomeStatement = (data: FinancialData): ComparisonItem[] => {
  const comparisons: ComparisonItem[] = [];
  
  // 营业收入
  comparisons.push(createComparisonItem(
    '营业收入',
    'income_statement',
    data.totalIncome,
    data.beginningTotalIncome,
    'high'
  ));
  
  // 营业成本/费用
  comparisons.push(createComparisonItem(
    '营业总成本',
    'income_statement',
    data.totalExpenses,
    data.beginningTotalExpenses,
    'high'
  ));
  
  // 净利润
  comparisons.push(createComparisonItem(
    '净利润',
    'income_statement',
    data.netProfit,
    data.beginningNetProfit,
    'high'
  ));
  
  // 毛利率估算
  const currentGrossMargin = data.totalIncome > 0 
    ? (data.totalIncome - data.totalExpenses * 0.7) / data.totalIncome * 100 
    : 0;
  const previousGrossMargin = data.beginningTotalIncome > 0 
    ? (data.beginningTotalIncome - data.beginningTotalExpenses * 0.7) / data.beginningTotalIncome * 100 
    : 0;
  
  comparisons.push(createComparisonItem(
    '毛利率',
    'income_statement',
    currentGrossMargin,
    previousGrossMargin,
    'high'
  ));
  
  // 主要收入科目
  const topIncome = Array.from(data.income.entries())
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5);
  
  topIncome.forEach(([name, currentValue]) => {
    const previousValue = data.beginningIncome.get(name) || 0;
    comparisons.push(createComparisonItem(
      name,
      'income_statement',
      currentValue,
      previousValue,
      'medium'
    ));
  });
  
  return comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
};

// 3. 财务指标对比
const compareFinancialRatios = (
  data: FinancialData,
  metrics: FinancialMetrics
): ComparisonItem[] => {
  const comparisons: ComparisonItem[] = [];
  
  if (!data.hasBeginningData) return comparisons;
  
  // 计算上期指标（简化版）
  const previousDebtRatio = data.beginningTotalAssets > 0 
    ? (data.beginningTotalLiabilities / data.beginningTotalAssets) * 100 
    : 0;
  const previousROE = data.beginningTotalEquity > 0 
    ? (data.beginningNetProfit / data.beginningTotalEquity) * 100 
    : 0;
  const previousNetMargin = data.beginningTotalIncome > 0 
    ? (data.beginningNetProfit / data.beginningTotalIncome) * 100 
    : 0;
  
  // 资产负债率
  comparisons.push(createComparisonItem(
    '资产负债率',
    'financial_ratio',
    metrics.debtToAssetRatio,
    previousDebtRatio,
    'high'
  ));
  
  // ROE
  comparisons.push(createComparisonItem(
    '净资产收益率(ROE)',
    'financial_ratio',
    metrics.roe,
    previousROE,
    'high'
  ));
  
  // 净利率
  comparisons.push(createComparisonItem(
    '销售净利率',
    'financial_ratio',
    metrics.netProfitMargin,
    previousNetMargin,
    'high'
  ));
  
  // 周转率
  const previousAssetTurnover = data.beginningTotalAssets > 0 
    ? data.beginningTotalIncome / data.beginningTotalAssets 
    : 0;
  comparisons.push(createComparisonItem(
    '总资产周转率',
    'financial_ratio',
    metrics.totalAssetTurnover,
    previousAssetTurnover,
    'medium'
  ));
  
  // 流动比率（估算）
  const previousCurrentRatio = 1.8; // 估算值
  comparisons.push(createComparisonItem(
    '流动比率',
    'financial_ratio',
    metrics.currentRatio,
    previousCurrentRatio,
    'medium'
  ));
  
  return comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
};

// ==================== 辅助函数 ====================

// 创建对比项
const createComparisonItem = (
  name: string,
  type: ComparisonItemType,
  currentPeriod: number,
  previousPeriod: number,
  importance: 'high' | 'medium' | 'low'
): ComparisonItem => {
  const absoluteChange = currentPeriod - previousPeriod;
  const percentageChange = previousPeriod !== 0 
    ? (absoluteChange / Math.abs(previousPeriod)) * 100 
    : (currentPeriod > 0 ? 100 : 0);
  
  let trend: 'up' | 'down' | 'stable';
  if (Math.abs(percentageChange) < 5) {
    trend = 'stable';
  } else if (percentageChange > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }
  
  return {
    name,
    type,
    currentPeriod: round(currentPeriod, 2),
    previousPeriod: round(previousPeriod, 2),
    absoluteChange: round(absoluteChange, 2),
    percentageChange: round(percentageChange, 2),
    trend,
    importance,
  };
};

// 计算汇总统计
const calculateSummary = (result: MultiPeriodAnalysisResult) => {
  const allItems = [
    ...result.balanceSheetComparison,
    ...result.incomeStatementComparison,
    ...result.ratioComparison,
  ];
  
  result.summary.totalItems = allItems.length;
  result.summary.increasedItems = allItems.filter(i => i.trend === 'up').length;
  result.summary.decreasedItems = allItems.filter(i => i.trend === 'down').length;
  result.summary.stableItems = allItems.filter(i => i.trend === 'stable').length;
  result.summary.significantChanges = allItems.filter(i => Math.abs(i.percentageChange) > 20).length;
};

// 趋势分析
const analyzeTrends = (result: MultiPeriodAnalysisResult) => {
  const trends: MultiPeriodAnalysisResult['trendAnalysis'] = [];
  
  // 规模趋势
  const assetChange = result.balanceSheetComparison.find(i => i.name === '资产总计');
  if (assetChange) {
    if (assetChange.percentageChange > 20) {
      trends.push({
        category: '规模扩张',
        description: `资产规模快速增长${assetChange.percentageChange.toFixed(1)}%，企业处于扩张期`,
        direction: 'positive',
      });
    } else if (assetChange.percentageChange < -10) {
      trends.push({
        category: '规模收缩',
        description: `资产规模下降${Math.abs(assetChange.percentageChange).toFixed(1)}%，企业可能在收缩业务`,
        direction: 'negative',
      });
    }
  }
  
  // 盈利能力趋势
  const profitChange = result.incomeStatementComparison.find(i => i.name === '净利润');
  const revenueChange = result.incomeStatementComparison.find(i => i.name === '营业收入');
  
  if (profitChange && revenueChange) {
    if (profitChange.percentageChange > revenueChange.percentageChange) {
      trends.push({
        category: '盈利能力',
        description: '利润增速超过收入增速，盈利能力提升',
        direction: 'positive',
      });
    } else if (profitChange.percentageChange < 0 && revenueChange.percentageChange > 0) {
      trends.push({
        category: '盈利能力',
        description: '收入增长但利润下降，成本费用控制出现问题',
        direction: 'negative',
      });
    }
  }
  
  // 财务杠杆趋势
  const debtChange = result.ratioComparison.find(i => i.name === '资产负债率');
  if (debtChange && debtChange.percentageChange > 10) {
    trends.push({
      category: '财务风险',
      description: '资产负债率上升，财务杠杆加大，风险增加',
      direction: 'negative',
    });
  }
  
  // 运营效率趋势
  const turnoverChange = result.ratioComparison.find(i => i.name === '总资产周转率');
  if (turnoverChange) {
    if (turnoverChange.percentageChange > 10) {
      trends.push({
        category: '运营效率',
        description: '资产周转加快，运营效率提升',
        direction: 'positive',
      });
    } else if (turnoverChange.percentageChange < -10) {
      trends.push({
        category: '运营效率',
        description: '资产周转放缓，运营效率下降',
        direction: 'negative',
      });
    }
  }
  
  return trends;
};

// 生成建议
const generateSuggestions = (result: MultiPeriodAnalysisResult): string[] => {
  const suggestions: string[] = [];
  
  // 根据变动最大的项目生成建议
  const significantChanges = [
    ...result.balanceSheetComparison,
    ...result.incomeStatementComparison,
  ].filter(i => Math.abs(i.percentageChange) > 30);
  
  if (significantChanges.length > 0) {
    suggestions.push(`【关注】以下科目变动超过30%：${significantChanges.slice(0, 3).map(i => i.name).join('、')}，建议深入分析原因。`);
  }
  
  // 根据趋势生成建议
  const negativeTrends = result.trendAnalysis.filter(t => t.direction === 'negative');
  negativeTrends.forEach(trend => {
    suggestions.push(`【${trend.category}】${trend.description}，建议采取改进措施。`);
  });
  
  // 资产负债结构建议
  const equityChange = result.balanceSheetComparison.find(i => i.name === '所有者权益');
  if (equityChange && equityChange.percentageChange < 5) {
    suggestions.push('【资本积累】所有者权益增长缓慢，建议加强利润留存或引入新投资。');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('各项财务指标变动平稳，建议继续保持现有经营策略。');
  }
  
  return suggestions;
};

// 无数据时返回的结果
const generateNoDataResult = (): MultiPeriodAnalysisResult => {
  return {
    summary: {
      totalItems: 0,
      increasedItems: 0,
      decreasedItems: 0,
      stableItems: 0,
      significantChanges: 0,
    },
    balanceSheetComparison: [],
    incomeStatementComparison: [],
    ratioComparison: [],
    trendAnalysis: [],
    suggestions: ['未检测到多期数据，无法进行对比分析。请上传包含年初/上期数据的报表。'],
  };
};

// 工具函数
const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

// 格式化变动率为可读的描述
export const formatChangeDescription = (change: number): string => {
  const absChange = Math.abs(change);
  if (absChange < 5) return '基本持平';
  if (absChange < 20) return change > 0 ? '有所增长' : '有所下降';
  if (absChange < 50) return change > 0 ? '明显增长' : '明显下降';
  return change > 0 ? '大幅增长' : '大幅下降';
};

export default performMultiPeriodAnalysis;
