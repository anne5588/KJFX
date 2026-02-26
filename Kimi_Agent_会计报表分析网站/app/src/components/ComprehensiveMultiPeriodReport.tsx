// ==================== 综合多期财务分析报告 ====================
// 专业的财务分析展示组件

import React, { useState, useMemo } from 'react';
import type { PeriodData } from '@/types/company';
import { 
  TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  Activity, Target, AlertTriangle, Lightbulb, FileText,
  BarChart3, PieChart, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle, Zap, Shield, TrendingUp as TrendIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  performComprehensiveMultiPeriodAnalysis,
  type ComprehensiveMultiPeriodReport as ReportType,
  type TrendAnalysis
} from '@/utils/comprehensiveMultiPeriodAnalysis';

interface Props {
  periods: PeriodData[];
  onClose?: () => void;
}

// 格式化金额
const formatAmount = (value: number): string => {
  if (Math.abs(value) >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  } else if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(2) + '万';
  }
  return value.toFixed(0);
};

// 格式化百分比（保留供后续使用）
// const formatPercent = (value: number): string => {
//   return value.toFixed(2) + '%';
// };

// 趋势指示器组件
const TrendBadge: React.FC<{ 
  trend: 'up' | 'down' | 'stable' | 'fluctuating'; 
  label?: string;
}> = ({ trend, label }) => {
  const configs = {
    up: { color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp, label: '上升' },
    down: { color: 'bg-rose-100 text-rose-700', icon: TrendingDown, label: '下降' },
    stable: { color: 'bg-blue-100 text-blue-700', icon: Minus, label: '平稳' },
    fluctuating: { color: 'bg-amber-100 text-amber-700', icon: Activity, label: '波动' },
  };
  const config = configs[trend];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
      <Icon className="w-3 h-3" />
      {label || config.label}
    </span>
  );
};

