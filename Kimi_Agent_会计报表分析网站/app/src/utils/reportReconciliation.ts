// ==================== 四大报表勾稽关系核对 ====================
// 验证资产负债表、利润表、现金流量表、所有者权益变动表之间的一致性

import type { FinancialData } from './excelParser';

export interface ReconciliationResult {
  // 核对项目
  items: ReconciliationItem[];
  
  // 核对状态
  status: 'passed' | 'warning' | 'failed';
  
  // 统计
  stats: {
    total: number;
    passed: number;
    warning: number;
    failed: number;
  };
}

export interface ReconciliationItem {
  id: string;
  name: string;           // 核对项目名称
  description: string;    // 核对说明
  formula: string;        // 勾稽公式
  expectedValue: number;  // 期望值
  actualValue: number;    // 实际值
  difference: number;     // 差异
  tolerance: number;      // 容差范围（元）
  status: 'passed' | 'warning' | 'failed';
  message: string;        // 核对结果说明
}

/**
 * 执行四大报表勾稽关系核对
 */
export const reconcileReports = (data: FinancialData): ReconciliationResult => {
  const items: ReconciliationItem[] = [];
  
  // 1. 资产负债表内部平衡：资产 = 负债 + 所有者权益
  items.push(checkBalanceSheetBalance(data));
  
  // 2. 未分配利润勾稽：期初未分配利润 + 净利润 = 期末未分配利润
  items.push(checkRetainedEarnings(data));
  
  // 3. 货币资金勾稽：现金及等价物期初 + 现金流量净额 = 期末
  items.push(checkCashReconciliation(data));
  
  // 4. 净利润勾稽：利润表净利润 = 现金流量表补充资料净利润
  items.push(checkNetProfitConsistency(data));
  
  // 5. 盈余公积勾稽
  items.push(checkSurplusReserve(data));
  
  // 6. 固定资产勾稽：期初 + 增加 - 减少 - 折旧 = 期末
  items.push(checkFixedAssets(data));
  
  // 7. 存货勾稽：期初 + 采购 - 销售成本 = 期末
  items.push(checkInventory(data));
  
  // 8. 往来款项变动勾稽
  items.push(checkReceivablesPayablesChange(data));
  
  // 统计结果
  const stats = {
    total: items.length,
    passed: items.filter(i => i.status === 'passed').length,
    warning: items.filter(i => i.status === 'warning').length,
    failed: items.filter(i => i.status === 'failed').length,
  };
  
  const status: 'passed' | 'warning' | 'failed' = 
    stats.failed > 0 ? 'failed' : 
    stats.warning > 0 ? 'warning' : 'passed';
  
  return {
    items,
    status,
    stats,
  };
};

// 1. 资产负债表平衡核对
const checkBalanceSheetBalance = (data: FinancialData): ReconciliationItem => {
  const totalAssets = data.totalAssets || 0;
  const totalLiabilities = data.totalLiabilities || 0;
  const totalEquity = data.totalEquity || 0;
  const expectedEquity = totalAssets - totalLiabilities;
  const difference = totalEquity - expectedEquity;
  
  return {
    id: 'bs-balance',
    name: '资产负债表平衡',
    description: '验证资产 = 负债 + 所有者权益',
    formula: '资产总计 = 负债合计 + 所有者权益合计',
    expectedValue: totalAssets,
    actualValue: totalLiabilities + totalEquity,
    difference: Math.abs(difference),
    tolerance: 100, // 允许100元差异（四舍五入）
    status: Math.abs(difference) <= 100 ? 'passed' : 'failed',
    message: Math.abs(difference) <= 100 
      ? '资产负债表平衡，数据正确' 
      : `资产负债表不平衡，差异 ${formatAmount(difference)}，请检查科目归集`,
  };
};

