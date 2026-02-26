// ==================== 科目余额深度分析（资金流向追踪）====================
// 结合明细账和科目余额表，分析资金变动原因、大额往来明细等

import type { FinancialData } from './excelParser';
import type { LedgerData } from './ledgerAnalysis';

export interface DetailedSubjectAnalysis {
  // 资金变动分析
  cashFlowAnalysis: CashFlowAnalysis;
  
  // 大额应收应付明细
  majorReceivablesPayables: MajorReceivablesPayables;
  
  // 权益与利润勾稽
  equityProfitReconciliation: EquityProfitReconciliation;
  
  // 资金流向追踪
  fundFlowTracking: FundFlowTracking;
  
  // 重点科目变动说明
  keySubjectChanges: KeySubjectChange[];
  
  // 异常变动预警
  abnormalChanges: AbnormalChange[];
}

// 资金变动分析
export interface CashFlowAnalysis {
  openingCash: number;
  closingCash: number;
  netChange: number;
  changeRate: number;
  
  // 资金去向分析
  outflows: {
    toReceivables: number;    // 变成应收账款
    toInventory: number;      // 变成存货
    toFixedAssets: number;    // 变成固定资产
    toExpenses: number;       // 费用支出
    toPayables: number;       // 偿还应付款
    other: number;
  };
  
  // 资金来源分析
  inflows: {
    fromRevenue: number;      // 销售收入
    fromPayables: number;     // 增加应付款（占用供应商资金）
    fromEquity: number;       // 股东投入
    fromDebt: number;         // 借款
    other: number;
  };
  
  assessment: string;
}

// 大额应收应付
export interface MajorReceivablesPayables {
  // 大额应收账款
  majorReceivables: {
    totalAmount: number;
    items: MajorReceivableItem[];
    concentrationRisk: string;  // 集中度风险
  };
  
  // 大额应付账款
  majorPayables: {
    totalAmount: number;
    items: MajorPayableItem[];
    paymentPressure: string;    // 付款压力评估
  };
  
  // 其他应收款（重点关注）
  otherReceivables: {
    totalAmount: number;
    items: OtherReceivableItem[];
    riskAssessment: string;
  };
  
  // 关联方往来
  relatedPartyTransactions: RelatedPartyTransaction[];
}

export interface MajorReceivableItem {
  counterparty: string;       // 对方单位
  amount: number;
  percentage: number;         // 占比
  aging: string;              // 账龄（如果有数据）
  riskLevel: 'high' | 'medium' | 'low';
  notes: string;
}

export interface MajorPayableItem {
  counterparty: string;
  amount: number;
  percentage: number;
  dueDate?: string;
  notes: string;
}

export interface OtherReceivableItem {
  counterparty: string;
  amount: number;
  nature: string;             // 款项性质
  riskLevel: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface RelatedPartyTransaction {
  partyName: string;
  receivable: number;
  payable: number;
  netExposure: number;
  transactionType: string;
  riskAlert: string;
}

// 权益与利润勾稽
export interface EquityProfitReconciliation {
  netProfit: number;          // 利润表净利润
  equityIncrease: number;     // 权益增加额
  retainedEarningsIncrease: number; // 未分配利润增加
  
  // 差异分析
  differences: {
    otherComprehensiveIncome: number;  // 其他综合收益
    dividendDistribution: number;      // 分红
    capitalInjection: number;          // 增资
    surplusReserve: number;            // 提取盈余公积
    otherAdjustments: number;
  };
  
  isConsistent: boolean;
  inconsistencyReasons: string[];
}

// 资金流向追踪
export interface FundFlowTracking {
  // 经营活动资金流向
  operating: {
    cashFromCustomers: number;     // 销售回款
    cashToSuppliers: number;       // 采购付款
    cashToEmployees: number;       // 工资支付
    cashForTax: number;            // 税费支付
    netOperatingFlow: number;
  };
  
  // 投资活动
  investing: {
    fixedAssetPurchase: number;    // 购置固定资产
    investmentOutflow: number;     // 对外投资
    investmentIncome: number;      // 投资收益
    netInvestingFlow: number;
  };
  
  // 筹资活动
  financing: {
    borrowings: number;            // 借款
    repayments: number;            // 还款
    dividends: number;             // 分红
    netFinancingFlow: number;
  };
  
  // 资金净变动
  totalNetFlow: number;
  
