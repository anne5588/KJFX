import type { FinancialData } from '@/utils/excelParser';
import type { FinancialMetrics } from '@/types/accounting';
import type { Anomaly } from './anomalyDetection';
import type { ForecastResult } from './financialForecast';
import type { IndustryComparisonResult } from './industryComparison';

export interface SmartReport {
  title: string;
  generatedAt: string;
  executiveSummary: ExecutiveSummary;
  keyFindings: KeyFinding[];
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
  actionPlan: ActionItem[];
  fullText: string;
}

export interface ExecutiveSummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  overallScore: number;
  keyHighlights: string[];
  oneSentenceSummary: string;
}

export interface KeyFinding {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  mitigations: string[];
}

export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  description: string;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ActionItem {
  phase: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  action: string;
  responsible: string;
  timeline: string;
  expectedOutcome: string;
}

export interface ReportGenerationOptions {
  includeForecast?: boolean;
  includeIndustryComparison?: boolean;
  includeAnomalies?: boolean;
  companyName?: string;
  reportPeriod?: string;
}

/**
 * 生成智能财务分析报告
 */
export const generateSmartReport = (
  financialData: FinancialData,
  metrics: FinancialMetrics,
  anomalies: Anomaly[] | null,
  _forecast: ForecastResult | null,
  industryComparison: IndustryComparisonResult | null,
  options: ReportGenerationOptions = {}
): SmartReport => {
  const {
    companyName = '本公司',
    reportPeriod = '本期'
  } = options;

  const generatedAt = new Date().toLocaleString('zh-CN');
  
  // 生成执行摘要
  const executiveSummary = generateExecutiveSummary(
    metrics, anomalies, _forecast, industryComparison, companyName
  );
  
  // 生成关键发现
  const keyFindings = generateKeyFindings(
    financialData, metrics, anomalies, _forecast, industryComparison
  );
  
  // 生成风险评估
  const riskAssessment = generateRiskAssessment(
    metrics, anomalies, _forecast
  );
  
  // 生成建议
  const recommendations = generateRecommendations(
    metrics, anomalies, _forecast, industryComparison
  );
  
  // 生成行动计划
  const actionPlan = generateActionPlan(recommendations);
  
  // 生成完整报告文本
  const fullText = generateFullReportText(
    companyName, reportPeriod, generatedAt, executiveSummary, 
    keyFindings, riskAssessment, recommendations, actionPlan
  );
  
  return {
    title: `${companyName} 财务分析报告`,
    generatedAt,
    executiveSummary,
    keyFindings,
    riskAssessment,
    recommendations,
    actionPlan,
    fullText
  };
};

/**
 * 生成执行摘要
 */
