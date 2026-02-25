// ==================== 财务数据对比分析 ====================
// 支持：期末 vs 年初、本期 vs 上期、本年累计 vs 去年同期

import type { FinancialData } from './excelParser';

export interface ComparisonMetrics {
  // 资产负债变动
  assetGrowth: number;           // 资产增长率
  liabilityGrowth: number;       // 负债增长率
  equityGrowth: number;          // 权益增长率
  
  // 重要科目变动
  cashChange: number;            // 现金变动额
  cashChangePercent: number;     // 现金变动率
  receivablesChange: number;     // 应收账款变动额
  inventoryChange: number;       // 存货变动额
  
  // 结构变动
  debtRatioChange: number;       // 资产负债率变动
  currentRatioChange: number;    // 流动比率变动
  
  // 经营状况
  revenueGrowth: number;         // 收入增长（如有同期数据）
  profitGrowth: number;          // 利润增长
}

export interface SignificantChange {
  subject: string;
  currentValue: number;
  previousValue: number;
  changeAmount: number;
  changePercent: number;
  direction: 'increase' | 'decrease';
  significance: 'high' | 'medium' | 'low';
  analysis: string;
}

export interface ComparisonAnalysis {
  hasBeginningData: boolean;
  metrics: ComparisonMetrics;
  significantChanges: SignificantChange[];
  trends: {
    assetTrend: 'expansion' | 'contraction' | 'stable';
    liabilityTrend: 'increasing' | 'decreasing' | 'stable';
    liquidityTrend: 'improving' | 'deteriorating' | 'stable';
  };
  riskAlerts: string[];
  opportunities: string[];
}

// 计算对比分析
export const calculateComparisonAnalysis = (data: FinancialData): ComparisonAnalysis => {
  if (!data.hasBeginningData) {
    return {
      hasBeginningData: false,
      metrics: {} as ComparisonMetrics,
      significantChanges: [],
      trends: {} as any,
      riskAlerts: [],
      opportunities: [],
    };
  }

  const metrics = calculateMetrics(data);
  const significantChanges = findSignificantChanges(data);
  const trends = analyzeTrends(data, metrics);
  const riskAlerts = generateRiskAlerts(data, metrics, significantChanges);
  const opportunities = generateOpportunities(data, metrics, significantChanges);

  return {
    hasBeginningData: true,
    metrics,
    significantChanges,
    trends,
    riskAlerts,
    opportunities,
  };
};

// 计算关键指标变动
const calculateMetrics = (data: FinancialData): ComparisonMetrics => {
  const assetGrowth = data.beginningTotalAssets > 0 
    ? ((data.totalAssets - data.beginningTotalAssets) / data.beginningTotalAssets) * 100 
    : 0;
  
  const liabilityGrowth = data.beginningTotalLiabilities > 0
    ? ((data.totalLiabilities - data.beginningTotalLiabilities) / data.beginningTotalLiabilities) * 100
    : 0;
  
  const equityGrowth = data.beginningTotalEquity > 0
    ? ((data.totalEquity - data.beginningTotalEquity) / data.beginningTotalEquity) * 100
    : 0;

  // 现金变动
  let currentCash = 0, beginningCash = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款') || name.includes('货币资金')) {
      currentCash += value;
    }
  });
  data.beginningAssets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款') || name.includes('货币资金')) {
      beginningCash += value;
    }
  });

  const cashChange = currentCash - beginningCash;
  const cashChangePercent = beginningCash > 0 ? (cashChange / beginningCash) * 100 : 0;

  // 应收账款变动
  let currentReceivables = 0, beginningReceivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收') && !name.includes('其他')) {
      currentReceivables += value;
    }
  });
  data.beginningAssets.forEach((value, name) => {
    if (name.includes('应收') && !name.includes('其他')) {
      beginningReceivables += value;
    }
  });

  const receivablesChange = currentReceivables - beginningReceivables;

  // 存货变动
  let currentInventory = 0, beginningInventory = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) {
      currentInventory += value;
    }
  });
  data.beginningAssets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) {
      beginningInventory += value;
    }
  });

  const inventoryChange = currentInventory - beginningInventory;

  // 资产负债率变动
  const currentDebtRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  const beginningDebtRatio = data.beginningTotalAssets > 0 
    ? (data.beginningTotalLiabilities / data.beginningTotalAssets) * 100 
    : 0;
  const debtRatioChange = currentDebtRatio - beginningDebtRatio;

  return {
    assetGrowth: round(assetGrowth, 2),
    liabilityGrowth: round(liabilityGrowth, 2),
    equityGrowth: round(equityGrowth, 2),
    cashChange: round(cashChange, 2),
    cashChangePercent: round(cashChangePercent, 2),
    receivablesChange: round(receivablesChange, 2),
    inventoryChange: round(inventoryChange, 2),
    debtRatioChange: round(debtRatioChange, 2),
    currentRatioChange: 0, // 需要更多数据计算
    revenueGrowth: 0, // 需要利润表数据
    profitGrowth: 0, // 需要利润表数据
  };
};

