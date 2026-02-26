import type { FinancialData } from '@/utils/excelParser';
import type { FinancialMetrics } from '@/types/accounting';

export interface ForecastResult {
  forecastPeriods: string[];
  revenueForecast: ForecastItem[];
  profitForecast: ForecastItem[];
  assetsForecast: ForecastItem[];
  keyMetricsForecast: KeyMetricForecast[];
  trends: TrendAnalysis;
  suggestions: string[];
}

export interface ForecastItem {
  period: string;
  actual?: number; // 实际值（历史数据）
  forecast: number; // 预测值
  lowerBound: number; // 置信区间下限
  upperBound: number; // 置信区间上限
  growthRate?: number; // 增长率
}

export interface KeyMetricForecast {
  metric: string;
  metricName: string;
  currentValue: number;
  forecastValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'danger';
}

export interface TrendAnalysis {
  revenueGrowth: TrendInfo;
  profitGrowth: TrendInfo;
  assetGrowth: TrendInfo;
  overallTrend: 'positive' | 'negative' | 'stable';
  seasonality: boolean;
  volatility: 'high' | 'medium' | 'low';
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  averageRate: number;
}

interface HistoricalPoint {
  period: string;
  revenue: number;
  profit: number;
  assets: number;
}

/**
 * 执行财务预测分析
 * @param financialData 当前财务数据
 * @param metrics 当前财务指标
 * @param historicalData 历史数据（多期）
 */
export const performFinancialForecast = (
  financialData: FinancialData,
  metrics: FinancialMetrics,
  historicalData?: HistoricalPoint[]
): ForecastResult => {
  // 如果没有历史数据，使用当前数据生成模拟历史数据用于演示
  const history = historicalData || generateMockHistory(financialData);
  
  // 预测未来3期
  const forecastPeriods = generateForecastPeriods(3);
  
  // 收入预测
  const revenueForecast = forecastRevenue(history, forecastPeriods);
  
  // 利润预测
  const profitForecast = forecastProfit(history, forecastPeriods);
  
  // 资产预测
  const assetsForecast = forecastAssets(history, forecastPeriods);
  
  // 关键指标预测
  const keyMetricsForecast = forecastKeyMetrics(metrics, history, forecastPeriods);
  
  // 趋势分析
  const trends = analyzeTrends(history);
  
  // 生成建议
  const suggestions = generateForecastSuggestions(trends, keyMetricsForecast);
  
  return {
    forecastPeriods,
    revenueForecast,
    profitForecast,
    assetsForecast,
    keyMetricsForecast,
    trends,
    suggestions
  };
};

/**
 * 生成预测期间标签
 */
const generateForecastPeriods = (count: number): string[] => {
  const periods: string[] = [];
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  
  for (let i = 1; i <= count; i++) {
    let quarter = currentQuarter + i;
    let year = currentYear;
    
    while (quarter > 4) {
      quarter -= 4;
      year += 1;
    }
    
    periods.push(`${year}Q${quarter}`);
  }
  
  return periods;
};

/**
 * 生成模拟历史数据（用于演示）
 */
const generateMockHistory = (currentData: FinancialData): HistoricalPoint[] => {
  const revenue = currentData.totalIncome || 1000000;
  const profit = currentData.netProfit || 100000;
  const assets = currentData.totalAssets || 500000;
  
  const history: HistoricalPoint[] = [];
  const now = new Date();
  
  for (let i = 4; i >= 1; i--) {
    const quarter = Math.floor(now.getMonth() / 3) + 1 - i;
    const year = now.getFullYear() + Math.floor(quarter / 4);
    const adjustedQuarter = ((quarter % 4) + 4) % 4 + 1;
    
    // 添加一些随机波动
    const factor = 0.85 + Math.random() * 0.15;
    history.push({
      period: `${year}Q${adjustedQuarter}`,
      revenue: Math.round(revenue * (0.7 + i * 0.08) * factor),
      profit: Math.round(profit * (0.6 + i * 0.12) * factor),
      assets: Math.round(assets * (0.9 + i * 0.025) * factor)
    });
  }
  
  // 添加当前期
  history.push({
    period: '当前',
    revenue,
    profit,
    assets
  });
  
  return history;
};

