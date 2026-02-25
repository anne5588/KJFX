import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { ChartData } from '@/types/accounting';

// 饼图组件
interface PieChartComponentProps {
  data: ChartData[];
  title?: string;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, title }) => {
  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_item, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 柱状图组件
interface BarChartComponentProps {
  data: ChartData[];
  title?: string;
  color?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ data, title, color = '#667eea' }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 雷达图组件
interface RadarChartComponentProps {
  data: { subject: string; A: number; fullMark: number }[];
  title?: string;
}

export const RadarChartComponent: React.FC<RadarChartComponentProps> = ({ data, title }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
          <Radar
            name="实际值"
            dataKey="A"
            stroke="#667eea"
            fill="#667eea"
            fillOpacity={0.3}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 财务结构对比图
interface FinancialStructureChartProps {
  assets: number;
  liabilities: number;
  equity: number;
}

export const FinancialStructureChart: React.FC<FinancialStructureChartProps> = ({
  assets,
  liabilities,
  equity,
}) => {
  const data = [
    { name: '资产总计', value: Math.abs(assets) },
    { name: '负债总计', value: Math.abs(liabilities) },
    { name: '所有者权益', value: Math.abs(equity) },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">财务结构</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={70} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {data.map((_item, index) => (
              <Cell key={`cell-${index}`} fill={['#667eea', '#f5576c', '#43e97b'][index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 收支对比图
interface IncomeExpenseChartProps {
  income: number;
  expenses: number;
  netProfit: number;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  income,
  expenses,
  netProfit,
}) => {
  const data = [
    { name: '收入', value: Math.abs(income), color: '#43e97b' },
    { name: '费用', value: Math.abs(expenses), color: '#f5576c' },
    { name: '净利润', value: Math.abs(netProfit), color: netProfit >= 0 ? '#667eea' : '#f5576c' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">收支对比</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((item, index) => (
              <Cell key={`cell-${index}`} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
