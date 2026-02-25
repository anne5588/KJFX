import type { FinancialData } from './excelParser';

// ==================== 科目余额表深度分析（投行/审计级）====================

export interface SubjectBalanceAnalysis {
  // 异常检测
  anomalies: AnomalyItem[];
  
  // 重点科目核查
  keySubjects: KeySubjectAnalysis[];
  
  // 资产质量分析
  assetQuality: {
    cashRatio: number;
    receivablesRatio: number;
    inventoryRatio: number;
    fixedAssetsRatio: number;
    liquidityAssetsRatio: number;
    assessment: string;
    riskLevel: 'high' | 'medium' | 'low';
  };
  
  // 流动性分析
  liquidity: {
    cashAmount: number;
    restrictedCash: number;
    quickAssets: number;
    currentAssets: number;
    cashToExpenseRatio: number;
    monthsOfCash: number;
    assessment: string;
  };
  
  // 往来款项深度分析
  receivablesPayables: {
    totalReceivables: number;
    totalPayables: number;
    netReceivables: number;
    receivablesTurnoverDays: number;
    payablesTurnoverDays: number;
    collectionRisk: string;
    relatedPartyExposure: string;
  };
  
  // 存货深度分析
  inventory: {
    totalInventory: number;
    rawMaterials: number;
    workInProgress: number;
    finishedGoods: number;
    inventoryTurnover: number;
    inventoryDays: number;
    riskLevel: string;
    obsolescenceRisk: string;
  };
  
  // 资金占用与舞弊风险
  fundOccupation: {
    otherReceivablesRatio: number;
    otherPayablesRatio: number;
    relatedPartyFundFlow: string;
    profitManipulationRisk: string;
    assessment: string;
  };
  
  // 税务风险
  taxRisks: TaxRiskItem[];
  
  // 审计建议
  auditSuggestions: string[];
}

export interface AnomalyItem {
  type: 'error' | 'warning' | 'info' | 'critical';
  subject: string;
  message: string;
  detail?: string;
  suggestion: string;
}

export interface KeySubjectAnalysis {
  subject: string;
  balance: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'high' | 'medium' | 'low';
  keyPoints: string[];
  recommendations: string[];
}