/**
 * 线性回归预测
 */
const linearRegression = (data: number[]): { slope: number; intercept: number; r2: number } => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 计算 R²
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = data.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - ssResidual / ssTotal;
  
  return { slope, intercept, r2 };
};

/**
 * 预测收入
 */
const forecastRevenue = (history: HistoricalPoint[], periods: string[]): ForecastItem[] => {
  const revenues = history.map(h => h.revenue);
  const { slope, intercept } = linearRegression(revenues);
  
  const lastIndex = revenues.length - 1;
  const volatility = calculateVolatility(revenues);
  
  return periods.map((period: string, i: number) => {
    const forecastIndex = lastIndex + i + 1;
    const forecast = Math.max(0, slope * forecastIndex + intercept);
    const margin = forecast * volatility * (1 + i * 0.1); // 预测越远，置信区间越宽
    const lastRevenue = revenues[revenues.length - 1];
    const growthRate = lastRevenue > 0 ? ((forecast - lastRevenue) / lastRevenue) * 100 : 0;
    
    return {
      period,
      forecast: Math.round(forecast),
      lowerBound: Math.round(forecast - margin),
      upperBound: Math.round(forecast + margin),
      growthRate: Math.round(growthRate * 10) / 10
    };
  });
};

/**
 * 预测利润
 */
const forecastProfit = (history: HistoricalPoint[], periods: string[]): ForecastItem[] => {
  const profits = history.map(h => h.profit);
  const { slope, intercept } = linearRegression(profits);
  
  const lastIndex = profits.length - 1;
  const volatility = calculateVolatility(profits);
  
  return periods.map((period, i) => {
    const forecastIndex = lastIndex + i + 1;
    const forecast = Math.max(0, slope * forecastIndex + intercept);
    const margin = forecast * volatility * (1 + i * 0.15);
    const lastProfit = profits[profits.length - 1];
    const growthRate = lastProfit > 0 ? ((forecast - lastProfit) / lastProfit) * 100 : 0;
    
    return {
      period,
      forecast: Math.round(forecast),
      lowerBound: Math.round(Math.max(0, forecast - margin)),
      upperBound: Math.round(forecast + margin),
      growthRate: Math.round(growthRate * 10) / 10
    };
  });
};

/**
 * 预测资产
 */
const forecastAssets = (history: HistoricalPoint[], periods: string[]): ForecastItem[] => {
  const assets = history.map(h => h.assets);
  const { slope, intercept } = linearRegression(assets);
  
  const lastIndex = assets.length - 1;
  const volatility = calculateVolatility(assets);
  
  return periods.map((period: string, i: number) => {
    const forecastIndex = lastIndex + i + 1;
    const forecast = Math.max(0, slope * forecastIndex + intercept);
    const margin = forecast * volatility * (1 + i * 0.1);
    
    return {
      period,
      forecast: Math.round(forecast),
      lowerBound: Math.round(forecast - margin),
      upperBound: Math.round(forecast + margin)
    };
  });
};

/**
 * 预测关键指标
 */
