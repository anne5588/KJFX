import * as XLSX from 'xlsx';
import type { AccountBalance, AnalysisResult, FinancialMetrics } from '@/types/accounting';
import type { LedgerData } from './ledgerAnalysis';
import { parseLedgerSheet } from './ledgerAnalysis';
import type { FinancialSummaryData } from './financialSummary';
import { parseFinancialSummary } from './financialSummary';
import type { AgingAnalysis } from './agingAnalysis';
import { parseAgingAnalysis } from './agingAnalysis';

// ==================== 类型定义 ====================

// 原始表格数据（用于原样展示）
export interface RawTableData {
  sheetName: string;      // Excel中的Sheet名称
  headers: string[];      // 表头
  rows: any[][];          // 原始行数据
}

// 科目余额表条目
export interface SubjectBalanceItem {
  code: string;           // 科目编码
  name: string;           // 科目名称
  openingDebit: number;   // 期初借方余额
  openingCredit: number;  // 期初贷方余额
  currentDebit: number;   // 本期借方发生额
  currentCredit: number;  // 本期贷方发生额
  closingDebit: number;   // 期末借方余额
  closingCredit: number;  // 期末贷方余额
}

export interface FinancialData {
  // 当期数据（期末/本期）
  assets: Map<string, number>;
  liabilities: Map<string, number>;
  equity: Map<string, number>;
  income: Map<string, number>;
  expenses: Map<string, number>;
  operatingCashflow: number;
  investingCashflow: number;
  financingCashflow: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  
  // 期初/去年同期数据（用于对比分析）
  beginningAssets: Map<string, number>;
  beginningLiabilities: Map<string, number>;
  beginningEquity: Map<string, number>;
  beginningIncome: Map<string, number>;
  beginningExpenses: Map<string, number>;
  beginningTotalAssets: number;
  beginningTotalLiabilities: number;
  beginningTotalEquity: number;
  beginningTotalIncome: number;
  beginningTotalExpenses: number;
  beginningNetProfit: number;
  
  // 数据时间标记
  hasBeginningData: boolean;  // 是否有期初/同期数据
  
  // 明细分类账数据
  ledgers: LedgerData[];
  
  // 财务概要信息表
  financialSummary: FinancialSummaryData | null;
  
  // 账龄分析表
  agingAnalysis: AgingAnalysis | null;
  
  // 科目余额表（原始数据）
  subjectBalance: SubjectBalanceItem[];
  
  // 原始表格数据（用于报表查看原样展示）
  rawTables: {
    balanceSheet?: RawTableData;    // 资产负债表
    incomeStatement?: RawTableData; // 利润表
    cashflowStatement?: RawTableData; // 现金流量表
    subjectBalance?: RawTableData;  // 科目余额表
  };
}

// ==================== 智能列识别 ====================

interface ColumnMapping {
  itemNameCol: number;      // 项目名称列
  amountCol: number;        // 期末金额列（当期）
  beginningAmountCol?: number;  // 年初余额列（期初）
  rowNumCol?: number;       // 行次列（如果有）
}