  // 资金缺口分析
  fundingGap: {
    exists: boolean;
    amount: number;
    causes: string[];
    suggestions: string[];
  };
}

// 重点科目变动
export interface KeySubjectChange {
  subjectName: string;
  openingBalance: number;
  closingBalance: number;
  changeAmount: number;
  changeRate: number;
  direction: 'increase' | 'decrease';
  reason: string;
  impact: string;
}

// 异常变动
export interface AbnormalChange {
  subjectName: string;
  changeType: 'sudden_drop' | 'sudden_rise' | 'negative_balance' | 'high_turnover';
  severity: 'high' | 'medium' | 'low';
  description: string;
  possibleCauses: string[];
  suggestedActions: string[];
}

/**
 * 执行科目余额深度分析
 */
export const analyzeDetailedSubjects = (
  data: FinancialData,
  ledgerDetails?: LedgerData[]
): DetailedSubjectAnalysis => {
  
  return {
    cashFlowAnalysis: analyzeCashFlow(data),
    majorReceivablesPayables: analyzeMajorReceivablesPayables(data, ledgerDetails),
    equityProfitReconciliation: analyzeEquityProfitReconciliation(data),
    fundFlowTracking: trackFundFlow(data),
    keySubjectChanges: analyzeKeySubjectChanges(data),
    abnormalChanges: detectAbnormalChanges(data),
  };
};

// 分析资金变动
const analyzeCashFlow = (data: FinancialData): CashFlowAnalysis => {
  // 计算期初期末现金
  let openingCash = 0;
  let closingCash = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金') || name.includes('银行存款')) {
      closingCash += value;
    }
  });
  
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金') || name.includes('银行存款')) {
      openingCash += value;
    }
  });
  
  const netChange = closingCash - openingCash;
  const changeRate = openingCash > 0 ? (netChange / openingCash) * 100 : 0;
  
  // 分析资金去向（简化估算）
  // 1. 应收账款增加 = 资金被占用
  let receivablesChange = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('应收')) {
      receivablesChange += value;
    }
  });
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('应收')) {
      receivablesChange -= value;
    }
  });
  
  // 2. 存货增加
  let inventoryChange = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) {
      inventoryChange += value;
    }
  });
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存')) {
      inventoryChange -= value;
    }
  });
  
  // 3. 固定资产增加
  let fixedAssetChange = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('固定资产')) {
      fixedAssetChange += value;
    }
  });
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('固定资产')) {
      fixedAssetChange -= value;
    }
  });
  
  // 4. 费用支出（简化）
  const expenseOutflow = data.totalExpenses * 0.3; // 假设30%是现金费用
  
  // 5. 应付款变化（负数表示还款）
  let payablesChange = 0;
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付')) {
      payablesChange += value;
    }
  });
  data.beginningLiabilities?.forEach((value, name) => {
    if (name.includes('应付')) {
      payablesChange -= value;
    }
  });
  
  // 计算各项占比
  const totalOutflow = Math.abs(receivablesChange) + inventoryChange + fixedAssetChange + expenseOutflow + Math.max(0, -payablesChange);
  
  // 资金来源
  const revenueInflow = data.totalIncome * 0.7; // 假设70%回款
  const payableInflow = Math.max(0, payablesChange); // 增加应付款 = 资金释放
  
  // 生成评估
  let assessment = '';
  if (netChange < 0) {
    if (fixedAssetChange > Math.abs(netChange) * 0.5) {
      assessment = `现金减少 ${formatAmount(Math.abs(netChange))}，主要用于固定资产投资（${formatAmount(fixedAssetChange)}），属于扩张性支出`;
    } else if (receivablesChange > Math.abs(netChange) * 0.5) {
      assessment = `现金减少 ${formatAmount(Math.abs(netChange))}，主要被应收账款占用（${formatAmount(receivablesChange)}），需加强回款`;
    } else {
      assessment = `现金减少 ${formatAmount(Math.abs(netChange))}，资金流出较快，需关注现金流安全`;
    }
  } else {
    assessment = `现金增加 ${formatAmount(netChange)}（${changeRate.toFixed(1)}%），资金状况改善`;
  }
  
  return {
    openingCash,
    closingCash,
    netChange,
    changeRate,
    outflows: {
      toReceivables: Math.max(0, receivablesChange),
      toInventory: Math.max(0, inventoryChange),
      toFixedAssets: Math.max(0, fixedAssetChange),
      toExpenses: expenseOutflow,
      toPayables: Math.max(0, -payablesChange),
      other: Math.max(0, totalOutflow - Math.abs(receivablesChange) - inventoryChange - fixedAssetChange - expenseOutflow),
    },
    inflows: {
      fromRevenue: revenueInflow,
      fromPayables: payableInflow,
      fromEquity: 0,
      fromDebt: 0,
      other: 0,
    },
    assessment,
  };
};