export interface TaxRiskItem {
  type: string;
  risk: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

// ==================== 深度分析主函数 ====================

export const analyzeSubjectBalance = (data: FinancialData): SubjectBalanceAnalysis => {
  const anomalies: AnomalyItem[] = [];
  const taxRisks: TaxRiskItem[] = [];
  
  // 1. 异常检测（审计级）
  checkAnomalies(data, anomalies, taxRisks);
  
  // 2. 重点科目核查
  const keySubjects = analyzeKeySubjects(data);
  
  // 3. 资产质量分析
  const assetQuality = calculateAssetQuality(data);
  
  // 4. 流动性分析（含资金断裂风险评估）
  const liquidity = calculateLiquidity(data);
  
  // 5. 往来款项深度分析
  const receivablesPayables = calculateReceivablesPayables(data);
  
  // 6. 存货深度分析
  const inventory = analyzeInventory(data);
  
  // 7. 资金占用与舞弊风险
  const fundOccupation = analyzeFundOccupation(data);
  
  // 8. 生成审计建议
  const auditSuggestions = generateAuditSuggestions(data, anomalies, fundOccupation);
  
  return {
    anomalies,
    keySubjects,
    assetQuality,
    liquidity,
    receivablesPayables,
    inventory,
    fundOccupation,
    taxRisks,
    auditSuggestions,
  };
};

// ==================== 1. 异常检测（审计级）====================

const checkAnomalies = (
  data: FinancialData, 
  anomalies: AnomalyItem[], 
  taxRisks: TaxRiskItem[]
): void => {
  
  // === 货币资金异常 ===
  let cashAmount = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款') || name.includes('货币资金')) {
      cashAmount += value;
      
      // 现金出现负数
      if (value < 0) {
        anomalies.push({
          type: 'critical',
          subject: name,
          message: '货币资金出现负数',
          detail: `余额为 ${formatAmount(value)}，违反会计基本原理`,
          suggestion: '立即核查银行对账单和现金日记账，可能存在记账错误或资金挪用',
        });
      }
    }
  });
  
  // 现金余额异常（过高或过低）
  const monthlyExpense = data.totalExpenses / 12;
  if (cashAmount > monthlyExpense * 6) {
    anomalies.push({
      type: 'info',
      subject: '货币资金',
      message: `现金余额过高（${formatAmount(cashAmount)}）`,
      detail: `相当于${(cashAmount/monthlyExpense).toFixed(1)}个月运营成本，资金利用效率偏低`,
      suggestion: '关注是否存在关联方资金占用或虚构交易，考虑提高资金收益',
    });
  } else if (cashAmount < monthlyExpense && data.totalAssets > 1000000) {
    anomalies.push({
      type: 'warning',
      subject: '货币资金',
      message: `现金余额不足（${formatAmount(cashAmount)}）`,
      detail: `不足1个月运营成本（${formatAmount(monthlyExpense)}），存在资金链风险`,
      suggestion: '密切关注现金流，加快应收账款回收，考虑短期融资',
    });
  }
  
  // === 其他应收款异常（重点：资金占用）===
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收款')) {
      // 余额过大
      if (value > data.totalAssets * 0.1) {
        anomalies.push({
          type: 'warning',
          subject: name,
          message: `其他应收款占比过高（${(value/data.totalAssets*100).toFixed(1)}%）`,
          detail: `余额${formatAmount(value)}，可能存在股东资金占用或关联方往来`,
          suggestion: '逐笔核查款项性质、对方单位、账龄，关注税务风险（视同分红个税20%）',
        });
        
        taxRisks.push({
          type: '个税风险-视同分红',
          risk: '其他应收款可能被税务机关认定为股东分红，需缴纳20%个人所得税',
          severity: 'high',
          suggestion: '建议签订借款协议、约定利息、按期归还，保留商业实质证明',
        });
      }
      
      // 长期挂账（假设有年初数据对比，这里用规则判断）
      if (value > 100000) {
        anomalies.push({
          type: 'warning',
          subject: name,
          message: '其他应收款长期挂账风险',
          detail: `大额余额${formatAmount(value)}未及时清理`,
          suggestion: '对1年以上其他应收款逐笔核实，及时费用化或计提坏账',
        });
      }
    }
  });
  
  // === 应收账款异常 ===
  let receivablesTotal = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收账款') && !name.includes('其他')) {
      receivablesTotal += value;
    }
  });
  
  if (receivablesTotal > data.totalAssets * 0.3) {
    anomalies.push({
      type: 'warning',
      subject: '应收账款',
      message: `应收账款占资产比例过高（${(receivablesTotal/data.totalAssets*100).toFixed(1)}%）`,
      detail: `余额${formatAmount(receivablesTotal)}，可能存在放宽信用政策刺激销售或虚增收入`,
      suggestion: '核查账龄结构、主要客户信用状况，评估坏账准备计提充分性，关注期后回款',
    });
  }
  
  if (receivablesTotal > data.totalIncome * 0.5 && data.totalIncome > 0) {
    anomalies.push({
      type: 'warning',
      subject: '应收账款',
      message: '应收账款占收入比例异常',
      detail: `应收账款${formatAmount(receivablesTotal)}占收入${(receivablesTotal/data.totalIncome*100).toFixed(1)}%，回款能力存疑`,
      suggestion: '对比同行业周转率，分析信用政策合理性，加强催收管理',
    });
  }
  
  // === 存货异常 ===
  let inventoryTotal = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存商品') || name.includes('原材料')) {
      inventoryTotal += value;
    }
  });
  
  if (inventoryTotal > data.totalAssets * 0.3) {
    anomalies.push({
      type: 'warning',
      subject: '存货',
      message: `存货占资产比例过高（${(inventoryTotal/data.totalAssets*100).toFixed(1)}%）`,
      detail: `余额${formatAmount(inventoryTotal)}，可能存在滞销、跌价或虚增存货风险`,
      suggestion: '实地盘点核实账实相符，分析库龄结构，评估跌价准备，关注周转率',
    });
  }
  
  // 收入增长但存货未变（异常信号）
  if (data.totalIncome > 1000000 && inventoryTotal < data.totalAssets * 0.05) {
    anomalies.push({
      type: 'info',
      subject: '存货',
      message: '收入规模与存货不匹配',
      detail: '收入较大但存货余额偏低，需核实是否为轻资产模式或委托加工',
      suggestion: '核查生产模式、委外加工情况，确认成本结转准确性',
    });
  }
  
  // === 其他应付款异常（隐藏负债/收入）===
  data.liabilities.forEach((value, name) => {
    if (name.includes('其他应付款')) {
      if (value > data.totalLiabilities * 0.2) {
        anomalies.push({
          type: 'warning',
          subject: name,
          message: `其他应付款占比过高（${(value/data.totalLiabilities*100).toFixed(1)}%）`,
          detail: `余额${formatAmount(value)}，可能存在隐藏负债或延迟确认收入`,
          suggestion: '逐笔核查款项性质，关注关联方往来，防范税务风险',
        });
        
        taxRisks.push({
          type: '收入确认风险',
          risk: '其他应付款可能被怀疑为预收账款隐藏收入',
          severity: 'medium',
          suggestion: '保留完整合同和交付凭证，证明款项性质',
        });
      }
    }
  });
  
  // === 应付账款异常 ===
  let payablesTotal = 0;
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付账款') && !name.includes('其他')) {
      payablesTotal += value;
    }
  });
  
  if (payablesTotal > data.totalAssets * 0.25) {
    anomalies.push({
      type: 'warning',
      subject: '应付账款',
      message: '应付账款占资产比例过高',
      detail: `余额${formatAmount(payablesTotal)}，可能拖欠供应商款项或虚增采购`,
      suggestion: '关注供应商关系，防范供应链风险，核查采购真实性',
    });
  }
  
  // === 未分配利润异常 ===
  data.equity.forEach((value, name) => {
    if (name.includes('未分配利润')) {
      if (value < -100000) {
        anomalies.push({
          type: 'warning',
          subject: name,
          message: `未分配利润为负（${formatAmount(value)}）`,
          detail: '累计亏损较大，持续经营能力存疑',
          suggestion: '分析亏损原因，制定扭亏方案，关注对融资和信用的影响',
        });
      }
    }
  });
  
  // === 资产负债率异常 ===
  const debtRatio = data.totalAssets > 0 ? data.totalLiabilities / data.totalAssets : 0;
  if (debtRatio > 0.7) {
    anomalies.push({
      type: 'warning',
      subject: '资产负债率',
      message: `资产负债率过高（${(debtRatio*100).toFixed(1)}%）`,
      detail: '财务杠杆过高，偿债压力大',
      suggestion: '优化资本结构，控制负债规模，关注流动性风险',
    });
  }
};

