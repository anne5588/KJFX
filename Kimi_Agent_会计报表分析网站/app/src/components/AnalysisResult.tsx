// 简化的AnalysisResult组件 - 由于原文件编码损坏，这是修复版本
import React from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle, FileText, PieChart, BarChart3, Activity, 
  Shield, Wallet, RotateCcw, TrendingDown, Award, Target, AlertOctagon, Info,
  ArrowUpRight, ArrowDownRight, Minus, LineChart, Building2, FileSearch, Download, Sparkles
} from 'lucide-react';
import type { AnalysisResult as AnalysisResultType, ChartData } from '@/types/accounting';
import { formatCurrencyUniform, type FinancialData, type DupontAnalysis } from '@/utils/excelParser';

// Phase 3 工具函数导入
import { performFinancialForecast, type ForecastResult } from '@/utils/financialForecast';
import { performIndustryComparison, getAvailableIndustries, type IndustryComparisonResult, type IndustryMetricComparison } from '@/utils/industryComparison';
import { generateSmartReport, type SmartReport } from '@/utils/smartReport';
import { calculateWallScore } from '@/utils/wallScoring';
import { detectAnomalies, generateAnomalySummary, type Anomaly } from '@/utils/anomalyDetection';

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
  dupontData: _dupontData 
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
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="metrics">财务指标</TabsTrigger>
          <TabsTrigger value="subject">科目分析</TabsTrigger>
          <TabsTrigger value="structure">财务结构</TabsTrigger>
          <TabsTrigger value="charts">数据可视化</TabsTrigger>
          <TabsTrigger value="comparison">多期对比</TabsTrigger>
          <TabsTrigger value="forecast">财务预测</TabsTrigger>
          <TabsTrigger value="scoring">综合评分</TabsTrigger>
          <TabsTrigger value="anomaly">异常检测</TabsTrigger>
          <TabsTrigger value="industry">行业对比</TabsTrigger>
          <TabsTrigger value="report">智能报告</TabsTrigger>
          {activeTab === 'ledger' && (
            <TabsTrigger value="ledger">明细账</TabsTrigger>
          )}
        </TabsList>

        {/* 财务指标 - 五大能力分析 */}
        <TabsContent value="metrics" className="space-y-6">
          <FinancialMetricsDashboard metrics={metrics} financialData={financialData} />
        </TabsContent>

        {/* 科目分析 */}
        <TabsContent value="subject" className="space-y-6">
          <SubjectAnalysisTab 
            financialData={financialData} 
            onViewLedger={(subjectName) => {
              setExpandedLedger(subjectName);
              setActiveTab('ledger');
              // 滚动到顶部，让用户看到切换的标签
              window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* 多期对比分析 */}
        <TabsContent value="comparison" className="space-y-6">
          <MultiPeriodAnalysisTab financialData={financialData} metrics={metrics} />
        </TabsContent>

        {/* 沃尔评分法 */}
        <TabsContent value="scoring" className="space-y-6">
          <WallScoringTab metrics={metrics} />
        </TabsContent>

        {/* 异常检测 */}
        <TabsContent value="anomaly" className="space-y-6">
          <AnomalyDetectionTab financialData={financialData} />
        </TabsContent>

        {/* 审计 */}
        <TabsContent value="audit" className="space-y-6">
          <AuditTab financialData={financialData} />
        </TabsContent>

        {/* ========== Phase 3: 财务预测 ========== */}
        <TabsContent value="forecast" className="space-y-6">
          <FinancialForecastTab financialData={financialData} metrics={metrics} />
        </TabsContent>

        {/* ========== Phase 3: 行业对比 ========== */}
        <TabsContent value="industry" className="space-y-6">
          <IndustryComparisonTab metrics={metrics} />
        </TabsContent>

        {/* ========== Phase 3: 智能报告 ========== */}
        <TabsContent value="report" className="space-y-6">
          <SmartReportTab 
            financialData={financialData} 
            metrics={metrics}
          />
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
import { Progress } from '@/components/ui/progress';

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
import { Search, AlertCircle, Users, ArrowRightLeft, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  // 找到当前选中的科目明细账
  const selectedLedger = expandedSubject 
    ? financialData.ledgers.find(l => 
        l.subjectName === expandedSubject || 
        l.subjectName.includes(expandedSubject) ||
        expandedSubject.includes(l.subjectName)
      )
    : null;
  
  // 年月范围筛选状态
  const [startYearMonth, setStartYearMonth] = React.useState<string>('');
  const [endYearMonth, setEndYearMonth] = React.useState<string>('');
  
  // 提取可用的年月选项
  const yearMonthOptions = React.useMemo(() => {
    if (!selectedLedger) return [];
    const ymSet = new Set<string>();
    selectedLedger.entries.forEach(e => {
      if (e.date && e.date.length >= 7) {
        ymSet.add(e.date.substring(0, 7)); // 格式: YYYY-MM
      }
    });
    return Array.from(ymSet).sort();
  }, [selectedLedger]);
  
  // 筛选后的明细账数据
  const filteredLedger = React.useMemo(() => {
    if (!selectedLedger) return null;
    if (!startYearMonth && !endYearMonth) return selectedLedger;
    
    return {
      ...selectedLedger,
      entries: selectedLedger.entries.filter(e => {
        if (!e.date || e.date.length < 7) return false;
        const entryYM = e.date.substring(0, 7);
        if (startYearMonth && entryYM < startYearMonth) return false;
        if (endYearMonth && entryYM > endYearMonth) return false;
        return true;
      })
    };
  }, [selectedLedger, startYearMonth, endYearMonth]);
  
  const selectedAnalysis = filteredLedger ? analyzeLedger(filteredLedger) : null;

  // 如果没有选中科目，显示提示
  if (!selectedLedger) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">请选择要查看的科目</p>
            <p className="text-sm text-gray-400">在「科目分析」标签页中，点击带有「有明细」标签的科目即可查看明细</p>
          </CardContent>
        </Card>
        
        {/* 显示可用明细科目列表（简要版） */}
        {financialData.ledgers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">可用明细科目 ({financialData.ledgers.length}个)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {financialData.ledgers.map((ledger, idx) => (
                  <div 
                    key={idx}
                    className="p-2 bg-gray-50 rounded text-sm text-gray-700 truncate"
                    title={ledger.subjectName}
                  >
                    {ledger.subjectName}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            onExpandChange?.(null);
            setStartYearMonth('');
            setEndYearMonth('');
          }}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          返回科目分析
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{selectedLedger.subjectName}</h3>
          <p className="text-sm text-gray-500">
            {(!startYearMonth && !endYearMonth)
              ? `${selectedLedger.entries.length}笔交易`
              : `${filteredLedger?.entries.length || 0}笔交易 (已筛选)`
            }
            {selectedAnalysis && selectedAnalysis.anomalies.length > 0 && (
              <span className="text-red-500 ml-2">({selectedAnalysis.anomalies.length}个异常)</span>
            )}
          </p>
        </div>
        
        {/* 年月范围筛选器 */}
        {yearMonthOptions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">筛选时间:</span>
            <select
              value={startYearMonth}
              onChange={(e) => setStartYearMonth(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">开始年月</option>
              {yearMonthOptions.map(ym => (
                <option key={ym} value={ym}>{ym.replace('-', '年')}月</option>
              ))}
            </select>
            <span className="text-gray-400">-</span>
            <select
              value={endYearMonth}
              onChange={(e) => setEndYearMonth(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">结束年月</option>
              {yearMonthOptions.map(ym => (
                <option key={ym} value={ym}>{ym.replace('-', '年')}月</option>
              ))}
            </select>
            {(startYearMonth || endYearMonth) && (
              <button
                onClick={() => {
                  setStartYearMonth('');
                  setEndYearMonth('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* 直接显示科目详情 */}
      {filteredLedger && selectedAnalysis && (
        <LedgerDetailView ledger={filteredLedger} analysis={selectedAnalysis} />
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

const WallScoringTab: React.FC<{ metrics: AnalysisResultType['metrics'] }> = ({ metrics }) => {
  const scoreResult = calculateWallScore(metrics);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'average': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'average': return '一般';
      case 'poor': return '较差';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* 综合评分卡片 */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Award className="w-8 h-8" />
                沃尔综合评分
              </h3>
              <p className="text-indigo-100">基于9项核心财务指标的信用评价体系</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{scoreResult.totalScore}</div>
              <div className="text-indigo-100">满分 {scoreResult.maxPossibleScore}</div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between bg-white/10 rounded-lg p-4">
            <div>
              <span className="text-indigo-100">信用等级</span>
              <div className="text-4xl font-bold" style={{ color: scoreResult.ratingColor }}>
                {scoreResult.rating}
              </div>
            </div>
            <div className="text-right max-w-md">
              <p className="text-indigo-100 text-sm">信用等级说明</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 指标得分详情 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            各项指标得分
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoreResult.indicatorScores.map((indicator: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{indicator.name}</span>
                    <span className="text-gray-400">(权重{indicator.weight}%)</span>
                    <Badge className={`${getStatusColor(indicator.status)} text-white text-xs`}>
                      {getStatusText(indicator.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{indicator.score}</span>
                    <span className="text-gray-400">/{indicator.maxScore}</span>
                  </div>
                </div>
                <Progress value={(indicator.score / indicator.maxScore) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>实际值: {indicator.actualValue}{indicator.unit}</span>
                  <span>标准值: {indicator.standardValue}{indicator.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 改进建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            改进建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scoreResult.suggestions.map((suggestion: string, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                {suggestion}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnomalyDetectionTab: React.FC<{ financialData: FinancialData }> = ({ financialData }) => {
  const [anomalies, setAnomalies] = React.useState<Anomaly[]>([]);
  const [summary, setSummary] = React.useState<{ totalCount: number; highRisk: number; mediumRisk: number; lowRisk: number; overallAssessment: string } | null>(null);
  
  React.useEffect(() => {
    const loadAnomalyData = async () => {
      const detectedAnomalies = detectAnomalies(financialData);
      const anomalySummary = generateAnomalySummary(detectedAnomalies);
      setAnomalies(detectedAnomalies);
      setSummary(anomalySummary);
    };
    loadAnomalyData();
  }, [financialData]);
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 异常统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">异常总数</p>
              <p className="text-3xl font-bold text-gray-800">{summary?.totalCount || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600">高风险</p>
              <p className="text-3xl font-bold text-red-700">{summary?.highRisk || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-yellow-600">中风险</p>
              <p className="text-3xl font-bold text-yellow-700">{summary?.mediumRisk || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600">低风险</p>
              <p className="text-3xl font-bold text-blue-700">{summary?.lowRisk || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 整体评估 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            整体评估
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-medium ${
            (summary?.highRisk || 0) > 0 ? 'text-red-600' : 
            (summary?.mediumRisk || 0) > 0 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {summary?.overallAssessment || '加载中...'}
          </p>
        </CardContent>
      </Card>

      {/* 异常列表 */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-gray-600">未发现异常</p>
              <p className="text-sm text-gray-400">财务数据变动在正常范围内</p>
            </CardContent>
          </Card>
        ) : (
          anomalies.map((anomaly, idx) => (
            <Card key={idx} className={`${getSeverityColor(anomaly.severity)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(anomaly.severity)}
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold">
                      {anomaly.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {anomaly.description}
                    </p>
                  </div>
                  <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                    {anomaly.severity === 'high' ? '高风险' : 
                     anomaly.severity === 'medium' ? '中风险' : '低风险'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">本期值</p>
                    <p className="font-medium">{formatCurrencyUniform(anomaly.currentValue)}</p>
                  </div>
                  {anomaly.previousValue !== undefined && (
                    <div>
                      <p className="text-gray-500">上期值</p>
                      <p className="font-medium">{formatCurrencyUniform(anomaly.previousValue)}</p>
                    </div>
                  )}
                  {anomaly.changePercentage !== undefined && (
                    <div>
                      <p className="text-gray-500">变动幅度</p>
                      <p className={`font-medium ${anomaly.changePercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {anomaly.changePercentage > 0 ? '+' : ''}{anomaly.changePercentage.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">预警阈值</p>
                    <p className="font-medium">{anomaly.threshold}%</p>
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">建议措施：</p>
                  <p className="text-sm text-gray-600">{anomaly.suggestion}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== 第二阶段：多期对比标签页 ====================
import { performMultiPeriodAnalysis, type MultiPeriodAnalysisResult } from '@/utils/multiPeriodAnalysis';

// ==================== Phase 3: 财务预测标签页 ====================
interface FinancialForecastTabProps {
  financialData: FinancialData;
  metrics: AnalysisResultType['metrics'];
}

const FinancialForecastTab: React.FC<FinancialForecastTabProps> = ({ financialData, metrics }) => {
  const [forecastResult, setForecastResult] = React.useState<ForecastResult | null>(null);
  
  React.useEffect(() => {
    const result = performFinancialForecast(financialData, metrics);
    setForecastResult(result);
  }, [financialData, metrics]);
  
  if (!forecastResult) return null;
  
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down': return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getTrendText = (direction: string) => {
    switch (direction) {
      case 'up': return '上升';
      case 'down': return '下降';
      default: return '稳定';
    }
  };
  
  const getTrendClass = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600 bg-green-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* 预测概览 */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <LineChart className="w-8 h-8" />
                财务趋势预测
              </h3>
              <p className="text-blue-100">基于历史数据的未来3期财务预测</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                forecastResult.trends.overallTrend === 'positive' ? 'text-green-300' :
                forecastResult.trends.overallTrend === 'negative' ? 'text-red-300' : 'text-yellow-300'
              }`}>
                {forecastResult.trends.overallTrend === 'positive' ? '向好' :
                 forecastResult.trends.overallTrend === 'negative' ? '下行' : '稳定'}
              </div>
              <div className="text-blue-100">整体趋势</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(forecastResult.trends.revenueGrowth.direction)}
                <span className="text-blue-100">收入增长</span>
              </div>
              <div className={`text-xl font-bold ${getTrendClass(forecastResult.trends.revenueGrowth.direction)} px-2 py-1 rounded`}>
                {getTrendText(forecastResult.trends.revenueGrowth.direction)}
                <span className="text-sm ml-1">({forecastResult.trends.revenueGrowth.averageRate.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon(forecastResult.trends.profitGrowth.direction)}
                <span className="text-blue-100">利润增长</span>
              </div>
              <div className={`text-xl font-bold ${getTrendClass(forecastResult.trends.profitGrowth.direction)} px-2 py-1 rounded`}>
                {getTrendText(forecastResult.trends.profitGrowth.direction)}
                <span className="text-sm ml-1">({forecastResult.trends.profitGrowth.averageRate.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-100" />
                <span className="text-blue-100">波动性</span>
              </div>
              <div className={`text-xl font-bold px-2 py-1 rounded ${
                forecastResult.trends.volatility === 'high' ? 'text-red-300 bg-red-500/20' :
                forecastResult.trends.volatility === 'medium' ? 'text-yellow-300 bg-yellow-500/20' :
                'text-green-300 bg-green-500/20'
              }`}>
                {forecastResult.trends.volatility === 'high' ? '高' :
                 forecastResult.trends.volatility === 'medium' ? '中' : '低'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 关键指标预测 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            关键指标预测
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecastResult.keyMetricsForecast.map((metric: any, idx: number) => (
              <Card key={idx} className={`border-l-4 ${
                metric.status === 'healthy' ? 'border-l-green-500' :
                metric.status === 'warning' ? 'border-l-yellow-500' :
                'border-l-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{metric.metricName}</span>
                    {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-500" /> :
                     metric.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                     <Minus className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{metric.forecastValue.toFixed(2)}</span>
                    <span className={`text-sm ${
                      metric.change > 0 ? 'text-green-600' :
                      metric.change < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    当前值: {metric.currentValue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 预测建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            预测分析与建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecastResult.suggestions.map((suggestion: string, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                {suggestion}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== Phase 3: 行业对比标签页 ====================
interface IndustryComparisonTabProps {
  metrics: AnalysisResultType['metrics'];
}

const IndustryComparisonTab: React.FC<IndustryComparisonTabProps> = ({ metrics }) => {
  const [selectedIndustry, setSelectedIndustry] = React.useState('通用');
  const [comparison, setComparison] = React.useState<IndustryComparisonResult | null>(null);
  const industries = getAvailableIndustries();
  
  React.useEffect(() => {
    const result = performIndustryComparison(metrics, selectedIndustry);
    setComparison(result);
  }, [metrics, selectedIndustry]);
  
  if (!comparison) return null;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return <Badge className="bg-green-500">优秀</Badge>;
      case 'good': return <Badge className="bg-blue-500">良好</Badge>;
      case 'average': return <Badge variant="secondary">平均</Badge>;
      case 'below': return <Badge className="bg-yellow-500">偏下</Badge>;
      case 'poor': return <Badge variant="destructive">落后</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 行业选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            行业选择
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {industries.map((industry: string) => (
              <button
                key={industry}
                onClick={() => setSelectedIndustry(industry)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedIndustry === industry
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 综合评分 */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">与{comparison.industry}对比</h3>
              <p className="text-indigo-100">基于10项核心指标的竞争力分析</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{comparison.overallScore}</div>
              <div className="text-indigo-100">综合得分</div>
            </div>
          </div>
          <div className="mt-4 text-lg font-medium">
            {comparison.ranking}
          </div>
        </CardContent>
      </Card>
      
      {/* 优势与劣势 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              竞争优势 ({comparison.strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparison.strengths.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无显著优势指标</p>
            ) : (
              <div className="space-y-2">
                {comparison.strengths.map((strength: string, idx: number) => (
                  <div key={idx} className="p-2 bg-green-50 rounded text-sm text-green-800">
                    ✓ {strength}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              改进空间 ({comparison.weaknesses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comparison.weaknesses.length === 0 ? (
              <p className="text-gray-500 text-sm">各项指标表现良好</p>
            ) : (
              <div className="space-y-2">
                {comparison.weaknesses.map((weakness: string, idx: number) => (
                  <div key={idx} className="p-2 bg-red-50 rounded text-sm text-red-800">
                    • {weakness}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 详细对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            指标详细对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparison.comparisonMetrics.map((metric: IndustryMetricComparison, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{metric.metricName}</span>
                    {getStatusBadge(metric.status)}
                  </div>
                  <div className="text-sm text-gray-500">
                    百分位排名: {metric.percentile}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">企业值</span>
                    <div className={`font-bold ${
                      metric.gap > 0 ? 'text-green-600' : metric.gap < 0 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {metric.companyValue}
                      {metric.gap > 0 ? ' ↑' : metric.gap < 0 ? ' ↓' : ''}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">行业平均</span>
                    <div className="font-medium">{metric.industryAvg}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">与行业差距</span>
                    <div className={`font-medium ${metric.gap > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.gap > 0 ? '+' : ''}{metric.gap}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            竞争力提升建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {comparison.suggestions.map((suggestion: string, idx: number) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                {suggestion}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== Phase 3: 智能报告标签页 ====================
interface SmartReportTabProps {
  financialData: FinancialData;
  metrics: AnalysisResultType['metrics'];
}

const SmartReportTab: React.FC<SmartReportTabProps> = ({ financialData, metrics }) => {
  const [report, setReport] = React.useState<SmartReport | null>(null);
  
  React.useEffect(() => {
    const generateReport = async () => {
      // 先生成异常检测结果
      const { detectAnomalies } = await import('@/utils/anomalyDetection');
      const anomalies: Anomaly[] = detectAnomalies(financialData);
      
      // 生成预测结果
      const forecast = performFinancialForecast(financialData, metrics);
      
      // 生成行业对比
      const industryComparison = performIndustryComparison(metrics);
      
      // 生成智能报告
      const generatedReport = generateSmartReport(
        financialData,
        metrics,
        anomalies,
        forecast,
        industryComparison,
        {
          companyName: '本公司',
          reportPeriod: '本期'
        }
      );
      
      setReport(generatedReport);
    };
    
    generateReport();
  }, [financialData, metrics]);
  
  if (!report) return null;
  
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getHealthText = (health: string) => {
    switch (health) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'fair': return '一般';
      case 'poor': return '较差';
      case 'critical': return '严峻';
      default: return '未知';
    }
  };
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const downloadReport = () => {
    const blob = new Blob([report.fullText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '财务分析报告.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 报告标题 */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FileSearch className="w-8 h-8" />
                智能财务分析报告
              </h3>
              <p className="text-blue-100">生成时间: {report.generatedAt}</p>
            </div>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* 执行摘要 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            执行摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-24 h-24 rounded-full ${getHealthColor(report.executiveSummary.overallHealth)} flex items-center justify-center`}>
              <div className="text-center text-white">
                <div className="text-3xl font-bold">{report.executiveSummary.overallScore}</div>
                <div className="text-xs">评分</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold mb-2">
                财务健康状况: <span className={getHealthColor(report.executiveSummary.overallHealth).replace('bg-', 'text-').replace('500', '600')}>
                  {getHealthText(report.executiveSummary.overallHealth)}
                </span>
              </div>
              <p className="text-gray-600">{report.executiveSummary.oneSentenceSummary}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {report.executiveSummary.keyHighlights.map((highlight: string, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg text-sm ${
                highlight.includes('⚠️') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
              }`}>
                {highlight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 关键发现 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            关键发现 ({report.keyFindings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.keyFindings.map((finding: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Badge variant={finding.impact === 'high' ? 'destructive' : finding.impact === 'medium' ? 'default' : 'secondary'}>
                    {finding.impact === 'high' ? '高影响' : finding.impact === 'medium' ? '中影响' : '低影响'}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{finding.title}</div>
                    <div className="text-sm text-gray-500 mb-1">{finding.category}</div>
                    <p className="text-sm text-gray-700">{finding.description}</p>
                    <p className="text-xs text-gray-400 mt-2">数据: {finding.data}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 风险评估 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            风险评估
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-3xl font-bold ${getRiskColor(report.riskAssessment.overallRisk)}`}>
              {report.riskAssessment.overallRisk === 'low' ? '低风险' :
               report.riskAssessment.overallRisk === 'medium' ? '中等风险' :
               report.riskAssessment.overallRisk === 'high' ? '高风险' : '极高风险'}
            </div>
            <div className="text-gray-500">
              风险评分: {report.riskAssessment.riskScore}/100
            </div>
          </div>
          
          {report.riskAssessment.riskFactors.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="font-medium text-gray-700">主要风险因素:</div>
              {report.riskAssessment.riskFactors.map((factor: any, idx: number) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-800">{factor.name}</span>
                    <Badge variant={factor.level === 'high' || factor.level === 'critical' ? 'destructive' : 'default'}>
                      {factor.level === 'high' ? '高风险' : factor.level === 'medium' ? '中风险' : '低风险'}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{factor.description}</p>
                </div>
              ))}
            </div>
          )}
          
          {report.riskAssessment.mitigations.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium text-gray-700">风险缓解措施:</div>
              {report.riskAssessment.mitigations.map((mitigation: string, idx: number) => (
                <div key={idx} className="p-2 bg-green-50 rounded text-sm text-green-800">
                  ✓ {mitigation}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 改进建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            改进建议 ({report.recommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'}>
                      {rec.priority === 'critical' ? '紧急' : rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低'}
                    </Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">难度: {
                    rec.difficulty === 'easy' ? '简单' : rec.difficulty === 'medium' ? '中等' : '困难'
                  }</span>
                </div>
                <div className="font-medium text-gray-900 mb-1">{rec.title}</div>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <p className="text-xs text-green-600">预期效果: {rec.expectedImpact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 行动计划 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            行动计划
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.actionPlan.map((action: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    action.phase === 'immediate' ? 'destructive' :
                    action.phase === 'short-term' ? 'default' :
                    action.phase === 'medium-term' ? 'secondary' : 'outline'
                  }>
                    {action.phase === 'immediate' ? '立即执行' :
                     action.phase === 'short-term' ? '短期行动' :
                     action.phase === 'medium-term' ? '中期规划' : '长期目标'}
                  </Badge>
                  <span className="text-xs text-gray-500">时间: {action.timeline}</span>
                </div>
                <div className="font-medium text-gray-900">{action.action}</div>
                <div className="text-sm text-gray-500">负责: {action.responsible}</div>
                <div className="text-xs text-green-600 mt-1">{action.expectedOutcome}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MultiPeriodAnalysisTab: React.FC<{ 
  financialData: FinancialData; 
  metrics: AnalysisResultType['metrics'] 
}> = ({ financialData, metrics }) => {
  // 添加错误边界处理
  const [analysis, setAnalysis] = React.useState<MultiPeriodAnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    try {
      const result = performMultiPeriodAnalysis(financialData, metrics);
      setAnalysis(result);
      setError(null);
    } catch (err) {
      console.error('多期对比分析出错:', err);
      setError('多期对比分析过程中出现错误');
      setAnalysis(null);
    }
  }, [financialData, metrics]);
  
  // 如果出错，显示错误信息
  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-700 font-medium">分析出错</p>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <p className="text-xs text-gray-500 mt-4">请检查数据是否包含有效的期初/上期数据</p>
        </CardContent>
      </Card>
    );
  }
  
  // 如果还在加载，显示加载状态
  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">正在分析...</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const ComparisonTable = ({ 
    title, 
    items 
  }: { 
    title: string; 
    items: MultiPeriodAnalysisResult['balanceSheetComparison'] 
  }) => (
    <Card className="h-full">
      <CardHeader className="py-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">无数据</p>
          ) : (
            items.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {getTrendIcon(item.trend)}
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrencyUniform(item.currentPeriod)}
                  </div>
                  <div className={`text-xs ${
                    item.percentageChange > 0 ? 'text-red-600' : 
                    item.percentageChange < 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {item.percentageChange > 0 ? '+' : ''}{item.percentageChange.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-blue-600">对比项目</p>
            <p className="text-2xl font-bold text-blue-800">{analysis.summary.totalItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-green-600">增长</p>
            <p className="text-2xl font-bold text-green-800">{analysis.summary.increasedItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-red-600">下降</p>
            <p className="text-2xl font-bold text-red-800">{analysis.summary.decreasedItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">持平</p>
            <p className="text-2xl font-bold text-gray-800">{analysis.summary.stableItems}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-yellow-600">重大变动</p>
            <p className="text-2xl font-bold text-yellow-800">{analysis.summary.significantChanges}</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势分析 */}
      {analysis.trendAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.trendAnalysis.map((trend, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${
                  trend.direction === 'positive' ? 'bg-green-50' :
                  trend.direction === 'negative' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge variant={trend.direction === 'positive' ? 'default' : trend.direction === 'negative' ? 'destructive' : 'secondary'}>
                      {trend.category}
                    </Badge>
                    <span className={`text-sm ${
                      trend.direction === 'positive' ? 'text-green-700' :
                      trend.direction === 'negative' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {trend.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 对比表格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonTable title="资产负债表对比" items={analysis.balanceSheetComparison} />
        <ComparisonTable title="利润表对比" items={analysis.incomeStatementComparison} />
      </div>

      {/* 指标对比 */}
      <ComparisonTable title="财务指标对比" items={analysis.ratioComparison} />

      {/* 建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            分析建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                {suggestion}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResultComponent;