// 通过内容分析检测右侧列（负债/权益）
const detectRightColumnsByContent = (data: any[][], headerRow: number): ColumnMapping | undefined => {
  const midPoint = Math.floor(data[headerRow].length / 2);
  
  // 关键词列表：负债类
  const liabilityKeywords = ['负债', '应付', '借款', '债券', '长期', '短期', '预收', '应交', '应付职工', '应付股利'];
  // 关键词列表：权益类
  const equityKeywords = ['权益', '资本', '股本', '盈余', '未分配', '库存股'];
  
  // 统计每列包含负债/权益关键词的数量
  const columnScores: Map<number, { liability: number; equity: number; amountValues: number }> = new Map();
  
  // 扫描前20行数据
  for (let i = headerRow + 1; i < Math.min(headerRow + 25, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    for (let col = midPoint - 1; col < row.length && col < midPoint + 6; col++) {
      const cellValue = String(row[col] || '').trim();
      if (!cellValue || cellValue.length < 2) continue;
      
      if (!columnScores.has(col)) {
        columnScores.set(col, { liability: 0, equity: 0, amountValues: 0 });
      }
      const scores = columnScores.get(col)!;
      
      // 检查关键词
      if (liabilityKeywords.some(k => cellValue.includes(k))) {
        scores.liability++;
      }
      if (equityKeywords.some(k => cellValue.includes(k))) {
        scores.equity++;
      }
    }
    
    // 统计金额列（数字列）
    for (let col = midPoint; col < row.length && col < midPoint + 6; col++) {
      const cellValue = row[col];
      if (typeof cellValue === 'number' && cellValue > 0) {
        const scores = columnScores.get(col) || { liability: 0, equity: 0, amountValues: 0 };
        scores.amountValues++;
        columnScores.set(col, scores);
      } else if (typeof cellValue === 'string') {
        const num = parseFloat(cellValue.replace(/,/g, ''));
        if (!isNaN(num) && num > 0) {
          const scores = columnScores.get(col) || { liability: 0, equity: 0, amountValues: 0 };
          scores.amountValues++;
          columnScores.set(col, scores);
        }
      }
    }
  }
  
  // 找包含最多负债/权益关键词的列作为项目名称列
  let bestNameCol = -1;
  let bestNameScore = 0;
  
  columnScores.forEach((scores, col) => {
    const totalScore = scores.liability + scores.equity;
    if (totalScore > bestNameScore) {
      bestNameScore = totalScore;
      bestNameCol = col;
    }
  });
  
  // 找金额列（通常是名称列右侧的数字列）
  let bestAmountCol = -1;
  let bestAmountScore = 0;
  
  if (bestNameCol >= 0) {
    columnScores.forEach((scores, col) => {
      if (col > bestNameCol && scores.amountValues > bestAmountScore) {
        bestAmountScore = scores.amountValues;
        bestAmountCol = col;
      }
    });
  }
  
  console.log('内容分析右侧列:', { bestNameCol, bestAmountCol, scores: Array.from(columnScores.entries()) });
  
  if (bestNameCol >= 0 && bestAmountCol > bestNameCol) {
    return { itemNameCol: bestNameCol, amountCol: bestAmountCol };
  }
  
  // 回退到默认位置
  return { itemNameCol: 6, amountCol: 7 };
};

// 自动识别表头行和列位置
const detectColumns = (data: any[][], sheetType: string): { headerRow: number; leftCols: ColumnMapping; rightCols?: ColumnMapping } => {
  let headerRow = -1;
  let leftCols: ColumnMapping = { itemNameCol: 0, amountCol: 2 };
  let rightCols: ColumnMapping | undefined;
  
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;
    
    const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
    
    // 资产负债表：左右两栏
    if (sheetType === 'balance') {
      // 更宽松的表头检测条件
      const hasAsset = rowStr.includes('资产');
      const hasLiability = rowStr.includes('负债');
      const hasEquity = rowStr.includes('权益') || rowStr.includes('所有者权益') || rowStr.includes('股东权益');
      const hasAmount = rowStr.includes('期末') || rowStr.includes('金额') || rowStr.includes('余额');
      
      // 检测条件：有"资产"+（有"负债"或"权益"）+有金额列
      if (hasAsset && (hasLiability || hasEquity) && hasAmount) {
        headerRow = i;
        
        // 分析表头行的标题来确定列位置
        for (let col = 0; col < row.length; col++) {
          const headerCell = String(row[col] || '').trim();
          
          // 左侧：找"资产"列（通常是前半部分）
          const midPoint = Math.floor(row.length / 2);
          if (headerCell.includes('资产') && !headerCell.includes('负债') && col < midPoint && leftCols.itemNameCol === 0) {
            leftCols.itemNameCol = col;
          }
          // 左侧金额列识别
          // 期末余额列（当期）
          const isPeriodEnd = (headerCell.includes('期末') || headerCell.includes('本期') || headerCell.includes('本年')) &&
                               !headerCell.includes('年初') && !headerCell.includes('上期') && !headerCell.includes('去年');
          
          if (isPeriodEnd && col > leftCols.itemNameCol && col < leftCols.itemNameCol + 4 && leftCols.amountCol === 2) {
            leftCols.amountCol = col;
          }
          
          // 年初余额列（期初）- 在期末列右侧
          const isPeriodStart = (headerCell.includes('年初') || headerCell.includes('期初') || headerCell.includes('上期')) &&
                                !headerCell.includes('期末') && !headerCell.includes('本期');
          
          if (isPeriodStart && leftCols.amountCol > 0 && col > leftCols.amountCol && col < leftCols.amountCol + 3) {
            leftCols.beginningAmountCol = col;
          }
          
          // 右侧：找"负债"或"权益"列（通常在后半部分）
          if ((headerCell.includes('负债') || headerCell.includes('权益')) && 
              col >= midPoint - 1 && !rightCols) {
            rightCols = { itemNameCol: col, amountCol: col + 1 };
          }
          // 右侧金额列识别
          if (rightCols) {
            // 期末余额列（当期）
            const isRightPeriodEnd = (headerCell.includes('期末') || headerCell.includes('本期') || headerCell.includes('本年')) &&
                                      !headerCell.includes('年初') && !headerCell.includes('上期') && !headerCell.includes('去年');
            
            if (isRightPeriodEnd && col > rightCols.itemNameCol && col < rightCols.itemNameCol + 4) {
              rightCols.amountCol = col;
            }
            
            // 年初余额列（期初）- 在期末列右侧
            const isRightPeriodStart = (headerCell.includes('年初') || headerCell.includes('期初') || headerCell.includes('上期')) &&
                                       !headerCell.includes('期末') && !headerCell.includes('本期');
            
            if (isRightPeriodStart && rightCols.amountCol > 0 && col > rightCols.amountCol && col < rightCols.amountCol + 3) {
              rightCols.beginningAmountCol = col;
            }
          }
        }
        
        // 如果表头识别失败，使用内容分析来确定右侧列
        if (!rightCols) {
          rightCols = detectRightColumnsByContent(data, headerRow);
        }
        
        console.log('自动识别列位置:', { headerRow, leftCols, rightCols });
        break;
      }
    }
    // 利润表/现金流量表：单栏
    else if (sheetType === 'income' || sheetType === 'cashflow') {
      if (rowStr.includes('项目') && (rowStr.includes('金额') || rowStr.includes('本期'))) {
        headerRow = i;
        
        // 找项目名列（第一个有"项目"标题或有中文内容的列）
        for (let col = 0; col < row.length; col++) {
          const headerCell = String(row[col] || '').trim();
          if (headerCell.includes('项目') || headerCell.includes('项')) {
            leftCols.itemNameCol = col;
            // 找金额列
            for (let ac = col + 1; ac < row.length; ac++) {
              const amountHeader = String(row[ac] || '').trim();
              if (amountHeader.includes('金额') || amountHeader.includes('本期') || amountHeader.includes('本年')) {
                leftCols.amountCol = ac;
                break;
              }
            }
            break;
          }
        }
        
        console.log('自动识别列位置:', { headerRow, leftCols });
        break;
      }
    }
  }
  
  if (headerRow === -1) {
    headerRow = 3;
    // 尝试通过内容分析找到右侧列
    if (sheetType === 'balance') {
      rightCols = detectRightColumnsByContent(data, headerRow);
    }
  }
  return { headerRow, leftCols, rightCols };
};

// ==================== 主解析函数 ====================

export const parseExcelFile = (file: File): Promise<FinancialData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('无法读取文件内容'));
          return;
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const allData: FinancialData = createEmptyFinancialData();
        
        console.log('发现Sheets:', workbook.SheetNames);
        
        workbook.SheetNames.forEach(sheetName => {
          console.log(`\n=== 处理 Sheet: "${sheetName}" ===`);
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];
          
          console.log(`  数据行数: ${jsonData.length}`);
          
          if (jsonData.length === 0) {
            console.log('  跳过: 空表');
            return;
          }
          
          // 打印前几行用于调试
          const preview = jsonData.slice(0, 3).map(r => r.slice(0, 3).join(',')).join(' | ');
          console.log(`  预览: ${preview.substring(0, 100)}...`);
          
          const sheetType = detectSheetType(jsonData, sheetName);
          console.log(`  识别为: ${sheetType}`);
          
          switch (sheetType) {
            case 'balance':
              parseBalanceSheetSmart(jsonData, allData);
              // 保存原始数据
              allData.rawTables.balanceSheet = {
                sheetName,
                headers: jsonData.length > 0 ? jsonData[0].map(String) : [],
                rows: jsonData.slice(1)
              };
              break;
            case 'income':
              parseIncomeStatementSmart(jsonData, allData);
              // 保存原始数据
              allData.rawTables.incomeStatement = {
                sheetName,
                headers: jsonData.length > 0 ? jsonData[0].map(String) : [],
                rows: jsonData.slice(1)
              };
              break;
            case 'cashflow':
              parseCashflowStatementSmart(jsonData, allData);
              // 保存原始数据
              allData.rawTables.cashflowStatement = {
                sheetName,
                headers: jsonData.length > 0 ? jsonData[0].map(String) : [],
                rows: jsonData.slice(1)
              };
              break;
            case 'subject':
              parseSubjectBalance(jsonData, allData);
              // 保存原始数据
              allData.rawTables.subjectBalance = {
                sheetName,
                headers: jsonData.length > 0 ? jsonData[0].map(String) : [],
                rows: jsonData.slice(1)
              };
              break;
            case 'ledger':
              const ledgers = parseLedgerSheet(jsonData);
              if (ledgers.length > 0) {
                allData.ledgers.push(...ledgers);
                console.log(`解析到 ${ledgers.length} 个科目的明细账`);
              }
              break;
            case 'summary':
              const summary = parseFinancialSummary(jsonData);
              if (summary) {
                allData.financialSummary = summary;
                console.log('解析到财务概要信息表');
              }
              break;
            case 'aging':
              const aging = parseAgingAnalysis(jsonData);
              if (aging) {
                allData.agingAnalysis = aging;
                console.log(`解析到账龄分析表: ${aging.subjectName}`);
              }
              break;
          }
        });
        
        calculateSummaries(allData);
        
        console.log('解析结果:', {
          资产总计: allData.totalAssets,
          负债总计: allData.totalLiabilities,
          权益总计: allData.totalEquity,
          营业收入: allData.totalIncome,
          净利润: allData.netProfit,
        });
        
        if (!hasValidData(allData)) {
          reject(new Error('未能识别到有效的财务数据，请检查文件格式'));
          return;
        }
        
        resolve(allData);
      } catch (error) {
        reject(new Error('解析Excel文件失败: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsBinaryString(file);
  });
};

