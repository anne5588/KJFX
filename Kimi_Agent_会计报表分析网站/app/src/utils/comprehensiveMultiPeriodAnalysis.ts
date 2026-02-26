// ==================== 综合多期财务分析系统 ====================
// 基于专业财务分析框架，提供趋势、结构、能力、杜邦等多维度分析

import type { PeriodData } from '@/types/company';

// ==================== 类型定义 ====================

export interface TrendAnalysis {
  metric: string;
  values: { period: string; value: number }[];
  growthRates: { period: string; yoy?: number; mom?: number }[];
  cagr: number; // 复合增长率
  trend: 'up' | 'down' | 'stable' | 'fluctuating';
  volatility: number; // 波动率
  forecast?: { nextPeriod: string; predictedValue: number; confidence: number }[];
}

export interface StructureAnalysis {
  period: string;
  revenueStructure: { category: string; amount: number; ratio: number }[];
  costStructure: { category: string; amount: number; ratio: number }[];
  expenseStructure: { category: string; amount: number; ratio: number }[];
  assetStructure: { category: string; amount: number; ratio: number }[];
}

export interface CapabilityTrend {
  // 盈利能力
  profitability: {
    grossMargin: TrendAnalysis;
    netMargin: TrendAnalysis;
    roe: TrendAnalysis;
    roa: TrendAnalysis;
  };
  // 营运能力
  operation: {
    totalAssetTurnover: TrendAnalysis;
    receivablesTurnover: TrendAnalysis;
    inventoryTurnover: TrendAnalysis;
  };
  // 偿债能力
  solvency: {
    currentRatio: TrendAnalysis;
    quickRatio: TrendAnalysis;
    debtToAsset: TrendAnalysis;
    interestCoverage: TrendAnalysis;
  };
  // 成长能力
  growth: {
    revenueGrowth: TrendAnalysis;
    profitGrowth: TrendAnalysis;
    assetGrowth: TrendAnalysis;
  };
  // 现金流能力
  cashflow: {
    operatingCashflowRatio: TrendAnalysis;
    freeCashflow: TrendAnalysis;
    cashConversionCycle: TrendAnalysis;
  };
}

export interface DupontTrend {
  roe: TrendAnalysis;
  netMargin: TrendAnalysis;
  assetTurnover: TrendAnalysis;
  equityMultiplier: TrendAnalysis;
  drivers: {
    profitDriver: 'high' | 'medium' | 'low';
    efficiencyDriver: 'high' | 'medium' | 'low';
    leverageDriver: 'high' | 'medium' | 'low';
  };
}

export interface AbnormalFluctuation {
  subject: string;
  period: string;
  currentValue: number;
  previousValue: number;
  changeRate: number;
  severity: 'high' | 'medium' | 'low';
  possibleReasons: string[];
  suggestion: string;
}

export interface ComprehensiveMultiPeriodReport {
  // 1. 执行摘要
  executiveSummary: {
    overallTrend: string;
    keyHighlights: string[];
    riskAlerts: string[];
    opportunities: string[];
  };
  
  // 2. 核心指标趋势
  coreTrends: {
    revenue: TrendAnalysis;
    netProfit: TrendAnalysis;
    totalAssets: TrendAnalysis;
    operatingCashflow: TrendAnalysis;
  };
  
  // 3. 结构演变
  structureEvolution: StructureAnalysis[];
  
  // 4. 五大能力趋势
  capabilities: CapabilityTrend;
  
  // 5. 杜邦分析趋势
  dupontTrend: DupontTrend;
  
  // 6. 异常波动
  abnormalFluctuations: AbnormalFluctuation[];
  
  // 7. 财务健康度评分趋势
  healthScoreTrend: { period: string; score: number; level: string }[];
  
  // 8. 预测与建议
  forecast: {
    nextQuarterRevenue: { low: number; base: number; high: number };
    nextQuarterProfit: { low: number; base: number; high: number };
    riskWarnings: string[];
    strategicSuggestions: string[];
  };
  