// 分析大额应收应付
const analyzeMajorReceivablesPayables = (
  data: FinancialData,
  _ledgerDetails?: LedgerData[]
): MajorReceivablesPayables => {
  
  // 收集应收账款明细
  const receivables: { name: string; amount: number }[] = [];
  data.assets.forEach((value, name) => {
    if (name.includes('应收账款') && !name.includes('坏账') && !name.includes('其他')) {
      receivables.push({ name, amount: value });
    }
  });
  receivables.sort((a, b) => b.amount - a.amount);
  
  const totalReceivables = receivables.reduce((sum, r) => sum + r.amount, 0);
  
  // 生成大额应收项目（如果没有明细，按总账拆分）
  const majorReceivableItems: MajorReceivableItem[] = [];
  if (receivables.length > 0) {
    // 前5大
    const top5 = receivables.slice(0, 5);
    top5.forEach((r, idx) => {
      const percentage = totalReceivables > 0 ? (r.amount / totalReceivables) * 100 : 0;
      majorReceivableItems.push({
        counterparty: `主要客户${idx + 1}`,
        amount: r.amount,
        percentage,
        aging: '账龄待核实',
        riskLevel: percentage > 30 ? 'high' : percentage > 10 ? 'medium' : 'low',
        notes: percentage > 30 ? '单一客户占比过高，集中度风险大' : '',
      });
    });
  }
  
  // 集中度风险评估
  const top3Ratio = majorReceivableItems.slice(0, 3).reduce((sum, i) => sum + i.percentage, 0);
  const concentrationRisk = top3Ratio > 60 
    ? `前3大客户占比${top3Ratio.toFixed(1)}%，集中度风险高，建议分散客户`
    : top3Ratio > 40
    ? `前3大客户占比${top3Ratio.toFixed(1)}%，集中度中等，需关注大客户依赖`
    : `前3大客户占比${top3Ratio.toFixed(1)}%，客户结构较分散`;
  
  // 应付账款
  const payables: { name: string; amount: number }[] = [];
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付账款') && !name.includes('其他')) {
      payables.push({ name, amount: value });
    }
  });
  payables.sort((a, b) => b.amount - a.amount);
  
  const totalPayables = payables.reduce((sum, p) => sum + p.amount, 0);
  
  const majorPayableItems: MajorPayableItem[] = [];
  payables.slice(0, 5).forEach((p, idx) => {
    majorPayableItems.push({
      counterparty: `主要供应商${idx + 1}`,
      amount: p.amount,
      percentage: totalPayables > 0 ? (p.amount / totalPayables) * 100 : 0,
      notes: '',
    });
  });
  
  // 付款压力评估
  const payableToIncomeRatio = data.totalIncome > 0 ? (totalPayables / data.totalIncome) * 100 : 0;
  const paymentPressure = payableToIncomeRatio > 30
    ? `应付账款占收入${payableToIncomeRatio.toFixed(1)}%，付款压力较大，需关注供应商关系`
    : `应付账款占收入${payableToIncomeRatio.toFixed(1)}%，付款压力正常`;
  
  // 其他应收款（重点关注）
  let otherReceivablesTotal = 0;
  const otherReceivablesItems: OtherReceivableItem[] = [];
  
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收款')) {
      otherReceivablesTotal += value;
      otherReceivablesItems.push({
        counterparty: name,
        amount: value,
        nature: '需核实款项性质',
        riskLevel: value > 100000 ? 'high' : value > 10000 ? 'medium' : 'low',
        suggestion: value > 100000 ? '金额较大，逐笔核查对方单位和形成原因' : '定期清理，避免长期挂账',
      });
    }
  });
  
  const riskAssessment = otherReceivablesTotal > data.totalAssets * 0.05
    ? `其他应收款${formatAmount(otherReceivablesTotal)}占比${(otherReceivablesTotal/data.totalAssets*100).toFixed(1)}%，存在资金占用风险，重点关注股东借款`
    : `其他应收款${formatAmount(otherReceivablesTotal)}占比${(otherReceivablesTotal/data.totalAssets*100).toFixed(1)}%，风险可控`;
  
  // 关联方往来（简化，实际应从明细识别）
  const relatedPartyTransactions: RelatedPartyTransaction[] = [];
  
  return {
    majorReceivables: {
      totalAmount: totalReceivables,
      items: majorReceivableItems,
      concentrationRisk,
    },
    majorPayables: {
      totalAmount: totalPayables,
      items: majorPayableItems,
      paymentPressure,
    },
    otherReceivables: {
      totalAmount: otherReceivablesTotal,
      items: otherReceivablesItems,
      riskAssessment,
    },
    relatedPartyTransactions,
  };
};