// 指标趋势卡片
const MetricTrendCard: React.FC<{
  title: string;
  analysis: TrendAnalysis;
  unit?: string;
}> = ({ title, analysis, unit = '' }) => {
  const latest = analysis.values[analysis.values.length - 1];
  const previous = analysis.values[analysis.values.length - 2];
  const change = previous ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100 : 0;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{title}</span>
          <TrendBadge trend={analysis.trend} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {typeof latest.value === 'number' && Math.abs(latest.value) > 100 
              ? formatAmount(latest.value) 
              : latest.value.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className={`flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">波动率 {analysis.volatility.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

// 执行摘要组件
const ExecutiveSummary: React.FC<{ report: ReportType }> = ({ report }) => {
  const { executiveSummary } = report;
  
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">执行摘要</h3>
          </div>
          <p className="text-blue-100 text-lg mb-4">
            企业整体呈<span className="font-semibold text-white">「{executiveSummary.overallTrend}」</span>态势
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-blue-200 text-sm mb-2">关键亮点</p>
              {executiveSummary.keyHighlights.map((h, i) => (
                <p key={i} className="text-sm">{h}</p>
              ))}
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-blue-200 text-sm mb-2">风险提示</p>
              {executiveSummary.riskAlerts.map((r, i) => (
                <p key={i} className="text-sm">{r}</p>
              ))}
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-blue-200 text-sm mb-2">发展机会</p>
              {executiveSummary.opportunities.map((o, i) => (
                <p key={i} className="text-sm">{o}</p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 核心趋势分析
const CoreTrendsAnalysis: React.FC<{ report: ReportType }> = ({ report }) => {
  const { coreTrends } = report;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTrendCard title="营业收入" analysis={coreTrends.revenue} />
        <MetricTrendCard title="净利润" analysis={coreTrends.netProfit} />
        <MetricTrendCard title="总资产" analysis={coreTrends.totalAssets} />
        <MetricTrendCard title="经营现金流" analysis={coreTrends.operatingCashflow} />
      </div>
      
      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            核心指标趋势图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {coreTrends.revenue.values.map((item, idx) => {
              const maxRevenue = Math.max(...coreTrends.revenue.values.map(v => v.value));
              const height = maxRevenue > 0 ? (item.value / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs text-gray-500">{item.period}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 五大能力分析
const CapabilityAnalysis: React.FC<{ report: ReportType }> = ({ report }) => {
  const { capabilities } = report;
  
  const sections = [
    { title: '盈利能力', icon: Target, data: capabilities.profitability },
    { title: '营运能力', icon: Activity, data: capabilities.operation },
    { title: '偿债能力', icon: Shield, data: capabilities.solvency },
    { title: '成长能力', icon: TrendIcon, data: capabilities.growth },
    { title: '现金流能力', icon: Zap, data: capabilities.cashflow },
  ];
  
  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <section.icon className="w-5 h-5 text-blue-600" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(section.data).map(([key, analysis]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{analysis.metric}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {analysis.values[analysis.values.length - 1]?.value.toFixed(2)}
                    </span>
                    <TrendBadge trend={analysis.trend} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// 杜邦分析
const DupontAnalysis: React.FC<{ report: ReportType }> = ({ report }) => {
  const { dupontTrend } = report;
  
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">杜邦分析驱动因素</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-indigo-200 text-sm mb-2">盈利驱动</p>
              <span className={`text-2xl font-bold ${
                dupontTrend.drivers.profitDriver === 'high' ? 'text-emerald-300' :
                dupontTrend.drivers.profitDriver === 'medium' ? 'text-yellow-300' : 'text-rose-300'
              }`}>
                {dupontTrend.drivers.profitDriver === 'high' ? '强' :
                 dupontTrend.drivers.profitDriver === 'medium' ? '中' : '弱'}
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-indigo-200 text-sm mb-2">效率驱动</p>
              <span className={`text-2xl font-bold ${
                dupontTrend.drivers.efficiencyDriver === 'high' ? 'text-emerald-300' :
                dupontTrend.drivers.efficiencyDriver === 'medium' ? 'text-yellow-300' : 'text-rose-300'
              }`}>
                {dupontTrend.drivers.efficiencyDriver === 'high' ? '强' :
                 dupontTrend.drivers.efficiencyDriver === 'medium' ? '中' : '弱'}
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-indigo-200 text-sm mb-2">杠杆驱动</p>
              <span className={`text-2xl font-bold ${
                dupontTrend.drivers.leverageDriver === 'high' ? 'text-emerald-300' :
                dupontTrend.drivers.leverageDriver === 'medium' ? 'text-yellow-300' : 'text-rose-300'
              }`}>
                {dupontTrend.drivers.leverageDriver === 'high' ? '强' :
                 dupontTrend.drivers.leverageDriver === 'medium' ? '中' : '弱'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTrendCard title="ROE" analysis={dupontTrend.roe} unit="%" />
        <MetricTrendCard title="销售净利率" analysis={dupontTrend.netMargin} unit="%" />
        <MetricTrendCard title="总资产周转率" analysis={dupontTrend.assetTurnover} />
        <MetricTrendCard title="权益乘数" analysis={dupontTrend.equityMultiplier} />
      </div>
    </div>
  );
};

// 异常波动分析
const AbnormalFluctuations: React.FC<{ report: ReportType }> = ({ report }) => {
  const { abnormalFluctuations } = report;
  
  if (abnormalFluctuations.length === 0) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-6 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="font-semibold text-emerald-900">未发现异常波动</h3>
            <p className="text-emerald-700 text-sm">各期财务指标变化在正常范围内</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {abnormalFluctuations.map((item, idx) => (
        <Card key={idx} className={`border-l-4 ${
          item.severity === 'high' ? 'border-l-rose-500' : 'border-l-amber-500'
        }`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                item.severity === 'high' ? 'bg-rose-100' : 'bg-amber-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  item.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold">{item.subject}</h4>
                  <Badge variant={item.severity === 'high' ? 'destructive' : 'secondary'}>
                    {item.severity === 'high' ? '高风险' : '中风险'}
                  </Badge>
                  <span className="text-sm text-gray-500">{item.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  从 {formatAmount(item.previousValue)} 变化至 {formatAmount(item.currentValue)}，
                  变动幅度 <span className={`font-semibold ${
                    item.changeRate > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>{item.changeRate > 0 ? '+' : ''}{item.changeRate.toFixed(1)}%</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.possibleReasons.map((reason, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {reason}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-blue-600">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  {item.suggestion}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// 预测与建议
const ForecastAndSuggestions: React.FC<{ report: ReportType }> = ({ report }) => {
  const { forecast } = report;
  
  return (
    <div className="space-y-6">
      {/* 预测 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            下期预测
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-3">预测营业收入</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">保守</span>
                  <span className="font-medium">{formatAmount(forecast.nextQuarterRevenue.low)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">基准</span>
                  <span className="font-bold text-blue-600">{formatAmount(forecast.nextQuarterRevenue.base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">乐观</span>
                  <span className="font-medium">{formatAmount(forecast.nextQuarterRevenue.high)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600 mb-3">预测净利润</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">保守</span>
                  <span className="font-medium">{formatAmount(forecast.nextQuarterProfit.low)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">基准</span>
                  <span className="font-bold text-emerald-600">{formatAmount(forecast.nextQuarterProfit.base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">乐观</span>
                  <span className="font-medium">{formatAmount(forecast.nextQuarterProfit.high)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 风险警告 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            风险预警
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forecast.riskWarnings.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm">{warning}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 战略建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            战略建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {forecast.strategicSuggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 主组件
const ComprehensiveMultiPeriodReport: React.FC<Props> = ({ periods, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  const report = useMemo(() => {
    try {
      return performComprehensiveMultiPeriodAnalysis(periods);
    } catch (error) {
      console.error('分析失败:', error);
      return null;
    }
  }, [periods]);
  
  if (!report) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
        <p className="text-gray-600">数据不足以生成完整报告，请确保至少有两个期间的数据</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航 */}
      <div className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="mb-3 -ml-2 text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
          <h2 className="text-lg font-bold text-gray-900">多期分析报告</h2>
          <p className="text-xs text-gray-500 mt-1">共 {periods.length} 个期间</p>
        </div>
        
        <nav className="p-2 space-y-1">
          {[
            { id: 'summary', label: '执行摘要', icon: FileText },
            { id: 'trends', label: '核心趋势', icon: TrendingUp },
            { id: 'capabilities', label: '五大能力', icon: Target },
            { id: 'dupont', label: '杜邦分析', icon: PieChart },
            { id: 'abnormal', label: '异常波动', icon: AlertTriangle },
            { id: 'forecast', label: '预测建议', icon: Lightbulb },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {activeTab === id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'summary' && <ExecutiveSummary report={report} />}
          {activeTab === 'trends' && <CoreTrendsAnalysis report={report} />}
          {activeTab === 'capabilities' && <CapabilityAnalysis report={report} />}
          {activeTab === 'dupont' && <DupontAnalysis report={report} />}
          {activeTab === 'abnormal' && <AbnormalFluctuations report={report} />}
          {activeTab === 'forecast' && <ForecastAndSuggestions report={report} />}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveMultiPeriodReport;
