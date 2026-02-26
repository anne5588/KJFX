// ==================== 多期收入/成本/费用对比分析 ====================

import type { PeriodData } from '@/types/company';
import { sortPeriods } from '@/types/company';

export interface IncomeCostExpenseAnalysis {
  periods: string[];
  
  // 收入分析
  revenue: {
    period: string;
    totalRevenue: number;        // 总收入
    mainRevenue: number;         // 主营业务收入
    otherRevenue: number;        // 其他业务收入
    growthRate: number;          // 环比增长率
  }[];
  
  // 成本分析
  cost: {
    period: string;
    totalCost: number;           // 总成本
    mainCost: number;            // 主营业务成本
    otherCost: number;           // 其他业务成本
    costRatio: number;           // 成本率
    growthRate: number;
  }[];
  
  // 费用分析
  expense: {
    period: string;
    totalExpense: number;        // 总费用
    salesExpense: number;        // 销售费用
    adminExpense: number;        // 管理费用
    financeExpense: number;      // 财务费用
    expenseRatio: number;        // 费用率
    growthRate: number;
  }[];
  
  // 利润分析
  profit: {
    period: string;
    grossProfit: number;         // 毛利
    operatingProfit: number;     // 营业利润
    netProfit: number;           // 净利润
    grossMargin: number;         // 毛利率
    netMargin: number;           // 净利率
  }[];
  
  // 趋势总结
  trends: {
    revenueTrend: 'up' | 'down' | 'stable';
    costTrend: 'up' | 'down' | 'stable';
    expenseTrend: 'up' | 'down' | 'stable';
    profitTrend: 'up' | 'down' | 'stable';
  };
  
  // 分析建议
  suggestions: string[];
}

/**
 * 执行多期收入成本费用分析
 */
export const analyzeIncomeCostExpense = (
  periods: PeriodData[]
): IncomeCostExpenseAnalysis => {
  // 按期间排序
  const sortedPeriods = sortPeriods(periods);
  
  const result: IncomeCostExpenseAnalysis = {
    periods: sortedPeriods.map(p => p.period),
    revenue: [],
    cost: [],
    expense: [],
    profit: [],
    trends: {
      revenueTrend: 'stable',
      costTrend: 'stable',
      expenseTrend: 'stable',
      profitTrend: 'stable',
    },
    suggestions: [],
  };
  
  // 计算各项指标
  sortedPeriods.forEach((period, index) => {
    const data = period.financialData;
    const prevPeriod = index > 0 ? sortedPeriods[index - 1] : null;
    
    // 辅助函数：安全获取 Map 值
    const getMapValue = (map: any, key: string): number => {
      if (!map) return 0;
      if (map instanceof Map) return map.get(key) || 0;
      // 如果是数组（序列化后的 Map）
      if (Array.isArray(map)) {
        const entry = map.find(([k]: [string, number]) => k === key);
        return entry ? entry[1] : 0;
      }
      return 0;
    };
    
    // 收入数据
    const totalRevenue = data.totalIncome || 0;
    const mainRevenue = getMapValue(data.income, '主营业务收入') || totalRevenue * 0.9;
    const otherRevenue = totalRevenue - mainRevenue;
    const revenueGrowth = prevPeriod 
      ? ((totalRevenue - prevPeriod.financialData.totalIncome) / prevPeriod.financialData.totalIncome * 100)
      : 0;
    
    result.revenue.push({
      period: period.period,
      totalRevenue,
      mainRevenue,
      otherRevenue,
      growthRate: revenueGrowth,
    });
    
    // 成本数据
    const totalCost = (data.totalExpenses || 0) * 0.7; // 估算
    const mainCost = getMapValue(data.expenses, '主营业务成本') || totalCost * 0.8;
    const otherCost = totalCost - mainCost;
    const costRatio = totalRevenue > 0 ? (totalCost / totalRevenue * 100) : 0;
    const costGrowth = prevPeriod
      ? ((totalCost - ((prevPeriod.financialData.totalExpenses || 0) * 0.7)) / ((prevPeriod.financialData.totalExpenses || 1) * 0.7) * 100)
      : 0;
    
    result.cost.push({
      period: period.period,
      totalCost,
      mainCost,
      otherCost,
      costRatio,
      growthRate: costGrowth,
    });
    
    // 费用数据
    const totalExpense = data.totalExpenses || 0;
    const salesExpense = getMapValue(data.expenses, '销售费用') || totalExpense * 0.2;
    const adminExpense = getMapValue(data.expenses, '管理费用') || totalExpense * 0.5;
    const financeExpense = getMapValue(data.expenses, '财务费用') || totalExpense * 0.1;
    const expenseRatio = totalRevenue > 0 ? (totalExpense / totalRevenue * 100) : 0;
    const expenseGrowth = prevPeriod
      ? ((totalExpense - prevPeriod.financialData.totalExpenses) / prevPeriod.financialData.totalExpenses * 100)
      : 0;
    
    result.expense.push({
      period: period.period,
      totalExpense,
      salesExpense,
      adminExpense,
      financeExpense,
      expenseRatio,
      growthRate: expenseGrowth,
    });
    
    // 利润数据
    const grossProfit = totalRevenue - totalCost;
    const operatingProfit = data.netProfit || 0;
    const netProfit = data.netProfit || 0;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    
    result.profit.push({
      period: period.period,
      grossProfit,
      operatingProfit,
      netProfit,
      grossMargin,
      netMargin,
    });
  });
  
  // 计算趋势
  if (result.revenue.length >= 2) {
    const first = result.revenue[0].totalRevenue;
    const last = result.revenue[result.revenue.length - 1].totalRevenue;
    result.trends.revenueTrend = last > first * 1.05 ? 'up' : last < first * 0.95 ? 'down' : 'stable';
  }
  
  if (result.cost.length >= 2) {
    const first = result.cost[0].totalCost;
    const last = result.cost[result.cost.length - 1].totalCost;
    result.trends.costTrend = last > first * 1.05 ? 'up' : last < first * 0.95 ? 'down' : 'stable';
  }
  
  if (result.expense.length >= 2) {
    const first = result.expense[0].totalExpense;
    const last = result.expense[result.expense.length - 1].totalExpense;
    result.trends.expenseTrend = last > first * 1.05 ? 'up' : last < first * 0.95 ? 'down' : 'stable';
  }
  
  if (result.profit.length >= 2) {
    const first = result.profit[0].netProfit;
    const last = result.profit[result.profit.length - 1].netProfit;
    result.trends.profitTrend = last > first * 1.05 ? 'up' : last < first * 0.95 ? 'down' : 'stable';
  }
  
  // 生成建议
  result.suggestions = generateSuggestions(result);
  
  return result;
};