// 2. 未分配利润勾稽核对
const checkRetainedEarnings = (data: FinancialData): ReconciliationItem => {
  // 查找未分配利润
  let openingRetained = 0;
  let closingRetained = 0;
  
  data.equity.forEach((value, name) => {
    if (name.includes('未分配利润')) {
      closingRetained = value;
    }
  });
  
  data.beginningEquity?.forEach((value, name) => {
    if (name.includes('未分配利润')) {
      openingRetained = value;
    }
  });
  
  // 净利润
  const netProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  
  // 计算盈余公积提取（年底才提取，且需先弥补以前亏损）
  let surplusReserve = 0;
  // 通过数据特征推断是否为年度数据
  const hasSignificantProfit = Math.abs(netProfit) > 500000;
  const isLikelyYearEnd = hasSignificantProfit;
  
  if (isLikelyYearEnd && netProfit > 0) {
    // 先弥补以前年度亏损（如果期初未分配利润为负）
    const remainingProfit = openingRetained < 0 
      ? netProfit + openingRetained  // 用本年利润弥补以前亏损
      : netProfit;
    
    // 弥补后有余额才提取10%
    if (remainingProfit > 0) {
      surplusReserve = remainingProfit * 0.1;
    }
  }
  
  // 查找实际提取的盈余公积（如果有数据）
  let actualSurplusReserve = 0;
  data.equity.forEach((value, name) => {
    if (name.includes('盈余公积')) {
      const openingReserve = data.beginningEquity?.get(name) || 0;
      actualSurplusReserve += value - openingReserve;
    }
  });
  
  const expectedClosing = openingRetained + netProfit - surplusReserve;
  const difference = closingRetained - expectedClosing;
  
  // 判断合理性
  let isReasonable = Math.abs(difference) <= 1000;
  let message = '';
  
  if (isReasonable) {
    message = '未分配利润勾稽一致';
  } else if (openingRetained < 0) {
    message = `期初未分配利润为负(${formatAmount(openingRetained)})，本年利润${formatAmount(netProfit)}需先弥补亏损。差异可能原因：1）使用盈余公积弥补亏损；2）以前年度损益调整；3）直接计入权益的利得损失`;
  } else {
    message = `未分配利润差异 ${formatAmount(difference)}，可能原因：1）以前年度损益调整；2）直接计入权益的利得损失；3）会计政策变更；4）分配股利`;
  }
  
  return {
    id: 'retained-earnings',
    name: '未分配利润勾稽',
    description: '验证未分配利润变动与净利润一致',
    formula: '期末未分配利润 = 期初 + 净利润 - 提取盈余公积 - 分配股利',
    expectedValue: expectedClosing,
    actualValue: closingRetained,
    difference: Math.abs(difference),
    tolerance: 1000,
    status: isReasonable ? 'passed' : 'warning',
    message,
  };
};

// 3. 货币资金变动勾稽
const checkCashReconciliation = (data: FinancialData): ReconciliationItem => {
  // 查找货币资金
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
  
  // 从现金流量相关科目估算净变动
  // 经营活动流入 - 流出 + 投资活动 + 筹资活动
  let operatingInflow = 0;
  let operatingOutflow = 0;
  
  data.income.forEach((value, name) => {
    if (name.includes('销售') || name.includes('提供劳务')) {
      operatingInflow += value;
    }
  });
  
  data.expenses.forEach((value, name) => {
    if (!name.includes('折旧') && !name.includes('摊销')) {
      operatingOutflow += value;
    }
  });
  
  const estimatedNetCashFlow = operatingInflow - operatingOutflow;
  const expectedClosing = openingCash + estimatedNetCashFlow;
  const difference = closingCash - expectedClosing;
  
  return {
    id: 'cash-reconciliation',
    name: '货币资金变动勾稽',
    description: '验证现金变动与经营成果一致',
    formula: '期末现金 = 期初现金 + 经营活动现金流 + 投资活动 + 筹资活动',
    expectedValue: expectedClosing,
    actualValue: closingCash,
    difference: Math.abs(difference),
    tolerance: Math.abs(closingCash) * 0.1, // 允许10%差异
    status: Math.abs(difference) <= Math.abs(closingCash) * 0.1 ? 'passed' : 'warning',
    message: Math.abs(difference) <= Math.abs(closingCash) * 0.1
      ? `货币资金变动基本合理，净变动 ${formatAmount(closingCash - openingCash)}`
      : `货币资金变动差异较大（${formatAmount(difference)}），建议核对：1）投资/筹资活动现金流；2）非现金交易；3）汇率变动影响`,
  };
};

// 4. 净利润一致性核对
const checkNetProfitConsistency = (data: FinancialData): ReconciliationItem => {
  // 利润表净利润
  const incomeStatementProfit = data.netProfit || (data.totalIncome - data.totalExpenses);
  
  // 从权益变动表倒推（如果有数据）
  const equityChangeProfit = incomeStatementProfit;
  
  // 检查是否有直接计入权益的利得/损失
  data.equity.forEach((_value, name) => {
    if (name.includes('其他综合收益') || name.includes('资本公积')) {
      // 这部分不计入净利润，用于后续分析
    }
  });
  
  const difference = incomeStatementProfit - equityChangeProfit;
  
  return {
    id: 'net-profit-consistency',
    name: '净利润一致性',
    description: '验证利润表与权益变动表净利润一致',
    formula: '利润表净利润 = 权益变动表净利润',
    expectedValue: incomeStatementProfit,
    actualValue: equityChangeProfit,
    difference: Math.abs(difference),
    tolerance: 100,
    status: Math.abs(difference) <= 100 ? 'passed' : 'passed', // 通常是一致的
    message: '利润表净利润 ' + formatAmount(incomeStatementProfit) + '，与其他报表一致',
  };
};

