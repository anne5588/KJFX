import type { FinancialMetrics } from '@/types/accounting';

export interface IndustryComparisonResult {
  industry: string;
  comparisonMetrics: IndustryMetricComparison[];
  overallScore: number;
  ranking: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface IndustryMetricComparison {
  metric: string;
  metricName: string;
  companyValue: number;
  industryAvg: number;
  industryBest: number;
  percentile: number; // 百分位排名
  status: 'excellent' | 'good' | 'average' | 'below' | 'poor';
  gap: number; // 与行业平均的差距
}

export interface IndustryBenchmark {
  name: string;
  indicators: Record<string, number>;
}

// 行业基准数据（基于一般行业标准）
const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  '制造业': {
    name: '制造业',
    indicators: {
      currentRatio: 1.5,
      quickRatio: 1.0,
      debtToAssetRatio: 55,
      roe: 12,
      roa: 6,
      grossProfitMargin: 25,
      netProfitMargin: 8,
      totalAssetTurnover: 0.8,
      inventoryTurnover: 6,
      receivablesTurnover: 8
    }
  },
  '零售业': {
    name: '零售业',
    indicators: {
      currentRatio: 1.8,
      quickRatio: 1.2,
      debtToAssetRatio: 60,
      roe: 15,
      roa: 8,
      grossProfitMargin: 30,
      netProfitMargin: 4,
      totalAssetTurnover: 2.0,
      inventoryTurnover: 8,
      receivablesTurnover: 15
    }
  },
  '科技业': {
    name: '科技业',
    indicators: {
      currentRatio: 2.5,
      quickRatio: 2.0,
      debtToAssetRatio: 40,
      roe: 18,
      roa: 12,
      grossProfitMargin: 55,
      netProfitMargin: 15,
      totalAssetTurnover: 0.6,
      inventoryTurnover: 4,
      receivablesTurnover: 6
    }
  },
  '房地产': {
    name: '房地产',
    indicators: {
      currentRatio: 1.4,
      quickRatio: 0.5,
      debtToAssetRatio: 70,
      roe: 14,
      roa: 5,
      grossProfitMargin: 28,
      netProfitMargin: 12,
      totalAssetTurnover: 0.3,
      inventoryTurnover: 0.5,
      receivablesTurnover: 4
    }
  },
  '通用': {
    name: '通用行业',
    indicators: {
      currentRatio: 2.0,
      quickRatio: 1.5,
      debtToAssetRatio: 50,
      roe: 12,
      roa: 6,
      grossProfitMargin: 30,
      netProfitMargin: 10,
      totalAssetTurnover: 1.0,
      inventoryTurnover: 5,
      receivablesTurnover: 8
    }
  }
};

/**
 * 执行同行业对比分析
 * @param metrics 当前财务指标
 * @param industry 行业类型（可选，默认通用）
 */
export const performIndustryComparison = (
  metrics: FinancialMetrics,
  industry: string = '通用'
): IndustryComparisonResult => {
  // 获取行业基准
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['通用'];
  
  // 对比各项指标
  const comparisonMetrics = compareMetrics(metrics, benchmark);
  
  // 计算综合得分
  const overallScore = calculateOverallScore(comparisonMetrics);
  
  // 确定排名
  const ranking = determineRanking(overallScore);
  
  // 识别优势和劣势
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses(comparisonMetrics);
  
  // 生成建议
  const suggestions = generateComparisonSuggestions(comparisonMetrics, strengths, weaknesses);
  
  return {
    industry: benchmark.name,
    comparisonMetrics,
    overallScore,
    ranking,
    strengths,
    weaknesses,
    suggestions
  };
};

/**
 * 对比各项指标
 */
