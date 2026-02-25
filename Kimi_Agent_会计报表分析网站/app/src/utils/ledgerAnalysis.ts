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
  let lineCount = 0;
  
  console.log(`[parseLedgerSheet] 开始解析，共 ${data.length} 行数据`);
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    lineCount++;
    const firstCell = String(row[0] || '').trim();
    const secondCell = String(row[1] || '').trim();
    
    // 打印前20行用于调试
    if (lineCount <= 20) {
      console.log(`  行${i} [${row.length}列]: "${firstCell}" | "${secondCell}"`);
    }
    
    // 跳过空行和标题行
    if (!firstCell || firstCell === '日期' || firstCell.includes('编制单位') || firstCell.includes('科目编码')) {
      continue;
    }
    
    // 检测科目标题行
    // 格式1: "库存现金" (第一列是科目名称，后面几列也是相同科目名称)
    // 格式2: "科目：1001 库存现金"
    // 格式3: "1001 库存现金明细账"
    const isSubjectHeader = (
      // 格式1: 第一列是科目名称，且第二列也是相同内容（金蝶格式）
      (firstCell && secondCell === firstCell && firstCell.length > 1 && firstCell.length < 30) ||
      // 格式2: 包含"科目："
      firstCell.includes('科目：') || 
      // 格式3: "1001 库存现金" 或 "1001 库存现金明细账"
      firstCell.match(/^\d{3,4}\s+.+$/) ||
      // 格式4: 以"明细账"结尾
      firstCell.match(/.+明细账$/)
    );
    
    if (isSubjectHeader && !firstCell.match(/^\d{4}[-/]\d{2}/)) {
      console.log(`  -> 检测到科目标题: "${firstCell}"`);
      
      // 保存上一个科目的数据
      if (currentLedger && currentLedger.entries.length > 0) {
        calculateLedgerTotals(currentLedger);
        ledgers.push(currentLedger);
        console.log(`     保存上一科目: ${currentLedger.subjectName}, 共 ${currentLedger.entries.length} 条记录`);
      }
      
      // 解析科目信息
      let subjectCode = '';
      let subjectName = firstCell;
      
      // 尝试提取科目代码和名称
      const match1 = firstCell.match(/科目：(\d+)\s*(.+)/);
      const match2 = firstCell.match(/^(\d{3,4})\s+(.+)/);
      const match3 = firstCell.match(/^(.+?)明细账$/);
      
      if (match1) {
        subjectCode = match1[1];
        subjectName = match1[2];
      } else if (match2) {
        subjectCode = match2[1];
        subjectName = match2[2];
      } else if (match3) {
        subjectName = match3[1];
      }
      
      currentLedger = {
        subjectCode,
        subjectName: subjectName.replace(/明细账$/, '').trim(),
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
    if (firstCell.includes('年') && firstCell.includes('月') && (firstCell.includes('至') || firstCell.includes('~'))) {
      if (currentLedger) {
        currentLedger.period = firstCell;
      }
      continue;
    }
    
    // 解析明细记录
    // 支持多种日期格式：2026-01-01, 2026/01/01, 2026年01月01日, 2026-1-1
    const datePattern = /^\d{4}([-/年]\d{1,2}){2}日?$/;
    if (currentLedger && firstCell.match(datePattern) && !firstCell.includes('科目')) {
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
    console.log(`  -> 保存最后一个科目: ${currentLedger.subjectName}, ${currentLedger.entries.length}条记录`);
  }
  
  console.log(`[parseLedgerSheet] 解析完成，共 ${ledgers.length} 个科目`);
  return ledgers;
};

// 解析单条明细记录
const parseLedgerEntry = (row: any[]): LedgerEntry | null => {
  try {
    // 根据列数自适应解析
    const len = row.length;
    const date = String(row[0] || '').trim();
    const voucherNo = String(row[1] || '').trim();
    const subjectCode = String(row[2] || '').trim();
    const subjectName = String(row[3] || '').trim();
    const auxiliary = String(row[4] || '').trim();
    // 摘要可能在不同列
    const summary = String(row.find((cell, idx) => idx >= 3 && idx <= 6 && String(cell).length > 2 && !String(cell).match(/^\d+\.?\d*$/)) || row[5] || row[4] || '').trim();
    // 查找金额列（借方、贷方通常在倒数第3、2列）
    const debit = len >= 8 ? extractNumber(row[len - 4]) : extractNumber(row[5]);
    const credit = len >= 8 ? extractNumber(row[len - 3]) : extractNumber(row[6]);
    const direction = String(len >= 8 ? row[len - 2] : row[7] || '').trim() as '借' | '贷';
    const balance = len >= 8 ? extractNumber(row[len - 1]) : extractNumber(row[8]);
    
    // 只保留有效记录（有日期、不是标题行、金额有效）
    if (!date || date.includes('日期') || date.includes('科目') || (debit === 0 && credit === 0 && balance === 0)) {
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