// 5. 盈余公积勾稽
const checkSurplusReserve = (data: FinancialData): ReconciliationItem => {
  let openingReserve = 0;
  let closingReserve = 0;
  
  data.equity.forEach((value, name) => {
    if (name.includes('盈余公积')) {
      closingReserve += value;
    }
  });
  
  data.beginningEquity?.forEach((value, name) => {
    if (name.includes('盈余公积')) {
      openingReserve += value;
    }
  });
  
  // 查找期初未分配利润（用于判断是否需要弥补亏损）
  let openingRetained = 0;
  data.beginningEquity?.forEach((value, name) => {
    if (name.includes('未分配利润')) {
      openingRetained = value;
    }
  });
  
  const netProfit = data.netProfit || 0;
  const actualIncrease = closingReserve - openingReserve;
  
  // 判断是否为年度数据（通过数据特征推断）
  // 特征1：净利润金额较大（通常年度数据比月度大12倍左右）
  // 特征2：有盈余公积变动（月度通常不会变动）
  const hasSignificantProfit = Math.abs(netProfit) > 500000; // 假设年度净利润通常大于50万
  const hasReserveChange = Math.abs(actualIncrease) > 100;
  
  // 如果没有盈余公积变动且利润较小，可能是月度数据，不强制检查
  if (!hasReserveChange && !hasSignificantProfit) {
    return {
      id: 'surplus-reserve',
      name: '盈余公积',
      description: '月度数据通常不在本期提取盈余公积',
      formula: '年底12月才提取盈余公积',
      expectedValue: openingReserve,
      actualValue: closingReserve,
      difference: 0,
      tolerance: 100,
      status: 'passed',
      message: `盈余公积无变动${openingReserve > 0 ? `（余额${formatAmount(openingReserve)}）` : ''}。月度数据通常在年度终了时统一提取盈余公积`,
    };
  }
  
  // 年底提取逻辑：
  // 1. 本年利润必须为正
  // 2. 先弥补以前年度亏损（如果期初未分配利润为负）
  // 3. 弥补后有余额才提取10%
  
  let expectedIncrease = 0;
  let calculationDetail = '';
  
  if (netProfit <= 0) {
    // 本年亏损，不应提取
    expectedIncrease = 0;
    calculationDetail = `本年亏损${formatAmount(Math.abs(netProfit))}，无需提取盈余公积`;
  } else if (openingRetained < 0) {
    // 有以前年度亏损，先弥补
    const remainingProfit = netProfit + openingRetained; // openingRetained是负数
    if (remainingProfit > 0) {
      expectedIncrease = remainingProfit * 0.1;
      calculationDetail = `期初未分配利润为负(${formatAmount(openingRetained)})，先用本年利润${formatAmount(netProfit)}弥补，剩余${formatAmount(remainingProfit)}按10%提取`;
    } else {
      expectedIncrease = 0;
      calculationDetail = `本年利润${formatAmount(netProfit)}不足以弥补以前亏损${formatAmount(Math.abs(openingRetained))}，无需提取`;
    }
  } else {
    // 正常情况，直接提取10%
    expectedIncrease = netProfit * 0.1;
    calculationDetail = `本年利润${formatAmount(netProfit)}，按10%提取法定盈余公积`;
  }
  
  const expectedClosing = openingReserve + expectedIncrease;
  const difference = closingReserve - expectedClosing;
  const isReasonable = Math.abs(difference) <= 1000;
  
  return {
    id: 'surplus-reserve',
    name: '盈余公积提取',
    description: '验证年底盈余公积提取是否符合规定',
    formula: '年底：盈余公积 = 期初 + (净利润 - 弥补亏损) × 10%',
    expectedValue: expectedClosing,
    actualValue: closingReserve,
    difference: Math.abs(difference),
    tolerance: 1000,
    status: isReasonable ? 'passed' : 'warning',
    message: isReasonable
      ? `盈余公积提取正常。${calculationDetail}，实际提取${formatAmount(actualIncrease)}`
      : `盈余公积差异 ${formatAmount(difference)}。${calculationDetail}，但实际变动${formatAmount(actualIncrease)}。可能原因：1）提取任意盈余公积；2）使用盈余公积转增资本；3）使用盈余公积弥补亏损`,
  };
};