// ==================== 2. 重点科目核查 ====================

const analyzeKeySubjects = (data: FinancialData): KeySubjectAnalysis[] => {
  const subjects: KeySubjectAnalysis[] = [];
  
  // 货币资金
  let cashAmount = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款')) {
      cashAmount += value;
    }
  });
  
  subjects.push({
    subject: '货币资金',
    balance: cashAmount,
    trend: 'stable',
    riskLevel: cashAmount < 50000 ? 'high' : 'low',
    keyPoints: [
      `余额${formatAmount(cashAmount)}，占总资产${(cashAmount/data.totalAssets*100).toFixed(1)}%`,
      cashAmount > (data.totalExpenses/12)*3 ? '资金储备充足（>3个月运营）' : '资金储备偏低',
      '需与银行对账单核对，关注受限资金',
    ],
    recommendations: [
      '定期核对银行对账单和现金日记账',
      '关注大额资金往来的真实性',
      '优化资金配置，提高闲置资金收益',
    ],
  });
  
  // 应收账款
  let receivablesTotal = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收') && !name.includes('其他')) {
      receivablesTotal += value;
    }
  });
  
  subjects.push({
    subject: '应收账款',
    balance: receivablesTotal,
    trend: receivablesTotal > data.totalIncome * 0.4 ? 'up' : 'stable',
    riskLevel: receivablesTotal > data.totalAssets * 0.25 ? 'high' : 'medium',
    keyPoints: [
      `余额${formatAmount(receivablesTotal)}`,
      `占收入比例${data.totalIncome > 0 ? (receivablesTotal/data.totalIncome*100).toFixed(1) : 0}%`,
      receivablesTotal > data.totalIncome * 0.5 ? '回款压力较大' : '回款情况正常',
    ],
    recommendations: [
      '分析账龄结构，关注1年以上应收',
      '评估主要客户信用状况',
      '检查坏账准备计提充分性',
      '加强应收账款催收管理',
    ],
  });
  
  // 存货
  let inventoryTotal = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) {
      inventoryTotal += value;
    }
  });
  
  subjects.push({
    subject: '存货',
    balance: inventoryTotal,
    trend: 'stable',
    riskLevel: inventoryTotal > data.totalAssets * 0.2 ? 'medium' : 'low',
    keyPoints: [
      `余额${formatAmount(inventoryTotal)}`,
      `占资产比例${(inventoryTotal/data.totalAssets*100).toFixed(1)}%`,
      inventoryTotal > data.totalIncome * 0.3 ? '可能存在滞销风险' : '存货水平正常',
    ],
    recommendations: [
      '实地盘点，核实账实相符',
      '分析库龄，关注长库龄存货',
      '评估跌价准备计提',
      '优化库存管理，提高周转率',
    ],
  });
  
  // 其他应收款
  let otherReceivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收')) {
      otherReceivables += value;
    }
  });
  
  subjects.push({
    subject: '其他应收款',
    balance: otherReceivables,
    trend: otherReceivables > data.totalAssets * 0.05 ? 'up' : 'stable',
    riskLevel: otherReceivables > 100000 ? 'high' : 'medium',
    keyPoints: [
      `余额${formatAmount(otherReceivables)}`,
      '重点监控科目，易发生资金占用',
      otherReceivables > 50000 ? '需逐笔核查款项性质' : '余额可控',
    ],
    recommendations: [
      '逐笔核查对方单位、形成原因',
      '关注关联方往来',
      '及时清理，避免长期挂账',
      '防范税务风险（视同分红）',
    ],
  });
  
  return subjects;
};

