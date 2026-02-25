// 科目余额表数据类型
export interface AccountBalance {
  subjectCode: string;      // 科目编码
  subjectName: string;      // 科目名称
  openingDebit: number;     // 期初借方余额
  openingCredit: number;    // 期初贷方余额
  currentDebit: number;     // 本期借方发生额
  currentCredit: number;    // 本期贷方发生额
  closingDebit: number;     // 期末借方余额
  closingCredit: number;    // 期末贷方余额
}

// 财务指标类型
export interface FinancialMetrics {
  // 偿债能力指标
  currentRatio: number;           // 流动比率
  quickRatio: number;             // 速动比率
  cashRatio: number;              // 现金比率
  debtToAssetRatio: number;       // 资产负债率
  equityRatio: number;            // 产权比率
  
  // 营运能力指标
  receivablesTurnover: number;    // 应收账款周转率
  inventoryTurnover: number;      // 存货周转率
  totalAssetTurnover: number;     // 总资产周转率
  
  // 盈利能力指标
  grossProfitMargin: number;      // 销售毛利率
  netProfitMargin: number;        // 销售净利率
  roe: number;                    // 净资产收益率
  roa: number;                    // 总资产报酬率
}

// 科目分类
export interface AccountCategory {
  name: string;
  accounts: AccountBalance[];
  totalDebit: number;
  totalCredit: number;
}

// 分析结果
export interface AnalysisResult {
  metrics: FinancialMetrics;
  assets: AccountCategory;
  liabilities: AccountCategory;
  equity: AccountCategory;
  income: AccountCategory;
  expenses: AccountCategory;
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
  suggestions: string[];
}

// 图表数据
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// 上传文件状态
export interface UploadStatus {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  success: boolean;
}
