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

// 财务指标类型 - 五大能力分析
export interface FinancialMetrics {
  // ===== 偿债能力指标 =====
  currentRatio: number;           // 流动比率
  quickRatio: number;             // 速动比率
  cashRatio: number;              // 现金比率
  debtToAssetRatio: number;       // 资产负债率(%)
  equityRatio: number;            // 产权比率
  interestCoverageRatio: number;  // 利息保障倍数(新增)
  
  // ===== 营运能力指标 =====
  receivablesTurnover: number;    // 应收账款周转率(次)
  receivablesDays: number;        // 应收账款周转天数(新增)
  inventoryTurnover: number;      // 存货周转率(次)
  inventoryDays: number;          // 存货周转天数(新增)
  currentAssetTurnover: number;   // 流动资产周转率(新增)
  totalAssetTurnover: number;     // 总资产周转率(次)
  cashConversionCycle: number;    // 现金转换周期(新增)
  
  // ===== 盈利能力指标 =====
  grossProfitMargin: number;      // 销售毛利率(%)
  operatingProfitMargin: number;  // 营业利润率(%)(新增)
  netProfitMargin: number;        // 销售净利率(%)
  roe: number;                    // 净资产收益率(%)
  roa: number;                    // 总资产报酬率(%)
  ebitdaMargin: number;           // EBITDA利润率(%)(新增)
  costExpenseRatio: number;       // 成本费用利润率(%)(新增)
  
  // ===== 发展能力指标(新增) =====
  revenueGrowthRate: number;      // 营业收入增长率(%)
  netProfitGrowthRate: number;    // 净利润增长率(%)
  totalAssetGrowthRate: number;   // 总资产增长率(%)
  equityGrowthRate: number;       // 资本保值增值率(%)
  sustainableGrowthRate: number;  // 可持续增长率(%)
  
  // ===== 现金流指标(新增) =====
  operatingCashFlowRatio: number; // 经营现金流/净利润
  freeCashFlow: number;           // 自由现金流
  cashFlowToRevenue: number;      // 销售现金比率(%)
  cashRecoveryRate: number;       // 现金收入比率(%)
  operatingCashFlowPerShare: number; // 每股经营现金流
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