const generateExecutiveSummary = (
  metrics: FinancialMetrics,
  anomalies: Anomaly[] | null,
  forecast: ForecastResult | null,
  industryComparison: IndustryComparisonResult | null,
  companyName: string
): ExecutiveSummary => {
  const highlights: string[] = [];
  
  // 基于各项指标计算综合得分
  let score = 50;
  
  // 偿债能力（20分）
  if ((metrics.currentRatio || 0) >= 2) score += 5;
  if ((metrics.debtToAssetRatio || 100) <= 50) score += 5;
  if ((metrics.cashRatio || 0) >= 0.5) score += 5;
  if ((metrics.equityRatio || 0) >= 40) score += 5;
  
  // 盈利能力（25分）
  if ((metrics.roe || 0) >= 15) score += 8;
  else if ((metrics.roe || 0) >= 10) score += 5;
  if ((metrics.roa || 0) >= 8) score += 6;
  else if ((metrics.roa || 0) >= 5) score += 4;
  if ((metrics.netProfitMargin || 0) >= 15) score += 6;
  else if ((metrics.netProfitMargin || 0) >= 10) score += 4;
  if ((metrics.grossProfitMargin || 0) >= 30) score += 5;
  else if ((metrics.grossProfitMargin || 0) >= 20) score += 3;
  
  // 营运能力（20分）
  if ((metrics.totalAssetTurnover || 0) >= 1) score += 5;
  if ((metrics.receivablesTurnover || 0) >= 8) score += 5;
  if ((metrics.inventoryTurnover || 0) >= 5) score += 5;
  if ((metrics.cashConversionCycle || 100) <= 60) score += 5;
  
  // 发展能力（20分）
  if ((metrics.revenueGrowthRate || 0) >= 10) score += 5;
  if ((metrics.netProfitGrowthRate || 0) >= 10) score += 5;
  if ((metrics.totalAssetGrowthRate || 0) >= 5) score += 5;
  if ((metrics.sustainableGrowthRate || 0) >= 10) score += 5;
  
  // 现金流（15分）
  if ((metrics.operatingCashFlowRatio || 0) >= 0.5) score += 5;
  if ((metrics.freeCashFlow || 0) > 0) score += 5;
  if ((metrics.cashFlowToRevenue || 0) >= 0.8) score += 5;
  
  // 调整分数
  const highRiskCount = anomalies ? anomalies.filter((a: Anomaly) => a.severity === 'high').length : 0;
  const mediumRiskCount = anomalies ? anomalies.filter((a: Anomaly) => a.severity === 'medium').length : 0;
  if (highRiskCount > 0) score -= highRiskCount * 3;
  if (mediumRiskCount > 0) score -= mediumRiskCount * 1;
  if (forecast && forecast.trends.overallTrend === 'positive') score += 3;
  if (forecast && forecast.trends.overallTrend === 'negative') score -= 5;
  if (industryComparison && industryComparison.overallScore > 70) score += 3;
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // 确定健康状态
  let overallHealth: ExecutiveSummary['overallHealth'];
  if (score >= 80) overallHealth = 'excellent';
  else if (score >= 65) overallHealth = 'good';
  else if (score >= 50) overallHealth = 'fair';
  else if (score >= 35) overallHealth = 'poor';
  else overallHealth = 'critical';
  
  // 生成亮点
  if ((metrics.roe || 0) >= 15) {
    highlights.push(`ROE达到 ${metrics.roe}%，为股东创造优秀回报`);
  }
  if ((metrics.revenueGrowthRate || 0) >= 15) {
    highlights.push(`收入高速增长 ${metrics.revenueGrowthRate}%，市场表现亮眼`);
  }
  if ((metrics.debtToAssetRatio || 100) <= 40) {
    highlights.push('财务结构稳健，负债率低于40%，抗风险能力强');
  }
  if (industryComparison && industryComparison.overallScore >= 70) {
    highlights.push(`行业对比表现${industryComparison.ranking}，竞争力突出`);
  }
  if (forecast && forecast.trends.overallTrend === 'positive') {
    highlights.push('预测显示未来财务趋势向好，增长动能充足');
  }
  
  // 风险提示
  if ((metrics.currentRatio || 0) < 1) {
    highlights.push('⚠️ 流动比率低于1，短期偿债能力需关注');
  }
  if (anomalies && anomalies.filter((a: Anomaly) => a.severity === 'high').length > 0) {
    const highCount = anomalies.filter((a: Anomaly) => a.severity === 'high').length;
    highlights.push(`⚠️ 发现 ${highCount} 项高风险异常，需立即处理`);
  }
  
  // 生成一句话总结
  const healthText = {
    'excellent': '优秀',
    'good': '良好',
    'fair': '一般',
    'poor': '较差',
    'critical': '严峻'
  }[overallHealth];
  
  const oneSentenceSummary = `${companyName}本期财务健康状况${healthText}（评分：${score}/100）。` +
    `${highlights.filter(h => !h.includes('⚠️')).length > 0 ? '在盈利能力和成长性方面表现突出，' : ''}` +
    `${highlights.filter(h => h.includes('⚠️')).length > 0 ? '但存在部分风险点需要关注。' : '整体运营稳健。'}`;
  
  return {
    overallHealth,
    overallScore: score,
    keyHighlights: highlights,
    oneSentenceSummary
  };
};

