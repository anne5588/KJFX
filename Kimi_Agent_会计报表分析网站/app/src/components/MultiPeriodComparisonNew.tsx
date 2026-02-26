// ==================== 多期对比分析 - 全新UI设计 ====================
// 借鉴帆软九数云模板风格，左侧导航+章节式展示

import React, { useState, useMemo } from 'react';
import type { PeriodData } from '@/types/company';
import { 
  TrendingUp, Minus, ArrowUpRight, ArrowDownRight,
  Activity, ShoppingCart, Package, CreditCard, Wallet, Target, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeIncomeCostExpense, type IncomeCostExpenseAnalysis } from '@/utils/multiPeriodComparison';

interface MultiPeriodComparisonNewProps {
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

// 格式化百分比
const formatPercent = (value: number): string => {
  return (value * 100).toFixed(2) + '%';
};

// 变化趋势组件
const TrendIndicator: React.FC<{ 
  current: number; 
  previous: number;
  showValue?: boolean;
}> = ({ current, previous, showValue = true }) => {
  const change = previous !== 0 ? (current - previous) / Math.abs(previous) : 0;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.001;
  
  if (isNeutral) {
    return (
      <span className="flex items-center gap-1 text-gray-500">
        <Minus className="w-4 h-4" />
        {showValue && <span>持平</span>}
      </span>
    );
  }
  
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
      {showValue && <span>{Math.abs(change * 100).toFixed(2)}%</span>}
    </span>
  );
};

