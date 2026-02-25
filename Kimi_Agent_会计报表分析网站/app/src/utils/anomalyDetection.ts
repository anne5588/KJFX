// ==================== 财务异常波动检测 ====================
// 基于规则和数据分布的财务异常检测系统

import type { FinancialData } from '@/utils/excelParser';

// 异常类型
export type AnomalyType = 
  | 'sudden_change'      // 科目金额突变
  | 'proportion_change'  // 占比异常变化
  | 'ratio_deterioration' // 财务指标恶化
  | 'structural_shift'   // 结构异常变动
  | 'seasonal_anomaly'   // 季节性异常
  | 'cashflow_mismatch'; // 现金流与利润不匹配

// 异常严重程度
export type Severity = 'high' | 'medium' | 'low';

// 异常检测结果
export interface Anomaly {
  type: AnomalyType;
  severity: Severity;
  title: string;
  description: string;
  affectedItem: string;
  currentValue: number;
  previousValue?: number;
  changePercentage?: number;
  threshold: number;
  suggestion: string;
}

// 检测配置
export interface DetectionConfig {
  suddenChangeThreshold: number;    // 突变阈值（30%）
  ratioDeteriorationThreshold: number; // 指标恶化阈值
  structureChangeThreshold: number;  // 结构变化阈值
  cashflowMismatchThreshold: number; // 现金流匹配阈值
}

// 默认配置
export const defaultDetectionConfig: DetectionConfig = {
  suddenChangeThreshold: 0.30,      // 30%
  ratioDeteriorationThreshold: 0.20, // 20%
  structureChangeThreshold: 0.10,    // 10%
  cashflowMismatchThreshold: 0.50,   // 50%
};

// ==================== 主检测函数 ====================

