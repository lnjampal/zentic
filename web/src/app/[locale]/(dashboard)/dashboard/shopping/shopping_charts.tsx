'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const AXIS_TICK = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 11,
} as const;

const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  color: 'hsl(var(--foreground))',
} as const;

type PlatformCardRateChartViewProps = {
  width: number;
  data: Array<{
    platform: string;
    rate: number;
  }>;
};

export function PlatformCardRateChartView({ width, data }: PlatformCardRateChartViewProps) {
  return (
    <BarChart
      width={width}
      height={220}
      data={data}
      margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
    >
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />

      <XAxis dataKey="platform" stroke="hsl(var(--border))" tick={AXIS_TICK} tickLine={false} />

      <YAxis stroke="hsl(var(--border))" tick={AXIS_TICK} tickLine={false} axisLine={false} unit="%" />

      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />

      <Bar dataKey="rate" name="Card rate" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
    </BarChart>
  );
}

type ShoppingTrendChartViewProps = {
  width: number;
  data: Array<{
    date: string;
    ownCards: number;
    totalCards: number;
  }>;
};

export function ShoppingTrendChartView({ width, data }: ShoppingTrendChartViewProps) {
  return (
    <LineChart
      width={width}
      height={220}
      data={data}
      margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
    >
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />

      <XAxis
        dataKey="date"
        stroke="hsl(var(--border))"
        tick={AXIS_TICK}
        tickLine={false}
        tickFormatter={(v: string) => v.slice(5)}
      />

      <YAxis stroke="hsl(var(--border))" tick={AXIS_TICK} tickLine={false} axisLine={false} />

      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'hsl(var(--border))' }} />

      <Legend
        wrapperStyle={{
          fontSize: 11,
          color: 'hsl(var(--muted-foreground))',
        }}
      />

      <Line
        type="monotone"
        dataKey="ownCards"
        name="Your cards"
        stroke="hsl(var(--chart-2))"
        strokeWidth={2}
        dot={{ r: 2 }}
      />

      <Line
        type="monotone"
        dataKey="totalCards"
        name="All cards"
        stroke="hsl(var(--chart-4))"
        strokeWidth={2}
        dot={{ r: 2 }}
      />
    </LineChart>
  );
}