/**
 * 生成关键发现
 */
const generateKeyFindings = (
  financialData: FinancialData,
  metrics: FinancialMetrics,
  anomalies: Anomaly[] | null,
  forecast: ForecastResult | null,
  industryComparison: IndustryComparisonResult | null
): KeyFinding[] => {
  const findings: KeyFinding[] = [];
  
  // 1. 盈利能力发现
  const profit = financialData.netProfit || 0;
  findings.push({
    category: '盈利能力',
    title: '净利润水平分析',
    description: `本期实现净利润 ${profit.toLocaleString()} 元，净利率 ${(metrics.netProfitMargin || 0).toFixed(2)}%。`,
    impact: (metrics.netProfitMargin || 0) >= 10 ? 'high' : (metrics.netProfitMargin || 0) >= 5 ? 'medium' : 'low',
    data: `净利润: ${profit.toLocaleString()}, 净利率: ${(metrics.netProfitMargin || 0).toFixed(2)}%`
  });
  
  // 2. 偿债能力发现
  findings.push({
    category: '偿债能力',
    title: '短期偿债能力评估',
    description: `流动比率 ${(metrics.currentRatio || 0).toFixed(2)}，速动比率 ${(metrics.quickRatio || 0).toFixed(2)}。` +
      `${(metrics.currentRatio || 0) >= 2 ? '短期偿债能力充足。' : (metrics.currentRatio || 0) >= 1 ? '短期偿债能力尚可。' : '短期偿债压力较大，需关注流动性风险。'}`,
    impact: (metrics.currentRatio || 0) < 1 ? 'high' : 'medium',
    data: `流动比率: ${(metrics.currentRatio || 0).toFixed(2)}, 速动比率: ${(metrics.quickRatio || 0).toFixed(2)}`
  });
  
  // 3. 资产结构发现
  const totalAssets = financialData.totalAssets || 1;
  const currentAssets = Array.from(financialData.assets.values()).reduce((sum, val) => sum + val, 0) || 0;
  const fixedAssets = totalAssets - currentAssets;
  findings.push({
    category: '资产结构',
    title: '资产配置分析',
    description: `流动资产占比 ${((currentAssets / totalAssets) * 100).toFixed(1)}%，固定资产占比 ${((fixedAssets / totalAssets) * 100).toFixed(1)}%。` +
      `${currentAssets > fixedAssets ? '资产流动性较好。' : '固定资产占比较高，需关注资产周转效率。'}`,
    impact: 'medium',
    data: `流动资产: ${((currentAssets / totalAssets) * 100).toFixed(1)}%, 固定资产: ${((fixedAssets / totalAssets) * 100).toFixed(1)}%`
  });
  
  // 4. 成长性发现
  findings.push({
    category: '成长能力',
    title: '收入增长态势',
    description: `收入增长率 ${(metrics.revenueGrowthRate || 0).toFixed(2)}%，` +
      `${(metrics.revenueGrowthRate || 0) >= 10 ? '处于高速增长期。' : (metrics.revenueGrowthRate || 0) >= 0 ? '保持正向增长。' : '收入出现下滑，需分析原因。'}`,
    impact: Math.abs(metrics.revenueGrowthRate || 0) >= 20 ? 'high' : 'medium',
    data: `收入增长率: ${(metrics.revenueGrowthRate || 0).toFixed(2)}%`
  });
  
  // 5. 异常发现
  if (anomalies && anomalies.length > 0) {
    const highRiskAnomalies = anomalies.filter((a: Anomaly) => a.severity === 'high');
    if (highRiskAnomalies.length > 0) {
      findings.push({
        category: '风险预警',
        title: '财务异常警示',
        description: `发现 ${highRiskAnomalies.length} 项高风险异常：${highRiskAnomalies[0].title}${highRiskAnomalies.length > 1 ? '等' : ''}。` +
          `${highRiskAnomalies[0].description}`,
        impact: 'high',
        data: `高风险异常数: ${highRiskAnomalies.length}`
      });
    }
  }
  
  // 6. 行业对比发现
  if (industryComparison) {
    const weakAreas = industryComparison.weaknesses.slice(0, 2);
    if (weakAreas.length > 0) {
      findings.push({
        category: '行业对比',
        title: '竞争力差距分析',
        description: `与${industryComparison.industry}平均水平相比，在${weakAreas.length}个指标上存在差距。` +
          `主要改进空间：${weakAreas[0].split('：')[0]}。`,
        impact: 'medium',
        data: `行业排名: ${industryComparison.ranking}`
      });
    }
  }
  
  // 7. 预测发现
  if (forecast && forecast.keyMetricsForecast.length > 0) {
    const roeForecast = forecast.keyMetricsForecast.find(m => m.metric === 'roe');
    if (roeForecast) {
      findings.push({
        category: '趋势预测',
        title: '未来财务趋势',
        description: `基于历史数据分析，预测ROE将${roeForecast.trend === 'up' ? '上升至' : '下降至'} ${roeForecast.forecastValue}%。` +
          `${forecast.trends.overallTrend === 'positive' ? '整体趋势向好。' : forecast.trends.overallTrend === 'negative' ? '需警惕下行风险。' : '预计保持稳定。'}`,
        impact: 'medium',
        data: `预测ROE: ${roeForecast.forecastValue}%`
      });
    }
  }
  
  return findings;
};