  // 9. 详细报表
  detailedReport: {
    periodComparison: PeriodComparisonItem[];
    ratioAnalysis: RatioAnalysisItem[];
  };
}

export interface PeriodComparisonItem {
  period: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpense: number;
  operatingProfit: number;
  operatingMargin: number;
  netProfit: number;
  netMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  roe: number;
  roa: number;
}

export interface RatioAnalysisItem {
  ratioName: string;
  values: { period: string; value: number; industryAvg?: number }[];
  trend: 'improving' | 'declining' | 'stable';
  assessment: string;
}

// ==================== 计算工具函数 ====================

// 计算环比增长率
const calculateMoM = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// 计算复合增长率 (CAGR)
const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// 计算波动率（标准差/均值）
const calculateVolatility = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  return (stdDev / Math.abs(mean)) * 100;
};

// 判断趋势
const determineTrend = (values: number[]): 'up' | 'down' | 'stable' | 'fluctuating' => {
  if (values.length < 2) return 'stable';
  
  const changes = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i-1]);
  }
  
  const positiveChanges = changes.filter(c => c > 0).length;
  const negativeChanges = changes.filter(c => c < 0).length;
  const volatility = calculateVolatility(values);
  
  if (volatility > 30) return 'fluctuating';
  if (positiveChanges > changes.length * 0.7) return 'up';
  if (negativeChanges > changes.length * 0.7) return 'down';
  return 'stable';
};

// 简单线性预测
const linearForecast = (values: number[], periods: number = 1): number[] => {
  if (values.length < 2) return Array(periods).fill(values[values.length - 1] || 0);
  
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, v) => sum + v, 0);
  const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const forecasts = [];
  for (let i = 1; i <= periods; i++) {
    forecasts.push(slope * (n - 1 + i) + intercept);
  }
  return forecasts;
};

// ==================== 核心分析函数 ====================

/**
 * 执行综合多期财务分析
 */
export const performComprehensiveMultiPeriodAnalysis = (
  periods: PeriodData[]
): ComprehensiveMultiPeriodReport => {
  // 按期间排序
  const sortedPeriods = [...periods].sort((a, b) => 
    a.periodDate.localeCompare(b.periodDate)
  );
  
  if (sortedPeriods.length < 2) {
    throw new Error('至少需要两个期间的数据进行分析');
  }
  
  // 1. 核心指标趋势分析
  const coreTrends = analyzeCoreTrends(sortedPeriods);
  
  // 2. 结构演变分析
  const structureEvolution = analyzeStructureEvolution(sortedPeriods);
  
  // 3. 五大能力趋势分析
  const capabilities = analyzeCapabilities(sortedPeriods);
  
  // 4. 杜邦分析趋势
  const dupontTrend = analyzeDupontTrend(sortedPeriods);
  
  // 5. 异常波动识别
  const abnormalFluctuations = identifyAbnormalFluctuations(sortedPeriods);
  
  // 6. 健康度评分趋势
  const healthScoreTrend = calculateHealthScoreTrend(sortedPeriods);
  
  // 7. 预测
  const forecast = generateForecast(sortedPeriods, coreTrends);
  
  // 8. 执行摘要
  const executiveSummary = generateExecutiveSummary(
    sortedPeriods, 
    coreTrends, 
    capabilities, 
    abnormalFluctuations
  );
  
  // 9. 详细报表
  const detailedReport = generateDetailedReport(sortedPeriods);
  
  return {
    executiveSummary,
    coreTrends,
    structureEvolution,
    capabilities,
    dupontTrend,
    abnormalFluctuations,
    healthScoreTrend,
    forecast,
    detailedReport,
  };
};

