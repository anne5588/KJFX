// ==================== 沃尔评分法 - 财务综合评分系统 ====================
// 亚历山大·沃尔于20世纪初提出，通过7-10个核心财务指标评价企业信用水平

import type { FinancialMetrics } from '@/types/accounting';

// 沃尔评分指标配置
export interface WallScoringConfig {
  indicators: {
    name: string;           // 指标名称
    key: keyof FinancialMetrics;  // 对应FinancialMetrics的key
    weight: number;         // 权重(%)
    standardValue: number;  // 标准值(行业平均值)
    upperLimit: number;     // 上限值(优秀)
    lowerLimit: number;     // 下限值(较差)
    isHigherBetter: boolean; // 是否越高越好
    unit?: string;          // 单位
  }[];
}

// 默认沃尔评分配置（基于制造业/一般企业标准）
export const defaultWallScoringConfig: WallScoringConfig = {
  indicators: [
    {
      name: '流动比率',
      key: 'currentRatio',
      weight: 10,
      standardValue: 2.0,
      upperLimit: 3.0,
      lowerLimit: 1.0,
      isHigherBetter: true,
      unit: '',
    },
    {
      name: '净资产收益率',
      key: 'roe',
      weight: 15,
      standardValue: 15,
      upperLimit: 25,
      lowerLimit: 5,
      isHigherBetter: true,
      unit: '%',
    },
    {
      name: '总资产报酬率',
      key: 'roa',
      weight: 10,
      standardValue: 8,
      upperLimit: 15,
      lowerLimit: 3,
      isHigherBetter: true,
      unit: '%',
    },
    {
      name: '资产负债率',
      key: 'debtToAssetRatio',
      weight: 10,
      standardValue: 50,
      upperLimit: 70,
      lowerLimit: 30,
      isHigherBetter: false, // 越低越好
      unit: '%',
    },
    {
      name: '销售净利率',
      key: 'netProfitMargin',
      weight: 10,
      standardValue: 10,
      upperLimit: 20,
      lowerLimit: 3,
      isHigherBetter: true,
      unit: '%',
    },
    {
      name: '总资产周转率',
      key: 'totalAssetTurnover',
      weight: 10,
      standardValue: 1.0,
      upperLimit: 2.0,
      lowerLimit: 0.5,
      isHigherBetter: true,
      unit: '',
    },
    {
      name: '应收账款周转率',
      key: 'receivablesTurnover',
      weight: 10,
      standardValue: 6,
      upperLimit: 12,
      lowerLimit: 3,
      isHigherBetter: true,
      unit: '次',
    },
    {
      name: '存货周转率',
      key: 'inventoryTurnover',
      weight: 10,
      standardValue: 4,
      upperLimit: 8,
      lowerLimit: 2,
      isHigherBetter: true,
      unit: '次',
    },
    {
      name: '营业收入增长率',
      key: 'revenueGrowthRate',
      weight: 15,
      standardValue: 15,
      upperLimit: 30,
      lowerLimit: 0,
      isHigherBetter: true,
      unit: '%',
    },
  ],
};

// 评分结果
export interface WallScoringResult {
  totalScore: number;           // 总得分
  maxPossibleScore: number;     // 满分
  rating: string;               // 评级
  ratingColor: string;          // 评级颜色
  indicatorScores: {
    name: string;
    actualValue: number;
    standardValue: number;
    score: number;              // 单项得分
    maxScore: number;           // 单项满分
    weight: number;             // 权重
    unit: string;
    status: 'excellent' | 'good' | 'average' | 'poor';
  }[];
  suggestions: string[];        // 改进建议
}