/**
 * 生成风险评估
 */
const generateRiskAssessment = (
  metrics: FinancialMetrics,
  anomalies: Anomaly[] | null,
  forecast: ForecastResult | null
): RiskAssessment => {
  const riskFactors: RiskFactor[] = [];
  let totalRiskScore = 0;
  
  // 流动性风险
  const liquidityRisk = (metrics.currentRatio || 2) < 1 ? 'high' : 
                        (metrics.currentRatio || 2) < 1.5 ? 'medium' : 'low';
  if (liquidityRisk !== 'low') {
    riskFactors.push({
      name: '流动性风险',
      level: liquidityRisk,
      probability: liquidityRisk === 'high' ? 70 : 40,
      impact: liquidityRisk === 'high' ? 80 : 50,
      description: `流动比率 ${(metrics.currentRatio || 0).toFixed(2)}，${liquidityRisk === 'high' ? '存在短期偿债压力' : '流动性尚可但需关注'}`
    });
    totalRiskScore += liquidityRisk === 'high' ? 20 : 10;
  }
  
  // 财务杠杆风险
  const leverageRisk = (metrics.debtToAssetRatio || 0) > 70 ? 'high' :
                       (metrics.debtToAssetRatio || 0) > 60 ? 'medium' : 'low';
  if (leverageRisk !== 'low') {
    riskFactors.push({
      name: '财务杠杆风险',
      level: leverageRisk,
      probability: leverageRisk === 'high' ? 60 : 35,
      impact: leverageRisk === 'high' ? 75 : 45,
      description: `资产负债率 ${(metrics.debtToAssetRatio || 0).toFixed(2)}%，${leverageRisk === 'high' ? '负债水平较高' : '负债水平偏高'}`
    });
    totalRiskScore += leverageRisk === 'high' ? 18 : 9;
  }
  
  // 盈利能力风险
  const profitRisk = (metrics.roe || 100) < 5 ? 'high' :
                     (metrics.roe || 100) < 10 ? 'medium' : 'low';
  if (profitRisk !== 'low') {
    riskFactors.push({
      name: '盈利能力风险',
      level: profitRisk,
      probability: profitRisk === 'high' ? 65 : 40,
      impact: profitRisk === 'high' ? 70 : 45,
      description: `ROE ${(metrics.roe || 0).toFixed(2)}%，盈利能力${profitRisk === 'high' ? '较弱' : '一般'}`
    });
    totalRiskScore += profitRisk === 'high' ? 15 : 8;
  }
  
  // 增长风险
  const growthRisk = (metrics.revenueGrowthRate || 0) < -10 ? 'high' :
                     (metrics.revenueGrowthRate || 0) < 0 ? 'medium' : 'low';
  if (growthRisk !== 'low') {
    riskFactors.push({
      name: '增长停滞风险',
      level: growthRisk,
      probability: growthRisk === 'high' ? 70 : 45,
      impact: growthRisk === 'high' ? 65 : 40,
      description: `收入增长率 ${(metrics.revenueGrowthRate || 0).toFixed(2)}%，${growthRisk === 'high' ? '收入大幅下滑' : '收入增长乏力'}`
    });
    totalRiskScore += growthRisk === 'high' ? 15 : 8;
  }
  
  // 异常风险
  const highAnomalyCount = anomalies ? anomalies.filter((a: Anomaly) => a.severity === 'high').length : 0;
  if (highAnomalyCount > 0) {
    riskFactors.push({
      name: '财务异常风险',
      level: highAnomalyCount >= 3 ? 'high' : 'medium',
      probability: 60,
      impact: highAnomalyCount >= 3 ? 70 : 50,
      description: `发现 ${highAnomalyCount} 项高风险财务异常`
    });
    totalRiskScore += highAnomalyCount * 5;
  }
  
  // 趋势风险
  if (forecast && forecast.trends.overallTrend === 'negative') {
    riskFactors.push({
      name: '下行趋势风险',
      level: 'medium',
      probability: 55,
      impact: 60,
      description: '预测显示财务指标呈下降趋势'
    });
    totalRiskScore += 10;
  }
  
  // 确定整体风险等级
  let overallRisk: RiskAssessment['overallRisk'];
  if (totalRiskScore >= 40) overallRisk = 'critical';
  else if (totalRiskScore >= 25) overallRisk = 'high';
  else if (totalRiskScore >= 12) overallRisk = 'medium';
  else overallRisk = 'low';
  
  // 生成缓解措施
  const mitigations: string[] = [];
  if (liquidityRisk !== 'low') {
    mitigations.push('加强现金流管理，优化应收账款回收周期，保持充足的现金储备');
  }
  if (leverageRisk !== 'low') {
    mitigations.push('控制新增债务，优化债务结构，考虑股权融资降低负债率');
  }
  if (profitRisk !== 'low') {
    mitigations.push('提升产品盈利能力，优化成本结构，提高资产使用效率');
  }
  if (anomalies && anomalies.filter((a: Anomaly) => a.severity === 'high').length > 0) {
    mitigations.push('对发现的财务异常进行深入调查，及时整改问题');
  }
  
  return {
    overallRisk,
    riskScore: Math.min(100, totalRiskScore),
    riskFactors,
    mitigations
  };
};