export const detectAnomalies = (
  data: FinancialData,
  config: DetectionConfig = defaultDetectionConfig
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  // 1. 检测科目金额突变
  anomalies.push(...detectSuddenChanges(data, config));
  
  // 2. 检测财务指标恶化
  anomalies.push(...detectRatioDeterioration(data, config));
  
  // 3. 检测结构异常变动
  anomalies.push(...detectStructuralShifts(data, config));
  
  // 4. 检测现金流与利润不匹配
  anomalies.push(...detectCashflowMismatch(data, config));
  
  // 5. 检测具体科目异常
  anomalies.push(...detectSpecificAccountAnomalies(data));
  
  // 按严重程度排序
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

// ==================== 具体检测函数 ====================

// 1. 检测科目金额突变
const detectSuddenChanges = (
  data: FinancialData,
  config: DetectionConfig
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  if (!data.hasBeginningData) return anomalies;
  
  // 检测资产科目突变
  data.assets.forEach((currentValue: number, name: string) => {
    const previousValue = data.beginningAssets.get(name);
    if (previousValue && previousValue > 0) {
      const changeRatio = Math.abs(currentValue - previousValue) / previousValue;
      
      if (changeRatio > config.suddenChangeThreshold) {
        const isIncrease = currentValue > previousValue;
        anomalies.push({
          type: 'sudden_change',
          severity: changeRatio > 0.5 ? 'high' : 'medium',
          title: `【${name}】金额${isIncrease ? '大幅' : '异常'}${isIncrease ? '增长' : '下降'}`,
          description: `${name}从期初${formatAmount(previousValue)}变化到期末${formatAmount(currentValue)}，变动幅度${(changeRatio * 100).toFixed(1)}%`,
          affectedItem: name,
          currentValue,
          previousValue,
          changePercentage: changeRatio * 100,
          threshold: config.suddenChangeThreshold * 100,
          suggestion: isIncrease 
            ? `请检查${name}增长的原因，是否为业务扩张或投资增加，关注资金占用情况。`
            : `请检查${name}下降的原因，是否存在资产处置或减值情况。`,
        });
      }
    }
  });
  
  // 检测负债科目突变
  data.liabilities.forEach((currentValue: number, name: string) => {
    const previousValue = data.beginningLiabilities.get(name);
    if (previousValue && previousValue > 0) {
      const changeRatio = Math.abs(currentValue - previousValue) / previousValue;
      
      if (changeRatio > config.suddenChangeThreshold) {
        const isIncrease = currentValue > previousValue;
        anomalies.push({
          type: 'sudden_change',
          severity: changeRatio > 0.5 ? 'high' : 'medium',
          title: `【${name}】负债${isIncrease ? '大幅' : '异常'}${isIncrease ? '增加' : '减少'}`,
          description: `${name}从期初${formatAmount(previousValue)}变化到期末${formatAmount(currentValue)}，变动幅度${(changeRatio * 100).toFixed(1)}%`,
          affectedItem: name,
          currentValue,
          previousValue,
          changePercentage: changeRatio * 100,
          threshold: config.suddenChangeThreshold * 100,
          suggestion: isIncrease
            ? `负债大幅增加，请关注偿债压力和财务风险，合理安排还款计划。`
            : `负债减少有利于降低财务风险，但也需关注是否影响正常经营。`,
        });
      }
    }
  });
  
  return anomalies;
};

// 2. 检测财务指标恶化
const detectRatioDeterioration = (
  data: FinancialData,
  config: DetectionConfig
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  // 计算关键财务指标变化
  // 这里简化处理，实际应该对比两期的完整指标
  
  // 检测资产负债率变化
  if (data.hasBeginningData) {
    const currentDebtRatio = data.totalAssets > 0 ? data.totalLiabilities / data.totalAssets : 0;
    const previousDebtRatio = data.beginningTotalAssets > 0 
      ? data.beginningTotalLiabilities / data.beginningTotalAssets 
      : 0;
    
    const ratioChange = currentDebtRatio - previousDebtRatio;
    if (ratioChange > config.ratioDeteriorationThreshold) {
      anomalies.push({
        type: 'ratio_deterioration',
        severity: currentDebtRatio > 0.7 ? 'high' : 'medium',
        title: '【资产负债率】显著上升',
        description: `资产负债率从${(previousDebtRatio * 100).toFixed(1)}%上升到${(currentDebtRatio * 100).toFixed(1)}%，财务杠杆明显增加`,
        affectedItem: '资产负债率',
        currentValue: currentDebtRatio * 100,
        previousValue: previousDebtRatio * 100,
        changePercentage: (ratioChange / previousDebtRatio) * 100,
        threshold: config.ratioDeteriorationThreshold * 100,
        suggestion: '资产负债率上升较快，建议控制负债规模，优化资本结构，防范财务风险。',
      });
    }
  }
  
  // 检测净利润变化
  if (data.hasBeginningData && data.beginningNetProfit !== 0) {
    const profitChange = (data.netProfit - data.beginningNetProfit) / Math.abs(data.beginningNetProfit);
    if (profitChange < -config.ratioDeteriorationThreshold) {
      anomalies.push({
        type: 'ratio_deterioration',
        severity: profitChange < -0.5 ? 'high' : 'medium',
        title: '【净利润】大幅下滑',
        description: `净利润从${formatAmount(data.beginningNetProfit)}下降到${formatAmount(data.netProfit)}，降幅${(Math.abs(profitChange) * 100).toFixed(1)}%`,
        affectedItem: '净利润',
        currentValue: data.netProfit,
        previousValue: data.beginningNetProfit,
        changePercentage: profitChange * 100,
        threshold: config.ratioDeteriorationThreshold * 100,
        suggestion: '净利润大幅下滑，请分析成本费用增长或收入下降的原因，及时采取改进措施。',
      });
    }
  }
  
  return anomalies;
};

// 3. 检测结构异常变动
const detectStructuralShifts = (
  data: FinancialData,
  config: DetectionConfig
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  if (!data.hasBeginningData) return anomalies;
  
  // 检测流动资产占比变化
  const currentCurrentAssets = Array.from(data.assets.values()).reduce((a, b) => a + b, 0) * 0.6; // 估算
  const previousCurrentAssets = data.beginningTotalAssets * 0.6;
  
  const currentRatio = data.totalAssets > 0 ? currentCurrentAssets / data.totalAssets : 0;
  const previousRatio = data.beginningTotalAssets > 0 ? previousCurrentAssets / data.beginningTotalAssets : 0;
  
  if (Math.abs(currentRatio - previousRatio) > config.structureChangeThreshold) {
    const isIncrease = currentRatio > previousRatio;
    anomalies.push({
      type: 'structural_shift',
      severity: 'low',
      title: `【资产结构】流动资产占比${isIncrease ? '上升' : '下降'}`,
      description: `流动资产占比从${(previousRatio * 100).toFixed(1)}%变化到${(currentRatio * 100).toFixed(1)}%`,
      affectedItem: '资产结构',
      currentValue: currentRatio * 100,
      previousValue: previousRatio * 100,
      changePercentage: ((currentRatio - previousRatio) / previousRatio) * 100,
      threshold: config.structureChangeThreshold * 100,
      suggestion: isIncrease
        ? '流动资产占比上升，资产流动性增强，但需关注是否存在资金闲置。'
        : '流动资产占比下降，需关注短期偿债能力和资产流动性。',
    });
  }
  
  return anomalies;
};

// 4. 检测现金流与利润不匹配
const detectCashflowMismatch = (
  data: FinancialData,
  config: DetectionConfig
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  const operatingCashFlow = data.operatingCashflow;
  const netProfit = data.netProfit;
  
  if (netProfit !== 0 && operatingCashFlow !== 0) {
    const ratio = Math.abs(operatingCashFlow / netProfit);
    
    // 经营现金流与净利润严重背离
    if (ratio < config.cashflowMismatchThreshold && netProfit > 0) {
      anomalies.push({
        type: 'cashflow_mismatch',
        severity: ratio < 0.3 ? 'high' : 'medium',
        title: '【现金流】经营现金流与净利润严重不匹配',
        description: `净利润${formatAmount(netProfit)}，但经营现金流仅${formatAmount(operatingCashFlow)}，现金流/净利润比率为${(ratio * 100).toFixed(1)}%`,
        affectedItem: '经营现金流',
        currentValue: operatingCashFlow,
        previousValue: netProfit,
        changePercentage: (ratio - 1) * 100,
        threshold: config.cashflowMismatchThreshold * 100,
        suggestion: '利润含金量低，存在大量应收账款或存货占用资金，建议加强回款管理，关注坏账风险。',
      });
    }
    
    // 经营现金流为负但净利润为正
    if (operatingCashFlow < 0 && netProfit > 0) {
      anomalies.push({
        type: 'cashflow_mismatch',
        severity: 'high',
        title: '【现金流】经营现金流为负但净利润为正',
        description: `账面盈利${formatAmount(netProfit)}，但经营现金流为负${formatAmount(operatingCashFlow)}，存在"纸面富贵"风险`,
        affectedItem: '经营现金流',
        currentValue: operatingCashFlow,
        previousValue: netProfit,
        changePercentage: -100,
        threshold: 0,
        suggestion: '⚠️ 严重警告：账面盈利但现金流为负，企业面临资金链断裂风险，必须立即改善现金流状况。',
      });
    }
  }
  
  return anomalies;
};

// 5. 检测具体科目异常
const detectSpecificAccountAnomalies = (data: FinancialData): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  // 检测大额其他应收款
  data.assets.forEach((value: number, name: string) => {
    if (name.includes('其他应收') && value > data.totalAssets * 0.1) {
      anomalies.push({
        type: 'sudden_change',
        severity: 'medium',
        title: `【${name}】金额过大需关注`,
        description: `${name}金额${formatAmount(value)}，占总资产${((value / data.totalAssets) * 100).toFixed(1)}%`,
        affectedItem: name,
        currentValue: value,
        threshold: 10,
        suggestion: '其他应收款占比过高，可能存在关联方资金占用或隐藏费用，建议清理核实。',
      });
    }
  });
  
  // 检测存货异常增长
  let inventory = 0;
  data.assets.forEach((value: number, name: string) => {
    if (name.includes('存货') || name.includes('库存')) inventory += value;
  });
  
  if (data.totalIncome > 0) {
    const inventoryTurnover = data.totalIncome / inventory;
    if (inventory > data.totalAssets * 0.3 && inventoryTurnover < 2) {
      anomalies.push({
        type: 'proportion_change',
        severity: 'medium',
        title: '【存货】周转缓慢，存在积压风险',
        description: `存货金额${formatAmount(inventory)}，占总资产${((inventory / data.totalAssets) * 100).toFixed(1)}%，周转率${inventoryTurnover.toFixed(1)}次`,
        affectedItem: '存货',
        currentValue: inventory,
        threshold: 30,
        suggestion: '存货占比高且周转慢，可能存在滞销积压，建议加强库存管理，及时处理呆滞存货。',
      });
    }
  }
  
  // 检测应付账款异常
  let accountsPayable = 0;
  data.liabilities.forEach((value: number, name: string) => {
    if (name.includes('应付账款')) accountsPayable += value;
  });
  
  if (accountsPayable > data.totalIncome * 0.3) {
    anomalies.push({
      type: 'structural_shift',
      severity: 'low',
      title: '【应付账款】金额较大',
      description: `应付账款${formatAmount(accountsPayable)}，占年收入${((accountsPayable / data.totalIncome) * 100).toFixed(1)}%`,
      affectedItem: '应付账款',
      currentValue: accountsPayable,
      threshold: 30,
      suggestion: '应付账款占比较高，需关注供应商关系和付款信用，避免影响供应链稳定性。',
    });
  }
  
  return anomalies;
};

// ==================== 工具函数 ====================

const formatAmount = (amount: number): string => {
  const absValue = Math.abs(amount);
  if (absValue >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (absValue >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toFixed(2);
};

// 生成异常报告摘要
export const generateAnomalySummary = (anomalies: Anomaly[]) => {
  const highRisk = anomalies.filter(a => a.severity === 'high').length;
  const mediumRisk = anomalies.filter(a => a.severity === 'medium').length;
  const lowRisk = anomalies.filter(a => a.severity === 'low').length;
  
  let overallAssessment: string;
  if (highRisk > 0) {
    overallAssessment = '存在高风险异常，需要立即关注并采取措施';
  } else if (mediumRisk > 0) {
    overallAssessment = '存在中等风险异常，建议尽快处理';
  } else if (lowRisk > 0) {
    overallAssessment = '存在轻微异常，可逐步改进';
  } else {
    overallAssessment = '财务状况良好，未发现明显异常';
  }
  
  return {
    totalCount: anomalies.length,
    highRisk,
    mediumRisk,
    lowRisk,
    overallAssessment,
  };
};

export default detectAnomalies;