const forecastKeyMetrics = (
  currentMetrics: FinancialMetrics,
  history: HistoricalPoint[],
  _periods: string[]
): KeyMetricForecast[] => {
  const metrics: KeyMetricForecast[] = [];
  
  // 收入增长率趋势
  const revenues = history.map(h => h.revenue);
  const revenueGrowth = calculateGrowthTrend(revenues);
  metrics.push({
    metric: 'revenueGrowth',
    metricName: '收入增长率',
    currentValue: currentMetrics.revenueGrowthRate || 0,
    forecastValue: revenueGrowth.forecast,
    change: revenueGrowth.forecast - (currentMetrics.revenueGrowthRate || 0),
    trend: revenueGrowth.forecast > (currentMetrics.revenueGrowthRate || 0) ? 'up' : 'down',
    status: revenueGrowth.forecast > 10 ? 'healthy' : revenueGrowth.forecast > 0 ? 'warning' : 'danger'
  });
  
  // 净利润增长率趋势
  const profits = history.map(h => h.profit);
  const profitGrowth = calculateGrowthTrend(profits);
  metrics.push({
    metric: 'profitGrowth',
    metricName: '净利润增长率',
    currentValue: currentMetrics.netProfitGrowthRate || 0,
    forecastValue: profitGrowth.forecast,
    change: profitGrowth.forecast - (currentMetrics.netProfitGrowthRate || 0),
    trend: profitGrowth.forecast > (currentMetrics.netProfitGrowthRate || 0) ? 'up' : 'down',
    status: profitGrowth.forecast > 15 ? 'healthy' : profitGrowth.forecast > 0 ? 'warning' : 'danger'
  });
  
  // ROE趋势预测
  const roeTrend = predictMetricTrend(currentMetrics.roe || 10, 0.5);
  metrics.push({
    metric: 'roe',
    metricName: '净资产收益率(ROE)',
    currentValue: currentMetrics.roe || 0,
    forecastValue: roeTrend,
    change: roeTrend - (currentMetrics.roe || 0),
    trend: roeTrend > (currentMetrics.roe || 0) ? 'up' : 'down',
    status: roeTrend > 15 ? 'healthy' : roeTrend > 8 ? 'warning' : 'danger'
  });
  
  // 资产负债率趋势预测
  const debtTrend = predictMetricTrend(currentMetrics.debtToAssetRatio || 50, -0.2);
  metrics.push({
    metric: 'debtToAssetRatio',
    metricName: '资产负债率',
    currentValue: currentMetrics.debtToAssetRatio || 0,
    forecastValue: Math.max(0, debtTrend),
    change: Math.max(0, debtTrend) - (currentMetrics.debtToAssetRatio || 0),
    trend: debtTrend < (currentMetrics.debtToAssetRatio || 0) ? 'up' : 'down',
    status: debtTrend < 50 ? 'healthy' : debtTrend < 70 ? 'warning' : 'danger'
  });
  
  // 毛利率趋势预测
  const marginTrend = predictMetricTrend(currentMetrics.grossProfitMargin || 20, 0.3);
  metrics.push({
    metric: 'grossProfitMargin',
    metricName: '毛利率',
    currentValue: currentMetrics.grossProfitMargin || 0,
    forecastValue: marginTrend,
    change: marginTrend - (currentMetrics.grossProfitMargin || 0),
    trend: marginTrend > (currentMetrics.grossProfitMargin || 0) ? 'up' : 'down',
    status: marginTrend > 30 ? 'healthy' : marginTrend > 15 ? 'warning' : 'danger'
  });
  
  return metrics;
};

/**
 * 计算波动率
 */
const calculateVolatility = (data: number[]): number => {
  if (data.length < 2) return 0.1;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return mean > 0 ? stdDev / mean : 0.1;
};

/**
 * 计算增长趋势
 */
const calculateGrowthTrend = (data: number[]): { forecast: number; trend: number } => {
  if (data.length < 2) return { forecast: 0, trend: 0 };
  
  const growthRates: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] > 0) {
      growthRates.push((data[i] - data[i - 1]) / data[i - 1] * 100);
    }
  }
  
  if (growthRates.length === 0) return { forecast: 0, trend: 0 };
  
  const avg = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const { slope } = linearRegression(growthRates);
  
  return {
    forecast: Math.round((avg + slope) * 10) / 10,
    trend: slope
  };
};

/**
 * 预测指标趋势
 */
const predictMetricTrend = (currentValue: number, bias: number): number => {
  // 添加一些随机性和趋势偏差
  const randomFactor = (Math.random() - 0.5) * 2;
  const change = bias + randomFactor;
  return Math.round((currentValue + change) * 10) / 10;
};

/**
 * 分析趋势
 */