// 发现重大变动科目
const findSignificantChanges = (data: FinancialData): SignificantChange[] => {
  const changes: SignificantChange[] = [];
  const threshold = 10; // 10%变动阈值

  // 资产变动分析
  data.assets.forEach((currentValue, name) => {
    const beginningValue = data.beginningAssets.get(name) || 0;
    const changeAmount = currentValue - beginningValue;
    const changePercent = beginningValue > 0 ? (changeAmount / beginningValue) * 100 : 0;

    if (Math.abs(changePercent) >= threshold || Math.abs(changeAmount) >= data.totalAssets * 0.05) {
      changes.push({
        subject: name,
        currentValue,
        previousValue: beginningValue,
        changeAmount,
        changePercent: round(changePercent, 2),
        direction: changeAmount > 0 ? 'increase' : 'decrease',
        significance: Math.abs(changePercent) >= 30 ? 'high' : Math.abs(changePercent) >= 15 ? 'medium' : 'low',
        analysis: generateChangeAnalysis(name, changeAmount, changePercent, currentValue, data.totalAssets),
      });
    }
  });

  // 负债变动分析
  data.liabilities.forEach((currentValue, name) => {
    const beginningValue = data.beginningLiabilities.get(name) || 0;
    const changeAmount = currentValue - beginningValue;
    const changePercent = beginningValue > 0 ? (changeAmount / beginningValue) * 100 : 0;

    if (Math.abs(changePercent) >= threshold || Math.abs(changeAmount) >= data.totalLiabilities * 0.05) {
      changes.push({
        subject: name,
        currentValue,
        previousValue: beginningValue,
        changeAmount,
        changePercent: round(changePercent, 2),
        direction: changeAmount > 0 ? 'increase' : 'decrease',
        significance: Math.abs(changePercent) >= 30 ? 'high' : Math.abs(changePercent) >= 15 ? 'medium' : 'low',
        analysis: generateChangeAnalysis(name, changeAmount, changePercent, currentValue, data.totalLiabilities),
      });
    }
  });

  return changes.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 10);
};

// 生成变动分析说明
const generateChangeAnalysis = (
  subject: string, 
  changeAmount: number, 
  changePercent: number, 
  _currentValue: number,
  totalValue: number
): string => {
  const direction = changeAmount > 0 ? '增加' : '减少';
  const percentStr = Math.abs(changePercent).toFixed(1);
  
  // 现金类
  if (subject.includes('现金') || subject.includes('银行存款')) {
    if (changeAmount > 0) {
      return `现金储备${direction}${percentStr}%，${changeAmount > totalValue * 0.1 ? '资金充裕，可考虑提高资金利用效率' : '流动性有所改善'}`;
    } else {
      return `现金储备${direction}${percentStr}%，${Math.abs(changeAmount) > totalValue * 0.1 ? '需关注资金链安全' : '关注现金管理'}`;
    }
  }
  
  // 应收类
  if (subject.includes('应收')) {
    if (changeAmount > 0) {
      return `应收账款${direction}${percentStr}%，${changePercent > 20 ? '增幅较大，需加强回款管理' : '随业务规模正常增长'}`;
    } else {
      return `应收账款${direction}${percentStr}%，回款情况良好`;
    }
  }
  
  // 存货类
  if (subject.includes('存货') || subject.includes('库存')) {
    if (changeAmount > 0) {
      return `存货${direction}${percentStr}%，${changePercent > 30 ? '可能存在滞销风险，需关注库存周转' : '为业务扩张做准备'}`;
    } else {
      return `存货${direction}${percentStr}%，库存管理效率提升`;
    }
  }
  
  // 负债类
  if (subject.includes('借款') || subject.includes('负债')) {
    if (changeAmount > 0) {
      return `负债${direction}${percentStr}%，${changePercent > 20 ? '杠杆上升，关注偿债压力' : '融资规模扩大'}`;
    } else {
      return `负债${direction}${percentStr}%，财务结构优化`;
    }
  }
  
  return `较期初${direction}${percentStr}%`;
};