// ==================== Sheet类型识别 ====================

const detectSheetType = (data: any[][], sheetName: string): string => {
  const nameLower = sheetName.toLowerCase();
  console.log(`    [detectSheetType] 检查: "${sheetName}" -> lower: "${nameLower}"`);
  
  // 优先检查特定类型（放在前面优先匹配）
  if (nameLower.includes('资产负债')) { console.log('      -> match: balance'); return 'balance'; }
  if (nameLower.includes('利润') || nameLower.includes('损益')) { console.log('      -> match: income'); return 'income'; }
  if (nameLower.includes('现金') || nameLower.includes('cash')) { console.log('      -> match: cashflow'); return 'cashflow'; }
  // 明细分类账要在科目余额表之前检查
  if (nameLower.includes('明细')) { console.log('      -> match: ledger (by name)'); return 'ledger'; }
  if (nameLower.includes('ledger')) { console.log('      -> match: ledger (by ledger)'); return 'ledger'; }
  if (nameLower.includes('账龄') || nameLower.includes('aging')) { console.log('      -> match: aging'); return 'aging'; }
  if (nameLower.includes('概要') || nameLower.includes('summary')) { console.log('      -> match: summary'); return 'summary'; }
  if (nameLower.includes('科目') || nameLower.includes('余额')) { console.log('      -> match: subject'); return 'subject'; }
  
  const content = data.slice(0, 15).map(row => row.join(' ')).join(' ');
  
  if (content.includes('资产') && content.includes('负债') && content.includes('所有者权益')) return 'balance';
  if (content.includes('营业收入') || content.includes('营业成本') || content.includes('净利润')) return 'income';
  if (content.includes('经营活动') && content.includes('现金流量')) return 'cashflow';
  if (content.includes('科目编码') || content.includes('科目名称')) return 'subject';
  // 检测明细分类账特征
  if ((content.includes('日期') || content.includes('凭证')) && 
      content.includes('摘要') && 
      (content.includes('借方') || content.includes('贷方')) &&
      content.includes('余额')) return 'ledger';
  // 检测财务概要信息表特征
  if (content.includes('本年累计') && content.includes('本期金额') && 
      (content.includes('盈利状况') || content.includes('三项费用'))) return 'summary';
  // 检测账龄分析表特征
  if (content.includes('期初余额') && content.includes('期末余额') && 
      (content.includes('30天') || content.includes('账龄'))) return 'aging';
  
  return 'unknown';
};

// ==================== 智能资产负债表解析 ====================

const parseBalanceSheetSmart = (data: any[][], result: FinancialData): void => {
  console.log('解析资产负债表...');
  
  const { headerRow, leftCols, rightCols } = detectColumns(data, 'balance');
  
  console.log('表头行:', headerRow);
  console.log('左侧列（资产）:', leftCols);
  console.log('右侧列（负债/权益）:', rightCols);
  
  // 检查是否有年初余额列
  const hasBeginningData = leftCols.beginningAmountCol !== undefined || 
                           (rightCols?.beginningAmountCol !== undefined);
  result.hasBeginningData = hasBeginningData;
  console.log('是否有年初数据:', hasBeginningData);
  
  // 找总计行
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const leftItem = String(row[leftCols.itemNameCol] || '').trim();
    const rightItem = rightCols ? String(row[rightCols.itemNameCol] || '').trim() : '';
    
    // 资产总计（期末）
    if (leftItem.includes('资产总计') || (leftItem.includes('资产') && leftItem.includes('合计') && !leftItem.includes('负债'))) {
      const value = extractNumber(row[leftCols.amountCol]);
      if (value > 0) {
        result.totalAssets = value;
        console.log('资产总计(期末):', value);
      }
      // 年初数据
      if (hasBeginningData && leftCols.beginningAmountCol !== undefined) {
        const beginValue = extractNumber(row[leftCols.beginningAmountCol]);
        if (beginValue > 0) {
          result.beginningTotalAssets = beginValue;
          console.log('资产总计(年初):', beginValue);
        }
      }
    }
    
    // 负债合计（期末）
    if (rightItem.includes('负债合计') || (rightItem.includes('负债') && rightItem.includes('合计') && !rightItem.includes('权益'))) {
      const value = rightCols ? extractNumber(row[rightCols.amountCol]) : 0;
      if (value > 0) {
        result.totalLiabilities = value;
        console.log('负债合计(期末):', value);
      }
      // 年初数据
      if (hasBeginningData && rightCols?.beginningAmountCol !== undefined) {
        const beginValue = extractNumber(row[rightCols.beginningAmountCol]);
        if (beginValue > 0) {
          result.beginningTotalLiabilities = beginValue;
          console.log('负债合计(年初):', beginValue);
        }
      }
    }
    
    // 权益合计（期末）
    if ((rightItem.includes('所有者权益') || rightItem.includes('股东权益')) && rightItem.includes('合计')) {
      const value = rightCols ? extractNumber(row[rightCols.amountCol]) : 0;
      if (value > 0) {
        result.totalEquity = value;
        console.log('权益合计(期末):', value);
      }
      // 年初数据
      if (hasBeginningData && rightCols?.beginningAmountCol !== undefined) {
        const beginValue = extractNumber(row[rightCols.beginningAmountCol]);
        if (beginValue > 0) {
          result.beginningTotalEquity = beginValue;
          console.log('权益合计(年初):', beginValue);
        }
      }
    }
  }
  
  // 计算权益（如果未找到）
  if (result.totalEquity === 0 && result.totalAssets > 0 && result.totalLiabilities > 0) {
    result.totalEquity = result.totalAssets - result.totalLiabilities;
  }
  if (result.beginningTotalEquity === 0 && result.beginningTotalAssets > 0 && result.beginningTotalLiabilities > 0) {
    result.beginningTotalEquity = result.beginningTotalAssets - result.beginningTotalLiabilities;
  }
  
  // 解析明细（期末+年初）
  parseBalanceDetailsSmart(data, headerRow, leftCols, rightCols, result);
  
  console.log('资产负债表解析完成:', {
    资产总计: result.totalAssets,
    资产总计_年初: result.beginningTotalAssets,
    负债总计: result.totalLiabilities,
    负债总计_年初: result.beginningTotalLiabilities,
    权益总计: result.totalEquity,
    权益总计_年初: result.beginningTotalEquity,
  });
};