// ==================== 3. 资产质量分析 ====================

const calculateAssetQuality = (data: FinancialData) => {
  let cashAmount = 0;
  let receivablesAmount = 0;
  let inventoryAmount = 0;
  let fixedAssetsAmount = 0;
  let currentAssetsAmount = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款') || name.includes('货币资金')) {
      cashAmount += value;
      currentAssetsAmount += value;
    } else if (name.includes('应收')) {
      receivablesAmount += value;
      currentAssetsAmount += value;
    } else if (name.includes('存货') || name.includes('库存')) {
      inventoryAmount += value;
      currentAssetsAmount += value;
    } else if (name.includes('预付')) {
      currentAssetsAmount += value;
    } else if (name.includes('固定') || name.includes('无形') || name.includes('长期')) {
      fixedAssetsAmount += value;
    }
  });
  
  const cashRatio = data.totalAssets > 0 ? (cashAmount / data.totalAssets) * 100 : 0;
  const receivablesRatio = data.totalAssets > 0 ? (receivablesAmount / data.totalAssets) * 100 : 0;
  const inventoryRatio = data.totalAssets > 0 ? (inventoryAmount / data.totalAssets) * 100 : 0;
  const fixedAssetsRatio = data.totalAssets > 0 ? (fixedAssetsAmount / data.totalAssets) * 100 : 0;
  const liquidityAssetsRatio = data.totalAssets > 0 ? (currentAssetsAmount / data.totalAssets) * 100 : 0;
  
  // 评估风险等级
  let riskLevel: 'high' | 'medium' | 'low' = 'low';
  let assessment = '';
  
  if (cashRatio < 5 && receivablesRatio > 35) {
    riskLevel = 'high';
    assessment = '流动性紧张，应收账款占比过高，资产质量较差';
  } else if (cashRatio < 10 || inventoryRatio > 25) {
    riskLevel = 'medium';
    assessment = '资产质量一般，需关注流动性或存货管理';
  } else {
    riskLevel = 'low';
    assessment = '资产结构合理，流动性较好';
  }
  
  if (fixedAssetsRatio > 60) {
    assessment += '；非流动资产占比过高，资产变现能力弱，转型困难';
  }
  
  return {
    cashRatio: round(cashRatio, 2),
    receivablesRatio: round(receivablesRatio, 2),
    inventoryRatio: round(inventoryRatio, 2),
    fixedAssetsRatio: round(fixedAssetsRatio, 2),
    liquidityAssetsRatio: round(liquidityAssetsRatio, 2),
    assessment,
    riskLevel,
  };
};

