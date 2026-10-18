import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ScrollView,
  View,
} from "react-native";
import { useReports } from "./hooks/useReports";
import ReportsHeader from "./components/ReportsHeader";
import ReportsPresets from "./components/ReportsPresets";
import ReportsDateSelector from "./components/ReportsDateSelector";
import Reports from "./components/reports/Reports";

export default function RangeReportScreen() {
  const {
    netProfit,
    applyCustom,
    applyPreset,
    activePreset,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
    isLoading,
    report,
    setShowStartPicker,
    setShowEndPicker,
    setStartDate,
    setEndDate,
    handleExport,
    isExporting,
    handlePrintReport
  } = useReports();

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <ReportsHeader />

        {/* Presets */}
        <ReportsPresets applyPreset={applyPreset} activePreset={activePreset} />

        {/* Selector de fechas custom */}
        <ReportsDateSelector
          startDate={startDate}
          endDate={endDate}
          setShowStartPicker={setShowStartPicker}
          setShowEndPicker={setShowEndPicker}
          applyCustom={applyCustom}
        />

        {showStartPicker && (
          <DateTimePicker
            value={new Date(startDate)}
            mode="date"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date.toISOString().split("T")[0]);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={new Date(endDate)}
            mode="date"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date.toISOString().split("T")[0]);
            }}
          />
        )}

        {/* Resultados */}
        <Reports
          netProfit={netProfit}
          isExporting={isExporting}
          handleExport={handleExport}
          endDate={endDate}
          startDate={startDate}
          isLoading={isLoading}
          handlePrint={handlePrintReport}
          report={report}
        />
      </ScrollView>
    </View>
  );
}