/**
 * 生成建议
 */
const generateRecommendations = (
  metrics: FinancialMetrics,
  anomalies: Anomaly[] | null,
  forecast: ForecastResult | null,
  industryComparison: IndustryComparisonResult | null
): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // 流动性改善建议
  if ((metrics.currentRatio || 0) < 1.5) {
    recommendations.push({
      priority: (metrics.currentRatio || 0) < 1 ? 'critical' : 'high',
      category: '流动性管理',
      title: '提升短期偿债能力',
      description: `当前流动比率 ${(metrics.currentRatio || 0).toFixed(2)}，建议加快应收账款回收，合理控制库存水平，优化短期债务结构。`,
      expectedImpact: '流动比率提升至1.5以上，降低流动性风险',
      difficulty: 'medium'
    });
  }
  
  // 盈利能力提升建议
  if ((metrics.roe || 0) < 15) {
    recommendations.push({
      priority: (metrics.roe || 0) < 8 ? 'high' : 'medium',
      category: '盈利能力',
      title: '提升资本回报率',
      description: `当前ROE ${(metrics.roe || 0).toFixed(2)}%，低于理想水平。建议通过提升净利润率、加快资产周转或适度使用财务杠杆来提升ROE。`,
      expectedImpact: 'ROE提升至15%以上，增强股东回报',
      difficulty: 'hard'
    });
  }
  
  // 成本控制建议
  if ((metrics.netProfitMargin || 0) < 10) {
    recommendations.push({
      priority: 'medium',
      category: '成本管理',
      title: '优化成本结构',
      description: `当前净利率 ${(metrics.netProfitMargin || 0).toFixed(2)}%，建议审查各项费用支出，优化供应链成本，提升产品定价能力。`,
      expectedImpact: '净利率提升至10%以上',
      difficulty: 'medium'
    });
  }
  
  // 增长建议
  if ((metrics.revenueGrowthRate || 0) < 5) {
    recommendations.push({
      priority: (metrics.revenueGrowthRate || 0) < 0 ? 'high' : 'medium',
      category: '业务增长',
      title: '加速业务增长',
      description: `收入增长率 ${(metrics.revenueGrowthRate || 0).toFixed(2)}% 偏低，建议开拓新市场、推出新产品或优化销售渠道。`,
      expectedImpact: '收入增长率提升至10%以上',
      difficulty: 'hard'
    });
  }
  
  // 异常处理建议
  if (anomalies && anomalies.length > 0) {
    const highRisk = anomalies.filter((a: Anomaly) => a.severity === 'high');
    if (highRisk.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: '风险管理',
        title: '处理财务异常',
        description: `发现 ${highRisk.length} 项高风险异常，包括${highRisk[0].title}等。建议立即调查原因并采取整改措施。`,
        expectedImpact: '消除财务风险隐患，提升财务健康度',
        difficulty: 'medium'
      });
    }
  }
  
  // 行业对标建议
  if (industryComparison && industryComparison.weaknesses.length > 0) {
    const topWeakness = industryComparison.weaknesses[0];
    recommendations.push({
      priority: 'medium',
      category: '竞争力提升',
      title: '缩小行业差距',
      description: `与${industryComparison.industry}平均水平相比，${topWeakness}。建议学习行业最佳实践，提升核心竞争力。`,
      expectedImpact: `达到行业平均水平以上`,
      difficulty: 'hard'
    });
  }
  
  // 趋势应对建议
  if (forecast && forecast.trends.overallTrend === 'negative') {
    recommendations.push({
      priority: 'high',
      category: '战略规划',
      title: '应对下行风险',
      description: '预测显示未来财务趋势可能下行，建议制定应急预案，控制成本支出，保持充足现金储备。',
      expectedImpact: '降低下行风险影响，保持稳定运营',
      difficulty: 'hard'
    });
  }
  
  // 按优先级排序
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

