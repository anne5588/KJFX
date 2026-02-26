// ==================== 公司账套本地存储管理 ====================

import type { CompanyAccount, PeriodData, CompanyStorage } from '@/types/company';
import { generatePeriodDate } from '@/types/company';
import type { FinancialData } from '@/utils/excelParser';

const STORAGE_KEY = 'accounting-analysis-companies';

// 恢复 FinancialData 中的 Map
const restoreFinancialData = (data: any): FinancialData => {
  if (!data) return data;
  
  return {
    ...data,
    assets: new Map(data.assets || []),
    liabilities: new Map(data.liabilities || []),
    equity: new Map(data.equity || []),
    income: new Map(data.income || []),
    expenses: new Map(data.expenses || []),
    beginningAssets: new Map(data.beginningAssets || []),
    beginningLiabilities: new Map(data.beginningLiabilities || []),
    beginningEquity: new Map(data.beginningEquity || []),
    beginningIncome: new Map(data.beginningIncome || []),
    beginningExpenses: new Map(data.beginningExpenses || []),
  };
};

// 恢复期间数据
const restorePeriodData = (period: PeriodData): PeriodData => {
  return {
    ...period,
    financialData: restoreFinancialData(period.financialData),
  };
};

// 获取所有公司
export const getAllCompanies = (): CompanyAccount[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const storage: CompanyStorage = JSON.parse(data);
    
    // 恢复每个公司的期间数据中的 Map
    return (storage.companies || []).map(company => ({
      ...company,
      periods: company.periods.map(restorePeriodData),
    }));
  } catch (e) {
    console.error('读取公司数据失败:', e);
    return [];
  }
};

// 获取当前选中公司
export const getCurrentCompany = (): CompanyAccount | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const storage: CompanyStorage = JSON.parse(data);
    if (!storage.currentCompanyId) return null;
    const company = storage.companies.find(c => c.id === storage.currentCompanyId) || null;
    
    // 恢复期间数据中的 Map
    if (company) {
      return {
        ...company,
        periods: company.periods.map(restorePeriodData),
      };
    }
    return company;
  } catch (e) {
    console.error('读取当前公司失败:', e);
    return null;
  }
};

// 设置当前公司
export const setCurrentCompany = (companyId: string | null): void => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const storage: CompanyStorage = data ? JSON.parse(data) : { companies: [], currentCompanyId: null };
    storage.currentCompanyId = companyId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error('设置当前公司失败:', e);
  }
};

// 创建新公司
export const createCompany = (name: string): CompanyAccount => {
  const company: CompanyAccount = {
    id: `company-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    periods: [],
  };
  
  try {
    const companies = getAllCompanies();
    companies.push(company);
    const storage: CompanyStorage = {
      companies,
      currentCompanyId: company.id,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (e) {
    console.error('创建公司失败:', e);
  }
  
  return company;
};

// 更新公司名称
export const updateCompanyName = (companyId: string, name: string): boolean => {
  try {
    const companies = getAllCompanies();
    const company = companies.find(c => c.id === companyId);
    if (company) {
      company.name = name;
      company.updatedAt = new Date().toISOString();
      const storage: CompanyStorage = {
        companies,
        currentCompanyId: getCurrentCompany()?.id || null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return true;
    }
  } catch (e) {
    console.error('更新公司失败:', e);
  }
  return false;
};

// 删除公司
export const deleteCompany = (companyId: string): boolean => {
  try {
    const companies = getAllCompanies();
    const filtered = companies.filter(c => c.id !== companyId);
    const currentCompany = getCurrentCompany();
    const storage: CompanyStorage = {
      companies: filtered,
      currentCompanyId: currentCompany?.id === companyId ? null : currentCompany?.id || null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (e) {
    console.error('删除公司失败:', e);
  }
  return false;
};

// 添加期间数据
export const addPeriodData = (
  companyId: string,
  period: string,
  periodType: 'month' | 'quarter' | 'year',
  financialData: any,
  metrics: any,
  dupontAnalysis: any
): PeriodData | null => {
  try {
    const companies = getAllCompanies();
    const company = companies.find(c => c.id === companyId);
    if (!company) return null;
    
    // 检查是否已存在相同期间
    const existingIndex = company.periods.findIndex(p => p.period === period);
    
    const periodData: PeriodData = {
      id: `period-${Date.now()}`,
      period,
      periodType,
      periodDate: generatePeriodDate(period, periodType),
      uploadedAt: new Date().toISOString(),
      financialData,
      metrics,
      dupontAnalysis,
    };
    
    if (existingIndex >= 0) {
      // 更新现有期间
      company.periods[existingIndex] = periodData;
    } else {
      // 添加新期间
      company.periods.push(periodData);
    }
    
    // 按期间日期排序
    company.periods.sort((a, b) => a.periodDate.localeCompare(b.periodDate));
    company.updatedAt = new Date().toISOString();
    
    const storage: CompanyStorage = {
      companies,
      currentCompanyId: getCurrentCompany()?.id || null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    
    return periodData;
  } catch (e) {
    console.error('添加期间数据失败:', e);
  }
  return null;
};

// 删除期间数据
export const deletePeriodData = (companyId: string, periodId: string): boolean => {
  try {
    const companies = getAllCompanies();
    const company = companies.find(c => c.id === companyId);
    if (company) {
      company.periods = company.periods.filter(p => p.id !== periodId);
      company.updatedAt = new Date().toISOString();
      const storage: CompanyStorage = {
        companies,
        currentCompanyId: getCurrentCompany()?.id || null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
      return true;
    }
  } catch (e) {
    console.error('删除期间数据失败:', e);
  }
  return false;
};

// 获取公司的单期数据
export const getPeriodData = (companyId: string, periodId: string): PeriodData | null => {
  const company = getAllCompanies().find(c => c.id === companyId);
  return company?.periods.find(p => p.id === periodId) || null;
};

// 清除所有数据
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