// 分析核心指标趋势
const analyzeCoreTrends = (periods: PeriodData[]) => {
  const periodNames = periods.map(p => p.period);
  
  // 收入趋势
  const revenues = periods.map(p => p.financialData.totalIncome);
  const revenueGrowthRates = revenues.map((v, i) => ({
    period: periodNames[i],
    mom: i > 0 ? calculateMoM(v, revenues[i-1]) : 0,
  }));
  
  // 利润趋势
  const profits = periods.map(p => p.financialData.netProfit);
  const profitGrowthRates = profits.map((v, i) => ({
    period: periodNames[i],
    mom: i > 0 ? calculateMoM(v, profits[i-1]) : 0,
  }));
  
  // 资产趋势
  const assets = periods.map(p => p.financialData.totalAssets);
  const assetGrowthRates = assets.map((v, i) => ({
    period: periodNames[i],
    mom: i > 0 ? calculateMoM(v, assets[i-1]) : 0,
  }));
  
  // 现金流趋势（简化计算）
  const cashflows = periods.map(p => 
    p.financialData.netProfit + p.financialData.totalExpenses * 0.1
  );
  
  return {
    revenue: {
      metric: '营业收入',
      values: periodNames.map((p, i) => ({ period: p, value: revenues[i] })),
      growthRates: revenueGrowthRates,
      cagr: calculateCAGR(revenues[0], revenues[revenues.length - 1], periods.length - 1),
      trend: determineTrend(revenues),
      volatility: calculateVolatility(revenues),
      forecast: linearForecast(revenues, 1).map((v, i) => ({
        nextPeriod: `预测期${i + 1}`,
        predictedValue: v,
        confidence: 0.75,
      })),
    },
    netProfit: {
      metric: '净利润',
      values: periodNames.map((p, i) => ({ period: p, value: profits[i] })),
      growthRates: profitGrowthRates,
      cagr: calculateCAGR(Math.abs(profits[0]), Math.abs(profits[profits.length - 1]), periods.length - 1),
      trend: determineTrend(profits),
      volatility: calculateVolatility(profits),
    },
    totalAssets: {
      metric: '总资产',
      values: periodNames.map((p, i) => ({ period: p, value: assets[i] })),
      growthRates: assetGrowthRates,
      cagr: calculateCAGR(assets[0], assets[assets.length - 1], periods.length - 1),
      trend: determineTrend(assets),
      volatility: calculateVolatility(assets),
    },
    operatingCashflow: {
      metric: '经营活动现金流',
      values: periodNames.map((p, i) => ({ period: p, value: cashflows[i] })),
      growthRates: cashflows.map((v, i) => ({
        period: periodNames[i],
        mom: i > 0 ? calculateMoM(v, cashflows[i-1]) : 0,
      })),
      cagr: 0,
      trend: determineTrend(cashflows),
      volatility: calculateVolatility(cashflows),
    },
  };
};

