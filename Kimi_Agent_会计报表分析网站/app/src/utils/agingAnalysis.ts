// ==================== 账龄分析表分析 ====================

export interface AgingItem {
  code: string;
  name: string;
  beginningBalance: number;
  debit: number;
  credit: number;
  endingBalance: number;
  
  // 账龄分布
  days0_30: number;
  days30_60: number;
  days60_90: number;
  days90_180: number;
  days180_360: number;
  days360_1080: number;
  days1080plus: number;
}

export interface AgingAnalysis {
  subjectCode: string;
  subjectName: string;
  period: string;
  items: AgingItem[];
  
  // 合计
  totalBeginning: number;
  totalDebit: number;
  totalCredit: number;
  totalEnding: number;
  
  // 账龄合计
  totalDays0_30: number;
  totalDays30_60: number;
  totalDays60_90: number;
  totalDays90_180: number;
  totalDays180_360: number;
  totalDays360_1080: number;
  totalDays1080plus: number;
  
  // 分析结果
  analysis: {
    longTermReceivablesRatio: number;  // 长期应收款占比（>180天）
    highRiskAmount: number;            // 高风险金额（>360天）
    riskAssessment: string;
    suggestions: string[];
  };
}

// 解析账龄分析表
export const parseAgingAnalysis = (data: any[][]): AgingAnalysis | null => {
  if (!data || data.length < 5) return null;
  
  // 查找科目标题行（如"科目：1122 应收账款"）
  let subjectCode = '';
  let subjectName = '';
  let period = '';
  let headerRow = -1;
  
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    const rowStr = row.join(' ');
    
    // 解析科目信息
    const subjectMatch = rowStr.match(/科目[：:]\s*(\d+)\s*(.+?)(?:\s|$)/);
    if (subjectMatch) {
      subjectCode = subjectMatch[1];
      subjectName = subjectMatch[2].trim();
    }
    
    // 解析期间
    const periodMatch = rowStr.match(/(\d{4}年\d{1,2}月(?:至|~)\d{4}年\d{1,2}月)/);
    if (periodMatch) {
      period = periodMatch[1];
    }
    
    // 查找表头行
    if (rowStr.includes('编码') && rowStr.includes('名称') && rowStr.includes('期初余额')) {
      headerRow = i;
    }
  }
  
  if (headerRow === -1) return null;
  
  const items: AgingItem[] = [];
  
  // 解析数据行
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 10) continue;
    
    const code = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();
    
    // 跳过合计行
    if (name.includes('合计') || name.includes('总计')) continue;
    if (!code && !name) continue;
    
    const item: AgingItem = {
      code,
      name,
      beginningBalance: extractNumber(row[2]),
      debit: extractNumber(row[3]),
      credit: extractNumber(row[4]),
      endingBalance: extractNumber(row[5]),
      days0_30: extractNumber(row[6]),
      days30_60: extractNumber(row[7]),
      days60_90: extractNumber(row[8]),
      days90_180: extractNumber(row[9]),
      days180_360: extractNumber(row[10]),
      days360_1080: extractNumber(row[11]),
      days1080plus: extractNumber(row[12]),
    };
    
    if (item.name) {
      items.push(item);
    }
  }
  
  // 计算合计
  const analysis = calculateAgingAnalysis(items);
  
  return {
    subjectCode,
    subjectName,
    period,
    items,
    ...analysis,
  };
};

// 计算账龄分析
const calculateAgingAnalysis = (items: AgingItem[]) => {
  const totalBeginning = items.reduce((sum, item) => sum + item.beginningBalance, 0);
  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);
  const totalEnding = items.reduce((sum, item) => sum + item.endingBalance, 0);
  
  const totalDays0_30 = items.reduce((sum, item) => sum + item.days0_30, 0);
  const totalDays30_60 = items.reduce((sum, item) => sum + item.days30_60, 0);
  const totalDays60_90 = items.reduce((sum, item) => sum + item.days60_90, 0);
  const totalDays90_180 = items.reduce((sum, item) => sum + item.days90_180, 0);
  const totalDays180_360 = items.reduce((sum, item) => sum + item.days180_360, 0);
  const totalDays360_1080 = items.reduce((sum, item) => sum + item.days360_1080, 0);
  const totalDays1080plus = items.reduce((sum, item) => sum + item.days1080plus, 0);
  
  // 分析
  const longTermReceivables = totalDays180_360 + totalDays360_1080 + totalDays1080plus;
  const longTermReceivablesRatio = totalEnding > 0 ? (longTermReceivables / totalEnding) * 100 : 0;
  const highRiskAmount = totalDays360_1080 + totalDays1080plus;
  
  // 风险评估
  let riskAssessment = '';
  let suggestions: string[] = [];
  
  if (longTermReceivablesRatio > 30) {
    riskAssessment = '高风险：长期应收款占比超过30%，存在较大回款风险';
    suggestions.push('重点关注超过180天的应收款项，及时计提坏账准备');
    suggestions.push('加强对长期未回款的客户催收力度');
  } else if (longTermReceivablesRatio > 15) {
    riskAssessment = '中风险：长期应收款占比在15%-30%，需关注回款情况';
    suggestions.push('定期跟踪账龄较长的应收款项');
  } else {
    riskAssessment = '低风险：应收款账龄结构合理，回款风险可控';
  }
  
  if (highRiskAmount > 0) {
    suggestions.push(`超过360天的高风险应收款${formatAmount(highRiskAmount)}，建议单独评估可回收性`);
  }
  
  if (totalDays90_180 > totalEnding * 0.2) {
    suggestions.push('90-180天应收款占比较高，建议加强催收管理');
  }
  
  return {
    totalBeginning,
    totalDebit,
    totalCredit,
    totalEnding,
    totalDays0_30,
    totalDays30_60,
    totalDays60_90,
    totalDays90_180,
    totalDays180_360,
    totalDays360_1080,
    totalDays1080plus,
    analysis: {
      longTermReceivablesRatio: parseFloat(longTermReceivablesRatio.toFixed(2)),
      highRiskAmount,
      riskAssessment,
      suggestions,
    },
  };
};

// 提取数字
const extractNumber = (cell: any): number => {
  if (cell === undefined || cell === null) return 0;
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    const cleaned = cell.replace(/[,，\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// 格式化金额
const formatAmount = (amount: number): string => {
  if (Math.abs(amount) >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(amount) >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toFixed(2);
};

export default parseAgingAnalysis;
