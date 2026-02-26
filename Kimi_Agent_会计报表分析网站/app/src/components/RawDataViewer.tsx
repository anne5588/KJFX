// ==================== 原始报表查看组件 ====================
// 原样展示用户上传的财务报表原始数据，美化版

import React, { useState } from 'react';
import type { FinancialData } from '@/utils/excelParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2,
  BarChart3,
  Activity,
  Clock,
  BookOpen,
  ArrowRightLeft,
  ScrollText,
  ChevronDown,
  ChevronRight,
  FileText,
  FileX,
  List,
  TrendingUp,
  Users,
  PieChart,
  AlertCircle
} from 'lucide-react';

interface RawDataViewerProps {
  financialData: FinancialData;
}

// 格式化单元格值
const formatCellValue = (value: any): string => {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'number') {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value);
};

// 判断是否为数字
const isNumeric = (value: any): boolean => {
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/,/g, ''));
    return !isNaN(num) && /^-?\d+(\.\d+)?$/.test(value.replace(/,/g, ''));
  }
  return false;
};

// 空数据提示组件
const EmptyDataTip: React.FC<{ message: string; icon?: React.ReactNode }> = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-gray-400">
    {icon || <FileX className="w-16 h-16 mb-4 opacity-30" />}
    <p className="text-sm">{message}</p>
  </div>
);

// 检测是否为表头行
const findHeaderRow = (rows: any[][]): { headerIndex: number; headers: string[] } => {
  const headerKeywords = ['项目', '科目', '行次', '序号', '代码', '名称', '金额', '本期', '本年', '期末', '期初', '借方', '贷方', '资产', '负债'];
  
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowText = row.map(String).join(' ');
    const keywordCount = headerKeywords.filter(kw => rowText.includes(kw)).length;
    
    // 如果包含至少2个关键词，认为是表头
    if (keywordCount >= 2) {
      return { headerIndex: i, headers: row.map(h => h === null || h === undefined ? '' : String(h)) };
    }
  }
  
  return { headerIndex: -1, headers: [] };
};