// 分析趋势
const analyzeTrends = (_data: FinancialData, metrics: ComparisonMetrics) => {
  return {
    assetTrend: (metrics.assetGrowth > 10 ? 'expansion' : metrics.assetGrowth < -5 ? 'contraction' : 'stable') as 'expansion' | 'contraction' | 'stable',
    liabilityTrend: (metrics.liabilityGrowth > 10 ? 'increasing' : metrics.liabilityGrowth < -5 ? 'decreasing' : 'stable') as 'increasing' | 'decreasing' | 'stable',
    liquidityTrend: (metrics.cashChangePercent > 0 ? 'improving' : metrics.cashChangePercent < -10 ? 'deteriorating' : 'stable') as 'improving' | 'deteriorating' | 'stable',
  };
};

// 生成风险预警
const generateRiskAlerts = (
  _data: FinancialData, 
  metrics: ComparisonMetrics, 
  changes: SignificantChange[]
): string[] => {
  const alerts: string[] = [];

  // 资产负债率快速上升
  if (metrics.debtRatioChange > 5) {
    alerts.push(`【杠杆风险】资产负债率较年初上升${metrics.debtRatioChange.toFixed(1)}个百分点，财务杠杆快速增加`);
  }

  // 现金大幅减少
  if (metrics.cashChangePercent < -20) {
    alerts.push(`【流动性风险】货币资金较年初减少${Math.abs(metrics.cashChangePercent).toFixed(1)}%，关注资金链安全`);
  }

  // 应收账款激增
  const receivablesAlert = changes.find(c => c.subject.includes('应收') && c.changePercent > 30);
  if (receivablesAlert) {
    alerts.push(`【回款风险】应收账款大幅增加${receivablesAlert.changePercent.toFixed(1)}%，可能存在回款困难或虚增收入`);
  }

  // 存货积压
  const inventoryAlert = changes.find(c => c.subject.includes('存货') && c.changePercent > 30);
  if (inventoryAlert) {
    alerts.push(`【存货风险】存货增长${inventoryAlert.changePercent.toFixed(1)}%，可能存在滞销，关注跌价准备`);
  }

  // 权益下降（亏损）
  if (metrics.equityGrowth < -10) {
    alerts.push(`【盈利风险】所有者权益较年初减少${Math.abs(metrics.equityGrowth).toFixed(1)}%，累计亏损较大`);
  }

  return alerts;
};

// 生成机会/正面发现
const generateOpportunities = (
  _data: FinancialData, 
  metrics: ComparisonMetrics, 
  changes: SignificantChange[]
): string[] => {
  const opportunities: string[] = [];

  // 资产负债率下降
  if (metrics.debtRatioChange < -3) {
    opportunities.push(`【结构优化】资产负债率较年初下降${Math.abs(metrics.debtRatioChange).toFixed(1)}个百分点，财务结构改善`);
  }

  // 现金增加
  if (metrics.cashChangePercent > 20) {
    opportunities.push(`【资金充裕】货币资金较年初增加${metrics.cashChangePercent.toFixed(1)}%，可考虑扩大投资或偿还债务`);
  }

  // 应收账款下降
  const receivablesImprove = changes.find(c => c.subject.includes('应收') && c.changePercent < -10);
  if (receivablesImprove) {
    opportunities.push(`【回款改善】应收账款减少${Math.abs(receivablesImprove.changePercent).toFixed(1)}%，回款管理效果良好`);
  }

  // 权益增长
  if (metrics.equityGrowth > 15) {
    opportunities.push(`【盈利良好】所有者权益增长${metrics.equityGrowth.toFixed(1)}%，盈利能力强，资本积累稳健`);
  }

  return opportunities;
};

// 工具函数
const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

export default calculateComparisonAnalysis;
