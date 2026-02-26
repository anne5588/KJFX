// ==================== 公司账套数据模型 ====================

import type { FinancialData } from '@/utils/excelParser';
import type { FinancialMetrics } from './accounting';

// 公司账套
export interface CompanyAccount {
  id: string;                    // 唯一标识
  name: string;                  // 公司名称
  createdAt: string;             // 创建时间
  updatedAt: string;             // 更新时间
  periods: PeriodData[];         // 多期数据
}

// 单期数据
export interface PeriodData {
  id: string;                    // 唯一标识
  period: string;                // 期间（如"2024年Q1"、"2024年1月"）
  periodType: 'month' | 'quarter' | 'year';  // 期间类型
  periodDate: string;            // 期间日期（用于排序，格式：2024-01、2024-Q1）
  uploadedAt: string;            // 上传时间
  financialData: FinancialData;  // 财务数据
  metrics: FinancialMetrics;     // 财务指标
  dupontAnalysis: {
    roe: number;
    netProfitMargin: number;
    totalAssetTurnover: number;
    equityMultiplier: number;
  };
}

// 多期对比分析结果
export interface MultiPeriodComparison {
  companyId: string;
  companyName: string;
  periods: string[];             // 期间列表
  
  // 收入趋势
  revenueTrend: {
    period: string;
    revenue: number;
    growthRate: number;
  }[];
  
  // 成本趋势
  costTrend: {
    period: string;
    cost: number;
    growthRate: number;
    costRatio: number;           // 成本率
  }[];
  
  // 费用趋势
  expenseTrend: {
    period: string;
    expense: number;
    growthRate: number;
    expenseRatio: number;        // 费用率
  }[];
  
  // 利润趋势
  profitTrend: {
    period: string;
    grossProfit: number;
    operatingProfit: number;
    netProfit: number;
  }[];
  
  // 关键指标趋势
  keyMetricsTrend: {
    period: string;
    roe: number;
    grossMargin: number;
    netMargin: number;
  }[];
  
  // 分析总结
  summary: {
    revenueGrowth: string;
    costControl: string;
    expenseControl: string;
    profitability: string;
  };
}

// 存储管理
export interface CompanyStorage {
  companies: CompanyAccount[];
  currentCompanyId: string | null;
}

// 期间排序辅助函数
export const sortPeriods = (periods: PeriodData[]): PeriodData[] => {
  return [...periods].sort((a, b) => {
    return a.periodDate.localeCompare(b.periodDate);
  });
};

// 生成期间日期（用于排序）
export const generatePeriodDate = (period: string, type: 'month' | 'quarter' | 'year'): string => {
  const year = period.match(/(\d{4})/)?.[1] || '2024';
  
  if (type === 'year') {
    return `${year}-12`;
  }
  
  if (type === 'quarter') {
    const quarter = period.match(/Q([1-4])/)?.[1] || '1';
    const month = parseInt(quarter) * 3;
    return `${year}-${month.toString().padStart(2, '0')}`;
  }
  
  // month
  const month = period.match(/(\d{1,2})月/)?.[1] || '01';
  return `${year}-${month.padStart(2, '0')}`;
};