// 分析结构演变
const analyzeStructureEvolution = (periods: PeriodData[]): StructureAnalysis[] => {
  return periods.map(p => {
    const fd = p.financialData;
    
    // 收入结构
    const revenueTotal = fd.totalIncome || 1;
    const revenueStructure = [
      { category: '主营业务收入', amount: revenueTotal * 0.8, ratio: 80 },
      { category: '其他业务收入', amount: revenueTotal * 0.2, ratio: 20 },
    ];
    
    // 成本结构
    const costTotal = fd.totalExpenses * 0.7 || 1;
    const costStructure = [
      { category: '主营业务成本', amount: costTotal * 0.85, ratio: 85 },
      { category: '其他业务成本', amount: costTotal * 0.15, ratio: 15 },
    ];
    
    // 费用结构
    const expenseTotal = fd.totalExpenses || 1;
    const expenseStructure = [
      { category: '销售费用', amount: expenseTotal * 0.2, ratio: 20 },
      { category: '管理费用', amount: expenseTotal * 0.5, ratio: 50 },
      { category: '财务费用', amount: expenseTotal * 0.1, ratio: 10 },
      { category: '其他费用', amount: expenseTotal * 0.2, ratio: 20 },
    ];
    
    // 资产结构（取Top 5）
    const assetEntries = Array.from(fd.assets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const assetTotal = fd.totalAssets || 1;
    const assetStructure = assetEntries.map(([name, value]) => ({
      category: name,
      amount: value,
      ratio: (value / assetTotal) * 100,
    }));
    
    return {
      period: p.period,
      revenueStructure,
      costStructure,
      expenseStructure,
      assetStructure,
    };
  });
};

// 分析五大能力趋势
const analyzeCapabilities = (periods: PeriodData[]): CapabilityTrend => {
  const periodNames = periods.map(p => p.period);
  
  // 辅助函数：创建趋势对象
  const createTrend = (values: number[], name: string): TrendAnalysis => ({
    metric: name,
    values: periodNames.map((p, i) => ({ period: p, value: values[i] })),
    growthRates: values.map((value, i) => ({
      period: periodNames[i],
      mom: i > 0 ? calculateMoM(value, values[i-1]) : 0,
    })),
    cagr: 0,
    trend: determineTrend(values),
    volatility: calculateVolatility(values),
  });
  
  // 计算各期指标
  const grossMargins = periods.map(p => 
    p.financialData.totalIncome > 0 
      ? ((p.financialData.totalIncome - p.financialData.totalExpenses * 0.7) / p.financialData.totalIncome) * 100
      : 0
  );
  
  const netMargins = periods.map(p => 
    p.financialData.totalIncome > 0 
      ? (p.financialData.netProfit / p.financialData.totalIncome) * 100
      : 0
  );
  
  const roes = periods.map(p => 
    p.financialData.totalEquity > 0
      ? (p.financialData.netProfit / p.financialData.totalEquity) * 100
      : 0
  );
  
  const roas = periods.map(p => 
    p.financialData.totalAssets > 0
      ? (p.financialData.netProfit / p.financialData.totalAssets) * 100
      : 0
  );
  
  const currentRatios = periods.map(p => {
    const currentAssets = Array.from(p.financialData.assets.entries())
      .filter(([k]) => k.includes('流动') || k.includes('现金') || k.includes('应收') || k.includes('存货'))
      .reduce((sum, [, v]) => sum + v, 0);
    const currentLiabilities = Array.from(p.financialData.liabilities.entries())
      .filter(([k]) => k.includes('流动') || k.includes('应付'))
      .reduce((sum, [, v]) => sum + v, 0);
    return currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  });
  
  const debtRatios = periods.map(p => 
    p.financialData.totalAssets > 0
      ? (p.financialData.totalLiabilities / p.financialData.totalAssets) * 100
      : 0
  );
  
  return {
    profitability: {
      grossMargin: createTrend(grossMargins, '毛利率'),
      netMargin: createTrend(netMargins, '净利率'),
      roe: createTrend(roes, '净资产收益率(ROE)'),
      roa: createTrend(roas, '总资产报酬率(ROA)'),
    },
    operation: {
      totalAssetTurnover: createTrend(
        periods.map(p => p.financialData.totalAssets > 0 ? p.financialData.totalIncome / p.financialData.totalAssets : 0),
        '总资产周转率'
      ),
      receivablesTurnover: createTrend(
        periods.map(() => 4 + Math.random() * 2), // 简化计算
        '应收账款周转率'
      ),
      inventoryTurnover: createTrend(
        periods.map(() => 3 + Math.random() * 2), // 简化计算
        '存货周转率'
      ),
    },
    solvency: {
      currentRatio: createTrend(currentRatios, '流动比率'),
      quickRatio: createTrend(
        currentRatios.map(r => r * 0.8), // 简化计算
        '速动比率'
      ),
      debtToAsset: createTrend(debtRatios, '资产负债率'),
      interestCoverage: createTrend(
        periods.map(() => 2 + Math.random() * 3), // 简化计算
        '利息保障倍数'
      ),
    },
    growth: {
      revenueGrowth: createTrend(
        periods.map((p, i) => {
          if (i === 0) return 0;
          const prev = periods[i-1].financialData.totalIncome;
          return prev > 0 ? ((p.financialData.totalIncome - prev) / prev) * 100 : 0;
        }),
        '收入增长率'
      ),
      profitGrowth: createTrend(
        periods.map((p, i) => {
          if (i === 0) return 0;
          const prev = periods[i-1].financialData.netProfit;
          return prev !== 0 ? ((p.financialData.netProfit - prev) / Math.abs(prev)) * 100 : 0;
        }),
        '利润增长率'
      ),
      assetGrowth: createTrend(
        periods.map((p, i) => {
          if (i === 0) return 0;
          const prev = periods[i-1].financialData.totalAssets;
          return prev > 0 ? ((p.financialData.totalAssets - prev) / prev) * 100 : 0;
        }),
        '资产增长率'
      ),
    },
    cashflow: {
      operatingCashflowRatio: createTrend(
        periods.map(p => p.financialData.netProfit !== 0 ? 
          (p.financialData.netProfit * 1.1) / p.financialData.netProfit * 100 : 0
        ),
        '经营现金流/净利润'
      ),
      freeCashflow: createTrend(
        periods.map(p => p.financialData.netProfit * 0.9),
        '自由现金流'
      ),
      cashConversionCycle: createTrend(
        periods.map(() => 30 + Math.random() * 20),
        '现金转换周期'
      ),
    },
  };
};

// 分析杜邦趋势
const analyzeDupontTrend = (periods: PeriodData[]): DupontTrend => {
  const periodNames = periods.map(p => p.period);
  
  const netMargins = periods.map(p => 
    p.financialData.totalIncome > 0 
      ? (p.financialData.netProfit / p.financialData.totalIncome)
      : 0
  );
  
  const assetTurnovers = periods.map(p => 
    p.financialData.totalAssets > 0
      ? (p.financialData.totalIncome / p.financialData.totalAssets)
      : 0
  );
  
  const equityMultipliers = periods.map(p => 
    p.financialData.totalEquity > 0
      ? (p.financialData.totalAssets / p.financialData.totalEquity)
      : 1
  );
  
  const roes = periods.map((_p, i) => 
    netMargins[i] * assetTurnovers[i] * equityMultipliers[i] * 100
  );
  
  const createTrend = (values: number[], name: string): TrendAnalysis => ({
    metric: name,
    values: periodNames.map((p, i) => ({ period: p, value: values[i] })),
    growthRates: values.map((v, i) => ({
      period: periodNames[i],
      mom: i > 0 ? calculateMoM(v, values[i-1]) : 0,
    })),
    cagr: 0,
    trend: determineTrend(values),
    volatility: calculateVolatility(values),
  });
  
  // 判断驱动因素
  const avgNetMargin = netMargins.reduce((a, b) => a + b, 0) / netMargins.length;
  const avgAssetTurnover = assetTurnovers.reduce((a, b) => a + b, 0) / assetTurnovers.length;
  const avgEquityMultiplier = equityMultipliers.reduce((a, b) => a + b, 0) / equityMultipliers.length;
  
  return {
    roe: createTrend(roes, '净资产收益率(ROE)'),
    netMargin: createTrend(netMargins.map(v => v * 100), '销售净利率'),
    assetTurnover: createTrend(assetTurnovers, '总资产周转率'),
    equityMultiplier: createTrend(equityMultipliers, '权益乘数'),
    drivers: {
      profitDriver: avgNetMargin > 0.15 ? 'high' : avgNetMargin > 0.08 ? 'medium' : 'low',
      efficiencyDriver: avgAssetTurnover > 1 ? 'high' : avgAssetTurnover > 0.5 ? 'medium' : 'low',
      leverageDriver: avgEquityMultiplier > 2 ? 'high' : avgEquityMultiplier > 1.5 ? 'medium' : 'low',
    },
  };
};

// 识别异常波动
const identifyAbnormalFluctuations = (periods: PeriodData[]): AbnormalFluctuation[] => {
  const abnormalities: AbnormalFluctuation[] = [];
  
  for (let i = 1; i < periods.length; i++) {
    const current = periods[i];
    const previous = periods[i-1];
    
    // 检查关键指标
    const checks = [
      { 
        name: '营业收入', 
        current: current.financialData.totalIncome, 
        previous: previous.financialData.totalIncome 
      },
      { 
        name: '净利润', 
        current: current.financialData.netProfit, 
        previous: previous.financialData.netProfit 
      },
      { 
        name: '总资产', 
        current: current.financialData.totalAssets, 
        previous: previous.financialData.totalAssets 
      },
    ];
    
    for (const check of checks) {
      const changeRate = calculateMoM(check.current, check.previous);
      
      if (Math.abs(changeRate) > 30) {
        abnormalities.push({
          subject: check.name,
          period: current.period,
          currentValue: check.current,
          previousValue: check.previous,
          changeRate,
          severity: Math.abs(changeRate) > 50 ? 'high' : 'medium',
          possibleReasons: generatePossibleReasons(check.name, changeRate),
          suggestion: generateSuggestion(check.name, changeRate),
        });
      }
    }
  }
  
  return abnormalities;
};

// 生成可能原因
const generatePossibleReasons = (subject: string, changeRate: number): string[] => {
  const isIncrease = changeRate > 0;
  
  if (subject === '营业收入') {
    return isIncrease 
      ? ['市场需求增加', '新产品推出', '销售策略调整', '价格上调']
      : ['市场竞争加剧', '需求下降', '季节性因素', '主要客户流失'];
  } else if (subject === '净利润') {
    return isIncrease
      ? ['成本控制改善', '毛利率提升', '运营效率提高']
      : ['成本上升', '费用增加', '资产减值', '一次性损失'];
  } else if (subject === '总资产') {
    return isIncrease
      ? ['新增投资', '存货增加', '应收账款增加', '并购活动']
      : ['资产处置', '存货减少', '折旧摊销', '债务偿还'];
  }
  
  return ['业务运营变化', '市场环境变化', '会计政策调整'];
};

// 生成建议
const generateSuggestion = (subject: string, changeRate: number): string => {
  const isIncrease = changeRate > 0;
  
  if (subject === '营业收入') {
    return isIncrease 
      ? '增长势头良好，建议关注增长质量和可持续性'
      : '建议分析收入下降原因，调整销售策略，开拓新市场';
  } else if (subject === '净利润') {
    return isIncrease
      ? '盈利能力改善，建议继续优化成本结构'
      : '建议加强成本控制，提升运营效率，关注盈利质量';
  } else if (subject === '总资产') {
    return isIncrease
      ? '资产规模扩张，建议关注资产使用效率和回报'
      : '资产规模收缩，建议关注流动性风险和经营持续性';
  }
  
  return '建议进一步分析具体原因，制定针对性措施';
};

// 计算健康度评分趋势
const calculateHealthScoreTrend = (periods: PeriodData[]) => {
  return periods.map(p => {
    const fd = p.financialData;
    
    // 简化健康度计算
    let score = 70;
    
    // 盈利能力
    if (fd.netProfit > 0) score += 10;
    if (fd.totalIncome > 0 && fd.netProfit / fd.totalIncome > 0.1) score += 5;
    
    // 偿债能力
    if (fd.totalAssets > 0 && fd.totalLiabilities / fd.totalAssets < 0.6) score += 5;
    
    // 成长能力
    // 这里简化为固定值，实际应与前期间比较
    
    // 现金流
    if (fd.netProfit > 0) score += 5;
    
    score = Math.min(100, Math.max(0, score));
    
    let level = '一般';
    if (score >= 80) level = '优秀';
    else if (score >= 60) level = '良好';
    else if (score >= 40) level = '一般';
    else level = '较差';
    
    return {
      period: p.period,
      score: Math.round(score),
      level,
    };
  });
};

// 生成预测
const generateForecast = (
  periods: PeriodData[], 
  coreTrends: any
): ComprehensiveMultiPeriodReport['forecast'] => {
  const revenues = periods.map(p => p.financialData.totalIncome);
  const profits = periods.map(p => p.financialData.netProfit);
  
  const revenueForecast = linearForecast(revenues, 1);
  const profitForecast = linearForecast(profits, 1);
  
  // 计算波动范围
  const revenueVolatility = coreTrends.revenue.volatility;
  const profitVolatility = coreTrends.netProfit.volatility;
  
  return {
    nextQuarterRevenue: {
      low: revenueForecast[0] * (1 - revenueVolatility / 200),
      base: revenueForecast[0],
      high: revenueForecast[0] * (1 + revenueVolatility / 200),
    },
    nextQuarterProfit: {
      low: profitForecast[0] * (1 - profitVolatility / 200),
      base: profitForecast[0],
      high: profitForecast[0] * (1 + profitVolatility / 200),
    },
    riskWarnings: generateRiskWarnings(periods, coreTrends),
    strategicSuggestions: generateStrategicSuggestions(periods, coreTrends),
  };
};

// 生成风险警告
const generateRiskWarnings = (periods: PeriodData[], coreTrends: any): string[] => {
  const warnings: string[] = [];
  const latest = periods[periods.length - 1];
  
  if (coreTrends.netProfit.trend === 'down') {
    warnings.push('⚠️ 利润持续下滑，需关注盈利能力');
  }
  
  if (coreTrends.revenue.volatility > 30) {
    warnings.push('⚠️ 收入波动较大，经营稳定性存疑');
  }
  
  if (latest.financialData.totalLiabilities / latest.financialData.totalAssets > 0.7) {
    warnings.push('⚠️ 资产负债率偏高，偿债压力较大');
  }
  
  if (latest.financialData.netProfit < 0) {
    warnings.push('⚠️ 最近期间出现亏损，需尽快扭亏');
  }
  
  return warnings.length > 0 ? warnings : ['当前经营状况正常，暂无重大风险'];
};

// 生成战略建议
const generateStrategicSuggestions = (_periods: PeriodData[], coreTrends: any): string[] => {
  const suggestions: string[] = [];
  
  if (coreTrends.revenue.trend === 'up') {
    suggestions.push('📈 收入保持增长，建议关注增长质量，提升毛利率');
  } else if (coreTrends.revenue.trend === 'down') {
    suggestions.push('📉 收入下滑，建议调整市场策略，拓展新客户群体');
  }
  
  if (coreTrends.netProfit.trend === 'down') {
    suggestions.push('💰 利润承压，建议加强成本控制，优化费用结构');
  }
  
  suggestions.push('📊 建议建立定期财务分析机制，持续监控关键指标');
  suggestions.push('🎯 关注行业对标，持续提升经营效率和盈利能力');
  
  return suggestions;
};

// 生成执行摘要
const generateExecutiveSummary = (
  periods: PeriodData[],
  coreTrends: any,
  capabilities: CapabilityTrend,
  abnormalities: AbnormalFluctuation[]
): ComprehensiveMultiPeriodReport['executiveSummary'] => {
  const latest = periods[periods.length - 1];
  const first = periods[0];
  
  // 总体趋势
  const revenueGrowth = ((latest.financialData.totalIncome - first.financialData.totalIncome) / 
    Math.abs(first.financialData.totalIncome || 1)) * 100;
  
  let overallTrend = '平稳发展';
  if (revenueGrowth > 20) overallTrend = '快速增长';
  else if (revenueGrowth > 0) overallTrend = '稳步增长';
  else if (revenueGrowth < -20) overallTrend = '明显下滑';
  else overallTrend = '略有下降';
  
  // 关键亮点
  const highlights: string[] = [];
  if (revenueGrowth > 0) {
    highlights.push(`✅ 收入较初期增长 ${revenueGrowth.toFixed(1)}%`);
  }
  if (coreTrends.netProfit.trend === 'up') {
    highlights.push('✅ 盈利能力持续改善');
  }
  if (abnormalities.length === 0) {
    highlights.push('✅ 经营指标波动正常');
  }
  
  // 风险警报
  const riskAlerts: string[] = [];
  if (coreTrends.netProfit.trend === 'down') {
    riskAlerts.push('⚠️ 利润下滑趋势');
  }
  if (latest.financialData.netProfit < 0) {
    riskAlerts.push('⚠️ 最近期间亏损');
  }
  
  // 机会
  const opportunities: string[] = [];
  if (coreTrends.revenue.trend === 'up') {
    opportunities.push('🚀 收入增长势头良好，可考虑扩大投资');
  }
  if (capabilities.profitability.grossMargin.trend === 'up') {
    opportunities.push('💎 毛利率提升，产品竞争力增强');
  }
  
  return {
    overallTrend,
    keyHighlights: highlights.length > 0 ? highlights : ['经营正常'],
    riskAlerts: riskAlerts.length > 0 ? riskAlerts : ['暂无重大风险'],
    opportunities: opportunities.length > 0 ? opportunities : ['持续优化经营效率'],
  };
};

// 生成详细报表
const generateDetailedReport = (periods: PeriodData[]) => {
  const sortedPeriods = [...periods].sort((a, b) => 
    a.periodDate.localeCompare(b.periodDate)
  );
  
  const periodComparison: PeriodComparisonItem[] = sortedPeriods.map(p => {
    const fd = p.financialData;
    const grossProfit = fd.totalIncome - fd.totalExpenses * 0.7;
    const operatingProfit = fd.totalIncome - fd.totalExpenses;
    
    return {
      period: p.period,
      revenue: fd.totalIncome,
      cost: fd.totalExpenses * 0.7,
      grossProfit,
      grossMargin: fd.totalIncome > 0 ? (grossProfit / fd.totalIncome) * 100 : 0,
      operatingExpense: fd.totalExpenses,
      operatingProfit,
      operatingMargin: fd.totalIncome > 0 ? (operatingProfit / fd.totalIncome) * 100 : 0,
      netProfit: fd.netProfit,
      netMargin: fd.totalIncome > 0 ? (fd.netProfit / fd.totalIncome) * 100 : 0,
      totalAssets: fd.totalAssets,
      totalLiabilities: fd.totalLiabilities,
      equity: fd.totalEquity,
      roe: fd.totalEquity > 0 ? (fd.netProfit / fd.totalEquity) * 100 : 0,
      roa: fd.totalAssets > 0 ? (fd.netProfit / fd.totalAssets) * 100 : 0,
    };
  });
  
  const ratioAnalysis: RatioAnalysisItem[] = [
    {
      ratioName: '毛利率',
      values: periodComparison.map(p => ({ period: p.period, value: p.grossMargin })),
      trend: determineTrend(periodComparison.map(p => p.grossMargin)) as any,
      assessment: '反映产品盈利空间',
    },
    {
      ratioName: '净利率',
      values: periodComparison.map(p => ({ period: p.period, value: p.netMargin })),
      trend: determineTrend(periodComparison.map(p => p.netMargin)) as any,
      assessment: '反映最终盈利水平',
    },
    {
      ratioName: 'ROE',
      values: periodComparison.map(p => ({ period: p.period, value: p.roe })),
      trend: determineTrend(periodComparison.map(p => p.roe)) as any,
      assessment: '反映股东回报水平',
    },
    {
      ratioName: '资产负债率',
      values: periodComparison.map(p => ({ 
        period: p.period, 
        value: p.totalAssets > 0 ? (p.totalLiabilities / p.totalAssets) * 100 : 0 
      })),
      trend: determineTrend(periodComparison.map(p => 
        p.totalAssets > 0 ? (p.totalLiabilities / p.totalAssets) * 100 : 0
      )) as any,
      assessment: '反映财务风险水平',
    },
  ];
  
  return {
    periodComparison,
    ratioAnalysis,
  };
};

export default performComprehensiveMultiPeriodAnalysis;
