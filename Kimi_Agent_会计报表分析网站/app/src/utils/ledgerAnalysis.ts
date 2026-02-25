// ==================== 明细分类账分析 ====================
// 用于深入分析每个科目的交易明细

export interface LedgerEntry {
  date: string;           // 日期
  voucherNo: string;      // 凭证号
  subjectCode: string;    // 科目编码
  subjectName: string;    // 科目名称
  auxiliary: string;      // 辅助核算（往来单位/部门/项目等）
  summary: string;        // 摘要
  debit: number;          // 借方金额
  credit: number;         // 贷方金额
  direction: '借' | '贷'; // 余额方向
  balance: number;        // 余额
}

export interface LedgerData {
  subjectCode: string;
  subjectName: string;
  period: string;         // 期间（如"2026年1月至2026年1月"）
  entries: LedgerEntry[];
  beginningBalance: number;
  totalDebit: number;     // 本期借方合计
  totalCredit: number;    // 本期贷方合计
  yearToDateDebit: number;   // 本年累计借方
  yearToDateCredit: number;  // 本年累计贷方
}

export interface LedgerAnalysis {
  // 大额交易分析
  largeTransactions: LargeTransaction[];
  
  // 往来单位分析
  counterpartyAnalysis: CounterpartyInfo[];
  
  // 交易频率分析
  transactionFrequency: {
    dailyAvg: number;     // 日均交易笔数
    monthlyCount: number; // 本月交易笔数
  };
  
  // 异常检测
  anomalies: LedgerAnomaly[];
  
  // 资金流向
  fundFlow: {
    inflow: number;       // 总流入
    outflow: number;      // 总流出
    netFlow: number;      // 净流入
  };
}

export interface LargeTransaction {
  entry: LedgerEntry;
  rank: number;           // 金额排名
  percentage: number;     // 占总额比例
}

export interface CounterpartyInfo {
  name: string;           // 往来单位名称
  totalDebit: number;     // 总借方（收款）
  totalCredit: number;    // 总贷方（付款）
  netAmount: number;      // 净额
  transactionCount: number; // 交易笔数
  firstDate: string;
  lastDate: string;
}

export interface LedgerAnomaly {
  type: 'large_amount' | 'frequent_transaction' | 'weekend_transaction' | 'round_number' | 'suspicious_summary';
  description: string;
  entries: LedgerEntry[];
  riskLevel: 'high' | 'medium' | 'low';
}

// ==================== 解析明细分类账 ====================

export const parseLedgerSheet = (data: any[][]): LedgerData[] => {
  const ledgers: LedgerData[] = [];
  let currentLedger: LedgerData | null = null;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;
    
    // 检测科目标题行（如"应收账款"、"银行存款"）
    const firstCell = String(row[0] || '').trim();
    
    // 匹配科目标题（通常在表头或独立行）
    if (firstCell.includes('科目：') || firstCell.match(/^\d+\s+.+账$/)) {
      // 保存上一个科目的数据
      if (currentLedger && currentLedger.entries.length > 0) {
        calculateLedgerTotals(currentLedger);
        ledgers.push(currentLedger);
      }
      
      // 解析科目信息
      const subjectMatch = firstCell.match(/科目：(\d+)\s*(.+)/) || 
                           firstCell.match(/(\d{4})\s+(.+)/);
      const subjectCode = subjectMatch ? subjectMatch[1] : '';
      const subjectName = subjectMatch ? subjectMatch[2].replace(/明细账$/, '').trim() : firstCell;
      
      currentLedger = {
        subjectCode,
        subjectName,
        period: '',
        entries: [],
        beginningBalance: 0,
        totalDebit: 0,
        totalCredit: 0,
        yearToDateDebit: 0,
        yearToDateCredit: 0,
      };
      continue;
    }
    
    // 检测期间信息
    if (firstCell.includes('年') && firstCell.includes('月') && firstCell.includes('至')) {
      if (currentLedger) {
        currentLedger.period = firstCell;
      }
      continue;
    }
    
    // 解析明细记录
    // 格式：日期 | 凭证号 | 科目编码 | 科目名称 | 辅助核算 | 摘要 | 借方 | 贷方 | 方向 | 余额
    if (currentLedger && firstCell.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/)) {
      const entry = parseLedgerEntry(row);
      if (entry) {
        currentLedger.entries.push(entry);
        
        // 检测期初余额
        if (entry.summary.includes('期初余额') || entry.summary.includes('年初余额')) {
          currentLedger.beginningBalance = entry.balance;
        }
      }
    }
    
    // 检测合计行
    if (currentLedger && (firstCell.includes('本期合计') || firstCell.includes('本月合计'))) {
      currentLedger.totalDebit = extractNumber(row[6]); // 借方列
      currentLedger.totalCredit = extractNumber(row[7]); // 贷方列
    }
    
    if (currentLedger && firstCell.includes('本年累计')) {
      currentLedger.yearToDateDebit = extractNumber(row[6]);
      currentLedger.yearToDateCredit = extractNumber(row[7]);
    }
  }
  
  // 保存最后一个科目
  if (currentLedger && currentLedger.entries.length > 0) {
    calculateLedgerTotals(currentLedger);
    ledgers.push(currentLedger);
  }
  
  return ledgers;
};