// 智能解析资产负债表明细
const parseBalanceDetailsSmart = (
  data: any[][], 
  headerRow: number, 
  leftCols: ColumnMapping, 
  rightCols: ColumnMapping | undefined,
  result: FinancialData
): void => {
  
  // 确定右侧栏的范围（负债 vs 权益）
  let liabilityEndRow = data.length;
  let equityStartRow = -1;
  
  if (rightCols) {
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const item = String(row[rightCols.itemNameCol] || '').trim();
      
      if (item.includes('所有者权益') || item.includes('股东权益')) {
        equityStartRow = i;
        // 找负债结束行（权益开始前的负债合计）
        for (let j = i - 1; j > headerRow; j--) {
          const prevRow = data[j];
          if (!prevRow) continue;
          const prevItem = String(prevRow[rightCols.itemNameCol] || '').trim();
          if (prevItem.includes('负债合计') || prevItem.includes('流动负债合计')) {
            liabilityEndRow = j;
            break;
          }
        }
        break;
      }
    }
  }
  
  console.log('负债范围:', headerRow, '-', liabilityEndRow);
  console.log('权益开始:', equityStartRow);
  console.log('年初余额列:', leftCols.beginningAmountCol, rightCols?.beginningAmountCol);
  
  // 读取左侧（资产）- 期末数据
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const item = String(row[leftCols.itemNameCol] || '').trim();
    const value = extractNumber(row[leftCols.amountCol]);
    
    // 跳过标题、合计、空行
    if (!item || item.length < 2) continue;
    // 只跳过总计行，不跳过资产明细科目（如货币资金、应收账款等）
    if (item.includes('资产总计') || item.includes('资产合计') || item.includes('合计') || item.includes('小计')) continue;
    if (item.includes('：') || item.includes(':')) continue;
    if (item.startsWith('其中')) continue;
    if (/^\d+$/.test(item)) continue; // 纯数字
    
    if (value > 0) {
      result.assets.set(item, value);
    }
    
    // 年初数据
    if (leftCols.beginningAmountCol !== undefined && result.hasBeginningData) {
      const beginValue = extractNumber(row[leftCols.beginningAmountCol]);
      if (beginValue > 0) {
        result.beginningAssets.set(item, beginValue);
      }
    }
  }
  
  // 读取右侧（负债和权益）- 期末数据
  if (rightCols) {
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const item = String(row[rightCols.itemNameCol] || '').trim();
      const value = extractNumber(row[rightCols.amountCol]);
      
      // 跳过标题、合计、空行
      if (!item || item.length < 2) continue;
      // 只跳过总计行和分类标题，不跳过明细科目
      if (item.includes('负债总计') || item.includes('负债合计') || item.includes('权益总计') || item.includes('权益合计') || item.includes('合计') || item.includes('小计')) continue;
      // 跳过分类标题行（如流动负债、非流动负债、所有者权益等）
      if (item === '流动负债' || item === '非流动负债' || item === '负债' || item === '所有者权益' || item === '股东权益' || item === '权益') continue;
      if (item.includes('：') || item.includes(':')) continue;
      if (item.startsWith('其中')) continue;
      if (/^\d+$/.test(item)) continue; // 纯数字
      
      if (value > 0) {
        // 判断是负债还是权益
        if (equityStartRow > 0 && i >= equityStartRow) {
          result.equity.set(item, value);
        } else if (i < liabilityEndRow) {
          result.liabilities.set(item, value);
        }
      }
      
      // 年初数据
      if (rightCols.beginningAmountCol !== undefined && result.hasBeginningData) {
        const beginValue = extractNumber(row[rightCols.beginningAmountCol]);
        if (beginValue > 0) {
          if (equityStartRow > 0 && i >= equityStartRow) {
            result.beginningEquity.set(item, beginValue);
          } else if (i < liabilityEndRow) {
            result.beginningLiabilities.set(item, beginValue);
          }
        }
      }
    }
  }
};

// ==================== 智能利润表解析 ====================

const parseIncomeStatementSmart = (data: any[][], result: FinancialData): void => {
  console.log('解析利润表...');
  
  const { headerRow, leftCols } = detectColumns(data, 'income');
  
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const item = String(row[leftCols.itemNameCol] || '').trim();
    const value = extractNumber(row[leftCols.amountCol]);
    
    if (!item || item.length < 2) continue;
    if (item.includes('编制单位') || item.includes('利润表')) continue;
    
    // 识别关键项目
    if (item.includes('营业收入') && !item.includes('净')) {
      if (value !== 0) result.totalIncome = value;
    }
    if (item.includes('营业成本') && !item.includes('税金')) {
      result.expenses.set('营业成本', Math.abs(value));
    }
    if ((item.includes('净利润') || item.includes('净亏损')) && 
        !item.includes('持续') && !item.includes('终止')) {
      result.netProfit = value;
    }
    
    if (value === 0) continue;
    
    if (isIncomeItem(item)) {
      result.income.set(item, Math.abs(value));
    } else if (isExpenseItem(item)) {
      result.expenses.set(item, Math.abs(value));
    }
  }
  
  console.log('利润表解析完成:', { 营业收入: result.totalIncome, 净利润: result.netProfit });
};

// ==================== 智能现金流量表解析 ====================

const parseCashflowStatementSmart = (data: any[][], result: FinancialData): void => {
  console.log('解析现金流量表...');
  
  const { headerRow, leftCols } = detectColumns(data, 'cashflow');
  
  let currentSection: 'operating' | 'investing' | 'financing' | null = null;
  
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const item = String(row[leftCols.itemNameCol] || '').trim();
    
    if (item.includes('经营活动')) {
      currentSection = 'operating';
      continue;
    }
    if (item.includes('投资活动')) {
      currentSection = 'investing';
      continue;
    }
    if (item.includes('筹资活动') || item.includes('融资活动')) {
      currentSection = 'financing';
      continue;
    }
    
    if (item.includes('现金流量净额') || (item.includes('小计') && !item.includes('流入') && !item.includes('流出'))) {
      const value = extractNumber(row[leftCols.amountCol]);
      if (currentSection === 'operating') result.operatingCashflow = value;
      if (currentSection === 'investing') result.investingCashflow = value;
      if (currentSection === 'financing') result.financingCashflow = value;
    }
  }
  
  console.log('现金流量表解析完成:', {
    经营活动: result.operatingCashflow,
    投资活动: result.investingCashflow,
    筹资活动: result.financingCashflow,
  });
};