// 美化版原始表格组件
const RawTable: React.FC<{ data: any[][] }> = ({ data }) => {
  if (!data || data.length === 0) return <EmptyDataTip message="暂无数据" />;
  
  // 自动识别表头
  const { headerIndex, headers } = findHeaderRow(data);
  
  // 数据行（排除表头之前的行和表头行本身）
  const dataRows = headerIndex >= 0 ? data.slice(headerIndex + 1) : data;
  const maxCols = Math.max(...data.map(row => row?.length || 0), headers.length);
  const effectiveHeaders = headers.length > 0 ? headers : Array.from({ length: maxCols }, (_, i) => `列${i + 1}`);
  
  // 判断某列是否为金额列
  const isAmountCol = (colIndex: number): boolean => {
    let numericCount = 0;
    let totalCount = 0;
    const startIdx = headerIndex >= 0 ? headerIndex + 1 : 0;
    for (let i = startIdx; i < Math.min(data.length, startIdx + 20); i++) {
      const val = data[i]?.[colIndex];
      if (val !== undefined && val !== null && val !== '') {
        totalCount++;
        if (isNumeric(val)) numericCount++;
      }
    }
    return totalCount > 0 && numericCount / totalCount > 0.5;
  };
  
  // 判断是否为合计/总计行
  const isTotalRow = (row: any[]): boolean => {
    const rowText = row.map(String).join(' ').toLowerCase();
    return rowText.includes('合计') || rowText.includes('总计') || rowText.includes('利润') || rowText.includes('净额');
  };
  
  // 判断是否为分类标题行
  const isCategoryRow = (row: any[]): boolean => {
    const firstCell = String(row[0] || '').trim();
    return firstCell.match(/^[一二三四五六七八九十]、/) !== null || 
           firstCell.includes('：') || 
           firstCell.includes('经营活动') ||
           firstCell.includes('投资活动') ||
           firstCell.includes('筹资活动');
  };
  
  return (
    <div className="overflow-auto">
      <Table className="border-collapse">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-100 hover:to-slate-200">
            {effectiveHeaders.map((header, idx) => (
              <TableHead 
                key={idx} 
                className={`text-xs font-semibold whitespace-nowrap py-3 px-2 border-b-2 border-slate-300 ${
                  isAmountCol(idx) ? 'text-right' : 'text-left'
                }`}
                style={{ minWidth: isAmountCol(idx) ? '120px' : '80px' }}
              >
                {header || ''}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataRows.map((row, rowIdx) => {
            const isTotal = isTotalRow(row);
            const isCategory = isCategoryRow(row);
            
            return (
              <TableRow 
                key={rowIdx} 
                className={`transition-colors ${
                  isTotal 
                    ? 'bg-blue-50/70 font-semibold border-y border-blue-200' 
                    : isCategory 
                      ? 'bg-slate-50/80 font-medium' 
                      : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                } hover:bg-blue-50/30`}
              >
                {Array.from({ length: maxCols }).map((_, colIdx) => {
                  const value = row?.[colIdx];
                  const isAmount = isAmountCol(colIdx);
                  const displayValue = formatCellValue(value);
                  
                  return (
                    <TableCell 
                      key={colIdx} 
                      className={`text-xs py-2 px-2 whitespace-nowrap border-b border-slate-100 ${
                        isAmount ? 'text-right font-mono tabular-nums' : 'text-left'
                      } ${colIdx === 0 && isCategory ? 'font-medium text-slate-700' : ''} ${
                        isTotal && isAmount && displayValue ? 'text-blue-700 font-bold' : ''
                      }`}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

// 报表卡片组件
const ReportCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    amber: 'from-amber-50 to-amber-100 border-amber-200',
    rose: 'from-rose-50 to-rose-100 border-rose-200',
    cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
    slate: 'from-slate-50 to-slate-100 border-slate-200',
  };
  
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    cyan: 'text-cyan-600',
    slate: 'text-slate-600',
  };
  
  return (
    <Card className={`overflow-hidden border shadow-sm bg-gradient-to-br ${colorClasses[color] || colorClasses.slate}`}>
      <CardHeader className="py-3 px-4 border-b border-white/50">
        <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${iconColors[color] || iconColors.slate}`}>
          {icon}
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 bg-white/60">
        {children}
      </CardContent>
    </Card>
  );
};

const RawDataViewer: React.FC<RawDataViewerProps> = ({ financialData }) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [expandedLedgers, setExpandedLedgers] = useState<Set<number>>(new Set());
  
  // 获取原始表格数据
  const rawTables = financialData?.rawTables || {};
  const hasBalance = !!rawTables.balanceSheet?.rows?.length;
  const hasIncome = !!rawTables.incomeStatement?.rows?.length;
  const hasIncomeAppendix = !!rawTables.incomeAppendix?.rows?.length;
  const hasCashflow = !!rawTables.cashflowStatement?.rows?.length;
  const hasEquity = !!rawTables.equityStatement?.rows?.length;
  const hasSubject = !!rawTables.subjectBalance?.rows?.length;
  
  // 明细分类账
  const ledgers = financialData?.ledgers || [];
  
  // 账龄分析
  const agingAnalysis = financialData?.agingAnalysis;
  
  // 财务概要
  const summary = financialData?.financialSummary;
  
  // 切换明细分类账展开状态
  const toggleLedger = (index: number) => {
    const newSet = new Set(expandedLedgers);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedLedgers(newSet);
  };
  
  // 标签配置
  const tabs = [
    { id: 'balance', label: '资产负债表', icon: Building2, color: 'blue', hasData: hasBalance },
    { id: 'income', label: '利润表', icon: BarChart3, color: 'emerald', hasData: hasIncome },
    { id: 'incomeAppendix', label: '利润表附表', icon: TrendingUp, color: 'purple', hasData: hasIncomeAppendix },
    { id: 'cashflow', label: '现金流量表', icon: ArrowRightLeft, color: 'amber', hasData: hasCashflow },
    { id: 'equity', label: '权益变动表', icon: Users, color: 'rose', hasData: hasEquity },
    { id: 'subject', label: '科目余额表', icon: List, color: 'slate', hasData: hasSubject },
    { id: 'ledger', label: '明细账', icon: BookOpen, color: 'cyan', hasData: ledgers.length > 0, count: ledgers.length },
    { id: 'aging', label: '账龄分析', icon: Clock, color: 'purple', hasData: !!agingAnalysis },
    { id: 'summary', label: '财务概要', icon: FileText, color: 'emerald', hasData: !!summary },
    { id: 'check', label: '勾稽检查', icon: Activity, color: 'blue', hasData: true },
  ];
  
  return (
    <div className="space-y-4">
      {/* 报表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full bg-slate-100/80 p-1 rounded-xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant="secondary" className="text-[10px] ml-1 bg-slate-200">
                      {tab.count}
                    </Badge>
                  )}
                  {!tab.hasData && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>
        
        {/* 资产负债表 */}
        <TabsContent value="balance" className="mt-4">
          {hasBalance ? (
            <ReportCard 
              title={rawTables.balanceSheet?.sheetName || '资产负债表'} 
              icon={<Building2 className="w-4 h-4" />} 
              color="blue"
            >
              <RawTable data={rawTables.balanceSheet!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无资产负债表数据" icon={<Building2 className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 利润表 */}
        <TabsContent value="income" className="mt-4">
          {hasIncome ? (
            <ReportCard 
              title={rawTables.incomeStatement?.sheetName || '利润表'} 
              icon={<BarChart3 className="w-4 h-4" />} 
              color="emerald"
            >
              <RawTable data={rawTables.incomeStatement!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无利润表数据" icon={<BarChart3 className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 利润表附表 */}
        <TabsContent value="incomeAppendix" className="mt-4">
          {hasIncomeAppendix ? (
            <ReportCard 
              title={rawTables.incomeAppendix?.sheetName || '利润表附表'} 
              icon={<TrendingUp className="w-4 h-4" />} 
              color="purple"
            >
              <RawTable data={rawTables.incomeAppendix!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无利润表附表数据" icon={<TrendingUp className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 现金流量表 */}
        <TabsContent value="cashflow" className="mt-4">
          {hasCashflow ? (
            <ReportCard 
              title={rawTables.cashflowStatement?.sheetName || '现金流量表'} 
              icon={<ArrowRightLeft className="w-4 h-4" />} 
              color="amber"
            >
              <RawTable data={rawTables.cashflowStatement!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无现金流量表数据" icon={<ArrowRightLeft className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 权益变动表 */}
        <TabsContent value="equity" className="mt-4">
          {hasEquity ? (
            <ReportCard 
              title={rawTables.equityStatement?.sheetName || '权益变动表'} 
              icon={<Users className="w-4 h-4" />} 
              color="rose"
            >
              <RawTable data={rawTables.equityStatement!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无权益变动表数据" icon={<Users className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 科目余额表 */}
        <TabsContent value="subject" className="mt-4">
          {hasSubject ? (
            <ReportCard 
              title={rawTables.subjectBalance?.sheetName || '科目余额表'} 
              icon={<List className="w-4 h-4" />} 
              color="slate"
            >
              <RawTable data={rawTables.subjectBalance!.rows} />
            </ReportCard>
          ) : (
            <EmptyDataTip message="暂无科目余额表数据" icon={<List className="w-16 h-16" />} />
          )}
        </TabsContent>
        
        {/* 明细分类账 */}
        <TabsContent value="ledger" className="mt-4 space-y-3">
          {ledgers.length === 0 ? (
            <EmptyDataTip message="未检测到明细分类账数据" icon={<BookOpen className="w-16 h-16" />} />
          ) : (
            ledgers.map((ledger, idx) => (
              <Card key={idx} className="overflow-hidden border shadow-sm">
                <div 
                  className="p-3 bg-gradient-to-r from-cyan-50 to-cyan-100 cursor-pointer flex items-center justify-between hover:from-cyan-100 hover:to-cyan-200 transition-colors border-b border-cyan-200"
                  onClick={() => toggleLedger(idx)}
                >
                  <div className="flex items-center gap-3">
                    {expandedLedgers.has(idx) ? <ChevronDown className="w-4 h-4 text-cyan-700" /> : <ChevronRight className="w-4 h-4 text-cyan-700" />}
                    <span className="font-semibold text-cyan-900">{ledger.subjectCode} {ledger.subjectName}</span>
                    <Badge variant="secondary" className="text-xs bg-cyan-200 text-cyan-800">
                      {ledger.entries.length} 笔
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-cyan-800">
                    <span>借: <span className="font-mono font-semibold">{ledger.totalDebit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
                    <span>贷: <span className="font-mono font-semibold">{ledger.totalCredit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
                  </div>
                </div>
                
                {expandedLedgers.has(idx) && (
                  <CardContent className="p-0 bg-white">
                    <div className="overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs">日期</TableHead>
                            <TableHead className="text-xs">凭证</TableHead>
                            <TableHead className="text-xs">摘要</TableHead>
                            <TableHead className="text-right text-xs">借方</TableHead>
                            <TableHead className="text-right text-xs">贷方</TableHead>
                            <TableHead className="text-right text-xs">余额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledger.entries.slice(0, 50).map((entry, eidx) => (
                            <TableRow key={eidx} className={eidx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <TableCell className="text-xs py-1.5">{entry.date}</TableCell>
                              <TableCell className="text-xs py-1.5">{entry.voucherNo}</TableCell>
                              <TableCell className="text-xs py-1.5 max-w-[200px] truncate" title={entry.summary}>{entry.summary}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1.5 text-emerald-600">{entry.debit > 0 ? entry.debit.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : ''}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1.5 text-rose-600">{entry.credit > 0 ? entry.credit.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : ''}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1.5 font-medium">{entry.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))}
                          {ledger.entries.length > 50 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-xs text-slate-500 py-3 bg-slate-50">
                                ... 还有 {ledger.entries.length - 50} 条记录 ...
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* 账龄分析 */}
        <TabsContent value="aging" className="mt-4">
          {!agingAnalysis ? (
            <EmptyDataTip message="未检测到账龄分析表" icon={<Clock className="w-16 h-16" />} />
          ) : (
            <ReportCard 
              title={`${agingAnalysis.subjectCode} ${agingAnalysis.subjectName}`} 
              icon={<Clock className="w-4 h-4" />} 
              color="purple"
            >
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-50">
                      <TableHead className="text-xs">单位/项目</TableHead>
                      <TableHead className="text-right text-xs">期末余额</TableHead>
                      <TableHead className="text-right text-xs">0-30天</TableHead>
                      <TableHead className="text-right text-xs">30-90天</TableHead>
                      <TableHead className="text-right text-xs">90-360天</TableHead>
                      <TableHead className="text-right text-xs">360天+</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingAnalysis.items.map((item, idx) => (
                      <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <TableCell className="text-sm py-1.5">{item.name || item.code}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-1.5">{item.endingBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1.5">{item.days0_30.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1.5">{(item.days30_60 + item.days60_90).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1.5">{(item.days90_180 + item.days180_360).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1.5 text-rose-600 font-medium">{(item.days360_1080 + item.days1080plus).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-purple-50 font-bold">
                      <TableCell className="py-2">合计</TableCell>
                      <TableCell className="text-right font-mono py-2">{agingAnalysis.totalEnding.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{agingAnalysis.totalDays0_30.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{(agingAnalysis.totalDays30_60 + agingAnalysis.totalDays60_90).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{(agingAnalysis.totalDays90_180 + agingAnalysis.totalDays180_360).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2 text-rose-700">{(agingAnalysis.totalDays360_1080 + agingAnalysis.totalDays1080plus).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </ReportCard>
          )}
        </TabsContent>
        
        {/* 财务概要 */}
        <TabsContent value="summary" className="mt-4">
          {!summary ? (
            <EmptyDataTip message="未检测到财务概要信息表" icon={<FileText className="w-16 h-16" />} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'revenue', label: '营业收入', icon: TrendingUp, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100' },
                { key: 'netProfit', label: '净利润', icon: PieChart, color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-100', isProfit: true },
                { key: 'netProfitMargin', label: '净利率', icon: Activity, color: 'text-purple-600', bg: 'from-purple-50 to-purple-100', isPercent: true },
                { key: 'expenseRatio', label: '费用比率', icon: AlertCircle, color: 'text-amber-600', bg: 'from-amber-50 to-amber-100', isPercent: true },
                { key: 'receivables', label: '应收款', icon: ScrollText, color: 'text-cyan-600', bg: 'from-cyan-50 to-cyan-100' },
                { key: 'fundBalance', label: '资金收支净额', icon: ArrowRightLeft, color: 'text-rose-600', bg: 'from-rose-50 to-rose-100', isProfit: true },
              ].map(item => {
                const data = summary[item.key as keyof typeof summary];
                if (!data) return null;
                const Icon = item.icon;
                const value = item.isPercent 
                  ? `${data.currentPeriodAmount.toFixed(2)}%`
                  : data.currentPeriodAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
                
                return (
                  <Card key={item.key} className={`bg-gradient-to-br ${item.bg} border-0 shadow-sm`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                      </div>
                      <p className={`text-xl font-bold ${item.isProfit && data.currentPeriodAmount < 0 ? 'text-rose-600' : item.color}`}>
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        {/* 勾稽检查 */}
        <TabsContent value="check" className="mt-4">
          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 bg-slate-50">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                数据勾稽检查
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${
                Math.abs((financialData?.totalAssets || 0) - (financialData?.totalLiabilities || 0) - (financialData?.totalEquity || 0)) < 100 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-rose-50 border-rose-200'
              }`}>
                <span className="text-sm font-medium">资产 = 负债 + 权益</span>
                <Badge variant={Math.abs((financialData?.totalAssets || 0) - (financialData?.totalLiabilities || 0) - (financialData?.totalEquity || 0)) < 100 ? 'default' : 'destructive'}>
                  {Math.abs((financialData?.totalAssets || 0) - (financialData?.totalLiabilities || 0) - (financialData?.totalEquity || 0)) < 100 ? '✓ 平衡' : '✗ 不平衡'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RawDataViewer;