// 解析单条明细记录
const parseLedgerEntry = (row: any[]): LedgerEntry | null => {
  try {
    const date = String(row[0] || '').trim();
    const voucherNo = String(row[1] || '').trim();
    const subjectCode = String(row[2] || '').trim();
    const subjectName = String(row[3] || '').trim();
    const auxiliary = String(row[4] || '').trim();
    const summary = String(row[5] || '').trim();
    const debit = extractNumber(row[6]);
    const credit = extractNumber(row[7]);
    const direction = String(row[8] || '').trim() as '借' | '贷';
    const balance = extractNumber(row[9]);
    
    // 只保留有效记录（有日期、金额不为0）
    if (!date || (debit === 0 && credit === 0 && balance === 0)) {
      return null;
    }
    
    return {
      date,
      voucherNo,
      subjectCode,
      subjectName,
      auxiliary,
      summary,
      debit,
      credit,
      direction: direction === '贷' ? '贷' : '借',
      balance,
    };
  } catch (e) {
    return null;
  }
};

// 计算科目合计
const calculateLedgerTotals = (ledger: LedgerData): void => {
  if (ledger.totalDebit === 0) {
    ledger.totalDebit = ledger.entries.reduce((sum, e) => sum + e.debit, 0);
  }
  if (ledger.totalCredit === 0) {
    ledger.totalCredit = ledger.entries.reduce((sum, e) => sum + e.credit, 0);
  }
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

// ==================== 明细账分析 ====================

export const analyzeLedger = (ledger: LedgerData): LedgerAnalysis => {
  const entries = ledger.entries.filter(e => 
    !e.summary.includes('期初') && 
    !e.summary.includes('合计') && 
    !e.summary.includes('累计')
  );
  
  // 大额交易分析（前10大）
  const largeTransactions = analyzeLargeTransactions(entries);
  
  // 往来单位分析
  const counterpartyAnalysis = analyzeCounterparties(entries);
  
  // 交易频率
  const transactionFrequency = analyzeTransactionFrequency(entries);
  
  // 异常检测
  const anomalies = detectAnomalies(entries);
  
  // 资金流向
  const fundFlow = {
    inflow: entries.reduce((sum, e) => sum + e.debit, 0),
    outflow: entries.reduce((sum, e) => sum + e.credit, 0),
    netFlow: 0,
  };
  fundFlow.netFlow = fundFlow.inflow - fundFlow.outflow;
  
  return {
    largeTransactions,
    counterpartyAnalysis: counterpartyAnalysis.slice(0, 10),
    transactionFrequency,
    anomalies,
    fundFlow,
  };
};

// 大额交易分析
const analyzeLargeTransactions = (entries: LedgerEntry[]): LargeTransaction[] => {
  // 按金额排序（借方+贷方）
  const sorted = [...entries].sort((a, b) => {
    const amountA = Math.max(a.debit, a.credit);
    const amountB = Math.max(b.debit, b.credit);
    return amountB - amountA;
  });
  
  const totalAmount = entries.reduce((sum, e) => sum + e.debit + e.credit, 0);
  
  return sorted.slice(0, 10).map((entry, index) => ({
    entry,
    rank: index + 1,
    percentage: totalAmount > 0 ? (Math.max(entry.debit, entry.credit) / totalAmount) * 100 : 0,
  }));
};

// 往来单位分析
const analyzeCounterparties = (entries: LedgerEntry[]): CounterpartyInfo[] => {
  const counterpartyMap = new Map<string, CounterpartyInfo>();
  
  entries.forEach(entry => {
    // 从辅助核算或摘要中提取往来单位
    let counterparty = entry.auxiliary;
    
    // 如果辅助核算为空，尝试从摘要中提取
    if (!counterparty && entry.summary) {
      // 匹配"收到XXX"、"支付XXX"、"XXX报销"等模式
      const match = entry.summary.match(/收到(.+?)的?款?|支付(.+?)|(.+?)报销|(.+?)退款/);
      if (match) {
        counterparty = match[1] || match[2] || match[3] || match[4];
      }
    }
    
    if (!counterparty) return;
    
    if (!counterpartyMap.has(counterparty)) {
      counterpartyMap.set(counterparty, {
        name: counterparty,
        totalDebit: 0,
        totalCredit: 0,
        netAmount: 0,
        transactionCount: 0,
        firstDate: entry.date,
        lastDate: entry.date,
      });
    }
    
    const info = counterpartyMap.get(counterparty)!;
    info.totalDebit += entry.debit;
    info.totalCredit += entry.credit;
    info.transactionCount++;
    
    if (entry.date < info.firstDate) info.firstDate = entry.date;
    if (entry.date > info.lastDate) info.lastDate = entry.date;
  });
  
  // 计算净额并排序（按交易金额）
  const result = Array.from(counterpartyMap.values());
  result.forEach(info => {
    info.netAmount = info.totalDebit - info.totalCredit;
  });
  
  return result.sort((a, b) => 
    Math.abs(b.totalDebit + b.totalCredit) - Math.abs(a.totalDebit + a.totalCredit)
  );
};

// 交易频率分析
const analyzeTransactionFrequency = (entries: LedgerEntry[]) => {
  const dates = entries.map(e => e.date).filter(d => d);
  const uniqueDates = new Set(dates);
  
  return {
    dailyAvg: uniqueDates.size > 0 ? entries.length / uniqueDates.size : 0,
    monthlyCount: entries.length,
  };
};

// 异常检测
const detectAnomalies = (entries: LedgerEntry[]): LedgerAnomaly[] => {
  const anomalies: LedgerAnomaly[] = [];
  
  // 1. 大额交易检测（单笔超过平均10倍）
  const amounts = entries.map(e => Math.max(e.debit, e.credit)).filter(a => a > 0);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const largeAmountEntries = entries.filter(e => 
    Math.max(e.debit, e.credit) > avgAmount * 10
  );
  
  if (largeAmountEntries.length > 0) {
    anomalies.push({
      type: 'large_amount',
      description: `发现${largeAmountEntries.length}笔大额交易（超过平均金额10倍）`,
      entries: largeAmountEntries,
      riskLevel: 'medium',
    });
  }
  
  // 2. 频繁交易检测（同一天同一单位多笔）
  const dateCounterpartyMap = new Map<string, number>();
  entries.forEach(e => {
    const key = `${e.date}_${e.auxiliary}`;
    dateCounterpartyMap.set(key, (dateCounterpartyMap.get(key) || 0) + 1);
  });
  
  const frequentEntries: LedgerEntry[] = [];
  dateCounterpartyMap.forEach((count, key) => {
    if (count >= 3) {
      const [date, counterparty] = key.split('_');
      entries.filter(e => e.date === date && e.auxiliary === counterparty)
        .forEach(e => frequentEntries.push(e));
    }
  });
  
  if (frequentEntries.length > 0) {
    anomalies.push({
      type: 'frequent_transaction',
      description: '发现同一天同一单位多笔交易',
      entries: frequentEntries,
      riskLevel: 'low',
    });
  }
  
  // 3. 整数金额检测（可能是人为操作）
  const roundEntries = entries.filter(e => {
    const amount = Math.max(e.debit, e.credit);
    return amount > 10000 && amount % 10000 === 0;
  });
  
  if (roundEntries.length > 0) {
    anomalies.push({
      type: 'round_number',
      description: `发现${roundEntries.length}笔整数金额交易`,
      entries: roundEntries.slice(0, 5),
      riskLevel: 'low',
    });
  }
  
  return anomalies;
};

// ==================== 生成分析报告 ====================

export const generateLedgerReport = (ledger: LedgerData, analysis: LedgerAnalysis): string[] => {
  const report: string[] = [];
  
  report.push(`【${ledger.subjectName}】明细账分析报告`);
  report.push(`期间：${ledger.period || '未指定'}`);
  report.push(`交易笔数：${ledger.entries.length}笔`);
  report.push(`借方发生额：${formatAmount(ledger.totalDebit)}`);
  report.push(`贷方发生额：${formatAmount(ledger.totalCredit)}`);
  
  // 大额交易
  if (analysis.largeTransactions.length > 0) {
    report.push('\n【大额交易TOP5】');
    analysis.largeTransactions.slice(0, 5).forEach(t => {
      const amount = Math.max(t.entry.debit, t.entry.credit);
      report.push(`${t.rank}. ${t.entry.date} ${t.entry.summary} ${formatAmount(amount)} (${t.percentage.toFixed(1)}%)`);
    });
  }
  
  // 主要往来单位
  if (analysis.counterpartyAnalysis.length > 0) {
    report.push('\n【主要往来单位】');
    analysis.counterpartyAnalysis.slice(0, 5).forEach(c => {
      const direction = c.netAmount > 0 ? '应收' : '应付';
      report.push(`• ${c.name}: ${formatAmount(Math.abs(c.netAmount))} (${direction}, ${c.transactionCount}笔)`);
    });
  }
  
  // 异常提醒
  if (analysis.anomalies.length > 0) {
    report.push('\n【异常提醒】');
    analysis.anomalies.forEach(a => {
      const riskText = a.riskLevel === 'high' ? '【高】' : a.riskLevel === 'medium' ? '【中】' : '【低】';
      report.push(`${riskText} ${a.description}`);
    });
  }
  
  return report;
};

// 工具函数
const formatAmount = (amount: number): string => {
  if (Math.abs(amount) >= 100000000) {
    return (amount / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(amount) >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toFixed(2);
};

export default {
  parseLedgerSheet,
  analyzeLedger,
  generateLedgerReport,
};
