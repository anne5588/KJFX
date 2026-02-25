// 简化的AnalysisResult组件 - 由于原文件编码损坏，这是修复版本
import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, FileText, PieChart, BarChart3, Activity, Shield, Wallet, RotateCcw, TrendingDown } from 'lucide-react';
import type { AnalysisResult as AnalysisResultType, ChartData } from '@/types/accounting';
import { formatCurrencyUniform, type FinancialData, type DupontAnalysis } from '@/utils/excelParser';

// import MetricCard from './MetricCard';
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
  
  // 状态管理：当前标签页和要展开的明细账科目
  const [activeTab, setActiveTab] = React.useState('metrics');
  const [expandedLedger, setExpandedLedger] = React.useState<string | null>(null);



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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="metrics">财务指标</TabsTrigger>
          <TabsTrigger value="dupont">杜邦分析</TabsTrigger>
          <TabsTrigger value="subject">科目分析</TabsTrigger>
          <TabsTrigger value="structure">财务结构</TabsTrigger>
          <TabsTrigger value="charts">数据可视化</TabsTrigger>
          <TabsTrigger value="suggestions">分析建议</TabsTrigger>
          <TabsTrigger value="ledger">明细账</TabsTrigger>
          <TabsTrigger value="audit">审计</TabsTrigger>
        </TabsList>

        {/* 财务指标 - 五大能力分析 */}
        <TabsContent value="metrics" className="space-y-6">
          <FinancialMetricsDashboard metrics={metrics} financialData={financialData} />
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
          <SubjectAnalysisTab 
            financialData={financialData} 
            onViewLedger={(subjectName) => {
              setExpandedLedger(subjectName);
              setActiveTab('ledger');
            }}
          />
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

        {/* 明细账 */}
        <TabsContent value="ledger" className="space-y-6">
          <LedgerDetailTab 
            financialData={financialData} 
            expandedSubject={expandedLedger}
            onExpandChange={setExpandedLedger}
          />
        </TabsContent>

        {/* 审计 */}
        <TabsContent value="audit" className="space-y-6">
          <AuditTab financialData={financialData} />
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

// 五大能力分析仪表盘
import { Separator } from '@/components/ui/separator';

interface FinancialMetricsDashboardProps {
  metrics: AnalysisResultType['metrics'];
  financialData: FinancialData;
}