// ==================== 4. 流动性分析 ====================

const calculateLiquidity = (data: FinancialData) => {
  let cashAmount = 0;
  let restrictedCash = 0; // 受限资金（保证金等）
  let quickAssets = 0;
  let currentAssets = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('现金') || name.includes('银行存款') || name.includes('货币资金')) {
      cashAmount += value;
      quickAssets += value;
      currentAssets += value;
    } else if (name.includes('应收')) {
      quickAssets += value;
      currentAssets += value;
    } else if (name.includes('存货')) {
      currentAssets += value;
    } else if (!name.includes('固定') && !name.includes('无形') && !name.includes('长期')) {
      currentAssets += value;
    }
  });
  
  // 估算月均费用
  const monthlyExpense = data.totalExpenses > 0 ? data.totalExpenses / 12 : data.totalAssets * 0.05;
  const monthsOfCash = monthlyExpense > 0 ? (cashAmount - restrictedCash) / monthlyExpense : 0;
  const cashToExpenseRatio = monthlyExpense > 0 ? ((cashAmount - restrictedCash) / monthlyExpense) * 100 : 0;
  
  let assessment = '';
  if (monthsOfCash >= 6) {
    assessment = '现金储备充足，资金链安全（>6个月）';
  } else if (monthsOfCash >= 3) {
    assessment = '现金储备尚可（3-6个月），关注现金流管理';
  } else if (monthsOfCash >= 1) {
    assessment = '现金偏紧（1-3个月），需加快回款';
  } else {
    assessment = '现金严重不足（<1个月），存在资金链断裂风险！';
  }
  
  return {
    cashAmount,
    restrictedCash,
    quickAssets,
    currentAssets,
    cashToExpenseRatio: round(cashToExpenseRatio, 2),
    monthsOfCash: round(monthsOfCash, 1),
    assessment,
  };
};

// ==================== 5. 往来款项深度分析 ====================

const calculateReceivablesPayables = (data: FinancialData) => {
  let totalReceivables = 0;
  let totalPayables = 0;
  let relatedPartyReceivables = 0;
  let relatedPartyPayables = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('应收')) {
      totalReceivables += value;
      // 简单判断关联方（实际应通过明细分析）
      if (name.includes('关联') || name.includes('股东') || name.includes('员工')) {
        relatedPartyReceivables += value;
      }
    }
  });
  
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付')) {
      totalPayables += value;
      if (name.includes('关联') || name.includes('股东')) {
        relatedPartyPayables += value;
      }
    }
  });
  
  const netReceivables = totalReceivables - totalPayables;
  
  // 估算周转天数
  const dailyRevenue = data.totalIncome / 365;
  const dailyCost = data.totalExpenses / 365;
  const receivablesTurnoverDays = dailyRevenue > 0 ? totalReceivables / dailyRevenue : 0;
  const payablesTurnoverDays = dailyCost > 0 ? totalPayables / dailyCost : 0;
  
  let collectionRisk = '';
  if (netReceivables > totalPayables * 0.5) {
    collectionRisk = `资金被客户占用${formatAmount(netReceivables)}，回款压力大，需加强催收`;
  } else if (netReceivables < -totalPayables * 0.3) {
    collectionRisk = `占用供应商资金${formatAmount(Math.abs(netReceivables))}，话语权较强，但需维护关系`;
  } else {
    collectionRisk = '往来款项基本平衡，上下游关系正常';
  }
  
  const relatedPartyExposure = relatedPartyReceivables > 0 
    ? `关联方应收${formatAmount(relatedPartyReceivables)}，关注资金占用和定价公允性`
    : '关联方往来较少';
  
  return {
    totalReceivables,
    totalPayables,
    netReceivables,
    receivablesTurnoverDays: round(receivablesTurnoverDays, 1),
    payablesTurnoverDays: round(payablesTurnoverDays, 1),
    collectionRisk,
    relatedPartyExposure,
  };
};

