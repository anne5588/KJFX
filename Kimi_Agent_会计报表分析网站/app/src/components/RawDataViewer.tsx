// ==================== 原始报表查看组件 ====================
// 展示用户上传的所有财务报表数据

import React, { useState } from 'react';
import type { FinancialData } from '@/utils/excelParser';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Building2,
  PieChart,
  BarChart3,
  Activity,
  Clock,
  AlertTriangle,
  BookOpen,
  Layers,
  CreditCard,
  ArrowRightLeft,
  ScrollText,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';

interface RawDataViewerProps {
  financialData: FinancialData;
}

// 格式化金额
const formatAmount = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(2) + '万';
  }
  return value.toLocaleString();
};



// 计算占比进度条
const ProgressBar: React.FC<{ value: number; total: number; color: string }> = ({ value, total, color }) => {
  const percent = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  };
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClasses[color] || colorClasses.blue}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12">{percent.toFixed(1)}%</span>
    </div>
  );
};

const RawDataViewer: React.FC<RawDataViewerProps> = ({ financialData }) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [expandedLedgers, setExpandedLedgers] = useState<Set<number>>(new Set());
  
  // 准备数据
  const balanceSheetData = {
    assets: Array.from(financialData.assets.entries()).filter(([_, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
    liabilities: Array.from(financialData.liabilities.entries()).filter(([_, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
    equity: Array.from(financialData.equity.entries()).filter(([_, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
  };
  
  const incomeStatementData = {
    income: Array.from(financialData.income.entries()).filter(([_, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
    expenses: Array.from(financialData.expenses.entries()).filter(([_, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
  };
  
  // 现金流量数据
  const cashflowData = {
    operating: financialData.operatingCashflow,
    investing: financialData.investingCashflow,
    financing: financialData.financingCashflow,
    netCashflow: financialData.operatingCashflow + financialData.investingCashflow + financialData.financingCashflow,
  };
  
  // 明细分类账
  const ledgers = financialData.ledgers || [];
  
  // 账龄分析
  const agingAnalysis = financialData.agingAnalysis;
  
  // 财务概要
  const summary = financialData.financialSummary;
  
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
  
  // 主要指标
  const totalAssets = financialData.totalAssets;
  const totalLiabilities = financialData.totalLiabilities;
  const totalEquity = financialData.totalEquity;
  const totalIncome = financialData.totalIncome;
  const totalExpenses = financialData.totalExpenses;
  const netProfit = financialData.netProfit;
  
  return (
    <div className="space-y-6">
      {/* 核心数据概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">资产总计</p>
                <p className="text-xl font-bold">{formatAmount(totalAssets)}</p>
              </div>
              <Building2 className="w-6 h-6 text-blue-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-xs">负债总计</p>
                <p className="text-xl font-bold">{formatAmount(totalLiabilities)}</p>
              </div>
              <Wallet className="w-6 h-6 text-rose-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs">权益总计</p>
                <p className="text-xl font-bold">{formatAmount(totalEquity)}</p>
              </div>
              <PieChart className="w-6 h-6 text-emerald-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs">净利润</p>
                <p className="text-xl font-bold">{formatAmount(netProfit)}</p>
              </div>
              <Calculator className="w-6 h-6 text-amber-100" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 报表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 资产 */}
            <Card>
              <CardHeader className="bg-blue-50 py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    资产类科目
                  </span>
                  <Badge variant="secondary">{balanceSheetData.assets.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">科目名称</TableHead>
                      <TableHead className="text-right text-xs">期末余额</TableHead>
                      <TableHead className="text-right text-xs">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceSheetData.assets.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium text-sm py-1">{name}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                        <TableCell className="text-right py-1">
                          <ProgressBar value={value} total={totalAssets} color="blue" />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell className="py-2">资产总计</TableCell>
                      <TableCell className="text-right font-mono py-2">{formatAmount(totalAssets)}</TableCell>
                      <TableCell className="text-right py-2">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* 负债和权益 */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="bg-rose-50 py-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-rose-600" />
                      负债类科目
                    </span>
                    <Badge variant="secondary">{balanceSheetData.liabilities.length} 项</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[200px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">科目名称</TableHead>
                        <TableHead className="text-right text-xs">期末余额</TableHead>
                        <TableHead className="text-right text-xs">占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheetData.liabilities.map(([name, value], idx) => (
                        <TableRow key={idx} className="hover:bg-rose-50/50">
                          <TableCell className="font-medium text-sm py-1">{name}</TableCell>
                          <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                          <TableCell className="text-right py-1">
                            <ProgressBar value={value} total={totalLiabilities} color="rose" />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-rose-50 font-bold">
                        <TableCell className="py-2">负债合计</TableCell>
                        <TableCell className="text-right font-mono py-2">{formatAmount(totalLiabilities)}</TableCell>
                        <TableCell className="text-right py-2">100.0%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-emerald-50 py-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-600" />
                      权益类科目
                    </span>
                    <Badge variant="secondary">{balanceSheetData.equity.length} 项</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[150px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">科目名称</TableHead>
                        <TableHead className="text-right text-xs">期末余额</TableHead>
                        <TableHead className="text-right text-xs">占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheetData.equity.map(([name, value], idx) => (
                        <TableRow key={idx} className="hover:bg-emerald-50/50">
                          <TableCell className="font-medium text-sm py-1">{name}</TableCell>
                          <TableCell className="text-right font-mono text-sm py-1">{formatAmount(value)}</TableCell>
                          <TableCell className="text-right py-1">
                            <ProgressBar value={value} total={totalEquity} color="emerald" />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-emerald-50 font-bold">
                        <TableCell className="py-2">权益合计</TableCell>
                        <TableCell className="text-right font-mono py-2">{formatAmount(totalEquity)}</TableCell>
                        <TableCell className="text-right py-2">100.0%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* 利润表 */}
        <TabsContent value="income" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 收入 */}
            <Card>
              <CardHeader className="bg-blue-50 py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    收入类科目
                  </span>
                  <Badge variant="secondary">{incomeStatementData.income.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">科目名称</TableHead>
                      <TableHead className="text-right text-xs">本期发生额</TableHead>
                      <TableHead className="text-right text-xs">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.income.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium text-sm py-1">{name}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-1 text-blue-600">{formatAmount(value)}</TableCell>
                        <TableCell className="text-right py-1">
                          <ProgressBar value={value} total={totalIncome} color="blue" />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell className="py-2">收入合计</TableCell>
                      <TableCell className="text-right font-mono py-2 text-blue-700">{formatAmount(totalIncome)}</TableCell>
                      <TableCell className="text-right py-2">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* 成本和费用 */}
            <Card>
              <CardHeader className="bg-rose-50 py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    成本费用类科目
                  </span>
                  <Badge variant="secondary">{incomeStatementData.expenses.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">科目名称</TableHead>
                      <TableHead className="text-right text-xs">本期发生额</TableHead>
                      <TableHead className="text-right text-xs">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.expenses.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-rose-50/50">
                        <TableCell className="font-medium text-sm py-1">{name}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-1 text-rose-600">{formatAmount(value)}</TableCell>
                        <TableCell className="text-right py-1">
                          <ProgressBar value={value} total={totalExpenses} color="rose" />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-rose-50 font-bold">
                      <TableCell className="py-2">成本费用合计</TableCell>
                      <TableCell className="text-right font-mono py-2 text-rose-700">{formatAmount(totalExpenses)}</TableCell>
                      <TableCell className="text-right py-2">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* 利润计算 */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                利润计算过程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-gray-600">营业收入</span>
                  <span className="font-mono font-medium text-blue-600">{formatAmount(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-gray-600">减：营业成本费用</span>
                  <span className="font-mono font-medium text-rose-600">{formatAmount(totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-amber-100 px-2 rounded">
                  <span className="font-bold">净利润</span>
                  <span className={`font-mono font-bold text-lg ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatAmount(netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 现金流量表 */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                  <Activity className="w-4 h-4" />
                  经营活动现金流
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${cashflowData.operating >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatAmount(cashflowData.operating)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {cashflowData.operating >= 0 ? '净流入' : '净流出'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Layers className="w-4 h-4" />
                  投资活动现金流
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${cashflowData.investing >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatAmount(cashflowData.investing)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {cashflowData.investing >= 0 ? '净流入' : '净流出'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <CreditCard className="w-4 h-4" />
                  筹资活动现金流
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${cashflowData.financing >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatAmount(cashflowData.financing)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {cashflowData.financing >= 0 ? '净流入' : '净流出'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">现金流量净额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">本期现金及现金等价物净增加额</span>
                <span className={`text-2xl font-bold ${cashflowData.netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatAmount(cashflowData.netCashflow)}
                </span>
              </div>
              <div className="mt-4 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (cashflowData.operating / Math.abs(cashflowData.netCashflow || 1)) * 100 * Math.sign(cashflowData.operating)))}%` }}
                />
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (cashflowData.investing / Math.abs(cashflowData.netCashflow || 1)) * 100 * Math.sign(cashflowData.investing)))}%` }}
                />
                <div 
                  className="h-full bg-purple-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (cashflowData.financing / Math.abs(cashflowData.netCashflow || 1)) * 100 * Math.sign(cashflowData.financing)))}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />经营</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" />投资</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" />筹资</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 明细分类账 */}
        <TabsContent value="ledger" className="space-y-4">
          {ledgers.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">未检测到明细分类账数据</p>
              <p className="text-xs text-gray-400 mt-1">请确保上传的Excel文件包含明细分类账表</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {ledgers.map((ledger, idx) => (
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
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">期初: {formatAmount(ledger.beginningBalance)}</span>
                      <span className="text-emerald-600">借: {formatAmount(ledger.totalDebit)}</span>
                      <span className="text-rose-600">贷: {formatAmount(ledger.totalCredit)}</span>
                    </div>
                  </div>
                  
                  {expandedLedgers.has(idx) && (
                    <CardContent className="p-0 max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">日期</TableHead>
                            <TableHead className="text-xs">凭证号</TableHead>
                            <TableHead className="text-xs">摘要</TableHead>
                            <TableHead className="text-right text-xs">借方</TableHead>
                            <TableHead className="text-right text-xs">贷方</TableHead>
                            <TableHead className="text-right text-xs">余额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledger.entries.slice(0, 50).map((entry, eidx) => (
                            <TableRow key={eidx} className="hover:bg-gray-50">
                              <TableCell className="text-xs py-1">{entry.date}</TableCell>
                              <TableCell className="text-xs py-1">{entry.voucherNo}</TableCell>
                              <TableCell className="text-xs py-1 max-w-[200px] truncate" title={entry.summary}>{entry.summary}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1 text-emerald-600">{entry.debit > 0 ? formatAmount(entry.debit) : ''}</TableCell>
                              <TableCell className="text-right font-mono text-xs py-1 text-rose-600">{entry.credit > 0 ? formatAmount(entry.credit) : ''}</TableCell>
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
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* 账龄分析 */}
        <TabsContent value="aging" className="space-y-4">
          {!agingAnalysis ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">未检测到账龄分析表</p>
              <p className="text-xs text-gray-400 mt-1">请确保上传的Excel文件包含账龄分析表</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-3">
                    <p className="text-xs text-emerald-600">0-30天</p>
                    <p className="text-lg font-bold text-emerald-700">{formatAmount(agingAnalysis.totalDays0_30)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <p className="text-xs text-blue-600">30-90天</p>
                    <p className="text-lg font-bold text-blue-700">{formatAmount(agingAnalysis.totalDays30_60 + agingAnalysis.totalDays60_90)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-3">
                    <p className="text-xs text-amber-600">90-360天</p>
                    <p className="text-lg font-bold text-amber-700">{formatAmount(agingAnalysis.totalDays90_180 + agingAnalysis.totalDays180_360)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-200">
                  <CardContent className="p-3">
                    <p className="text-xs text-rose-600">360天以上</p>
                    <p className="text-lg font-bold text-rose-700">{formatAmount(agingAnalysis.totalDays360_1080 + agingAnalysis.totalDays1080plus)}</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    {agingAnalysis.subjectCode} {agingAnalysis.subjectName} 账龄明细
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-auto">
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
                      {agingAnalysis.items.slice(0, 30).map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
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
                    <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-800 mb-2">{agingAnalysis.analysis.riskAssessment}</p>
                    <ul className="space-y-1">
                      {agingAnalysis.analysis.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        {/* 财务概要 */}
        <TabsContent value="summary" className="space-y-4">
          {!summary ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">未检测到财务概要信息表</p>
              <p className="text-xs text-gray-400 mt-1">请确保上传的Excel文件包含财务概要信息表</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.revenue && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">营业收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{formatAmount(summary.revenue.currentPeriodAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      本年累计: {formatAmount(summary.revenue.yearToDateAmount)}
                      {summary.revenue.currentPeriodChange !== 0 && (
                        <span className={summary.revenue.currentPeriodChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {' '}({summary.revenue.currentPeriodChange > 0 ? '+' : ''}{summary.revenue.currentPeriodChange.toFixed(1)}%)
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {summary.netProfit && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">净利润</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${summary.netProfit.currentPeriodAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatAmount(summary.netProfit.currentPeriodAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      本年累计: {formatAmount(summary.netProfit.yearToDateAmount)}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {summary.netProfitMargin && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">净利率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">{summary.netProfitMargin.currentPeriodAmount.toFixed(2)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.expenseRatio && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">费用比率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">{summary.expenseRatio.currentPeriodAmount.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {summary.receivables && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">应收款</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-cyan-600">{formatAmount(summary.receivables.currentPeriodAmount)}</p>
                    {summary.receivables.currentPeriodChange > 50 && (
                      <p className="text-xs text-rose-600 mt-1">⚠️ 同比大幅增长 {summary.receivables.currentPeriodChange.toFixed(1)}%</p>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {summary.fundBalance && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">资金收支净额</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${summary.fundBalance.currentPeriodAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                数据勾稽检查
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                <span className="text-sm">资产 = 负债 + 权益</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {formatAmount(totalAssets)} = {formatAmount(totalLiabilities)} + {formatAmount(totalEquity)}
                  </span>
                  <Badge variant={Math.abs(totalAssets - totalLiabilities - totalEquity) < 100 ? 'default' : 'destructive'}>
                    {Math.abs(totalAssets - totalLiabilities - totalEquity) < 100 ? '✓ 平衡' : '✗ 不平衡'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                <span className="text-sm">净利润 = 收入 - 成本费用</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {formatAmount(netProfit)} = {formatAmount(totalIncome)} - {formatAmount(totalExpenses)}
                  </span>
                  <Badge variant={Math.abs(netProfit - (totalIncome - totalExpenses)) < 100 ? 'default' : 'destructive'}>
                    {Math.abs(netProfit - (totalIncome - totalExpenses)) < 100 ? '✓ 平衡' : '✗ 不平衡'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RawDataViewer;
