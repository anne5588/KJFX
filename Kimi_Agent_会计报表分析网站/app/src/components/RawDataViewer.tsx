// ==================== 原始报表查看组件 ====================
// 简单展示用户上传的财务报表原始数据

import React, { useState } from 'react';
import type { FinancialData } from '@/utils/excelParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Wallet,
  Building2,
  PieChart,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
  BookOpen,
  ArrowRightLeft,
  ScrollText,
  ChevronDown,
  ChevronRight,
  FileText,
  FileX
} from 'lucide-react';

interface RawDataViewerProps {
  financialData: FinancialData;
}

// 格式化金额 - 统一显示为元，带千分位
const formatAmount = (value: number): string => {
  if (value === 0 || value === undefined || value === null) return '-';
  // 统一显示为元，保留2位小数
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 安全获取 Map 数据
const safeGetMapEntries = (map: any): [string, number][] => {
  if (!map) return [];
  if (map instanceof Map) return Array.from(map.entries());
  if (Array.isArray(map)) return map as [string, number][];
  if (typeof map === 'object') return Object.entries(map).map(([k, v]) => [k, Number(v) || 0]);
  return [];
};

// 空数据提示组件
const EmptyDataTip: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-8 text-center text-gray-400">
    <FileX className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p className="text-sm">{message}</p>
  </div>
);