// 分析权益与利润勾稽
const analyzeEquityProfitReconciliation = (data: FinancialData): EquityProfitReconciliation => {
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  
  // 计算权益变动
  let openingEquity = 0;
  let closingEquity = 0;
  let openingRetained = 0;
  let closingRetained = 0;
  
  data.equity.forEach((value, name) => {
    closingEquity += value;
    if (name.includes('未分配利润')) {
      closingRetained = value;
    }
  });
  
  data.beginningEquity?.forEach((value, name) => {
    openingEquity += value;
    if (name.includes('未分配利润')) {
      openingRetained = value;
    }
  });
  
  const equityIncrease = closingEquity - openingEquity;
  const retainedIncrease = closingRetained - openingRetained;
  
  // 计算各项差异
  const surplusReserve = Math.max(0, netProfit * 0.1);
  const otherAdjustments = retainedIncrease - (netProfit - surplusReserve);
  
  const inconsistencies: string[] = [];
  if (Math.abs(otherAdjustments) > 1000) {
    inconsistencies.push(`未分配利润变动(${formatAmount(retainedIncrease)})与净利润(${formatAmount(netProfit)})不匹配`);
    inconsistencies.push('可能原因：以前年度损益调整、会计政策变更、直接计入权益的利得损失');
  }
  
  return {
    netProfit,
    equityIncrease,
    retainedEarningsIncrease: retainedIncrease,
    differences: {
      otherComprehensiveIncome: 0,
      dividendDistribution: 0,
      capitalInjection: 0,
      surplusReserve,
      otherAdjustments,
    },
    isConsistent: inconsistencies.length === 0,
    inconsistencyReasons: inconsistencies,
  };
};

// 追踪资金流向
const trackFundFlow = (data: FinancialData): FundFlowTracking => {
  // 经营活动现金流估算
  const cashFromCustomers = data.totalIncome * 0.75; // 假设75%回款率
  const cashToSuppliers = data.totalExpenses * 0.6;
  const cashToEmployees = data.totalExpenses * 0.15;
  const cashForTax = data.totalIncome * 0.08;
  const netOperatingFlow = cashFromCustomers - cashToSuppliers - cashToEmployees - cashForTax;
  
  // 投资活动
  let fixedAssetPurchase = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('固定资产')) {
      fixedAssetPurchase += Math.max(0, value - (data.beginningAssets?.get(name) || 0));
    }
  });
  
  const netInvestingFlow = -fixedAssetPurchase;
  
  // 筹资活动
  let borrowings = 0;
  data.liabilities.forEach((value, name) => {
    if (name.includes('借款') || name.includes('长期借款')) {
      borrowings += Math.max(0, value - (data.beginningLiabilities?.get(name) || 0));
    }
  });
  
  const netFinancingFlow = borrowings;
  const totalNetFlow = netOperatingFlow + netInvestingFlow + netFinancingFlow;
  
  // 资金缺口分析
  const hasGap = netOperatingFlow < 0 && fixedAssetPurchase > 0;
  
  return {
    operating: {
      cashFromCustomers,
      cashToSuppliers,
      cashToEmployees,
      cashForTax,
      netOperatingFlow,
    },
    investing: {
      fixedAssetPurchase,
      investmentOutflow: 0,
      investmentIncome: 0,
      netInvestingFlow,
    },
    financing: {
      borrowings,
      repayments: 0,
      dividends: 0,
      netFinancingFlow,
    },
    totalNetFlow,
    fundingGap: {
      exists: hasGap,
      amount: hasGap ? Math.abs(netOperatingFlow) + fixedAssetPurchase : 0,
      causes: hasGap ? ['经营活动现金流出', '大额资本支出'] : [],
      suggestions: hasGap 
        ? ['加快应收账款回收', '考虑短期借款', '推迟非必要投资', '优化存货管理'] 
        : [],
    },
  };
};