/**
 * 生成行动计划
 */
const generateActionPlan = (recommendations: Recommendation[]): ActionItem[] => {
  const actionItems: ActionItem[] = [];
  
  recommendations.slice(0, 6).forEach((rec) => {
    let phase: ActionItem['phase'];
    if (rec.priority === 'critical') phase = 'immediate';
    else if (rec.priority === 'high') phase = 'short-term';
    else if (rec.difficulty === 'easy') phase = 'short-term';
    else phase = 'medium-term';
    
    const timelines: Record<string, string> = {
      'immediate': '1周内',
      'short-term': '1个月内',
      'medium-term': '3个月内',
      'long-term': '6个月内'
    };
    
    actionItems.push({
      phase,
      action: rec.title,
      responsible: getResponsibleParty(rec.category),
      timeline: timelines[phase],
      expectedOutcome: rec.expectedImpact
    });
  });
  
  return actionItems.sort((a, b) => {
    const phaseOrder = { 'immediate': 0, 'short-term': 1, 'medium-term': 2, 'long-term': 3 };
    return phaseOrder[a.phase] - phaseOrder[b.phase];
  });
};

/**
 * 获取责任方
 */
const getResponsibleParty = (category: string): string => {
  const mapping: Record<string, string> = {
    '流动性管理': '财务总监',
    '盈利能力': 'CEO + 财务总监',
    '成本管理': '运营总监',
    '业务增长': '销售总监',
    '风险管理': 'CFO + 审计委员会',
    '竞争力提升': '战略部',
    '战略规划': 'CEO + 董事会'
  };
  return mapping[category] || '相关部门负责人';
};