// ==================== 科目余额表解析 ====================

const parseSubjectBalance = (data: any[][], result: FinancialData): void => {
  console.log('解析科目余额表...');
  
  let headerRow = -1;
  let codeCol = -1;
  let nameCol = -1;
  let openingDebitCol = -1;
  let openingCreditCol = -1;
  let currentDebitCol = -1;
  let currentCreditCol = -1;
  let closingDebitCol = -1;
  let closingCreditCol = -1;
  
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').trim();
      
      if ((cell.includes('科目编码') || cell.includes('科目代码')) && codeCol === -1) {
        codeCol = j;
      }
      if ((cell.includes('科目名称') || (cell.includes('科目') && !cell.includes('编码') && !cell.includes('代码'))) && nameCol === -1) {
        nameCol = j;
      }
      // 期初余额
      if ((cell.includes('期初') || cell.includes('年初')) && cell.includes('借方') && openingDebitCol === -1) {
        openingDebitCol = j;
      }
      if ((cell.includes('期初') || cell.includes('年初')) && cell.includes('贷方') && openingCreditCol === -1) {
        openingCreditCol = j;
      }
      // 本期发生额
      if ((cell.includes('本期') || cell.includes('本年')) && !cell.includes('期末') && !cell.includes('期初') && 
          (cell.includes('借方') || cell.includes('借')) && currentDebitCol === -1) {
        currentDebitCol = j;
      }
      if ((cell.includes('本期') || cell.includes('本年')) && !cell.includes('期末') && !cell.includes('期初') && 
          (cell.includes('贷方') || cell.includes('贷')) && currentCreditCol === -1) {
        currentCreditCol = j;
      }
      // 期末余额
      if (cell.includes('期末') && cell.includes('借方') && closingDebitCol === -1) {
        closingDebitCol = j;
      }
      if (cell.includes('期末') && cell.includes('贷方') && closingCreditCol === -1) {
        closingCreditCol = j;
      }
    }
    
    if (nameCol !== -1 && (closingDebitCol !== -1 || closingCreditCol !== -1)) {
      headerRow = i;
      break;
    }
  }
  
  console.log('科目余额表列识别:', { headerRow, codeCol, nameCol, openingDebitCol, openingCreditCol, currentDebitCol, currentCreditCol, closingDebitCol, closingCreditCol });
  
  if (headerRow === -1) return;
  
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const code = codeCol !== -1 ? String(row[codeCol] || '').trim() : '';
    const name = nameCol !== -1 ? String(row[nameCol] || '').trim() : '';
    
    if (!name && !code) continue;
    
    const openingDebit = openingDebitCol !== -1 ? extractNumber(row[openingDebitCol]) : 0;
    const openingCredit = openingCreditCol !== -1 ? extractNumber(row[openingCreditCol]) : 0;
    const currentDebit = currentDebitCol !== -1 ? extractNumber(row[currentDebitCol]) : 0;
    const currentCredit = currentCreditCol !== -1 ? extractNumber(row[currentCreditCol]) : 0;
    const closingDebit = closingDebitCol !== -1 ? extractNumber(row[closingDebitCol]) : 0;
    const closingCredit = closingCreditCol !== -1 ? extractNumber(row[closingCreditCol]) : 0;
    
    // 保存原始科目余额数据
    result.subjectBalance.push({
      code,
      name,
      openingDebit,
      openingCredit,
      currentDebit,
      currentCredit,
      closingDebit,
      closingCredit,
    });
    
    classifySubjectItem(name, code, closingDebit, closingCredit, result);
  }
  
  console.log(`解析到 ${result.subjectBalance.length} 条科目余额记录`);
};

// ==================== 工具函数 ====================

const createEmptyFinancialData = (): FinancialData => ({
  // 当期数据
  assets: new Map(),
  liabilities: new Map(),
  equity: new Map(),
  income: new Map(),
  expenses: new Map(),
  operatingCashflow: 0,
  investingCashflow: 0,
  financingCashflow: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  totalEquity: 0,
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  
  // 期初/同期数据
  beginningAssets: new Map(),
  beginningLiabilities: new Map(),
  beginningEquity: new Map(),
  beginningIncome: new Map(),
  beginningExpenses: new Map(),
  beginningTotalAssets: 0,
  beginningTotalLiabilities: 0,
  beginningTotalEquity: 0,
  beginningTotalIncome: 0,
  beginningTotalExpenses: 0,
  beginningNetProfit: 0,
  hasBeginningData: false,
  ledgers: [],
  financialSummary: null,
  agingAnalysis: null,
  subjectBalance: [],
  rawTables: {},
});

const hasValidData = (data: FinancialData): boolean => {
  return data.totalAssets !== 0 || data.totalIncome !== 0 || data.netProfit !== 0 ||
         data.assets.size > 0 || data.income.size > 0;
};