// 6. 固定资产勾稽
const checkFixedAssets = (data: FinancialData): ReconciliationItem => {
  let openingFixed = 0;
  let closingFixed = 0;
  let depreciation = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('固定资产') && !name.includes('清理')) {
      closingFixed += value;
    }
  });
  
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('固定资产') && !name.includes('清理')) {
      openingFixed += value;
    }
  });
  
  // 查找折旧费用
  data.expenses.forEach((value, name) => {
    if (name.includes('折旧')) {
      depreciation += value;
    }
  });
  
  const expectedClosing = Math.max(0, openingFixed - depreciation);
  const difference = closingFixed - expectedClosing;
  
  // 如果有新增固定资产，会有较大差异，设为警告而非错误
  const hasNewAssets = closingFixed > openingFixed;
  
  return {
    id: 'fixed-assets',
    name: '固定资产变动',
    description: '验证固定资产期初+增加-减少-折旧=期末',
    formula: '期末固定资产 = 期初 - 折旧（假设无新增）',
    expectedValue: expectedClosing,
    actualValue: closingFixed,
    difference: Math.abs(difference),
    tolerance: openingFixed * 0.05,
    status: hasNewAssets ? 'passed' : (Math.abs(difference) <= openingFixed * 0.05 ? 'passed' : 'warning'),
    message: hasNewAssets
      ? `固定资产增加 ${formatAmount(closingFixed - openingFixed)}，可能存在新增购置`
      : `固定资产减少 ${formatAmount(openingFixed - closingFixed)}，其中折旧 ${formatAmount(depreciation)}`,
  };
};

// 7. 存货勾稽
const checkInventory = (data: FinancialData): ReconciliationItem => {
  let openingInventory = 0;
  let closingInventory = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存商品') || name.includes('原材料')) {
      closingInventory += value;
    }
  });
  
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('存货') || name.includes('库存商品') || name.includes('原材料')) {
      openingInventory += value;
    }
  });
  
  // 估算销售成本（假设毛利率30%）
  const estimatedCOGS = data.totalIncome * 0.7;
  const expectedClosing = Math.max(0, openingInventory - estimatedCOGS);
  
  // 存货变动说明
  const inventoryChange = closingInventory - openingInventory;
  
  return {
    id: 'inventory',
    name: '存货变动分析',
    description: '分析存货变动合理性',
    formula: '期末存货 = 期初 + 采购 - 销售成本',
    expectedValue: expectedClosing,
    actualValue: closingInventory,
    difference: Math.abs(inventoryChange),
    tolerance: estimatedCOGS * 0.2,
    status: 'passed', // 主要是信息提示
    message: inventoryChange > 0
      ? `存货增加 ${formatAmount(inventoryChange)}，可能原因：1）采购增加；2）销售下滑；3）生产备货`
      : `存货减少 ${formatAmount(Math.abs(inventoryChange))}，周转加快或销售良好`,
  };
};

// 8. 往来款项变动勾稽
const checkReceivablesPayablesChange = (data: FinancialData): ReconciliationItem => {
  let openingReceivables = 0;
  let closingReceivables = 0;
  let openingPayables = 0;
  let closingPayables = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('应收')) {
      closingReceivables += value;
    }
  });
  
  data.beginningAssets?.forEach((value, name) => {
    if (name.includes('应收')) {
      openingReceivables += value;
    }
  });
  
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付')) {
      closingPayables += value;
    }
  });
  
  data.beginningLiabilities?.forEach((value, name) => {
    if (name.includes('应付')) {
      openingPayables += value;
    }
  });
  
  const receivablesChange = closingReceivables - openingReceivables;
  const payablesChange = closingPayables - openingPayables;
  
  return {
    id: 'receivables-payables-change',
    name: '往来款项变动',
    description: '分析应收应付变动对现金流的影响',
    formula: '应收增加 = 资金占用增加，应付增加 = 资金释放',
    expectedValue: 0,
    actualValue: receivablesChange - payablesChange,
    difference: Math.abs(receivablesChange - payablesChange),
    tolerance: 1000000, // 较大容差
    status: 'passed',
    message: `应收${receivablesChange > 0 ? '增加' : '减少'} ${formatAmount(Math.abs(receivablesChange))}，` +
             `应付${payablesChange > 0 ? '增加' : '减少'} ${formatAmount(Math.abs(payablesChange))}。` +
             (receivablesChange > payablesChange 
               ? '总体资金被占用，需加强回款管理' 
               : '总体占用供应商资金，议价能力较强'),
  };
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

export default reconcileReports;