// ==================== 6. 存货深度分析 ====================

const analyzeInventory = (data: FinancialData) => {
  let totalInventory = 0;
  let rawMaterials = 0;
  let workInProgress = 0;
  let finishedGoods = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存商品')) {
      totalInventory += value;
      if (name.includes('原材料')) rawMaterials += value;
      else if (name.includes('在产品') || name.includes('半成品')) workInProgress += value;
      else if (name.includes('库存商品') || name.includes('产成品')) finishedGoods += value;
      else finishedGoods += value; // 默认归到产成品
    }
  });
  
  // 估算周转率
  const costOfGoodsSold = data.totalExpenses * 0.7; // 估算营业成本
  const inventoryTurnover = totalInventory > 0 ? costOfGoodsSold / totalInventory : 0;
  const inventoryDays = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;
  
  // 风险等级
  let riskLevel = '';
  let obsolescenceRisk = '';
  
  if (totalInventory > data.totalAssets * 0.3) {
    riskLevel = '高风险：存货占比过高，可能存在滞销或跌价';
    obsolescenceRisk = '需重点关注长库龄存货，评估跌价准备';
  } else if (totalInventory > data.totalAssets * 0.15) {
    riskLevel = '中风险：存货占比中等，需关注周转';
    obsolescenceRisk = '定期检查存货状态，防范滞销';
  } else {
    riskLevel = '低风险：存货占比正常';
    obsolescenceRisk = '存货管理良好';
  }
  
  // 结构分析
  if (workInProgress > totalInventory * 0.5) {
    obsolescenceRisk += '；在产品占比过高，可能存在生产周期过长或生产效率问题';
  }
  if (finishedGoods > totalInventory * 0.6) {
    obsolescenceRisk += '；产成品占比高，可能存在销售不畅';
  }
  
  return {
    totalInventory,
    rawMaterials,
    workInProgress,
    finishedGoods,
    inventoryTurnover: round(inventoryTurnover, 2),
    inventoryDays: round(inventoryDays, 1),
    riskLevel,
    obsolescenceRisk,
  };
};

// ==================== 7. 资金占用与舞弊风险 ====================

const analyzeFundOccupation = (data: FinancialData) => {
  let otherReceivables = 0;
  let otherPayables = 0;
  let prepayments = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收')) otherReceivables += value;
    if (name.includes('预付')) prepayments += value;
  });
  
  data.liabilities.forEach((value, name) => {
    if (name.includes('其他应付')) otherPayables += value;
  });
  
  const otherReceivablesRatio = data.totalAssets > 0 ? (otherReceivables / data.totalAssets) * 100 : 0;
  const otherPayablesRatio = data.totalLiabilities > 0 ? (otherPayables / data.totalLiabilities) * 100 : 0;
  
  // 关联方资金往来风险评估
  let relatedPartyFundFlow = '';
  if (otherReceivables > 100000) {
    relatedPartyFundFlow = '其他应收款余额较大，存在关联方资金占用嫌疑，需逐笔核查';
  } else if (otherPayables > 100000) {
    relatedPartyFundFlow = '其他应付款余额较大，可能存在关联方借款或隐藏收入';
  } else {
    relatedPartyFundFlow = '关联方资金往来金额可控';
  }
  
  // 利润调节风险
  let profitManipulationRisk = '';
  if (otherReceivables > data.totalAssets * 0.1) {
    profitManipulationRisk = '高风险：可能通过其他应收款转移成本费用，虚增利润';
  } else if (prepayments > data.totalAssets * 0.15) {
    profitManipulationRisk = '中风险：预付款项较大，可能存在通过预付款调节利润';
  } else {
    profitManipulationRisk = '利润调节风险较低';
  }
  
  // 综合评估
  let assessment = '';
  if (otherReceivablesRatio > 10 || otherPayablesRatio > 20) {
    assessment = '资金占用风险较高，建议开展专项审计';
  } else if (otherReceivablesRatio > 5 || otherPayablesRatio > 10) {
    assessment = '存在一定资金占用风险，需加强监控';
  } else {
    assessment = '资金占用风险可控';
  }
  
  return {
    otherReceivablesRatio: round(otherReceivablesRatio, 2),
    otherPayablesRatio: round(otherPayablesRatio, 2),
    relatedPartyFundFlow,
    profitManipulationRisk,
    assessment,
  };
};