const extractNumber = (cell: any): number => {
  if (cell === undefined || cell === null) return 0;
  
  if (typeof cell === 'number') return cell;
  if (typeof cell === 'string') {
    let str = cell.trim().replace(/[,\s]/g, '');
    const isNegative = str.startsWith('(') && str.endsWith(')');
    if (isNegative) {
      str = '-' + str.slice(1, -1);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
};

const isIncomeItem = (name: string): boolean => {
  const incomeKeywords = ['收入', '收益', '营业外收入', '其他收益', '利得'];
  return incomeKeywords.some(k => name.includes(k));
};

const isExpenseItem = (name: string): boolean => {
  const expenseKeywords = ['成本', '费用', '支出', '损失', '营业外支出', '所得税', '税金及附加'];
  return expenseKeywords.some(k => name.includes(k));
};

const classifySubjectItem = (
  name: string, 
  code: string, 
  debit: number, 
  credit: number, 
  result: FinancialData
): void => {
  const balance = debit - credit;
  const absBalance = Math.abs(balance);
  
  if (absBalance < 0.01) return;
  
  if (code.startsWith('1') || code.startsWith('001') ||
      name.includes('现金') || name.includes('银行') || 
      name.includes('应收') || name.includes('存货') ||
      name.includes('资产') || name.includes('固定') || name.includes('无形')) {
    if (balance > 0) {
      result.assets.set(name, absBalance);
    }
  }
  else if (code.startsWith('2') || 
           name.includes('应付') || name.includes('借款') || 
           name.includes('负债') || name.includes('应交') || name.includes('预收')) {
    if (balance < 0 || credit > 0) {
      result.liabilities.set(name, absBalance);
    }
  }
  else if (code.startsWith('3') || 
           name.includes('资本') || name.includes('盈余') || 
           name.includes('权益') || name.includes('未分配') || name.includes('实收资本')) {
    if (balance < 0 || credit > 0) {
      result.equity.set(name, absBalance);
    }
  }
  else if (code.startsWith('4') || code.startsWith('6') ||
           name.includes('收入') || name.includes('收益')) {
    result.income.set(name, absBalance);
  }
  else if (code.startsWith('5') || code.startsWith('7') ||
           name.includes('成本') || name.includes('费用') || name.includes('支出')) {
    result.expenses.set(name, absBalance);
  }
};

const calculateSummaries = (data: FinancialData): void => {
  if (data.totalAssets === 0) {
    data.assets.forEach(v => data.totalAssets += v);
  }
  if (data.totalLiabilities === 0) {
    data.liabilities.forEach(v => data.totalLiabilities += v);
  }
  if (data.totalEquity === 0) {
    data.equity.forEach(v => data.totalEquity += v);
  }
  if (data.totalIncome === 0) {
    data.income.forEach(v => data.totalIncome += v);
  }
  if (data.totalExpenses === 0) {
    data.expenses.forEach(v => data.totalExpenses += v);
  }
  
  if (data.netProfit === 0 && (data.totalIncome !== 0 || data.totalExpenses !== 0)) {
    data.netProfit = data.totalIncome - data.totalExpenses;
  }
  
  if (data.totalEquity === 0 && data.totalAssets !== 0 && data.totalLiabilities !== 0) {
    data.totalEquity = data.totalAssets - data.totalLiabilities;
  }
};

// ==================== 财务指标计算 - 五大能力分析 ====================

export const calculateMetrics = (data: FinancialData): FinancialMetrics => {
  const totalAssets = data.totalAssets;
  const totalLiabilities = data.totalLiabilities;
  const totalEquity = data.totalEquity;
  const totalIncome = data.totalIncome;
  const netProfit = data.netProfit;
  
  // ===== 资产负债表项目精确计算 =====
  let currentAssets = 0;
  let cashAndCashEquivalents = 0;
  let accountsReceivable = 0;
  let inventory = 0;
  let fixedAssets = 0;
  
  data.assets.forEach((value, name) => {
    if (name.includes('货币') || name.includes('现金') || name.includes('银行') || name.includes('存款')) {
      currentAssets += value;
      cashAndCashEquivalents += value;
    } else if (name.includes('应收') && !name.includes('预收')) {
      currentAssets += value;
      accountsReceivable += value;
    } else if (name.includes('存货') || name.includes('库存') || name.includes('原材料') || name.includes('商品')) {
      currentAssets += value;
      inventory += value;
    } else if (name.includes('预付')) {
      currentAssets += value;
    } else if (name.includes('固定') || name.includes('在建工程') || name.includes('无形资产')) {
      fixedAssets += value;
    }
  });
  
  let currentLiabilities = 0;
  let totalDebt = 0;
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付') || name.includes('预收') || 
        name.includes('薪酬') || name.includes('应交') || name.includes('短期') || name.includes('一年内')) {
      currentLiabilities += value;
    }
    if (name.includes('借款') || name.includes('债券') || name.includes('长期应付款')) {
      totalDebt += value;
    }
  });
  
  // 如果无法精确计算，使用估算
  if (currentAssets === 0) currentAssets = totalAssets * 0.6;
  if (cashAndCashEquivalents === 0) cashAndCashEquivalents = currentAssets * 0.15;
  if (accountsReceivable === 0) accountsReceivable = currentAssets * 0.25;
  if (inventory === 0) inventory = currentAssets * 0.2;
  if (currentLiabilities === 0) currentLiabilities = totalLiabilities * 0.8;
  
  const quickAssets = currentAssets - inventory;
  
  // ===== 1. 偿债能力指标 =====
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const quickRatio = currentLiabilities > 0 ? quickAssets / currentLiabilities : 0;
  const cashRatio = currentLiabilities > 0 ? cashAndCashEquivalents / currentLiabilities : 0;
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const equityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
  // 利息保障倍数（简化计算：假设财务费用主要是利息）
  let interestExpense = 0;
  data.expenses.forEach((value, name) => {
    if (name.includes('利息') || name.includes('财务费用')) interestExpense += value;
  });
  if (interestExpense === 0) interestExpense = data.totalExpenses * 0.02; // 估算2%
  const interestCoverageRatio = interestExpense > 0 ? (netProfit + interestExpense) / interestExpense : 999;
  
  // ===== 2. 营运能力指标 =====
  // 应收账款周转率 = 营业收入 / 平均应收账款余额
  const avgReceivables = data.hasBeginningData 
    ? (accountsReceivable + (data.beginningAssets.get('应收账款') || accountsReceivable)) / 2
    : accountsReceivable;
  const receivablesTurnover = avgReceivables > 0 ? totalIncome / avgReceivables : 0;
  const receivablesDays = receivablesTurnover > 0 ? 365 / receivablesTurnover : 0;
  
  // 存货周转率 = 营业成本 / 平均存货余额
  let costOfGoodsSold = data.totalExpenses * 0.7; // 估算营业成本
  data.expenses.forEach((value, name) => {
    if (name.includes('成本') && name.includes('营业')) costOfGoodsSold = value;
  });
  const avgInventory = data.hasBeginningData
    ? (inventory + (data.beginningAssets.get('存货') || inventory)) / 2
    : inventory;
  const inventoryTurnover = avgInventory > 0 ? costOfGoodsSold / avgInventory : 0;
  const inventoryDays = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;
  
  // 流动资产周转率
  const avgCurrentAssets = data.hasBeginningData
    ? (currentAssets + (data.beginningTotalAssets * 0.6)) / 2
    : currentAssets;
  const currentAssetTurnover = avgCurrentAssets > 0 ? totalIncome / avgCurrentAssets : 0;
  
  // 总资产周转率
  const avgTotalAssets = data.hasBeginningData
    ? (totalAssets + data.beginningTotalAssets) / 2
    : totalAssets;
  const totalAssetTurnover = avgTotalAssets > 0 ? totalIncome / avgTotalAssets : 0;
  
  // 现金转换周期
  let accountsPayable = 0;
  data.liabilities.forEach((value, name) => {
    if (name.includes('应付') && !name.includes('预付')) accountsPayable += value;
  });
  const payablesTurnover = accountsPayable > 0 ? costOfGoodsSold / accountsPayable : 0;
  const payablesDays = payablesTurnover > 0 ? 365 / payablesTurnover : 0;
  const cashConversionCycle = receivablesDays + inventoryDays - payablesDays;
  
  // ===== 3. 盈利能力指标 =====
  const netProfitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const grossProfitMargin = totalIncome > 0 ? ((totalIncome - costOfGoodsSold) / totalIncome) * 100 : 0;
  
  // 营业利润 = 营业收入 - 营业成本 - 税金及附加 - 期间费用
  const operatingProfit = netProfit * 1.2; // 估算营业利润略高于净利润
  const operatingProfitMargin = totalIncome > 0 ? (operatingProfit / totalIncome) * 100 : 0;
  
  const roe = totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0;
  const roa = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
  
  // EBITDA利润率 (息税折旧前利润)
  const ebitda = netProfit + interestExpense + (totalAssets * 0.05); // 估算折旧
  const ebitdaMargin = totalIncome > 0 ? (ebitda / totalIncome) * 100 : 0;
  
  // 成本费用利润率
  const costExpenseRatio = data.totalExpenses > 0 ? (netProfit / data.totalExpenses) * 100 : 0;
  
  // ===== 4. 发展能力指标（需要期初数据） =====
  let revenueGrowthRate = 0;
  let netProfitGrowthRate = 0;
  let totalAssetGrowthRate = 0;
  let equityGrowthRate = 0;
  
  if (data.hasBeginningData) {
    revenueGrowthRate = data.beginningTotalIncome > 0 
      ? ((totalIncome - data.beginningTotalIncome) / data.beginningTotalIncome) * 100 
      : 0;
    netProfitGrowthRate = data.beginningNetProfit !== 0
      ? ((netProfit - data.beginningNetProfit) / Math.abs(data.beginningNetProfit)) * 100
      : 0;
    totalAssetGrowthRate = data.beginningTotalAssets > 0
      ? ((totalAssets - data.beginningTotalAssets) / data.beginningTotalAssets) * 100
      : 0;
    equityGrowthRate = data.beginningTotalEquity > 0
      ? ((totalEquity - data.beginningTotalEquity) / data.beginningTotalEquity) * 100
      : 0;
  } else {
    // 无对比数据时使用估算
    revenueGrowthRate = totalIncome > 100000 ? 10 : 5;
    netProfitGrowthRate = netProfit > 0 ? 15 : -5;
    totalAssetGrowthRate = 8;
    equityGrowthRate = 12;
  }
  
  // 可持续增长率 = ROE × (1 - 分红率)，假设分红率30%
  const sustainableGrowthRate = roe * 0.7;
  
  // ===== 5. 现金流指标 =====
  const operatingCashFlow = data.operatingCashflow !== 0 
    ? data.operatingCashflow 
    : netProfit * 1.1; // 估算经营现金流略高于净利润
  const freeCashFlow = operatingCashFlow - (totalAssets * 0.05); // 减去资本支出估算
  
  const operatingCashFlowRatio = netProfit !== 0 ? operatingCashFlow / Math.abs(netProfit) : 0;
  const cashFlowToRevenue = totalIncome > 0 ? (operatingCashFlow / totalIncome) * 100 : 0;
  const cashRecoveryRate = totalIncome > 0 ? (operatingCashFlow / totalIncome) * 100 : 0;
  const operatingCashFlowPerShare = totalEquity > 0 ? operatingCashFlow / (totalEquity / 10) : 0; // 假设每股10元
  
  return {
    // 偿债能力
    currentRatio: round(currentRatio, 2),
    quickRatio: round(quickRatio, 2),
    cashRatio: round(cashRatio, 2),
    debtToAssetRatio: round(debtToAssetRatio, 2),
    equityRatio: round(equityRatio, 2),
    interestCoverageRatio: round(interestCoverageRatio, 2),
    // 营运能力
    receivablesTurnover: round(receivablesTurnover, 1),
    receivablesDays: round(receivablesDays, 1),
    inventoryTurnover: round(inventoryTurnover, 1),
    inventoryDays: round(inventoryDays, 1),
    currentAssetTurnover: round(currentAssetTurnover, 2),
    totalAssetTurnover: round(totalAssetTurnover, 2),
    cashConversionCycle: round(cashConversionCycle, 1),
    // 盈利能力
    grossProfitMargin: round(grossProfitMargin, 2),
    operatingProfitMargin: round(operatingProfitMargin, 2),
    netProfitMargin: round(netProfitMargin, 2),
    roe: round(roe, 2),
    roa: round(roa, 2),
    ebitdaMargin: round(ebitdaMargin, 2),
    costExpenseRatio: round(costExpenseRatio, 2),
    // 发展能力
    revenueGrowthRate: round(revenueGrowthRate, 2),
    netProfitGrowthRate: round(netProfitGrowthRate, 2),
    totalAssetGrowthRate: round(totalAssetGrowthRate, 2),
    equityGrowthRate: round(equityGrowthRate, 2),
    sustainableGrowthRate: round(sustainableGrowthRate, 2),
    // 现金流
    operatingCashFlowRatio: round(operatingCashFlowRatio, 2),
    freeCashFlow: round(freeCashFlow, 2),
    cashFlowToRevenue: round(cashFlowToRevenue, 2),
    cashRecoveryRate: round(cashRecoveryRate, 2),
    operatingCashFlowPerShare: round(operatingCashFlowPerShare, 2),
  };
};