const RawDataViewer: React.FC<RawDataViewerProps> = ({ financialData }) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [expandedLedgers, setExpandedLedgers] = useState<Set<number>>(new Set());
  
  // 安全获取数据
  const assets = safeGetMapEntries(financialData?.assets);
  const liabilities = safeGetMapEntries(financialData?.liabilities);
  const equity = safeGetMapEntries(financialData?.equity);
  const income = safeGetMapEntries(financialData?.income);
  const expenses = safeGetMapEntries(financialData?.expenses);
  
  // 去重函数
  const deduplicate = (entries: [string, number][]): [string, number][] => {
    const seen = new Set<string>();
    return entries.filter(([name]) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  };
  
  // 准备数据 - 去重并过滤
  const balanceSheetData = {
    assets: deduplicate(assets.filter(([_, v]) => v !== 0)),
    liabilities: deduplicate(liabilities.filter(([_, v]) => v !== 0)),
    equity: deduplicate(equity.filter(([_, v]) => v !== 0)),
  };
  
  const incomeStatementData = {
    income: deduplicate(income.filter(([_, v]) => v !== 0)),
    expenses: deduplicate(expenses.filter(([_, v]) => v !== 0)),
  };
  
  // 计算各类合计
  const totalAssetsCalculated = balanceSheetData.assets.reduce((sum, [_, v]) => sum + v, 0);
  const totalLiabilitiesCalculated = balanceSheetData.liabilities.reduce((sum, [_, v]) => sum + v, 0);
  const totalEquityCalculated = balanceSheetData.equity.reduce((sum, [_, v]) => sum + v, 0);
  const totalIncomeCalculated = incomeStatementData.income.reduce((sum, [_, v]) => sum + v, 0);
  const totalExpensesCalculated = incomeStatementData.expenses.reduce((sum, [_, v]) => sum + v, 0);
  const netProfitCalculated = totalIncomeCalculated - totalExpensesCalculated;
  
  // 现金流量数据
  const cashflowData = {
    operating: financialData?.operatingCashflow || 0,
    investing: financialData?.investingCashflow || 0,
    financing: financialData?.financingCashflow || 0,
  };
  
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
  
  // 判断是否有数据
  const hasBalanceData = balanceSheetData.assets.length > 0 || balanceSheetData.liabilities.length > 0 || balanceSheetData.equity.length > 0;
  const hasIncomeData = incomeStatementData.income.length > 0 || incomeStatementData.expenses.length > 0;
  const hasCashflowData = cashflowData.operating !== 0 || cashflowData.investing !== 0 || cashflowData.financing !== 0;
  
  return (
    <div className="space-y-4">
      {/* 报表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
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
        
        {/* 资产负债表 */}
        <TabsContent value="balance" className="space-y-4">
          {!hasBalanceData ? (
            <EmptyDataTip message="暂无资产负债表数据，请检查上传的Excel文件是否包含资产负债表" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 资产 */}
              <Card>
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    资产
                    <span className="text-xs text-gray-500 font-normal">({balanceSheetData.assets.length}项)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-auto">
                  {balanceSheetData.assets.length === 0 ? (
                    <EmptyDataTip message="无资产数据" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">项目</TableHead>
                          <TableHead className="text-right text-xs">期末余额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceSheetData.assets.map(([name, value], idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm py-1">{name}</TableCell>
                            <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell className="py-2">资产总计</TableCell>
                          <TableCell className="text-right font-mono py-2">{formatAmount(totalAssetsCalculated)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              {/* 负债和权益 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="bg-rose-50 py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-rose-600" />
                      负债
                      <span className="text-xs text-gray-500 font-normal">({balanceSheetData.liabilities.length}项)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[250px] overflow-auto">
                    {balanceSheetData.liabilities.length === 0 ? (
                      <EmptyDataTip message="无负债数据" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">项目</TableHead>
                            <TableHead className="text-right text-xs">期末余额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceSheetData.liabilities.map(([name, value], idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-1">{name}</TableCell>
                              <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-rose-50 font-bold">
                            <TableCell className="py-2">负债合计</TableCell>
                            <TableCell className="text-right font-mono py-2">{formatAmount(totalLiabilitiesCalculated)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="bg-emerald-50 py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      所有者权益
                      <span className="text-xs text-gray-500 font-normal">({balanceSheetData.equity.length}项)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[200px] overflow-auto">
                    {balanceSheetData.equity.length === 0 ? (
                      <EmptyDataTip message="无权益数据" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">项目</TableHead>
                            <TableHead className="text-right text-xs">期末余额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceSheetData.equity.map(([name, value], idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm py-1">{name}</TableCell>
                              <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-emerald-50 font-bold">
                            <TableCell className="py-2">所有者权益合计</TableCell>
                            <TableCell className="text-right font-mono py-2">{formatAmount(totalEquityCalculated)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* 利润表 */}
        <TabsContent value="income" className="space-y-4">
          {!hasIncomeData ? (
            <EmptyDataTip message="暂无利润表数据，请检查上传的Excel文件是否包含利润表" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 收入 */}
              <Card>
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    收入
                    <span className="text-xs text-gray-500 font-normal">({incomeStatementData.income.length}项)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-auto">
                  {incomeStatementData.income.length === 0 ? (
                    <EmptyDataTip message="无收入数据" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">项目</TableHead>
                          <TableHead className="text-right text-xs">本期金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeStatementData.income.map(([name, value], idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm py-1">{name}</TableCell>
                            <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell className="py-2">收入合计</TableCell>
                          <TableCell className="text-right font-mono py-2">{formatAmount(totalIncomeCalculated)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              {/* 成本和费用 */}
              <Card>
                <CardHeader className="bg-rose-50 py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-rose-600" />
                    成本费用
                    <span className="text-xs text-gray-500 font-normal">({incomeStatementData.expenses.length}项)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-auto">
                  {incomeStatementData.expenses.length === 0 ? (
                    <EmptyDataTip message="无成本费用数据" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">项目</TableHead>
                          <TableHead className="text-right text-xs">本期金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeStatementData.expenses.map(([name, value], idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm py-1">{name}</TableCell>
                            <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-rose-50 font-bold">
                          <TableCell className="py-2">成本费用合计</TableCell>
                          <TableCell className="text-right font-mono py-2">{formatAmount(totalExpensesCalculated)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 利润计算 */}
          {hasIncomeData && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  利润计算
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="text-gray-600">收入合计</span>
                    <span className="font-mono font-medium text-blue-600">{formatAmount(totalIncomeCalculated)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="text-gray-600">减：成本费用合计</span>
                    <span className="font-mono font-medium text-rose-600">{formatAmount(totalExpensesCalculated)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-amber-100 px-3 rounded">
                    <span className="font-bold">净利润</span>
                    <span className={`font-mono font-bold text-lg ${netProfitCalculated >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatAmount(netProfitCalculated)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 现金流量表 */}
        <TabsContent value="cashflow" className="space-y-4">
          {!hasCashflowData ? (
            <EmptyDataTip message="暂无现金流量表数据，请检查上传的Excel文件是否包含现金流量表" />
          ) : (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  现金流量
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">项目</TableHead>
                      <TableHead className="text-right text-xs">本期金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm py-2">经营活动产生的现金流量净额</TableCell>
                      <TableCell className={`text-right font-mono text-sm py-2 ${cashflowData.operating >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatAmount(cashflowData.operating)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm py-2">投资活动产生的现金流量净额</TableCell>
                      <TableCell className={`text-right font-mono text-sm py-2 ${cashflowData.investing >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatAmount(cashflowData.investing)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm py-2">筹资活动产生的现金流量净额</TableCell>
                      <TableCell className={`text-right font-mono text-sm py-2 ${cashflowData.financing >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatAmount(cashflowData.financing)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 明细分类账 */}
        <TabsContent value="ledger" className="space-y-3">
          {ledgers.length === 0 ? (
            <EmptyDataTip message="未检测到明细分类账数据，请检查上传的Excel文件是否包含明细分类账表" />
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
                    <span>借: {formatAmount(ledger.totalDebit)}</span>
                    <span>贷: {formatAmount(ledger.totalCredit)}</span>
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
                            <TableCell className="text-right font-mono text-xs py-1">{entry.debit > 0 ? formatAmount(entry.debit) : ''}</TableCell>
                            <TableCell className="text-right font-mono text-xs py-1">{entry.credit > 0 ? formatAmount(entry.credit) : ''}</TableCell>
                            <TableCell className="text-right font-mono text-xs py-1">{formatAmount(entry.balance)}</TableCell>
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
            <EmptyDataTip message="未检测到账龄分析表，请检查上传的Excel文件是否包含账龄分析表" />
          ) : (
            <>
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
                          <TableCell className="text-right font-mono text-sm py-1">{formatAmount(item.endingBalance)}</TableCell>
                          <TableCell className="text-right font-mono text-xs py-1">{formatAmount(item.days0_30)}</TableCell>
                          <TableCell className="text-right font-mono text-xs py-1">{formatAmount(item.days30_60 + item.days60_90)}</TableCell>
                          <TableCell className="text-right font-mono text-xs py-1">{formatAmount(item.days90_180 + item.days180_360)}</TableCell>
                          <TableCell className="text-right font-mono text-xs py-1 text-rose-600">{formatAmount(item.days360_1080 + item.days1080plus)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold">
                        <TableCell className="py-2">合计</TableCell>
                        <TableCell className="text-right font-mono py-2">{formatAmount(agingAnalysis.totalEnding)}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-2">{formatAmount(agingAnalysis.totalDays0_30)}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-2">{formatAmount(agingAnalysis.totalDays30_60 + agingAnalysis.totalDays60_90)}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-2">{formatAmount(agingAnalysis.totalDays90_180 + agingAnalysis.totalDays180_360)}</TableCell>
                        <TableCell className="text-right font-mono text-xs py-2 text-rose-600">{formatAmount(agingAnalysis.totalDays360_1080 + agingAnalysis.totalDays1080plus)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {agingAnalysis.analysis.suggestions.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-800">{agingAnalysis.analysis.riskAssessment}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        {/* 财务概要 */}
        <TabsContent value="summary" className="space-y-4">
          {!summary ? (
            <EmptyDataTip message="未检测到财务概要信息表，请检查上传的Excel文件是否包含财务概要信息表" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summary.revenue && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-gray-500">营业收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold text-blue-600">{formatAmount(summary.revenue.currentPeriodAmount)}</p>
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
                      {formatAmount(summary.netProfit.currentPeriodAmount)}
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
                    <p className="text-lg font-bold text-cyan-600">{formatAmount(summary.receivables.currentPeriodAmount)}</p>
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
                      {formatAmount(summary.fundBalance.currentPeriodAmount)}
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