/**
 * 生成分析建议
 */
const generateSuggestions = (analysis: IncomeCostExpenseAnalysis): string[] => {
  const suggestions: string[] = [];
  
  const { revenue, cost, expense, profit, trends } = analysis;
  
  // 收入趋势建议
  if (trends.revenueTrend === 'up') {
    const avgGrowth = revenue.reduce((sum, r, i) => i > 0 ? sum + r.growthRate : sum, 0) / (revenue.length - 1);
    suggestions.push(`✅ 收入呈上升趋势，平均环比增长 ${avgGrowth.toFixed(1)}%，表现良好。`);
  } else if (trends.revenueTrend === 'down') {
    suggestions.push(`⚠️ 收入呈下降趋势，建议分析原因，加强市场开拓。`);
  }
  
  // 成本控制建议
  const avgCostRatio = cost.reduce((sum, c) => sum + c.costRatio, 0) / cost.length;
  if (avgCostRatio > 70) {
    suggestions.push(`⚠️ 平均成本率 ${avgCostRatio.toFixed(1)}% 偏高，建议优化成本结构。`);
  } else {
    suggestions.push(`✅ 成本控制在合理范围内（${avgCostRatio.toFixed(1)}%）。`);
  }
  
  // 费用控制建议
  const avgExpenseRatio = expense.reduce((sum, e) => sum + e.expenseRatio, 0) / expense.length;
  if (avgExpenseRatio > 20) {
    suggestions.push(`⚠️ 费用率 ${avgExpenseRatio.toFixed(1)}% 偏高，建议审查各项费用支出。`);
  }
  
  // 利润趋势建议
  if (trends.profitTrend === 'up') {
    suggestions.push(`✅ 盈利能力持续改善，净利润呈上升趋势。`);
  } else if (trends.profitTrend === 'down') {
    suggestions.push(`⚠️ 净利润下滑，建议从增收和节支两方面改善。`);
  }
  
  // 毛利率分析
  const avgGrossMargin = profit.reduce((sum, p) => sum + p.grossMargin, 0) / profit.length;
  if (avgGrossMargin < 20) {
    suggestions.push(`⚠️ 平均毛利率 ${avgGrossMargin.toFixed(1)}% 偏低，产品盈利能力有待提升。`);
  }
  
  return suggestions;
};

/**
 * 生成多期对比报告
 */
export const generateMultiPeriodReport = (
  analysis: IncomeCostExpenseAnalysis
): string[] => {
  const report: string[] = [];
  
  report.push('多期收入成本费用对比分析报告');
  report.push('================================');
  report.push('');
  
  // 收入汇总
  report.push('【收入趋势】');
  analysis.revenue.forEach(r => {
    report.push(`${r.period}: 收入 ${r.totalRevenue.toLocaleString()}元，环比 ${r.growthRate > 0 ? '+' : ''}${r.growthRate.toFixed(1)}%`);
  });
  report.push('');
  
  // 成本汇总
  report.push('【成本趋势】');
  analysis.cost.forEach(c => {
    report.push(`${c.period}: 成本 ${c.totalCost.toLocaleString()}元，成本率 ${c.costRatio.toFixed(1)}%`);
  });
  report.push('');
  
  // 费用汇总
  report.push('【费用趋势】');
  analysis.expense.forEach(e => {
    report.push(`${e.period}: 费用 ${e.totalExpense.toLocaleString()}元，费用率 ${e.expenseRatio.toFixed(1)}%`);
  });
  report.push('');
  
  // 利润汇总
  report.push('【利润趋势】');
  analysis.profit.forEach(p => {
    report.push(`${p.period}: 毛利 ${p.grossProfit.toLocaleString()}元，毛利率 ${p.grossMargin.toFixed(1)}%，净利率 ${p.netMargin.toFixed(1)}%`);
  });
  report.push('');
  
  // 建议
  report.push('【分析建议】');
  analysis.suggestions.forEach((s, i) => {
    report.push(`${i + 1}. ${s}`);
  });
  
  return report;
};