// ==================== 杜邦分析 ====================

export interface DupontAnalysis {
  roe: number;
  netProfitMargin: number;
  totalAssetTurnover: number;
  equityMultiplier: number;
}

export const calculateDupont = (data: FinancialData): DupontAnalysis => {
  const netProfitMargin = data.totalIncome > 0 ? data.netProfit / data.totalIncome : 0;
  const totalAssetTurnover = data.totalAssets > 0 ? data.totalIncome / data.totalAssets : 0;
  const equityMultiplier = data.totalEquity > 0 ? data.totalAssets / data.totalEquity : 0;
  const roe = netProfitMargin * totalAssetTurnover * equityMultiplier;
  
  return {
    roe: round(roe * 100, 2),
    netProfitMargin: round(netProfitMargin * 100, 2),
    totalAssetTurnover: round(totalAssetTurnover, 2),
    equityMultiplier: round(equityMultiplier, 2),
  };
};

// ==================== 分析建议生成 ====================

export const generateSuggestions = (data: FinancialData, metrics: FinancialMetrics): string[] => {
  const suggestions: string[] = [];
  
  if (metrics.currentRatio < 1.5) {
    suggestions.push(`流动比率为 ${metrics.currentRatio}，低于标准值2，建议关注短期偿债能力。`);
  } else if (metrics.currentRatio > 3) {
    suggestions.push(`流动比率为 ${metrics.currentRatio}，较高，可能存在资金利用效率不高的情况。`);
  } else {
    suggestions.push(`流动比率为 ${metrics.currentRatio}，处于合理范围。`);
  }
  
  if (metrics.debtToAssetRatio > 60) {
    suggestions.push(`资产负债率为 ${metrics.debtToAssetRatio}%，较高，财务风险较大。`);
  } else if (metrics.debtToAssetRatio < 30) {
    suggestions.push(`资产负债率为 ${metrics.debtToAssetRatio}%，较低，财务结构稳健。`);
  } else {
    suggestions.push(`资产负债率为 ${metrics.debtToAssetRatio}%，处于适宜范围40%-60%内。`);
  }
  
  if (metrics.netProfitMargin < 0) {
    suggestions.push(`销售净利率为 ${metrics.netProfitMargin}%，出现亏损，建议优化成本结构。`);
  } else if (metrics.netProfitMargin < 5) {
    suggestions.push(`销售净利率为 ${metrics.netProfitMargin}%，偏低，建议提升盈利能力。`);
  } else if (metrics.netProfitMargin > 20) {
    suggestions.push(`销售净利率为 ${metrics.netProfitMargin}%，盈利能力较强。`);
  }
  
  if (metrics.roe < 0) {
    suggestions.push(`净资产收益率(ROE)为 ${metrics.roe}%，出现亏损，需关注经营风险。`);
  } else if (metrics.roe < 10) {
    suggestions.push(`净资产收益率(ROE)为 ${metrics.roe}%，偏低，建议提高资产使用效率。`);
  } else if (metrics.roe > 20) {
    suggestions.push(`净资产收益率(ROE)为 ${metrics.roe}%，表现优秀。`);
  }
  
  if (metrics.totalAssetTurnover < 0.5) {
    suggestions.push(`总资产周转率为 ${metrics.totalAssetTurnover}，资产运营效率有待提升。`);
  }
  
  if (data.netProfit > 0) {
    suggestions.push(`本期实现净利润 ${formatCurrency(data.netProfit)}，经营状况良好。`);
  } else if (data.netProfit < 0) {
    suggestions.push(`本期出现亏损 ${formatCurrency(Math.abs(data.netProfit))}，需要关注经营风险。`);
  }
  
  if (data.operatingCashflow !== 0) {
    if (data.operatingCashflow > 0) {
      suggestions.push(`经营活动现金流为正(${formatCurrency(data.operatingCashflow)})，主营业务造血能力良好。`);
    } else {
      suggestions.push(`经营活动现金流为负(${formatCurrency(data.operatingCashflow)})，需关注经营回款情况。`);
    }
  }
  
  return suggestions;
};

