// ==================== 原始报表查看组件 ====================
// 原样展示用户上传的财务报表原始数据

import React, { useState } from 'react';
import type { FinancialData } from '@/utils/excelParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  List
} from 'lucide-react';

interface RawDataViewerProps {
  financialData: FinancialData;
}

// 格式化金额
const formatCellValue = (value: any): string => {
  if (value === undefined || value === null) return '';
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
const EmptyDataTip: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-8 text-center text-gray-400">
    <FileX className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p className="text-sm">{message}</p>
  </div>
);

// 原始表格组件
const RawTable: React.FC<{ data: any[][]; headers?: string[] }> = ({ data, headers }) => {
  if (!data || data.length === 0) return <EmptyDataTip message="无数据" />;
  
  const allRows = headers ? [headers, ...data] : data;
  const maxCols = Math.max(...allRows.map(row => row?.length || 0));
  
  // 判断某列是否为金额列（数字比例高）
  const isAmountCol = (colIndex: number): boolean => {
    let numericCount = 0;
    let totalCount = 0;
    for (let i = 1; i < Math.min(allRows.length, 20); i++) {
      const val = allRows[i]?.[colIndex];
      if (val !== undefined && val !== null && val !== '') {
        totalCount++;
        if (isNumeric(val)) numericCount++;
      }
    }
    return totalCount > 0 && numericCount / totalCount > 0.5;
  };
  
  return (
    <div className="overflow-auto max-h-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            {Array.from({ length: maxCols }).map((_, idx) => (
              <TableHead 
                key={idx} 
                className={`text-xs font-bold whitespace-nowrap ${isAmountCol(idx) ? 'text-right' : 'text-left'}`}
              >
                {headers?.[idx] || `列${idx + 1}`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {Array.from({ length: maxCols }).map((_, colIdx) => {
                const value = row?.[colIdx];
                const isAmount = isAmountCol(colIdx);
                const isBold = typeof value === 'string' && (
                  value.includes('合计') || 
                  value.includes('总计') || 
                  value.includes('利润') ||
                  value.includes('净利润')
                );
                
                return (
                  <TableCell 
                    key={colIdx} 
                    className={`text-xs py-1 whitespace-nowrap ${
                      isAmount ? 'text-right font-mono' : 'text-left'
                    } ${isBold ? 'font-bold bg-gray-100' : ''}`}
                  >
                    {formatCellValue(value)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const RawDataViewer: React.FC<RawDataViewerProps> = ({ financialData }) => {
  const [activeTab, setActiveTab] = useState('subject');
  const [expandedLedgers, setExpandedLedgers] = useState<Set<number>>(new Set());
  
  // 获取原始表格数据
  const rawTables = financialData?.rawTables || {};
  const subjectBalanceRaw = rawTables.subjectBalance;
  const balanceSheetRaw = rawTables.balanceSheet;
  const incomeStatementRaw = rawTables.incomeStatement;
  const cashflowStatementRaw = rawTables.cashflowStatement;
  
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
  
  return (
    <div className="space-y-4">
      {/* 报表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="subject" className="flex items-center gap-1 text-xs">
            <List className="w-3 h-3" />
            科目余额表
            {subjectBalanceRaw?.rows && subjectBalanceRaw.rows.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{subjectBalanceRaw.rows.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-1 text-xs">
            <Building2 className="w-3 h-3" />
            资产负债表
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-1 text-xs">
            <BarChart3 className="w-3 h-3" />
            利润表
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-1 text-xs">
            <ArrowRightLeft className="w-3 h-3" />
            现金流量表
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-1 text-xs">
            <BookOpen className="w-3 h-3" />
            明细账
            {ledgers.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{ledgers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3" />
            账龄分析
            {agingAnalysis && <Badge variant="secondary" className="text-[10px] ml-1">1</Badge>}
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1 text-xs">
            <FileText className="w-3 h-3" />
            财务概要
            {summary && <Badge variant="secondary" className="text-[10px] ml-1">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="check" className="flex items-center gap-1 text-xs">
            <Activity className="w-3 h-3" />
            勾稽检查
          </TabsTrigger>
        </TabsList>
        
        {/* 科目余额表 */}
        <TabsContent value="subject" className="space-y-4">
          {!subjectBalanceRaw ? (
            <EmptyDataTip message="暂无科目余额表数据" />
          ) : (
            <Card>
              <CardHeader className="bg-purple-50 py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <List className="w-4 h-4 text-purple-600" />
                  {subjectBalanceRaw.sheetName || '科目余额表'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RawTable data={subjectBalanceRaw.rows} headers={subjectBalanceRaw.headers} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 资产负债表 */}
        <TabsContent value="balance" className="space-y-4">
          {!balanceSheetRaw ? (
            <EmptyDataTip message="暂无资产负债表数据" />
          ) : (
            <Card>
              <CardHeader className="bg-blue-50 py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {balanceSheetRaw.sheetName || '资产负债表'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RawTable data={balanceSheetRaw.rows} headers={balanceSheetRaw.headers} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 利润表 */}
        <TabsContent value="income" className="space-y-4">
          {!incomeStatementRaw ? (
            <EmptyDataTip message="暂无利润表数据" />
          ) : (
            <Card>
              <CardHeader className="bg-emerald-50 py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  {incomeStatementRaw.sheetName || '利润表'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RawTable data={incomeStatementRaw.rows} headers={incomeStatementRaw.headers} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 现金流量表 */}
        <TabsContent value="cashflow" className="space-y-4">
          {!cashflowStatementRaw ? (
            <EmptyDataTip message="暂无现金流量表数据" />
          ) : (
            <Card>
              <CardHeader className="bg-cyan-50 py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-cyan-600" />
                  {cashflowStatementRaw.sheetName || '现金流量表'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RawTable data={cashflowStatementRaw.rows} headers={cashflowStatementRaw.headers} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 明细分类账 */}
        <TabsContent value="ledger" className="space-y-3">
          {ledgers.length === 0 ? (
            <EmptyDataTip message="未检测到明细分类账数据" />
          ) : (
            ledgers.map((ledger, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div 
                  className="p-3 bg-gray-50 cursor-pointer flex items-center justify-between hover:bg-gray-100"
                  onClick={() => toggleLedger(idx)}
                >
                  <div className="flex items-center gap-3">
                    {expandedLedgers.has(idx) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium">{ledger.subjectCode} {ledger.subjectName}</span>
                    <Badge variant="secondary" className="text-xs">{ledger.entries.length} 笔</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>借: {ledger.totalDebit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                    <span>贷: {ledger.totalCredit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                {expandedLedgers.has(idx) && (
                  <CardContent className="p-0 max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
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
                          <TableRow key={eidx}>
                            <TableCell className="text-xs py-1">{entry.date}</TableCell>
                            <TableCell className="text-xs py-1">{entry.voucherNo}</TableCell>
                            <TableCell className="text-xs py-1 max-w-[200px] truncate" title={entry.summary}>{entry.summary}</TableCell>
                            <TableCell className="text-right font-mono text-xs py-1">{entry.debit > 0 ? entry.debit.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : ''}</TableCell>
                            <TableCell className="text-right font-mono text-xs py-1">{entry.credit > 0 ? entry.credit.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : ''}</TableCell>
                            <TableCell className="text-right font-mono text-xs py-1">{entry.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        {ledger.entries.length > 50 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-xs text-gray-500 py-2">
                              ... 还有 {ledger.entries.length - 50} 条记录 ...
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* 账龄分析 */}
        <TabsContent value="aging" className="space-y-4">
          {!agingAnalysis ? (
            <EmptyDataTip message="未检测到账龄分析表" />
          ) : (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  {agingAnalysis.subjectCode} {agingAnalysis.subjectName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
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
                      <TableRow key={idx}>
                        <TableCell className="text-sm py-1">{item.name || item.code}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-1">{item.endingBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1">{item.days0_30.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1">{(item.days30_60 + item.days60_90).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1">{(item.days90_180 + item.days180_360).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-1 text-rose-600">{(item.days360_1080 + item.days1080plus).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell className="py-2">合计</TableCell>
                      <TableCell className="text-right font-mono py-2">{agingAnalysis.totalEnding.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{agingAnalysis.totalDays0_30.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{(agingAnalysis.totalDays30_60 + agingAnalysis.totalDays60_90).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">{(agingAnalysis.totalDays90_180 + agingAnalysis.totalDays180_360).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2 text-rose-600">{(agingAnalysis.totalDays360_1080 + agingAnalysis.totalDays1080plus).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 财务概要 */}
        <TabsContent value="summary" className="space-y-4">
          {!summary ? (
            <EmptyDataTip message="未检测到财务概要信息表" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summary.revenue && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">营业收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-blue-600">{summary.revenue.currentPeriodAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.netProfit && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">净利润</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-bold ${summary.netProfit.currentPeriodAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {summary.netProfit.currentPeriodAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {summary.netProfitMargin && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">净利率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-purple-600">{summary.netProfitMargin.currentPeriodAmount.toFixed(2)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.expenseRatio && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">费用比率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-amber-600">{summary.expenseRatio.currentPeriodAmount.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.receivables && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">应收款</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-cyan-600">{summary.receivables.currentPeriodAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.fundBalance && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">资金收支净额</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-lg font-bold ${summary.fundBalance.currentPeriodAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {summary.fundBalance.currentPeriodAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* 勾稽检查 */}
        <TabsContent value="check" className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">数据勾稽检查</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded border text-sm">
                <span>资产 = 负债 + 权益</span>
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
