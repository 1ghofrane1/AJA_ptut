import { Activity, Calendar, TrendingUp } from "lucide-react-native";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export function SuiviScreen() {
  // Mock data for evolution curve
  const evolutionData = [
    { day: 1, value: 45 },
    { day: 2, value: 48 },
    { day: 3, value: 52 },
    { day: 4, value: 50 },
    { day: 5, value: 55 },
    { day: 6, value: 58 },
    { day: 7, value: 62 },
    { day: 8, value: 65 },
    { day: 9, value: 63 },
    { day: 10, value: 68 },
  ];

  // Mock data for daily intake
  const dailyIntakes = [
    { time: "08:00", name: "Vitamine D3", taken: true },
    { time: "08:00", name: "Oméga-3", taken: true },
    { time: "21:00", name: "Magnésium", taken: false },
  ];

  // Mock monthly calendar data
  const monthlyData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    intensity: Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0,
  }));

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(126, 166, 157, ${opacity})`,
    strokeWidth: 3,
    propsForDots: {
      r: "0",
    },
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
  };

  const miniChartConfig = {
    ...chartConfig,
    strokeWidth: 2,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suivi</Text>
        <Text style={styles.headerSubtitle}>Votre progression</Text>
      </View>

      {/* Content */}
      <View style={styles.mainContent}>
        {/* Primary Visual - Objective Evolution Curve */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Qualité du sommeil</Text>
            <Text style={styles.chartSubtitle}>Évolution sur 10 jours</Text>
          </View>
          
          {/* Smooth curve */}
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: [],
                datasets: [{
                  data: evolutionData.map(d => d.value)
                }]
              }}
              width={screenWidth - 88}
              height={160}
              chartConfig={chartConfig}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              style={styles.chart}
            />
          </View>
          
          {/* Caption */}
          <View style={styles.caption}>
            <TrendingUp size={16} color="#7ea69d" />
            <Text style={styles.captionText}>Tendance positive sur les 10 derniers jours</Text>
          </View>
        </View>

        {/* Key Insights */}
        <View style={styles.insightsContainer}>
          {/* Insight 1 */}
          <View style={styles.insightCard1}>
            <Activity size={20} color="#7ea69d" style={styles.insightIcon} />
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                Votre régularité s'améliore de 12% ce mois-ci
              </Text>
              {/* Mini sparkline */}
              <View style={styles.miniChart}>
                <LineChart
                  data={{
                    labels: [],
                    datasets: [{
                      data: evolutionData.slice(0, 7).map(d => d.value)
                    }]
                  }}
                  width={screenWidth - 136}
                  height={32}
                  chartConfig={{
                    ...miniChartConfig,
                    color: (opacity = 1) => `rgba(179, 211, 210, ${opacity})`,
                  }}
                  bezier
                  withHorizontalLabels={false}
                  withVerticalLabels={false}
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  style={styles.chart}
                />
              </View>
            </View>
          </View>

          {/* Insight 2 */}
          <View style={styles.insightCard2}>
            <Calendar size={20} color="#14272d" style={styles.insightIcon} />
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                Meilleure régularité en soirée (85%)
              </Text>
              {/* Mini sparkline */}
              <View style={styles.miniChart}>
                <LineChart
                  data={{
                    labels: [],
                    datasets: [{
                      data: evolutionData.slice(3, 10).map(d => d.value)
                    }]
                  }}
                  width={screenWidth - 136}
                  height={32}
                  chartConfig={{
                    ...miniChartConfig,
                    color: (opacity = 1) => `rgba(20, 39, 45, ${opacity})`,
                  }}
                  bezier
                  withHorizontalLabels={false}
                  withVerticalLabels={false}
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  style={styles.chart}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Daily Intake Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prises aujourd'hui</Text>
          <View style={styles.intakesContainer}>
            {dailyIntakes.map((intake, index) => (
              <View key={index} style={styles.intakeRow}>
                <Text style={styles.intakeTime}>{intake.time}</Text>
                <View style={[
                  styles.intakeDot,
                  intake.taken ? styles.intakeDotTaken : styles.intakeDotNotTaken
                ]} />
                <View style={styles.intakeLine} />
                <Text style={[
                  styles.intakeName,
                  intake.taken ? styles.intakeNameTaken : styles.intakeNameNotTaken
                ]}>
                  {intake.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Historical View - Monthly Heatmap */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vue mensuelle</Text>
          <View style={styles.heatmapContainer}>
            {monthlyData.map((data, index) => {
              const showDayLabel = index < 7;
              const showDateLabel = (index + 1) % 7 === 1;
              
              return (
                <View key={index} style={styles.heatmapCell}>
                  {showDayLabel && (
                    <Text style={styles.dayLabel}>
                      {["L", "M", "M", "J", "V", "S", "D"][index]}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.heatmapSquare,
                      data.intensity === 0
                        ? styles.heatmapEmpty
                        : data.intensity === 1
                        ? styles.heatmapLow
                        : data.intensity === 2
                        ? styles.heatmapMedium
                        : styles.heatmapHigh,
                      {
                        opacity: data.intensity === 0 ? 0.3 : 0.4 + data.intensity * 0.2,
                      }
                    ]}
                  />
                  {showDateLabel && (
                    <Text style={styles.dateLabel}>{data.day}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Moins</Text>
            <View style={styles.legendSquares}>
              {[0.3, 0.5, 0.7, 0.9, 1].map((opacity, index) => (
                <View
                  key={index}
                  style={[
                    styles.legendSquare,
                    { opacity }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.legendText}>Plus</Text>
          </View>
        </View>

        {/* Summary Strip */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryArrow}>↗︎</Text>
          <Text style={styles.summaryText}>Tendance d'amélioration continue</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef6e2',
  },
  contentContainer: {
    paddingBottom: 96,
  },
  header: {
    backgroundColor: '#14272d',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
  },
  headerSubtitle: {
    color: '#b3d3d2',
    fontSize: 14,
    marginTop: 4,
  },
  mainContent: {
    paddingHorizontal: 24,
    marginTop: -16,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 39, 45, 0.05)',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#7ea69d',
  },
  chartContainer: {
    height: 160,
    marginHorizontal: -8,
  },
  chart: {
    borderRadius: 0,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  captionText: {
    fontSize: 14,
    color: '#14272d',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard1: {
    backgroundColor: '#e7ede7',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightCard2: {
    backgroundColor: '#b3d3d2',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightIcon: {
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    color: '#14272d',
  },
  miniChart: {
    height: 32,
    marginTop: 8,
    marginHorizontal: -4,
  },
  cardTitle: {
    color: '#14272d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  intakesContainer: {
    gap: 12,
  },
  intakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  intakeTime: {
    fontSize: 12,
    color: '#7ea69d',
    width: 48,
  },
  intakeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  intakeDotTaken: {
    backgroundColor: '#7ea69d',
  },
  intakeDotNotTaken: {
    borderWidth: 2,
    borderColor: 'rgba(126, 166, 157, 0.3)',
    backgroundColor: 'transparent',
  },
  intakeLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(20, 39, 45, 0.1)',
  },
  intakeName: {
    fontSize: 14,
  },
  intakeNameTaken: {
    color: '#14272d',
  },
  intakeNameNotTaken: {
    color: '#7ea69d',
  },
  heatmapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heatmapCell: {
    alignItems: 'center',
    gap: 4,
    width: '13%',
  },
  dayLabel: {
    fontSize: 12,
    color: '#7ea69d',
    marginBottom: 4,
  },
  heatmapSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  heatmapEmpty: {
    backgroundColor: '#e7ede7',
  },
  heatmapLow: {
    backgroundColor: '#b3d3d2',
  },
  heatmapMedium: {
    backgroundColor: '#7ea69d',
  },
  heatmapHigh: {
    backgroundColor: '#7ea69d',
  },
  dateLabel: {
    fontSize: 12,
    color: '#7ea69d',
    marginTop: 4,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  legendText: {
    fontSize: 12,
    color: '#7ea69d',
  },
  legendSquares: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  legendSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#7ea69d',
  },
  summaryCard: {
    backgroundColor: '#e7ede7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryArrow: {
    color: '#7ea69d',
    fontSize: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#14272d',
  },
});