const analyzeTrends = (history: HistoricalPoint[]): TrendAnalysis => {
  const revenues = history.map(h => h.revenue);
  const profits = history.map(h => h.profit);
  const assets = history.map(h => h.assets);
  
  const revenueGrowth = calculateGrowthTrend(revenues);
  const profitGrowth = calculateGrowthTrend(profits);
  const assetGrowth = calculateGrowthTrend(assets);
  
  const revenueVolatility = calculateVolatility(revenues);
  
  // 判断整体趋势
  let positiveCount = 0;
  let negativeCount = 0;
  
  if (revenueGrowth.forecast > 0) positiveCount++;
  else negativeCount++;
  
  if (profitGrowth.forecast > 0) positiveCount++;
  else negativeCount++;
  
  const overallTrend = positiveCount > negativeCount ? 'positive' : 
                       negativeCount > positiveCount ? 'negative' : 'stable';
  
  return {
    revenueGrowth: {
      direction: revenueGrowth.forecast > 5 ? 'up' : revenueGrowth.forecast < -5 ? 'down' : 'stable',
      strength: Math.abs(revenueGrowth.trend) > 5 ? 'strong' : Math.abs(revenueGrowth.trend) > 2 ? 'moderate' : 'weak',
      averageRate: revenueGrowth.forecast
    },
    profitGrowth: {
      direction: profitGrowth.forecast > 10 ? 'up' : profitGrowth.forecast < -10 ? 'down' : 'stable',
      strength: Math.abs(profitGrowth.trend) > 10 ? 'strong' : Math.abs(profitGrowth.trend) > 5 ? 'moderate' : 'weak',
      averageRate: profitGrowth.forecast
    },
    assetGrowth: {
      direction: assetGrowth.forecast > 5 ? 'up' : assetGrowth.forecast < -5 ? 'down' : 'stable',
      strength: Math.abs(assetGrowth.trend) > 5 ? 'strong' : Math.abs(assetGrowth.trend) > 2 ? 'moderate' : 'weak',
      averageRate: assetGrowth.forecast
    },
    overallTrend,
    seasonality: false, // 简化处理
    volatility: revenueVolatility > 0.3 ? 'high' : revenueVolatility > 0.15 ? 'medium' : 'low'
  };
};

/**
 * 生成预测建议
 */
const generateForecastSuggestions = (
  trends: TrendAnalysis,
  metrics: KeyMetricForecast[]
): string[] => {
  const suggestions: string[] = [];
  
  // 整体趋势建议
  if (trends.overallTrend === 'positive') {
    suggestions.push('财务预测显示整体趋势向好，建议保持当前经营策略并适度扩大规模。');
  } else if (trends.overallTrend === 'negative') {
    suggestions.push('⚠️ 预测显示财务指标可能下滑，建议审查成本结构和收入质量，制定应对预案。');
  } else {
    suggestions.push('预测显示财务将保持稳定，建议关注关键指标的细微变化，寻找增长机会。');
  }
  
  // 增长率建议
  const revenueForecast = metrics.find(m => m.metric === 'revenueGrowth');
  if (revenueForecast && revenueForecast.forecastValue < 0) {
    suggestions.push(`收入增长率预计下滑至 ${revenueForecast.forecastValue}%，建议加强市场开拓和产品创新。`);
  }
  
  const profitForecast = metrics.find(m => m.metric === 'profitGrowth');
  if (profitForecast && profitForecast.forecastValue < 0) {
    suggestions.push(`净利润增长面临压力，建议优化成本结构，提升运营效率。`);
  }
  
  // ROE建议
  const roeForecast = metrics.find(m => m.metric === 'roe');
  if (roeForecast && roeForecast.forecastValue < 10) {
    suggestions.push(`ROE预计为 ${roeForecast.forecastValue}%，低于理想水平，建议提升资产周转率或优化资本结构。`);
  }
  
  // 波动性建议
  if (trends.volatility === 'high') {
    suggestions.push('收入波动较大，建议建立风险缓冲机制，增强抗风险能力。');
  }
  
  // 资产负债率建议
  const debtForecast = metrics.find(m => m.metric === 'debtToAssetRatio');
  if (debtForecast && debtForecast.forecastValue > 60) {
    suggestions.push(`资产负债率预计达 ${debtForecast.forecastValue}%，需关注偿债压力和财务风险。`);
  }
  
  return suggestions;
};