/**
 * 生成完整报告文本
 */
const generateFullReportText = (
  companyName: string,
  reportPeriod: string,
  generatedAt: string,
  summary: ExecutiveSummary,
  findings: KeyFinding[],
  risk: RiskAssessment,
  recommendations: Recommendation[],
  actions: ActionItem[]
): string => {
  const lines: string[] = [];
  
  lines.push(`# ${companyName} 财务分析报告`);
  lines.push(`报告期间：${reportPeriod}`);
  lines.push(`生成时间：${generatedAt}`);
  lines.push('');
  
  lines.push('## 执行摘要');
  lines.push(summary.oneSentenceSummary);
  lines.push('');
  lines.push('### 关键亮点');
  summary.keyHighlights.forEach(h => lines.push(`- ${h}`));
  lines.push('');
  
  lines.push('## 关键发现');
  findings.forEach((f, i) => {
    lines.push(`${i + 1}. **${f.title}** (${f.category})`);
    lines.push(`   ${f.description}`);
    lines.push(`   数据支撑：${f.data}`);
    lines.push('');
  });
  
  lines.push('## 风险评估');
  lines.push(`整体风险等级：${risk.overallRisk === 'low' ? '低' : risk.overallRisk === 'medium' ? '中' : risk.overallRisk === 'high' ? '高' : '极高'}`);
  lines.push(`风险评分：${risk.riskScore}/100`);
  lines.push('');
  lines.push('### 主要风险因素');
  risk.riskFactors.forEach(rf => {
    lines.push(`- **${rf.name}** (${rf.level === 'low' ? '低' : rf.level === 'medium' ? '中' : rf.level === 'high' ? '高' : '极高'}风险)`);
    lines.push(`  ${rf.description}`);
  });
  lines.push('');
  
  lines.push('## 改进建议');
  recommendations.forEach((r, i) => {
    const priorityText = r.priority === 'critical' ? '🔴 紧急' : r.priority === 'high' ? '🟠 高' : r.priority === 'medium' ? '🟡 中' : '🟢 低';
    lines.push(`${i + 1}. ${priorityText} **${r.title}**`);
    lines.push(`   ${r.description}`);
    lines.push(`   预期效果：${r.expectedImpact}`);
    lines.push('');
  });
  
  lines.push('## 行动计划');
  const phaseNames: Record<string, string> = {
    'immediate': '立即执行',
    'short-term': '短期行动',
    'medium-term': '中期规划',
    'long-term': '长期目标'
  };
  
  actions.forEach(a => {
    lines.push(`- **${phaseNames[a.phase]}** | ${a.action}`);
    lines.push(`  负责：${a.responsible} | 时间：${a.timeline}`);
  });
  
  return lines.join('\n');
};

/**
 * 导出报告为文本
 */
export const exportReportAsText = (report: SmartReport): string => {
  return report.fullText;
};

/**
 * 导出报告为Markdown
 */
export const exportReportAsMarkdown = (report: SmartReport): string => {
  return report.fullText;
};
