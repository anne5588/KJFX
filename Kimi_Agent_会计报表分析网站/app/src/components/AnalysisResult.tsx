// 简化的AnalysisResult组件 - 由于原文件编码损坏，这是修复版本
import { TrendingUp, AlertTriangle, CheckCircle, FileText, PieChart, BarChart3, Activity } from 'lucide-react';
import type { AnalysisResult as AnalysisResultType, ChartData } from '@/types/accounting';
import { formatCurrencyUniform, type FinancialData, type DupontAnalysis } from '@/utils/excelParser';

import MetricCard from './MetricCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartComponent, BarChartComponent, RadarChartComponent, FinancialStructureChart, IncomeExpenseChart } from './Charts';

interface AnalysisResultProps {
  result: AnalysisResultType;
  financialData: FinancialData;
  dupontData: DupontAnalysis;
}

const AnalysisResultComponent: React.FC<AnalysisResultProps> = ({ 
  result, 
  financialData,
  dupontData 
}) => {
  const { metrics, summary } = result;

  const getMetricStatus = (value: number, type: 'ratio' | 'percentage') => {
    if (type === 'ratio') {
      if (value >= 2) return { trend: 'up' as const, status: '良好' };
      if (value >= 1) return { trend: 'neutral' as const, status: '一般' };
      return { trend: 'down' as const, status: '偏低' };
    } else {
      if (value >= 20) return { trend: 'up' as const, status: '优秀' };
      if (value >= 10) return { trend: 'up' as const, status: '良好' };
      if (value >= 5) return { trend: 'neutral' as const, status: '一般' };
      return { trend: 'down' as const, status: '偏低' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 财务概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">总资产</p>
                <p className="text-2xl font-bold">{formatCurrencyUniform(summary.totalAssets)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">总负债</p>
                <p className="text-2xl font-bold">{formatCurrencyUniform(summary.totalLiabilities)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">所有者权益</p>
                <p className="text-2xl font-bold">{formatCurrencyUniform(summary.totalEquity)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析标签页 */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="metrics">财务指标</TabsTrigger>
          <TabsTrigger value="dupont">杜邦分析</TabsTrigger>
          <TabsTrigger value="subject">科目分析</TabsTrigger>
          <TabsTrigger value="structure">财务结构</TabsTrigger>
          <TabsTrigger value="charts">数据可视化</TabsTrigger>
          <TabsTrigger value="suggestions">分析建议</TabsTrigger>
          <TabsTrigger value="ledger">审计</TabsTrigger>
        </TabsList>

        {/* 财务指标 */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="流动比率"
              value={metrics.currentRatio}
              description="衡量短期偿债能力"
              trend={getMetricStatus(metrics.currentRatio, 'ratio').trend}
              trendValue={getMetricStatus(metrics.currentRatio, 'ratio').status}
              color="blue"
            />
            <MetricCard
              title="速动比率"
              value={metrics.quickRatio}
              description="衡量即时偿债能力"
              trend={getMetricStatus(metrics.quickRatio, 'ratio').trend}
              trendValue={getMetricStatus(metrics.quickRatio, 'ratio').status}
              color="blue"
            />
            <MetricCard
              title="资产负债率"
              value={metrics.debtToAssetRatio}
              unit="%"
              description="衡量财务杠杆水平"
              trend={metrics.debtToAssetRatio < 50 ? 'up' : 'down'}
              trendValue={metrics.debtToAssetRatio < 50 ? '稳健' : '偏高'}
              color="purple"
            />
            <MetricCard
              title="净资产收益率 ROE"
              value={metrics.roe}
              unit="%"
              description="衡量股东权益回报率"
              trend={getMetricStatus(metrics.roe, 'percentage').trend}
              trendValue={getMetricStatus(metrics.roe, 'percentage').status}
              color="orange"
            />
            <MetricCard
              title="销售净利率"
              value={metrics.netProfitMargin}
              unit="%"
              description="衡量盈利能力"
              trend={getMetricStatus(metrics.netProfitMargin, 'percentage').trend}
              trendValue={getMetricStatus(metrics.netProfitMargin, 'percentage').status}
              color="green"
            />
            <MetricCard
              title="总资产周转率"
              value={metrics.totalAssetTurnover}
              description="衡量资产使用效率"
              trend={metrics.totalAssetTurnover > 0.8 ? 'up' : 'neutral'}
              trendValue={metrics.totalAssetTurnover > 0.8 ? '良好' : '一般'}
              color="cyan"
            />
          </div>
        </TabsContent>

        {/* 杜邦分析 */}
        <TabsContent value="dupont" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">杜邦分析体系</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">净资产收益率 (ROE)</p>
                <p className="text-5xl font-bold text-blue-600">{dupontData.roe}%</p>
                <p className="text-sm text-gray-500 mt-2">= 销售净利率 × 总资产周转率 × 权益乘数</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">销售净利率</p>
                    <p className="text-lg font-bold text-blue-600">{dupontData.netProfitMargin}%</p>
                    <p className="text-xs text-gray-500">净利润 ÷ 营业收入</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">总资产周转率</p>
                    <p className="text-lg font-bold text-blue-600">{dupontData.totalAssetTurnover}次</p>
                    <p className="text-xs text-gray-500">营业收入 ÷ 总资产</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">权益乘数</p>
                    <p className="text-lg font-bold text-blue-600">{dupontData.equityMultiplier}</p>
                    <p className="text-xs text-gray-500">总资产 ÷ 股东权益</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 科目分析 */}
        <TabsContent value="subject" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                科目余额表分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">资产总计: {formatCurrencyUniform(summary.totalAssets)}</p>
              <p className="text-gray-600">负债总计: {formatCurrencyUniform(summary.totalLiabilities)}</p>
              <p className="text-gray-600">权益总计: {formatCurrencyUniform(summary.totalEquity)}</p>
              <p className="text-gray-600">营业收入: {formatCurrencyUniform(summary.totalIncome)}</p>
              <p className="text-gray-600">净利润: {formatCurrencyUniform(summary.netProfit)}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 财务结构 */}
        <TabsContent value="structure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">资产明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Array.from(financialData.assets.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([name, value], index) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">{name}</span>
                        <span className="text-sm font-medium">{formatCurrencyUniform(value)}</span>
                      </div>
                    ))}
                </div>
                <div className="flex justify-between py-3 mt-2 bg-blue-50 rounded-lg px-3">
                  <span className="text-sm font-bold text-blue-800">合计</span>
                  <span className="text-sm font-bold text-blue-800">{formatCurrencyUniform(summary.totalAssets)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">负债明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {Array.from(financialData.liabilities.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([name, value], index) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">{name}</span>
                        <span className="text-sm font-medium">{formatCurrencyUniform(value)}</span>
                      </div>
                    ))}
                </div>
                <div className="flex justify-between py-3 mt-2 bg-red-50 rounded-lg px-3">
                  <span className="text-sm font-bold text-red-800">合计</span>
                  <span className="text-sm font-bold text-red-800">{formatCurrencyUniform(summary.totalLiabilities)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 数据可视化 */}
        <TabsContent value="charts" className="space-y-6">
          <ChartsTab financialData={financialData} metrics={result.metrics} />
        </TabsContent>

        {/* 分析建议 */}
        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-500" />
                综合分析与建议
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">经营概况</h4>
                <p className="text-blue-700 text-sm">
                  公司本期{summary.netProfit > 0 ? '实现盈利' : '出现亏损'}{formatCurrencyUniform(Math.abs(summary.netProfit))}。
                  营业收入{formatCurrencyUniform(summary.totalIncome)}，
                  净利率为{metrics.netProfitMargin}%。
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">财务状况</h4>
                <p className="text-green-700 text-sm">
                  资产总额{formatCurrencyUniform(summary.totalAssets)}，
                  资产负债率{metrics.debtToAssetRatio}%，
                  流动比率{metrics.currentRatio}。
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">管理建议</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• 加强现金流管理，优化资本结构</li>
                  <li>• 关注应收账款回收，降低坏账风险</li>
                  <li>• 建立健全的财务风险预警机制</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 审计 */}
        <TabsContent value="ledger" className="space-y-6">
          <LedgerAuditTab financialData={financialData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// 数据可视化标签页组件
interface ChartsTabProps {
  financialData: FinancialData;
  metrics: AnalysisResultType['metrics'];
}

const ChartsTab: React.FC<ChartsTabProps> = ({ financialData, metrics }) => {
  // 准备资产结构数据（Top 8）
  const assetData: ChartData[] = Array.from(financialData.assets.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 8 ? name.slice(0, 8) + '...' : name, value }));

  // 准备负债结构数据（Top 8）
  const liabilityData: ChartData[] = Array.from(financialData.liabilities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 8 ? name.slice(0, 8) + '...' : name, value }));

  // 准备收入支出数据
  const incomeExpenseData: ChartData[] = [
    { name: '营业收入', value: financialData.totalIncome, color: '#43e97b' },
    { name: '营业成本', value: financialData.totalExpenses * 0.7, color: '#f5576c' },
    { name: '期间费用', value: financialData.totalExpenses * 0.3, color: '#fa709a' },
  ].filter(d => d.value > 0);

  // 准备财务指标雷达图数据
  const radarData = [
    { subject: '偿债能力', A: Math.min(metrics.currentRatio / 2 * 100, 100), fullMark: 100 },
    { subject: '速动能力', A: Math.min(metrics.quickRatio / 1 * 100, 100), fullMark: 100 },
    { subject: '盈利能力', A: Math.max(0, metrics.netProfitMargin), fullMark: 100 },
    { subject: '资产回报', A: Math.max(0, metrics.roa), fullMark: 100 },
    { subject: '权益回报', A: Math.max(0, metrics.roe), fullMark: 100 },
    { subject: '营运效率', A: Math.min(metrics.totalAssetTurnover * 100, 100), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* 财务结构总览 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialStructureChart
          assets={financialData.totalAssets}
          liabilities={financialData.totalLiabilities}
          equity={financialData.totalEquity}
        />
        <IncomeExpenseChart
          income={financialData.totalIncome}
          expenses={financialData.totalExpenses}
          netProfit={financialData.netProfit}
        />
      </div>

      {/* 资产负债结构饼图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              资产结构（Top 8）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assetData.length > 0 ? (
              <PieChartComponent data={assetData} />
            ) : (
              <p className="text-gray-500 text-center py-8">暂无资产数据</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-red-600" />
              负债结构（Top 8）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liabilityData.length > 0 ? (
              <PieChartComponent data={liabilityData} />
            ) : (
              <p className="text-gray-500 text-center py-8">暂无负债数据</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 财务指标雷达图 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            财务能力雷达图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-lg mx-auto">
            <RadarChartComponent data={radarData} />
          </div>
        </CardContent>
      </Card>

      {/* 收支结构 */}
      {incomeExpenseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              收支结构
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent 
              data={incomeExpenseData} 
              color="#667eea"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 审计分析标签页组件
import { analyzeLedger, type LedgerData, type LedgerAnalysis } from '@/utils/ledgerAnalysis';
import { Search, AlertCircle, Users, ArrowRightLeft, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LedgerAuditTab: React.FC<{ financialData: FinancialData }> = ({ financialData }) => {
  // 分析所有明细账
  const ledgerAnalyses = financialData.ledgers.map(ledger => ({
    ledger,
    analysis: analyzeLedger(ledger),
  }));

  // 统计异常总数
  const totalAnomalies = ledgerAnalyses.reduce((sum, { analysis }) => sum + analysis.anomalies.length, 0);

  // 统计大额交易
  const totalLargeTransactions = ledgerAnalyses.reduce(
    (sum, { analysis }) => sum + analysis.largeTransactions.length, 0
  );

  // 统计往来单位
  const allCounterparties = ledgerAnalyses.flatMap(({ analysis }) => analysis.counterpartyAnalysis);
  const uniqueCounterparties = new Set(allCounterparties.map(c => c.name)).size;

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">明细科目数</p>
                <p className="text-2xl font-bold text-blue-800">{financialData.ledgers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">大额交易</p>
                <p className="text-2xl font-bold text-yellow-800">{totalLargeTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">往来单位</p>
                <p className="text-2xl font-bold text-green-800">{uniqueCounterparties}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalAnomalies > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-8 h-8 ${totalAnomalies > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              <div>
                <p className={`text-sm ${totalAnomalies > 0 ? 'text-red-600' : 'text-gray-600'}`}>异常提醒</p>
                <p className={`text-2xl font-bold ${totalAnomalies > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                  {totalAnomalies}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 无数据提示 */}
      {financialData.ledgers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">未检测到明细分类账数据</p>
            <p className="text-sm text-gray-400 mt-2">如需查看明细账，请确保Excel文件中包含明细分类账工作表</p>
          </CardContent>
        </Card>
      )}

      {/* 明细账列表 */}
      {ledgerAnalyses.length > 0 && (
        <Accordion type="multiple" className="space-y-4">
          {ledgerAnalyses.map(({ ledger, analysis }, index) => (
            <AccordionItem key={index} value={`ledger-${index}`} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-4 text-left">
                  <span className="font-semibold">{ledger.subjectName}</span>
                  <span className="text-sm text-gray-500">({ledger.entries.length}笔)</span>
                  {analysis.anomalies.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {analysis.anomalies.length}个异常
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <LedgerDetailView ledger={ledger} analysis={analysis} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* 财务概要和账龄分析 */}
      {(financialData.financialSummary || financialData.agingAnalysis) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {financialData.financialSummary && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <Wallet className="w-5 h-5" />
                  财务概要信息表
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">检测到财务概要信息</p>
                <p className="text-sm text-blue-600 mt-1">
                  收入: {formatCurrencyUniform(financialData.financialSummary.revenue?.currentPeriodAmount || 0)} | 
                  费用比率: {financialData.financialSummary.expenseRatio?.currentPeriodAmount.toFixed(1) || 0}%
                </p>
              </CardContent>
            </Card>
          )}

          {financialData.agingAnalysis && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                  <ArrowRightLeft className="w-5 h-5" />
                  账龄分析: {financialData.agingAnalysis.subjectName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700">
                  期初: {formatCurrencyUniform(financialData.agingAnalysis.totalBeginning)} | 
                  期末: {formatCurrencyUniform(financialData.agingAnalysis.totalEnding)} | 
                  高风险: {formatCurrencyUniform(financialData.agingAnalysis.analysis.highRiskAmount)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// 单个明细账详情视图
const LedgerDetailView: React.FC<{ ledger: LedgerData; analysis: LedgerAnalysis }> = ({ ledger, analysis }) => {
  return (
    <div className="space-y-4 mt-4">
      {/* 基本信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">期间</p>
          <p className="font-medium">{ledger.period || '未指定'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-500">期初余额</p>
          <p className="font-medium">{formatCurrencyUniform(ledger.beginningBalance)}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-600">借方发生额</p>
          <p className="font-medium text-blue-800">{formatCurrencyUniform(ledger.totalDebit)}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-red-600">贷方发生额</p>
          <p className="font-medium text-red-800">{formatCurrencyUniform(ledger.totalCredit)}</p>
        </div>
      </div>

      {/* 资金流向 */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            资金流向
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">总流入:</span>
              <span className="ml-2 font-medium text-green-600">{formatCurrencyUniform(analysis.fundFlow.inflow)}</span>
            </div>
            <div>
              <span className="text-gray-500">总流出:</span>
              <span className="ml-2 font-medium text-red-600">{formatCurrencyUniform(analysis.fundFlow.outflow)}</span>
            </div>
            <div>
              <span className="text-gray-500">净流入:</span>
              <span className={`ml-2 font-medium ${analysis.fundFlow.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyUniform(analysis.fundFlow.netFlow)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 大额交易 TOP5 */}
      {analysis.largeTransactions.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              大额交易 TOP5
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {analysis.largeTransactions.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="text-gray-600">{t.entry.date}</span>
                    <span className="truncate max-w-[200px]">{t.entry.summary}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrencyUniform(Math.max(t.entry.debit, t.entry.credit))}</span>
                    <span className="text-xs text-gray-400">{t.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 往来单位 TOP5 */}
      {analysis.counterpartyAnalysis.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              主要往来单位 TOP5
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {analysis.counterpartyAnalysis.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{c.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {c.transactionCount}笔
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${c.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {c.netAmount >= 0 ? '应收' : '应付'} {formatCurrencyUniform(Math.abs(c.netAmount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 异常提醒 */}
      {analysis.anomalies.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              异常提醒 ({analysis.anomalies.length}项)
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {analysis.anomalies.map((anomaly, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={anomaly.riskLevel === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {anomaly.riskLevel === 'high' ? '高风险' : anomaly.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </Badge>
                    <span className="text-sm font-medium text-red-800">{anomaly.description}</span>
                  </div>
                  {anomaly.entries.slice(0, 3).map((e, j) => (
                    <p key={j} className="text-xs text-red-600 ml-16">
                      {e.date} {e.summary} {formatCurrencyUniform(Math.max(e.debit, e.credit))}
                    </p>
                  ))}
                  {anomaly.entries.length > 3 && (
                    <p className="text-xs text-red-400 ml-16">还有 {anomaly.entries.length - 3} 笔...</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisResultComponent;
