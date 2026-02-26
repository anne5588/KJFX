import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  className?: string;
}

const variantStyles = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    iconBg: 'bg-white/20',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    iconBg: 'bg-white/20',
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-500 to-rose-600',
    lightBg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-200',
    iconBg: 'bg-white/20',
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
    iconBg: 'bg-white/20',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    lightBg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    iconBg: 'bg-white/20',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = '较上期',
  icon: Icon,
  variant = 'blue',
  className = '',
}) => {
  const styles = variantStyles[variant];
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl p-6
        ${styles.bg} text-white
        shadow-lg shadow-${variant}-500/25
        transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
        ${className}
      `}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      
      {/* 内容 */}
      <div className="relative z-10">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80 text-sm font-medium">{title}</span>
          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* 数值 */}
        <div className="mb-3">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {subtitle && (
            <span className="ml-2 text-white/70 text-sm">{subtitle}</span>
          )}
        </div>
        
        {/* 变化指示器 */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <span 
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                ${isPositive ? 'bg-white/20 text-white' : ''}
                ${isNegative ? 'bg-white/20 text-white' : ''}
                ${!isPositive && !isNegative ? 'bg-white/20 text-white' : ''}
              `}
            >
              {isPositive && <TrendingUp className="w-3 h-3" />}
              {isNegative && <TrendingDown className="w-3 h-3" />}
              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              {Math.abs(change).toFixed(2)}%
            </span>
            <span className="text-white/60 text-xs">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 简洁版指标卡片（用于次要指标）
export const MetricCardCompact: React.FC<{
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}> = ({ title, value, trend = 'neutral', trendValue }) => {
  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-rose-600 bg-rose-50',
    neutral: 'text-gray-600 bg-gray-50',
  };
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trendValue && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
