import React from 'react';
import { Building2, Calendar, ChevronRight, Trash2, TrendingUp, FileSpreadsheet } from 'lucide-react';
import type { CompanyAccount } from '@/types/company';

interface CompanyCardProps {
  company: CompanyAccount;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onSelect,
  onDelete,
}) => {
  const periodCount = company.periods.length;
  const latestPeriod = company.periods[company.periods.length - 1];
  
  // 获取最近的3个期间
  const recentPeriods = company.periods
    .slice(-3)
    .map(p => p.period)
    .reverse();
  
  return (
    <div 
      onClick={onSelect}
      className="
        group relative bg-white rounded-2xl p-6 
        shadow-sm border border-gray-100
        hover:shadow-xl hover:border-blue-200
        transition-all duration-300 cursor-pointer
        transform hover:-translate-y-1
      "
    >
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="
          absolute top-4 right-4 p-2 rounded-lg
          text-gray-400 hover:text-rose-500 hover:bg-rose-50
          opacity-0 group-hover:opacity-100
          transition-all duration-200
        "
        title="删除公司"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      {/* 公司图标和名称 */}
      <div className="flex items-start gap-4 mb-5">
        <div className="
          p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600
          text-white shadow-lg shadow-blue-500/30
        ">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex-1 pr-8">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {company.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{periodCount} 期数据</span>
          </div>
        </div>
      </div>
      
      {/* 数据概览 */}
      {latestPeriod && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">最近期间</p>
              <p className="text-lg font-semibold text-gray-900">
                {latestPeriod.period}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">总资产</p>
              <p className="text-lg font-semibold text-blue-600">
                {(latestPeriod.financialData.totalAssets / 10000).toFixed(1)}万
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 期间标签 */}
      {recentPeriods.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">最近上传</p>
          <div className="flex flex-wrap gap-2">
            {recentPeriods.map((period, idx) => (
              <span 
                key={idx}
                className="
                  inline-flex items-center gap-1 px-3 py-1.5
                  bg-blue-50 text-blue-600 text-sm rounded-lg
                  border border-blue-100
                "
              >
                <Calendar className="w-3 h-3" />
                {period}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* 底部操作 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>点击查看详情</span>
        </div>
        <div className="
          flex items-center gap-1 text-sm font-medium text-blue-600
          group-hover:translate-x-1 transition-transform
        ">
          进入查看
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