const compareMetrics = (
  metrics: FinancialMetrics,
  benchmark: IndustryBenchmark
): IndustryMetricComparison[] => {
  const comparisons: IndustryMetricComparison[] = [];
  
  const metricMappings: { key: keyof FinancialMetrics; name: string; isHigherBetter: boolean }[] = [
    { key: 'currentRatio', name: '流动比率', isHigherBetter: true },
    { key: 'quickRatio', name: '速动比率', isHigherBetter: true },
    { key: 'debtToAssetRatio', name: '资产负债率', isHigherBetter: false },
    { key: 'roe', name: '净资产收益率(ROE)', isHigherBetter: true },
    { key: 'roa', name: '总资产报酬率(ROA)', isHigherBetter: true },
    { key: 'grossProfitMargin', name: '毛利率', isHigherBetter: true },
    { key: 'netProfitMargin', name: '净利率', isHigherBetter: true },
    { key: 'totalAssetTurnover', name: '总资产周转率', isHigherBetter: true },
    { key: 'inventoryTurnover', name: '存货周转率', isHigherBetter: true },
    { key: 'receivablesTurnover', name: '应收账款周转率', isHigherBetter: true }
  ];
  
  metricMappings.forEach(({ key, name, isHigherBetter }) => {
    const companyValue = metrics[key] || 0;
    const industryAvg = benchmark.indicators[key] || 0;
    
    // 假设行业最佳值为平均值的1.5倍（正向指标）或0.5倍（负向指标）
    const industryBest = isHigherBetter 
      ? industryAvg * 1.5 
      : industryAvg * 0.5;
    
    // 计算百分位排名（简化算法）
    let percentile: number;
    if (isHigherBetter) {
      percentile = companyValue >= industryBest ? 95 :
                   companyValue >= industryAvg * 1.2 ? 80 :
                   companyValue >= industryAvg ? 60 :
                   companyValue >= industryAvg * 0.8 ? 40 :
                   companyValue >= industryAvg * 0.6 ? 20 : 10;
    } else {
      percentile = companyValue <= industryBest ? 95 :
                   companyValue <= industryAvg * 0.8 ? 80 :
                   companyValue <= industryAvg ? 60 :
                   companyValue <= industryAvg * 1.2 ? 40 :
                   companyValue <= industryAvg * 1.4 ? 20 : 10;
    }
    
    // 计算与行业平均的差距（百分比）
    const gap = industryAvg > 0 
      ? ((companyValue - industryAvg) / industryAvg) * 100 
      : 0;
    
    // 确定状态
    let status: IndustryMetricComparison['status'];
    if (percentile >= 80) status = 'excellent';
    else if (percentile >= 60) status = 'good';
    else if (percentile >= 40) status = 'average';
    else if (percentile >= 20) status = 'below';
    else status = 'poor';
    
    comparisons.push({
      metric: key,
      metricName: name,
      companyValue: Math.round(companyValue * 100) / 100,
      industryAvg: Math.round(industryAvg * 100) / 100,
      industryBest: Math.round(industryBest * 100) / 100,
      percentile,
      status,
      gap: Math.round(gap * 10) / 10
    });
  });
  
  return comparisons;
};

/**
 * 计算综合得分
 */