// 分析重点科目变动
const analyzeKeySubjectChanges = (data: FinancialData): KeySubjectChange[] => {
  const changes: KeySubjectChange[] = [];
  
  // 定义重点科目
  const keySubjects = [
    { name: '货币资金', matcher: (n: string) => n.includes('货币资金') || n.includes('现金') },
    { name: '应收账款', matcher: (n: string) => n.includes('应收账款') && !n.includes('其他') },
    { name: '存货', matcher: (n: string) => n.includes('存货') || n.includes('库存') },
    { name: '固定资产', matcher: (n: string) => n.includes('固定资产') },
    { name: '应付账款', matcher: (n: string) => n.includes('应付账款') && !n.includes('其他') },
    { name: '其他应收款', matcher: (n: string) => n.includes('其他应收') },
  ];
  
  keySubjects.forEach(({ name, matcher }) => {
    let opening = 0;
    let closing = 0;
    
    data.assets.forEach((value, subjectName) => {
      if (matcher(subjectName)) closing += value;
    });
    data.liabilities.forEach((value, subjectName) => {
      if (matcher(subjectName)) closing += value;
    });
    
    data.beginningAssets?.forEach((value, subjectName) => {
      if (matcher(subjectName)) opening += value;
    });
    data.beginningLiabilities?.forEach((value, subjectName) => {
      if (matcher(subjectName)) opening += value;
    });
    
    if (opening !== 0 || closing !== 0) {
      const changeAmount = closing - opening;
      const changeRate = opening !== 0 ? (changeAmount / Math.abs(opening)) * 100 : (closing > 0 ? 100 : 0);
      
      let reason = '';
      let impact = '';
      
      if (name === '货币资金') {
        reason = changeAmount > 0 ? '经营回款、融资增加' : '投资支出、偿还债务';
        impact = changeAmount > 0 ? '资金状况改善' : '需关注现金流';
      } else if (name === '应收账款') {
        reason = changeAmount > 0 ? '销售增加、回款放缓' : '回款加快、销售减少';
        impact = changeAmount > 0 ? '资金被占用' : '资金回笼';
      } else if (name === '存货') {
        reason = changeAmount > 0 ? '采购增加、销售不畅' : '销售良好、库存清理';
        impact = changeAmount > 0 ? '资金积压' : '周转加快';
      } else if (name === '其他应收款') {
        reason = '关联方往来、备用金等';
        impact = changeAmount > 0 ? '可能存在资金占用' : '清理较好';
      }
      
      changes.push({
        subjectName: name,
        openingBalance: opening,
        closingBalance: closing,
        changeAmount,
        changeRate,
        direction: changeAmount > 0 ? 'increase' : 'decrease',
        reason,
        impact,
      });
    }
  });
  
  return changes.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));
};

// 检测异常变动
const detectAbnormalChanges = (data: FinancialData): AbnormalChange[] => {
  const abnormal: AbnormalChange[] = [];
  
  // 1. 现金大幅下降
  let openingCash = 0;
  let closingCash = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金')) {
      closingCash += value;
    }
  });
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('货币资金') || name.includes('现金')) {
      openingCash += value;
    }
  });
  
  if (openingCash > 0 && closingCash < openingCash * 0.5) {
    abnormal.push({
      subjectName: '货币资金',
      changeType: 'sudden_drop',
      severity: 'high',
      description: `现金大幅下降 ${((1 - closingCash/openingCash) * 100).toFixed(1)}%`,
      possibleCauses: ['大额投资支出', '应收账款回收困难', '经营亏损', '偿还大额债务'],
      suggestedActions: ['分析现金流量表', '核查大额支出', '加快应收账款回收', '考虑融资'],
    });
  }
  
  // 2. 其他应收款异常
  let otherReceivables = 0;
  data.assets.forEach((value, name) => {
    if (name.includes('其他应收')) otherReceivables += value;
  });
  
  if (otherReceivables > data.totalAssets * 0.1) {
    abnormal.push({
      subjectName: '其他应收款',
      changeType: 'high_turnover',
      severity: 'high',
      description: `其他应收款占比过高 ${(otherReceivables/data.totalAssets*100).toFixed(1)}%`,
      possibleCauses: ['股东资金占用', '关联方往来', '虚假交易'],
      suggestedActions: ['逐笔核查款项性质', '要求限期归还', '完善内控制度'],
    });
  }
  
  return abnormal;
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

export default analyzeDetailedSubjects;
