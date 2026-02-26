// ==================== 原始报表查看组件 ====================
// 展示用户上传的原始财务报表数据

import React, { useState } from 'react';
import type { FinancialData } from '@/utils/excelParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Building2,
  PieChart,
  BarChart3
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

// 趋势指示器（预留，可用于多期对比）
// const TrendIndicator: React.FC<{ current: number; previous?: number }> = ({ current, previous }) => {
//   if (previous === undefined) return null;
//   const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
//   const isPositive = change > 0;
//   
//   return (
//     <span className={`inline-flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
//       {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
//       {Math.abs(change).toFixed(1)}%
//     </span>
//   );
// };

const RawDataViewer: React.FC<RawDataViewerProps> = ({ financialData }) => {
  const [activeTab, setActiveTab] = useState('balance');
  
  // 准备资产负债表数据
  const balanceSheetData = {
    assets: Array.from(financialData.assets.entries())
      .filter(([_, value]) => value !== 0)
      .sort((a, b) => b[1] - a[1]),
    liabilities: Array.from(financialData.liabilities.entries())
      .filter(([_, value]) => value !== 0)
      .sort((a, b) => b[1] - a[1]),
    equity: Array.from(financialData.equity.entries())
      .filter(([_, value]) => value !== 0)
      .sort((a, b) => b[1] - a[1]),
  };
  
  // 准备利润表数据
  const incomeStatementData = {
    income: Array.from(financialData.income.entries())
      .filter(([_, value]) => value !== 0)
      .sort((a, b) => b[1] - a[1]),
    expenses: Array.from(financialData.expenses.entries())
      .filter(([_, value]) => value !== 0)
      .sort((a, b) => b[1] - a[1]),
  };
  
  // 计算主要指标
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
      
      {/* 详细报表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            资产负债表
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            利润表
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            财务概要
          </TabsTrigger>
        </TabsList>
        
        {/* 资产负债表 */}
        <TabsContent value="balance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 资产 */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    资产类科目
                  </span>
                  <Badge variant="secondary">{balanceSheetData.assets.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>科目名称</TableHead>
                      <TableHead className="text-right">期末余额</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceSheetData.assets.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min((value / totalAssets) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12">
                              {((value / totalAssets) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell>资产总计</TableCell>
                      <TableCell className="text-right font-mono">{formatAmount(totalAssets)}</TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* 负债和权益 */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="bg-rose-50">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-rose-600" />
                      负债类科目
                    </span>
                    <Badge variant="secondary">{balanceSheetData.liabilities.length} 项</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>科目名称</TableHead>
                        <TableHead className="text-right">期末余额</TableHead>
                        <TableHead className="text-right">占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheetData.liabilities.map(([name, value], idx) => (
                        <TableRow key={idx} className="hover:bg-rose-50/50">
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatAmount(value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${Math.min((value / totalLiabilities) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-12">
                                {((value / totalLiabilities) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-rose-50 font-bold">
                        <TableCell>负债总计</TableCell>
                        <TableCell className="text-right font-mono">{formatAmount(totalLiabilities)}</TableCell>
                        <TableCell className="text-right">100.0%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-emerald-50">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-emerald-600" />
                      权益类科目
                    </span>
                    <Badge variant="secondary">{balanceSheetData.equity.length} 项</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>科目名称</TableHead>
                        <TableHead className="text-right">期末余额</TableHead>
                        <TableHead className="text-right">占比</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheetData.equity.map(([name, value], idx) => (
                        <TableRow key={idx} className="hover:bg-emerald-50/50">
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatAmount(value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min((value / totalEquity) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-12">
                                {((value / totalEquity) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-emerald-50 font-bold">
                        <TableCell>权益总计</TableCell>
                        <TableCell className="text-right font-mono">{formatAmount(totalEquity)}</TableCell>
                        <TableCell className="text-right">100.0%</TableCell>
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
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    收入类科目
                  </span>
                  <Badge variant="secondary">{incomeStatementData.income.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>科目名称</TableHead>
                      <TableHead className="text-right">本期发生额</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.income.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {formatAmount(value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min((value / totalIncome) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12">
                              {((value / totalIncome) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-blue-50 font-bold">
                      <TableCell>收入合计</TableCell>
                      <TableCell className="text-right font-mono text-blue-700">{formatAmount(totalIncome)}</TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* 成本和费用 */}
            <Card>
              <CardHeader className="bg-rose-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                    成本费用类科目
                  </span>
                  <Badge variant="secondary">{incomeStatementData.expenses.length} 项</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>科目名称</TableHead>
                      <TableHead className="text-right">本期发生额</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.expenses.map(([name, value], idx) => (
                      <TableRow key={idx} className="hover:bg-rose-50/50">
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right font-mono text-rose-600">
                          {formatAmount(value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${Math.min((value / totalExpenses) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12">
                              {((value / totalExpenses) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-rose-50 font-bold">
                      <TableCell>成本费用合计</TableCell>
                      <TableCell className="text-right font-mono text-rose-700">{formatAmount(totalExpenses)}</TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* 利润计算 */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                利润计算过程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-gray-600">营业收入</span>
                  <span className="font-mono font-medium text-blue-600">{formatAmount(totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-gray-600">减：营业成本</span>
                  <span className="font-mono font-medium text-rose-600">{formatAmount(totalExpenses * 0.7)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100 bg-blue-50/50 px-2 rounded">
                  <span className="font-medium">毛利</span>
                  <span className="font-mono font-bold text-blue-700">{formatAmount(totalIncome - totalExpenses * 0.7)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-100">
                  <span className="text-gray-600">减：期间费用</span>
                  <span className="font-mono font-medium text-rose-600">{formatAmount(totalExpenses * 0.3)}</span>
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
        
        {/* 财务概要 */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">资产结构</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>流动资产占比</span>
                    <span className="font-medium">
                      {(balanceSheetData.assets.filter(([k]) => 
                        k.includes('流动') || k.includes('现金') || k.includes('应收') || k.includes('存货')
                      ).reduce((sum, [, v]) => sum + v, 0) / totalAssets * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>非流动资产占比</span>
                    <span className="font-medium">
                      {(balanceSheetData.assets.filter(([k]) => 
                        k.includes('固定') || k.includes('无形') || k.includes('长期')
                      ).reduce((sum, [, v]) => sum + v, 0) / totalAssets * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">负债结构</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>资产负债率</span>
                    <span className="font-medium">{((totalLiabilities / totalAssets) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>权益比率</span>
                    <span className="font-medium">{((totalEquity / totalAssets) * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">盈利能力</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>毛利率</span>
                    <span className="font-medium">
                      {totalIncome > 0 ? ((totalIncome - totalExpenses * 0.7) / totalIncome * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>净利率</span>
                    <span className={`font-medium ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totalIncome > 0 ? (netProfit / totalIncome * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 数据勾稽检查 */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                数据勾稽检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-white rounded">
                  <span className="text-sm">资产 = 负债 + 权益</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      {formatAmount(totalAssets)} = {formatAmount(totalLiabilities)} + {formatAmount(totalEquity)}
                    </span>
                    <Badge variant={Math.abs(totalAssets - totalLiabilities - totalEquity) < 100 ? 'default' : 'destructive'}>
                      {Math.abs(totalAssets - totalLiabilities - totalEquity) < 100 ? '平衡' : '不平衡'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-white rounded">
                  <span className="text-sm">净利润 = 收入 - 成本 - 费用</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      {formatAmount(netProfit)} = {formatAmount(totalIncome)} - {formatAmount(totalExpenses)}
                    </span>
                    <Badge variant={Math.abs(netProfit - (totalIncome - totalExpenses)) < 100 ? 'default' : 'destructive'}>
                      {Math.abs(netProfit - (totalIncome - totalExpenses)) < 100 ? '平衡' : '不平衡'}
                    </Badge>
                  </div>
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