const calculateOverallScore = (comparisons: IndustryMetricComparison[]): number => {
  const weights: Record<string, number> = {
    'currentRatio': 0.08,
    'quickRatio': 0.08,
    'debtToAssetRatio': 0.10,
    'roe': 0.15,
    'roa': 0.10,
    'grossProfitMargin': 0.12,
    'netProfitMargin': 0.12,
    'totalAssetTurnover': 0.08,
    'inventoryTurnover': 0.08,
    'receivablesTurnover': 0.09
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  comparisons.forEach(comp => {
    const weight = weights[comp.metric] || 0.1;
    // 将百分位转换为0-100分
    const score = comp.percentile;
    totalScore += score * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) / 10 : 50;
};

/**
 * 确定排名等级
 */
const determineRanking = (score: number): string => {
  if (score >= 85) return '行业领先（前10%）';
  if (score >= 70) return '行业中上（前30%）';
  if (score >= 50) return '行业平均（前50%）';
  if (score >= 30) return '行业偏下（后30%）';
  return '行业落后（后10%）';
};

/**
 * 分析优势和劣势
 */
const analyzeStrengthsWeaknesses = (
  comparisons: IndustryMetricComparison[]
): { strengths: string[]; weaknesses: string[] } => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  // 按百分位排序
  const sorted = [...comparisons].sort((a, b) => b.percentile - a.percentile);
  
  // 前3名作为优势
  sorted.slice(0, 3).forEach(comp => {
    if (comp.percentile >= 60) {
      const gapText = comp.gap > 0 ? `高于行业平均 ${comp.gap}%` : `接近行业平均`;
      strengths.push(`${comp.metricName}：${gapText}，处于行业前 ${100 - comp.percentile}%`);
    }
  });
  
  // 后3名作为劣势
  sorted.slice(-3).reverse().forEach(comp => {
    if (comp.percentile < 60) {
      const gapAbs = Math.abs(comp.gap);
      const gapText = comp.gap < 0 ? `低于行业平均 ${gapAbs}%` : `略高于行业平均`;
      weaknesses.push(`${comp.metricName}：${gapText}，处于行业后 ${comp.percentile}%`);
    }
  });
  
  return { strengths, weaknesses };
};

/**
 * 生成对比建议
 */
const generateComparisonSuggestions = (
  comparisons: IndustryMetricComparison[],
  strengths: string[],
  weaknesses: string[]
): string[] => {
  const suggestions: string[] = [];
  
  // 整体评价
  const roeComp = comparisons.find(c => c.metric === 'roe');
  const debtComp = comparisons.find(c => c.metric === 'debtToAssetRatio');
  const profitComp = comparisons.find(c => c.metric === 'netProfitMargin');
  
  if (strengths.length > weaknesses.length) {
    suggestions.push('✅ 整体财务表现优于行业平均水平，应继续保持核心竞争优势。');
  } else if (weaknesses.length > strengths.length) {
    suggestions.push('⚠️ 整体财务表现低于行业平均，建议制定改进计划提升竞争力。');
  } else {
    suggestions.push('整体财务表现与行业平均水平相当，在部分指标上有提升空间。');
  }
  
  // ROE建议
  if (roeComp) {
    if (roeComp.status === 'excellent' || roeComp.status === 'good') {
      suggestions.push(`ROE表现${roeComp.status === 'excellent' ? '优秀' : '良好'}，资本回报效率高于行业，可为股东创造超额价值。`);
    } else if (roeComp.status === 'below' || roeComp.status === 'poor') {
      suggestions.push(`ROE低于行业平均 ${Math.abs(roeComp.gap)}%，建议提升资产周转率或优化资本结构。`);
    }
  }
  
  // 负债率建议
  if (debtComp) {
    if (debtComp.status === 'excellent' || debtComp.status === 'good') {
      suggestions.push('财务杠杆使用适度，财务风险可控，具备进一步举债扩张的空间。');
    } else if (debtComp.status === 'poor') {
      suggestions.push('⚠️ 资产负债率偏高，财务风险较大，建议控制负债规模，优化债务结构。');
    }
  }
  
  // 盈利能力建议
  if (profitComp && (profitComp.status === 'below' || profitComp.status === 'poor')) {
    suggestions.push('盈利能力低于行业水平，建议审查成本结构，提升产品定价能力或优化业务组合。');
  }
  
  // 周转率建议
  const turnoverComps = comparisons.filter(c => 
    c.metric === 'totalAssetTurnover' || c.metric === 'inventoryTurnover'
  );
  const lowTurnover = turnoverComps.filter(c => c.percentile < 40);
  if (lowTurnover.length >= 2) {
    suggestions.push('资产周转效率偏低，建议优化库存管理，加快应收账款回收，提升资产使用效率。');
  }
  
  return suggestions;
};

/**
 * 获取可用行业列表
 */
export const getAvailableIndustries = (): string[] => {
  return Object.keys(INDUSTRY_BENCHMARKS);
};