// ==================== 8. 生成审计建议 ====================

const generateAuditSuggestions = (
  data: FinancialData, 
  anomalies: AnomalyItem[],
  fundOccupation: any
): string[] => {
  const suggestions: string[] = [];
  
  // 优先级1：资金风险
  const cashAnomaly = anomalies.find(a => a.subject.includes('货币资金') && a.type === 'warning');
  if (cashAnomaly) {
    suggestions.push(`【紧急】${cashAnomaly.suggestion}`);
  }
  
  // 优先级2：税务风险
  if (fundOccupation.otherReceivablesRatio > 5) {
    suggestions.push('【税务合规】其他应收款占比超过5%，建议核查股东借款是否签订协议、约定利息、按期归还，防范视同分红个税风险');
  }
  
  // 优先级3：内控建议
  suggestions.push('【内控建议】建立健全备用金管理制度，严格审批大额其他应收款');
  suggestions.push('【内控建议】定期开展往来款项清理，避免长期挂账');
  
  // 优先级4：财务优化
  const receivables = Array.from(data.assets.entries()).find(([name]) => name.includes('应收'));
  if (receivables && receivables[1] > data.totalIncome * 0.3) {
    suggestions.push('【运营优化】应收账款占收入比例较高，建议：1）建立客户信用评级体系；2）制定差异化信用政策；3）加强逾期催收；4）考虑应收账款保理融资');
  }
  
  const inventory = Array.from(data.assets.entries()).find(([name]) => name.includes('存货'));
  if (inventory && inventory[1] > data.totalAssets * 0.2) {
    suggestions.push('【运营优化】存货占比偏高，建议：1）优化采购计划，推行JIT模式；2）加强销售预测；3）及时处理呆滞库存；4）完善存货跌价准备计提政策');
  }
  
  // 优先级5：审计程序建议
  suggestions.push('【审计程序】建议执行以下程序：1）银行函证；2）存货监盘；3）往来款函证；4）收入截止测试；5）关联方交易核查');
  
  return suggestions;
};

// ==================== 生成报告建议 ====================

export const generateSubjectBalanceSuggestions = (analysis: SubjectBalanceAnalysis): string[] => {
  const suggestions: string[] = [];
  
  // 资产质量
  suggestions.push(`【资产质量】${analysis.assetQuality.assessment}（风险等级：${analysis.assetQuality.riskLevel === 'high' ? '高' : analysis.assetQuality.riskLevel === 'medium' ? '中' : '低'}）`);
  suggestions.push(`现金占比${analysis.assetQuality.cashRatio}%，流动资产占比${analysis.assetQuality.liquidityAssetsRatio}%`);
  
  // 流动性
  suggestions.push(`【流动性】${analysis.liquidity.assessment}（现金可支撑${analysis.liquidity.monthsOfCash}个月运营）`);
  
  // 往来款项
  suggestions.push(`【往来款项】${analysis.receivablesPayables.collectionRisk}`);
  suggestions.push(`应收周转天数${analysis.receivablesPayables.receivablesTurnoverDays}天，应付周转天数${analysis.receivablesPayables.payablesTurnoverDays}天`);
  
  // 存货
  suggestions.push(`【存货管理】${analysis.inventory.riskLevel}`);
  suggestions.push(`存货周转率${analysis.inventory.inventoryTurnover}次，周转天数${analysis.inventory.inventoryDays}天`);
  
  // 资金占用
  suggestions.push(`【资金占用】${analysis.fundOccupation.assessment}`);
  suggestions.push(`其他应收占比${analysis.fundOccupation.otherReceivablesRatio}%，${analysis.fundOccupation.relatedPartyFundFlow}`);
  
  return suggestions;
};

// ==================== 工具函数 ====================

const formatAmount = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(2) + '万';
  }
  return value.toFixed(2);
};

const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

export default analyzeSubjectBalance;