// KPI卡片组件
const KPICard: React.FC<{
  title: string;
  value: number;
  previousValue: number;
  unit?: string;
  format?: 'amount' | 'percent';
  icon?: React.ReactNode;
}> = ({ title, value, previousValue, unit = '', format = 'amount', icon }) => {
  const displayValue = format === 'amount' ? formatAmount(value) : formatPercent(value);
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{displayValue}{unit}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendIndicator current={value} previous={previousValue} />
              <span className="text-xs text-gray-400">较上期</span>
            </div>
          </div>
          {icon && (
            <div className="p-3 bg-blue-50 rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 智能分析摘要组件
const AnalysisSummary: React.FC<{
  periods: PeriodData[];
  analysis: IncomeCostExpenseAnalysis;
}> = ({ periods, analysis }) => {
  const latest = periods[periods.length - 1];
  const previous = periods.length > 1 ? periods[periods.length - 2] : null;
  
  const summary = useMemo(() => {
    const parts: string[] = [];
    
    // 收入分析
    const latestRevenue = analysis.revenue[analysis.revenue.length - 1];
    const prevRevenue = analysis.revenue[analysis.revenue.length - 2];
    if (latestRevenue && prevRevenue) {
      const growth = ((latestRevenue.totalRevenue - prevRevenue.totalRevenue) / prevRevenue.totalRevenue * 100);
      parts.push(`营业收入${growth > 0 ? '增长' : '下降'}${Math.abs(growth).toFixed(1)}%，达到${formatAmount(latestRevenue.totalRevenue)}`);
    }
    
    // 成本分析
    const latestCost = analysis.cost[analysis.cost.length - 1];
    if (latestCost) {
      parts.push(`成本率${latestCost.costRatio.toFixed(1)}%`);
    }
    
    // 利润分析
    if (latest && previous) {
      const profitChange = ((latest.financialData.netProfit - previous.financialData.netProfit) / 
        Math.abs(previous.financialData.netProfit || 1) * 100);
      parts.push(`净利润${profitChange > 0 ? '增长' : '下降'}${Math.abs(profitChange).toFixed(1)}%`);
    }
    
    return parts.join('，') + '。';
  }, [analysis, latest, previous]);
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">分析摘要</h3>
            <p className="text-blue-800 leading-relaxed">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 趋势折线图组件（简化版）
const TrendChart: React.FC<{
  data: { period: string; value: number }[];
  title: string;
  color?: string;
}> = ({ data, title, color = '#3b82f6' }) => {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  // 生成SVG路径
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 100" className="w-full h-48">
          {/* 网格线 */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* 折线 */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          {/* 数据点 */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - min) / range) * 80 - 10;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="2" fill={color} />
                <text x={x} y="95" fontSize="3" textAnchor="middle" fill="#6b7280">
                  {d.period}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
};

// 瀑布图组件（展示累积变化）
const WaterfallChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  title: string;
}> = ({ data, title }) => {
  const max = Math.max(...data.map(d => Math.abs(d.value)));
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-20 text-sm text-gray-600 truncate">{item.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color || (item.value > 0 ? 'bg-green-500' : 'bg-red-500')}`}
                  style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
                />
              </div>
              <span className={`w-24 text-sm font-medium text-right ${item.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.value > 0 ? '+' : ''}{formatAmount(item.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 对比表格组件
const ComparisonTable: React.FC<{
  periods: PeriodData[];
}> = ({ periods }) => {
  const sortedPeriods = [...periods].sort((a, b) => a.periodDate.localeCompare(b.periodDate));
  
  const metrics = [
    { key: 'totalIncome', label: '营业收入', format: 'amount' },
    { key: 'totalExpenses', label: '营业成本', format: 'amount' },
    { key: 'netProfit', label: '净利润', format: 'amount' },
    { key: 'totalAssets', label: '总资产', format: 'amount' },
    { key: 'totalLiabilities', label: '总负债', format: 'amount' },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">关键指标对比</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-500">指标</th>
                {sortedPeriods.map(p => (
                  <th key={p.period} className="text-right py-2 text-sm font-medium text-gray-500">
                    {p.period}
                  </th>
                ))}
                <th className="text-right py-2 text-sm font-medium text-blue-600">趋势</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => {
                const values = sortedPeriods.map(p => {
                  const data = p.financialData as any;
                  return data[metric.key] || 0;
                });
                const latest = values[values.length - 1];
                const previous = values[values.length - 2] || latest;
                
                return (
                  <tr key={metric.key} className="border-b last:border-0">
                    <td className="py-3 text-sm font-medium">{metric.label}</td>
                    {values.map((v, i) => (
                      <td key={i} className="text-right py-3 text-sm">
                        {formatAmount(v)}
                      </td>
                    ))}
                    <td className="text-right py-3">
                      <TrendIndicator current={latest} previous={previous} showValue={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// 主组件
const MultiPeriodComparisonNew: React.FC<MultiPeriodComparisonNewProps> = ({ periods, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');
  
  // 按期间排序
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.periodDate.localeCompare(b.periodDate));
  }, [periods]);
  
  // 获取最新两期数据
  const latest = sortedPeriods[sortedPeriods.length - 1];
  const previous = sortedPeriods.length > 1 ? sortedPeriods[sortedPeriods.length - 2] : null;
  
  // 执行多期分析
  const analysis = useMemo(() => {
    return analyzeIncomeCostExpense(sortedPeriods);
  }, [sortedPeriods]);
  
  // 导航菜单
  const navItems = [
    { id: 'overview', label: '总览', icon: <Activity className="w-4 h-4" /> },
    { id: 'revenue', label: '收入分析', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'cost', label: '成本分析', icon: <Package className="w-4 h-4" /> },
    { id: 'expense', label: '费用分析', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'profit', label: '利润分析', icon: <Wallet className="w-4 h-4" /> },
    { id: 'trend', label: '增长趋势', icon: <TrendingUp className="w-4 h-4" /> },
  ];
  
  if (periods.length < 2) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>至少需要两个期间的数据才能进行对比分析</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧导航 */}
      <div className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="mb-3 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          )}
          <h2 className="text-lg font-bold text-gray-900">多期对比分析</h2>
          <p className="text-xs text-gray-500 mt-1">共 {periods.length} 个期间</p>
        </div>
        <nav className="p-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>
      </div>
      
      {/* 右侧内容区 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 顶部KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPICard
            title="营业收入"
            value={latest.financialData.totalIncome}
            previousValue={previous?.financialData.totalIncome || 0}
            icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
          />
          <KPICard
            title="营业成本"
            value={latest.financialData.totalExpenses * 0.7}
            previousValue={(previous?.financialData.totalExpenses || 0) * 0.7}
            icon={<Package className="w-5 h-5 text-orange-600" />}
          />
          <KPICard
            title="净利润"
            value={latest.financialData.netProfit}
            previousValue={previous?.financialData.netProfit || 0}
            icon={<Wallet className="w-5 h-5 text-green-600" />}
          />
          <KPICard
            title="总资产"
            value={latest.financialData.totalAssets}
            previousValue={previous?.financialData.totalAssets || 0}
            icon={<Target className="w-5 h-5 text-purple-600" />}
          />
        </div>
        
        {/* 分析摘要 */}
        <div className="mb-6">
          <AnalysisSummary periods={sortedPeriods} analysis={analysis} />
        </div>
        
        {/* 分章节内容 */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TrendChart
                data={analysis.revenue.map(r => ({ period: r.period, value: r.totalRevenue }))}
                title="营业收入趋势"
                color="#3b82f6"
              />
              <TrendChart
                data={analysis.cost.map(c => ({ period: c.period, value: c.totalCost }))}
                title="营业成本趋势"
                color="#f97316"
              />
            </div>
            <ComparisonTable periods={sortedPeriods} />
          </div>
        )}
        
        {activeSection === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TrendChart
                data={analysis.revenue.map(r => ({ period: r.period, value: r.totalRevenue }))}
                title="主营业务收入趋势"
                color="#3b82f6"
              />
              <TrendChart
                data={analysis.revenue.map(r => ({ period: r.period, value: r.growthRate }))}
                title="收入增长率"
                color="#10b981"
              />
            </div>
            <WaterfallChart
              title="收入构成分析"
              data={[
                { label: '主营业务收入', value: analysis.revenue[analysis.revenue.length - 1]?.mainRevenue || 0, color: '#3b82f6' },
                { label: '其他业务收入', value: analysis.revenue[analysis.revenue.length - 1]?.otherRevenue || 0, color: '#60a5fa' },
              ]}
            />
          </div>
        )}
        
        {activeSection === 'cost' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TrendChart
                data={analysis.cost.map(c => ({ period: c.period, value: c.totalCost }))}
                title="主营业务成本趋势"
                color="#f97316"
              />
              <TrendChart
                data={analysis.cost.map(c => ({ period: c.period, value: c.costRatio }))}
                title="成本率变化"
                color="#ef4444"
              />
            </div>
            <WaterfallChart
              title="成本构成分析"
              data={[
                { label: '主营业务成本', value: analysis.cost[analysis.cost.length - 1]?.mainCost || 0, color: '#f97316' },
                { label: '其他业务成本', value: analysis.cost[analysis.cost.length - 1]?.otherCost || 0, color: '#fbbf24' },
              ]}
            />
          </div>
        )}
        
        {activeSection === 'expense' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {analysis.expense.slice(-1).map((e, idx) => (
                <WaterfallChart
                  key={idx}
                  title={`${e.period} 费用构成`}
                  data={[
                    { label: '销售费用', value: e.salesExpense, color: '#8b5cf6' },
                    { label: '管理费用', value: e.adminExpense, color: '#a78bfa' },
                    { label: '财务费用', value: e.financeExpense, color: '#c4b5fd' },
                    { label: '其他费用', value: Math.max(0, e.totalExpense - e.salesExpense - e.adminExpense - e.financeExpense), color: '#ddd6fe' },
                  ]}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeSection === 'profit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <TrendChart
                data={sortedPeriods.map(p => ({ period: p.period, value: p.financialData.netProfit }))}
                title="净利润趋势"
                color="#10b981"
              />
              <TrendChart
                data={sortedPeriods.map(p => ({ 
                  period: p.period, 
                  value: p.financialData.totalIncome > 0 ? p.financialData.netProfit / p.financialData.totalIncome : 0 
                }))}
                title="净利率变化"
                color="#059669"
              />
            </div>
          </div>
        )}
        
        {activeSection === 'trend' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">综合增长趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <svg viewBox="0 0 400 200" className="w-full h-64">
                  {/* 收入线 */}
                  {(() => {
                    const data = analysis.revenue;
                    const max = Math.max(...data.map(d => d.totalRevenue));
                    const min = Math.min(...data.map(d => d.totalRevenue));
                    const range = max - min || 1;
                    const points = data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 350 + 25;
                      const y = 180 - ((d.totalRevenue - min) / range) * 150;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={points}
                      />
                    );
                  })()}
                  {/* 成本线 */}
                  {(() => {
                    const data = analysis.cost;
                    const max = Math.max(...data.map(d => d.totalCost));
                    const min = Math.min(...data.map(d => d.totalCost));
                    const range = max - min || 1;
                    const points = data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 350 + 25;
                      const y = 180 - ((d.totalCost - min) / range) * 150;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                        points={points}
                      />
                    );
                  })()}
                </svg>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">营业收入</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-orange-500 rounded"></div>
                    <span className="text-sm text-gray-600">营业成本</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiPeriodComparisonNew;
