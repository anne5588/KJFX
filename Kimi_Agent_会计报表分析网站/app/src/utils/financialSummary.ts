// ==================== 财务概要信息表分析 ====================

export interface FinancialSummaryItem {
  itemName: string;
  rowNum: number;
  yearToDateAmount: number;
  yearToDateChange: number;
  currentPeriodAmount: number;
  currentPeriodChange: number;
  momChange: number;
}

export interface FinancialSummaryData {
  // 盈利状况
  revenue: FinancialSummaryItem;
  netProfit: FinancialSummaryItem;
  netProfitMargin: FinancialSummaryItem;
  
  // 三项费用
  adminExpense: FinancialSummaryItem;
  salesExpense: FinancialSummaryItem;
  financeExpense: FinancialSummaryItem;
  expenseRatio: FinancialSummaryItem;
  
  // 应收应付
  receivables: FinancialSummaryItem;
  payables: FinancialSummaryItem;
  
  // 资金状况
  fundInflow: FinancialSummaryItem;
  fundOutflow: FinancialSummaryItem;
  fundBalance: FinancialSummaryItem;
  
  // 税金状况
  taxPayable: FinancialSummaryItem;
  taxRate: FinancialSummaryItem;
}

// 解析财务概要信息表
export const parseFinancialSummary = (data: any[][]): FinancialSummaryData | null => {
  if (!data || data.length < 5) return null;
  
  const summary: Partial<FinancialSummaryData> = {};
  
  // 查找表头行
  let headerRow = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    const rowStr = row.join(' ');
    if (rowStr.includes('项目') && rowStr.includes('本年累计') && rowStr.includes('本期')) {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow === -1) return null;
  
  // 解析每一行数据
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const itemName = String(row[0] || '').trim();
    if (!itemName || itemName.includes('编制单位')) continue;
    
    const item: FinancialSummaryItem = {
      itemName,
      rowNum: parseInt(String(row[1] || '0')) || 0,
      yearToDateAmount: extractNumber(row[2]),
      yearToDateChange: parsePercentage(row[3]),
      currentPeriodAmount: extractNumber(row[4]),
      currentPeriodChange: parsePercentage(row[5]),
      momChange: parsePercentage(row[6]),
    };
    
    // 分类存储
    if (itemName.includes('营业收入')) summary.revenue = item;
    else if (itemName.includes('净利润')) summary.netProfit = item;
    else if (itemName.includes('净利率')) summary.netProfitMargin = item;
    else if (itemName.includes('管理费用')) summary.adminExpense = item;
    else if (itemName.includes('销售费用')) summary.salesExpense = item;
    else if (itemName.includes('财务费用')) summary.financeExpense = item;
    else if (itemName.includes('费用比率')) summary.expenseRatio = item;
    else if (itemName.includes('应收款') || itemName === '应收款') summary.receivables = item;
    else if (itemName.includes('应付款') || itemName === '应付款') summary.payables = item;
    else if (itemName.includes('资金收入')) summary.fundInflow = item;
    else if (itemName.includes('资金支付')) summary.fundOutflow = item;
    else if (itemName.includes('资金收支')) summary.fundBalance = item;
    else if (itemName.includes('应交税费')) summary.taxPayable = item;
    else if (itemName.includes('税负率')) summary.taxRate = item;
  }
  
  return summary as FinancialSummaryData;
};

// 生成财务概要分析报告
export const generateFinancialSummaryReport = (data: FinancialSummaryData): string[] => {
  const report: string[] = [];
  
  // 盈利状况
  report.push('【盈利状况】');
  if (data.netProfit) {
    const profitText = data.netProfit.currentPeriodAmount >= 0 ? '盈利' : '亏损';
    report.push(`本期${profitText}${formatAmount(Math.abs(data.netProfit.currentPeriodAmount))}` +
      `${data.netProfit.currentPeriodChange !== 0 ? `，同比${data.netProfit.currentPeriodChange > 0 ? '增长' : '下降'}${Math.abs(data.netProfit.currentPeriodChange).toFixed(1)}%` : ''}`);
  }
  if (data.revenue && data.revenue.currentPeriodChange !== 0) {
    report.push(`营业收入同比${data.revenue.currentPeriodChange > 0 ? '增长' : '下降'}${Math.abs(data.revenue.currentPeriodChange).toFixed(1)}%`);
  }
  if (data.netProfitMargin) {
    report.push(`净利率为${data.netProfitMargin.currentPeriodAmount.toFixed(2)}%`);
  }
  
  // 费用状况
  report.push('\n【费用状况】');
  if (data.expenseRatio) {
    report.push(`费用比率${data.expenseRatio.currentPeriodAmount.toFixed(1)}%` +
      `${data.expenseRatio.currentPeriodChange !== 0 ? `，同比${data.expenseRatio.currentPeriodChange > 0 ? '上升' : '下降'}${Math.abs(data.expenseRatio.currentPeriodChange).toFixed(1)}个百分点` : ''}`);
  }
  if (data.adminExpense && data.adminExpense.currentPeriodChange !== 0) {
    report.push(`管理费用同比${data.adminExpense.currentPeriodChange > 0 ? '增长' : '下降'}${Math.abs(data.adminExpense.currentPeriodChange).toFixed(1)}%`);
  }
  
  // 资金状况
  report.push('\n【资金状况】');
  if (data.fundBalance) {
    const direction = data.fundBalance.currentPeriodAmount >= 0 ? '净流入' : '净流出';
    report.push(`本期资金${direction}${formatAmount(Math.abs(data.fundBalance.currentPeriodAmount))}`);
  }
  if (data.receivables && data.receivables.currentPeriodChange > 50) {
    report.push(`⚠️ 应收款同比大幅增长${data.receivables.currentPeriodChange.toFixed(1)}%，需关注回款风险`);
  }
  
  // 税务状况
  report.push('\n【税务状况】');
  if (data.taxRate) {
    report.push(`综合税负率${data.taxRate.currentPeriodAmount.toFixed(2)}%`);
  }
  
  return report;
};

// 工具函数
const extractNumber = (cell: any): number => {
  if (cell === undefined || cell === null) return 0;
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    const cleaned = cell.replace(/[,，\s%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

const parsePercentage = (cell: any): number => {
  if (cell === undefined || cell === null) return 0;
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    // 处理百分比字符串，如 "-85.00%"
    const cleaned = cell.replace(/,/g, '').replace(/\s/g, '');
    if (cleaned.endsWith('%')) {
      return parseFloat(cleaned.slice(0, -1));
    }
    return parseFloat(cleaned);
  }
  return 0;
};

const formatAmount = (amount: number): string => {
  if (Math.abs(amount) >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(amount) >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toFixed(2);
};

export default parseFinancialSummary;