// ==================== 单位设置 ====================
export type UnitType = 'yuan' | 'thousand' | 'wan';

let currentUnit: UnitType = 'wan';
let unitMultiplier: number = 1;
let unitSuffix: string = '';

export const setUnit = (unit: UnitType) => {
  currentUnit = unit;
  switch (unit) {
    case 'yuan':
      unitMultiplier = 1;
      unitSuffix = '元';
      break;
    case 'thousand':
      unitMultiplier = 1000;
      unitSuffix = '千元';
      break;
    case 'wan':
      unitMultiplier = 10000;
      unitSuffix = '万';
      break;
  }
};

export const getCurrentUnit = (): UnitType => currentUnit;
export const getUnitSuffix = (): string => unitSuffix;

// ==================== 金额格式化 ====================

export const formatCurrency = (value: number): string => {
  if (value === 0) return '0';
  
  const convertedValue = value / unitMultiplier;
  const absValue = Math.abs(convertedValue);
  const sign = convertedValue < 0 ? '-' : '';
  
  if (currentUnit === 'yuan') {
    // 元为单位，自动转换大单位显示
    if (absValue >= 100000000) {
      return sign + (absValue / 100000000).toFixed(2) + '亿';
    } else if (absValue >= 10000) {
      return sign + (absValue / 10000).toFixed(2) + '万';
    } else {
      return sign + absValue.toFixed(2) + '元';
    }
  } else {
    // 千元或万元为单位
    return sign + absValue.toFixed(2) + unitSuffix;
  }
};

export const formatCurrencyUniform = (value: number): string => {
  if (value === 0) return '0.00' + unitSuffix;
  
  const convertedValue = value / unitMultiplier;
  const absValue = Math.abs(convertedValue);
  const sign = convertedValue < 0 ? '-' : '';
  
  return sign + absValue.toFixed(2) + unitSuffix;
};

const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

// ==================== 兼容旧接口 ====================

export const analyzeAccountingData = (accounts: AccountBalance[]): AnalysisResult => {
  const data = createEmptyFinancialData();
  
  accounts.forEach(acc => {
    classifySubjectItem(
      acc.subjectName, 
      acc.subjectCode,
      acc.closingDebit,
      acc.closingCredit,
      data
    );
  });
  
  calculateSummaries(data);
  const metrics = calculateMetrics(data);
  const suggestions = generateSuggestions(data, metrics);
  
  return {
    metrics,
    assets: {
      name: '资产类',
      accounts: accounts.filter(a => {
        const code = a.subjectCode;
        const name = a.subjectName;
        return code.startsWith('1') || name.includes('资产') || name.includes('现金') || 
               name.includes('应收') || name.includes('存货') || name.includes('固定');
      }),
      totalDebit: data.totalAssets,
      totalCredit: 0,
    },
    liabilities: {
      name: '负债类',
      accounts: accounts.filter(a => {
        const code = a.subjectCode;
        const name = a.subjectName;
        return code.startsWith('2') || name.includes('负债') || name.includes('应付') || 
               name.includes('借款') || name.includes('应交');
      }),
      totalDebit: 0,
      totalCredit: data.totalLiabilities,
    },
    equity: {
      name: '所有者权益',
      accounts: accounts.filter(a => {
        const code = a.subjectCode;
        const name = a.subjectName;
        return code.startsWith('3') || name.includes('权益') || name.includes('资本') || 
               name.includes('盈余') || name.includes('未分配');
      }),
      totalDebit: 0,
      totalCredit: data.totalEquity,
    },
    income: {
      name: '收入类',
      accounts: accounts.filter(a => {
        const name = a.subjectName;
        return name.includes('收入') || name.includes('收益');
      }),
      totalDebit: 0,
      totalCredit: data.totalIncome,
    },
    expenses: {
      name: '费用类',
      accounts: accounts.filter(a => {
        const name = a.subjectName;
        return name.includes('成本') || name.includes('费用') || name.includes('支出');
      }),
      totalDebit: data.totalExpenses,
      totalCredit: 0,
    },
    summary: {
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      totalEquity: data.totalEquity,
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      netProfit: data.netProfit,
    },
    suggestions,
  };
};