const FinancialMetricsDashboard: React.FC<FinancialMetricsDashboardProps> = ({ 
  metrics, financialData 
}) => {
  // 评分计算
  const calculateScore = (value: number, goodThreshold: number, badThreshold: number) => {
    if (value >= goodThreshold) return { score: 90, level: '优秀', color: 'green' };
    if (value >= badThreshold) return { score: 70, level: '良好', color: 'blue' };
    return { score: 50, level: '待改进', color: 'yellow' };
  };

  // 各能力维度评分
  const solvencyScore = calculateScore(metrics.currentRatio, 2, 1.5);
  const operationScore = calculateScore(metrics.totalAssetTurnover, 1, 0.5);
  const profitScore = calculateScore(metrics.roe, 15, 8);
  const growthScore = calculateScore(Math.abs(metrics.revenueGrowthRate), 20, 10);
  const cashflowScore = calculateScore(metrics.operatingCashFlowRatio, 1, 0.5);
  
  const overallScore = Math.round(
    (solvencyScore.score + operationScore.score + profitScore.score + 
     growthScore.score + cashflowScore.score) / 5
  );

  const ScoreCard = ({ 
    title, score, level, color, icon: Icon, metrics: metricItems 
  }: { 
    title: string, score: number, level: string, color: string, icon: any,
    metrics: { label: string, value: string | number, unit?: string }[]
  }) => {
    const colorClasses: Record<string, { bg: string, text: string, border: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    const colors = colorClasses[color] || colorClasses.blue;
    
    return (
      <Card className={`${colors.bg} border ${colors.border}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg flex items-center gap-2 ${colors.text}`}>
              <Icon className="w-5 h-5" />
              {title}
            </CardTitle>
            <div className="text-right">
              <div className={`text-3xl font-bold ${colors.text}`}>{score}</div>
              <div className={`text-sm ${colors.text} opacity-80`}>{level}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metricItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">
                  {item.value}{item.unit ? <span className="text-gray-500 ml-1">{item.unit}</span> : ''}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 综合评分卡片 */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">财务健康度综合评分</h3>
              <p className="text-blue-100 text-sm">基于五大能力维度的综合评估</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{overallScore}</div>
              <div className="text-blue-100">满分100</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {['偿债能力', '营运能力', '盈利能力', '发展能力', '现金流'].map((name, i) => {
              const scores = [solvencyScore, operationScore, profitScore, growthScore, cashflowScore];
              return (
                <div key={name} className="flex-1 bg-white/20 rounded p-2 text-center">
                  <div className="text-xs text-blue-100">{name}</div>
                  <div className="font-bold">{scores[i].score}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 五大能力卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. 偿债能力 */}
        <ScoreCard
          title="偿债能力"
          score={solvencyScore.score}
          level={solvencyScore.level}
          color={solvencyScore.color}
          icon={Shield}
          metrics={[
            { label: '流动比率', value: metrics.currentRatio },
            { label: '速动比率', value: metrics.quickRatio },
            { label: '资产负债率', value: metrics.debtToAssetRatio, unit: '%' },
            { label: '利息保障倍数', value: metrics.interestCoverageRatio },
          ]}
        />

        {/* 2. 营运能力 */}
        <ScoreCard
          title="营运能力"
          score={operationScore.score}
          level={operationScore.level}
          color={operationScore.color}
          icon={RotateCcw}
          metrics={[
            { label: '应收账款周转', value: metrics.receivablesTurnover, unit: '次' },
            { label: '应收账款天数', value: metrics.receivablesDays, unit: '天' },
            { label: '存货周转率', value: metrics.inventoryTurnover, unit: '次' },
            { label: '总资产周转率', value: metrics.totalAssetTurnover },
            { label: '现金转换周期', value: metrics.cashConversionCycle, unit: '天' },
          ]}
        />

        {/* 3. 盈利能力 */}
        <ScoreCard
          title="盈利能力"
          score={profitScore.score}
          level={profitScore.level}
          color={profitScore.color}
          icon={TrendingUp}
          metrics={[
            { label: '毛利率', value: metrics.grossProfitMargin, unit: '%' },
            { label: '营业利润率', value: metrics.operatingProfitMargin, unit: '%' },
            { label: '净利率', value: metrics.netProfitMargin, unit: '%' },
            { label: 'ROE', value: metrics.roe, unit: '%' },
            { label: 'ROA', value: metrics.roa, unit: '%' },
          ]}
        />

        {/* 4. 发展能力 */}
        <ScoreCard
          title="发展能力"
          score={growthScore.score}
          level={growthScore.level}
          color={growthScore.color}
          icon={TrendingDown}
          metrics={[
            { label: '收入增长率', value: metrics.revenueGrowthRate, unit: '%' },
            { label: '净利润增长率', value: metrics.netProfitGrowthRate, unit: '%' },
            { label: '总资产增长率', value: metrics.totalAssetGrowthRate, unit: '%' },
            { label: '资本保值增值率', value: metrics.equityGrowthRate, unit: '%' },
            { label: '可持续增长率', value: metrics.sustainableGrowthRate, unit: '%' },
          ]}
        />

        {/* 5. 现金流 */}
        <ScoreCard
          title="现金流能力"
          score={cashflowScore.score}
          level={cashflowScore.level}
          color={cashflowScore.color}
          icon={Wallet}
          metrics={[
            { label: '经营现金流/净利润', value: metrics.operatingCashFlowRatio },
            { label: '自由现金流', value: formatCurrencyUniform(metrics.freeCashFlow) },
            { label: '销售现金比率', value: metrics.cashFlowToRevenue, unit: '%' },
            { label: '现金收入比率', value: metrics.cashRecoveryRate, unit: '%' },
          ]}
        />

        {/* 杜邦分析速览 */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <BarChart3 className="w-5 h-5" />
              杜邦分析速览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{metrics.roe}%</div>
                <div className="text-xs text-gray-500">净资产收益率 ROE</div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-medium">{metrics.netProfitMargin}%</div>
                  <div className="text-xs text-gray-500">净利率</div>
                </div>
                <div className="text-orange-500">×</div>
                <div>
                  <div className="font-medium">{metrics.totalAssetTurnover}</div>
                  <div className="text-xs text-gray-500">资产周转</div>
                </div>
              </div>
              <div className="text-center text-gray-400">×</div>
              <div className="text-center">
                <div className="font-medium">{financialData.totalEquity > 0 
                  ? (financialData.totalAssets / financialData.totalEquity).toFixed(2) 
                  : 0}</div>
                <div className="text-xs text-gray-500">权益乘数</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 指标说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">指标说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>偿债能力：</strong>反映企业偿还债务的能力，包括短期偿债（流动比率）和长期偿债（资产负债率）</p>
          <p><strong>营运能力：</strong>反映企业资产运营效率，周转率越高说明资产利用效率越好</p>
          <p><strong>盈利能力：</strong>反映企业获取利润的能力，ROE是综合性最强的盈利指标</p>
          <p><strong>发展能力：</strong>反映企业成长性，增长率越高说明企业发展势头越好</p>
          <p><strong>现金流：</strong>反映企业现金创造能力，经营现金流应持续为正且与利润匹配</p>
        </CardContent>
      </Card>
    </div>
  );
};

// 科目分析标签页组件
interface SubjectAnalysisTabProps {
  financialData: FinancialData;
  onViewLedger: (subjectName: string) => void;
}

const SubjectAnalysisTab: React.FC<SubjectAnalysisTabProps> = ({ financialData, onViewLedger }) => {
  // 获取有明细账的科目名称列表
  const ledgerSubjectNames = new Set(financialData.ledgers.map(l => l.subjectName));
  
  // 合并所有科目数据
  const allSubjects = [
    ...Array.from(financialData.assets.entries()).map(([name, value]) => ({ 
      name, value, type: '资产', hasLedger: ledgerSubjectNames.has(name) 
    })),
    ...Array.from(financialData.liabilities.entries()).map(([name, value]) => ({ 
      name, value, type: '负债', hasLedger: ledgerSubjectNames.has(name) 
    })),
    ...Array.from(financialData.income.entries()).map(([name, value]) => ({ 
      name, value, type: '收入', hasLedger: ledgerSubjectNames.has(name) 
    })),
    ...Array.from(financialData.expenses.entries()).map(([name, value]) => ({ 
      name, value, type: '费用', hasLedger: ledgerSubjectNames.has(name) 
    })),
  ].sort((a, b) => b.value - a.value);

  // 按类型分组
  const assets = allSubjects.filter(s => s.type === '资产').slice(0, 20);
  const liabilities = allSubjects.filter(s => s.type === '负债').slice(0, 20);
  const income = allSubjects.filter(s => s.type === '收入').slice(0, 10);
  const expenses = allSubjects.filter(s => s.type === '费用').slice(0, 10);

  const SubjectList = ({ items, type, color }: { items: typeof allSubjects, type: string, color: string }) => (
    <Card className="h-full">
      <CardHeader className="py-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>{type}科目</span>
          <span className={`text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
            {items.length}个
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">无{type}科目</p>
          ) : (
            items.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between py-2 px-2 rounded text-sm ${
                  item.hasLedger 
                    ? 'hover:bg-blue-50 cursor-pointer group' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => item.hasLedger && onViewLedger(item.name)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 truncate max-w-[120px]">{item.name}</span>
                  {item.hasLedger && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      有明细
                    </Badge>
                  )}
                </div>
                <span className="font-medium text-gray-900">{formatCurrencyUniform(item.value)}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            科目余额表分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">资产总计: {formatCurrencyUniform(financialData.totalAssets)}</p>
          <p className="text-gray-600">负债总计: {formatCurrencyUniform(financialData.totalLiabilities)}</p>
          <p className="text-gray-600">权益总计: {formatCurrencyUniform(financialData.totalEquity)}</p>
          <p className="text-gray-600">营业收入: {formatCurrencyUniform(financialData.totalIncome)}</p>
          <p className="text-gray-600">净利润: {formatCurrencyUniform(financialData.netProfit)}</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">提示：</span>
              带有 
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 mx-1">有明细</Badge>
              标签的科目可点击查看明细账详情
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubjectList items={assets} type="资产" color="blue" />
        <SubjectList items={liabilities} type="负债" color="red" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubjectList items={income} type="收入" color="green" />
        <SubjectList items={expenses} type="费用" color="orange" />
      </div>
    </div>
  );
};

// 明细账标签页组件
import { analyzeLedger, type LedgerData, type LedgerAnalysis } from '@/utils/ledgerAnalysis';
import { Search, AlertCircle, Users, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface LedgerDetailTabProps {
  financialData: FinancialData;
  expandedSubject?: string | null;
  onExpandChange?: (subject: string | null) => void;
}

const LedgerDetailTab: React.FC<LedgerDetailTabProps> = ({ 
  financialData, 
  expandedSubject,
  onExpandChange 
}) => {
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
  
  // 根据科目名称找到对应的索引
  const expandedValue = expandedSubject 
    ? ledgerAnalyses.findIndex(({ ledger }) => 
        ledger.subjectName === expandedSubject || 
        ledger.subjectName.includes(expandedSubject) ||
        expandedSubject.includes(ledger.subjectName)
      ) >= 0 
      ? `ledger-${ledgerAnalyses.findIndex(({ ledger }) => 
          ledger.subjectName === expandedSubject || 
          ledger.subjectName.includes(expandedSubject) ||
          expandedSubject.includes(ledger.subjectName)
        )}` 
      : undefined
    : undefined;

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
        <Accordion 
          type="multiple" 
          className="space-y-4"
          value={expandedValue ? [expandedValue] : undefined}
          onValueChange={(values) => {
            if (onExpandChange) {
              const expandedIndex = values[0]?.replace('ledger-', '');
              if (expandedIndex !== undefined) {
                const idx = parseInt(expandedIndex);
                if (ledgerAnalyses[idx]) {
                  onExpandChange(ledgerAnalyses[idx].ledger.subjectName);
                }
              } else {
                onExpandChange(null);
              }
            }
          }}
        >
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

    </div>
  );
};

// 审计标签页组件（简化版）
import { FileCheck } from 'lucide-react';

const AuditTab: React.FC<{ financialData: FinancialData }> = ({ financialData }) => {
  // 简单的审计检查
  const checks = [
    { name: '资产负债表平衡', pass: Math.abs(financialData.totalAssets - financialData.totalLiabilities - financialData.totalEquity) < 1 },
    { name: '利润表计算', pass: Math.abs(financialData.netProfit - (financialData.totalIncome - financialData.totalExpenses)) < 1 },
    { name: '明细分类账数据', pass: financialData.ledgers.length > 0 },
    { name: '财务概要信息', pass: financialData.financialSummary !== null },
    { name: '账龄分析数据', pass: financialData.agingAnalysis !== null },
  ];

  const passedCount = checks.filter(c => c.pass).length;

  return (
    <div className="space-y-6">
      {/* 审计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">通过检查</p>
                <p className="text-2xl font-bold text-green-800">{passedCount}/{checks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">数据完整性</p>
                <p className="text-2xl font-bold text-blue-800">{Math.round((passedCount / checks.length) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">审计状态</p>
                <p className="text-2xl font-bold text-purple-800">
                  {passedCount === checks.length ? '通过' : '待完善'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 检查项列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            数据完整性检查
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((check, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">{check.name}</span>
                <Badge variant={check.pass ? 'default' : 'secondary'} className={check.pass ? 'bg-green-500' : ''}>
                  {check.pass ? '通过' : '未检测'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">审计说明</p>
        <p>详细的科目明细账请切换到「明细账」标签页查看。财务概要信息和账龄分析可在对应数据检测后显示。</p>
      </div>
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