// 计算沃尔评分
export const calculateWallScore = (
  metrics: FinancialMetrics,
  config: WallScoringConfig = defaultWallScoringConfig
): WallScoringResult => {
  const indicatorScores = config.indicators.map(indicator => {
    const actualValue = metrics[indicator.key] as number || 0;
    const maxScore = indicator.weight;
    
    let score: number;
    let status: 'excellent' | 'good' | 'average' | 'poor';
    
    if (indicator.isHigherBetter) {
      // 越高越好的指标
      if (actualValue >= indicator.upperLimit) {
        score = maxScore;
        status = 'excellent';
      } else if (actualValue >= indicator.standardValue) {
        // 标准值到上限值之间线性插值
        score = maxScore * (0.6 + 0.4 * (actualValue - indicator.standardValue) / 
          (indicator.upperLimit - indicator.standardValue));
        status = 'good';
      } else if (actualValue >= indicator.lowerLimit) {
        // 下限值到标准值之间线性插值
        score = maxScore * (0.3 + 0.3 * (actualValue - indicator.lowerLimit) / 
          (indicator.standardValue - indicator.lowerLimit));
        status = 'average';
      } else {
        // 低于下限值
        score = maxScore * 0.3 * (actualValue / indicator.lowerLimit);
        if (score < 0) score = 0;
        status = 'poor';
      }
    } else {
      // 越低越好的指标（如资产负债率）
      if (actualValue <= indicator.lowerLimit) {
        score = maxScore;
        status = 'excellent';
      } else if (actualValue <= indicator.standardValue) {
        score = maxScore * (0.6 + 0.4 * (indicator.standardValue - actualValue) / 
          (indicator.standardValue - indicator.lowerLimit));
        status = 'good';
      } else if (actualValue <= indicator.upperLimit) {
        score = maxScore * (0.3 + 0.3 * (indicator.upperLimit - actualValue) / 
          (indicator.upperLimit - indicator.standardValue));
        status = 'average';
      } else {
        score = maxScore * 0.3 * (indicator.upperLimit / actualValue);
        if (score < 0) score = 0;
        status = 'poor';
      }
    }
    
    return {
      name: indicator.name,
      actualValue: round(actualValue, 2),
      standardValue: indicator.standardValue,
      score: round(score, 1),
      maxScore,
      weight: indicator.weight,
      unit: indicator.unit || '',
      status,
    };
  });
  
  const totalScore = indicatorScores.reduce((sum, item) => sum + item.score, 0);
  const maxPossibleScore = config.indicators.reduce((sum, item) => sum + item.weight, 0);
  
  // 确定评级
  const scorePercentage = (totalScore / maxPossibleScore) * 100;
  let rating: string;
  let ratingColor: string;
  
  if (scorePercentage >= 90) {
    rating = 'AAA';
    ratingColor = '#10b981'; // 绿色
  } else if (scorePercentage >= 80) {
    rating = 'AA';
    ratingColor = '#22c55e';
  } else if (scorePercentage >= 70) {
    rating = 'A';
    ratingColor = '#84cc16';
  } else if (scorePercentage >= 60) {
    rating = 'BBB';
    ratingColor = '#eab308';
  } else if (scorePercentage >= 50) {
    rating = 'BB';
    ratingColor = '#f97316';
  } else if (scorePercentage >= 40) {
    rating = 'B';
    ratingColor = '#ef4444';
  } else {
    rating = 'C';
    ratingColor = '#dc2626';
  }
  
  // 生成改进建议
  const suggestions: string[] = [];
  const poorIndicators = indicatorScores.filter(i => i.status === 'poor');
  const averageIndicators = indicatorScores.filter(i => i.status === 'average');
  
  if (poorIndicators.length > 0) {
    suggestions.push(`【重点关注】${poorIndicators.map(i => i.name).join('、')}表现较差，需要重点改进。`);
  }
  
  if (averageIndicators.length > 0) {
    suggestions.push(`【待提升】${averageIndicators.map(i => i.name).join('、')}有提升空间。`);
  }
  
  // 针对具体指标的建议
  indicatorScores.forEach(indicator => {
    if (indicator.status === 'poor' || indicator.status === 'average') {
      if (indicator.name === '资产负债率' && indicator.actualValue > 70) {
        suggestions.push(`资产负债率${indicator.actualValue}%偏高，建议优化资本结构，降低财务风险。`);
      } else if (indicator.name === '流动比率' && indicator.actualValue < 1.5) {
        suggestions.push(`流动比率${indicator.actualValue}偏低，短期偿债压力较大，建议加强现金流管理。`);
      } else if (indicator.name === '净资产收益率' && indicator.actualValue < 10) {
        suggestions.push(`ROE ${indicator.actualValue}%偏低，盈利能力有待提升，建议优化成本结构或提高资产周转效率。`);
      } else if (indicator.name === '营业收入增长率' && indicator.actualValue < 10) {
        suggestions.push(`收入增长率${indicator.actualValue}%偏低，企业发展动力不足，建议拓展新市场或新产品。`);
      }
    }
  });
  
  if (suggestions.length === 0) {
    suggestions.push('恭喜！各项财务指标表现良好，请继续保持。');
  }
  
  return {
    totalScore: round(totalScore, 1),
    maxPossibleScore,
    rating,
    ratingColor,
    indicatorScores,
    suggestions,
  };
};

// 工具函数
const round = (value: number, decimals: number): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

// 获取评级描述
export const getRatingDescription = (rating: string): string => {
  const descriptions: Record<string, string> = {
    'AAA': '财务状况极佳，信用等级最高',
    'AA': '财务状况优秀，偿债能力很强',
    'A': '财务状况良好，偿债能力较强',
    'BBB': '财务状况一般，偿债能力适中',
    'BB': '财务状况较差，存在一定风险',
    'B': '财务状况不佳，风险较高',
    'C': '财务状况很差，风险极高',
  };
  return descriptions[rating] || '未知评级';
};

export default calculateWallScore;
