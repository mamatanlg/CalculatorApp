import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { displayExpression, formatNumber, parseExpression } from "./calculator";

const COLORS = {
  ink: "#1b1d16",
  muted: "#929488",
  lime: "#e9ed32",
  paper: "#fffef7",
  key: "#e9e9e7",
  line: "#eeefe6",
  green: "#71800d",
  error: "#b84636",
};

const KEYS = [
  [
    { label: "C", action: "clear", kind: "dark" },
    { label: "( )", value: "()", kind: "function" },
    { label: "%", value: "%", kind: "function" },
    { label: "÷", value: "/", kind: "operator" },
  ],
  [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "×", value: "*", kind: "operator" },
  ],
  [
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "−", value: "-", kind: "operator" },
  ],
  [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "+", value: "+", kind: "operator" },
  ],
  [
    { label: "0", value: "0", span: true },
    { label: ".", value: "." },
    { label: "=", action: "equals", kind: "dark" },
  ],
];

function KeyButton({ item, onPress, compact }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel || item.label}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.key,
        compact && styles.keyCompact,
        item.span && styles.keySpan,
        item.kind === "function" && styles.keyFunction,
        item.kind === "operator" && styles.keyOperator,
        item.kind === "dark" && styles.keyDark,
        pressed && styles.keyPressed,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          item.kind === "function" && styles.functionText,
          item.kind === "operator" && styles.operatorText,
          item.kind === "dark" && styles.darkText,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function ToolButton({ label, icon, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.toolButton, pressed && styles.toolPressed]}
    >
      {icon === "copy" ? (
        <View style={styles.copyGlyph}>
          <View style={styles.copyBack} />
          <View style={styles.copyFront} />
        </View>
      ) : (
        <Text style={styles.toolIcon}>{icon}</Text>
      )}
    </Pressable>
  );
}

function HistoryPanel({ history, onClear, onSelect }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeading}>
        <View>
          <Text style={styles.eyebrow}>YOUR RECENT MATH</Text>
          <Text style={styles.historyTitle}>History</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear history"
          disabled={history.length === 0}
          onPress={onClear}
          style={({ pressed }) => [styles.clearHistory, pressed && styles.toolPressed]}
        >
          <Text style={[styles.clearHistoryText, history.length === 0 && styles.disabledText]}>
            Clear
          </Text>
        </Pressable>
      </View>
      <ScrollView style={styles.historyList} contentContainerStyle={styles.historyContent}>
        {history.length === 0 ? (
          <Text style={styles.historyEmpty}>Your calculations will show up here.</Text>
        ) : (
          history.map((item, index) => (
            <Pressable
              key={`${item.expression}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${displayExpression(item.expression)} equals ${formatNumber(item.result)}`}
              onPress={() => onSelect(item.expression)}
              style={({ pressed }) => [
                styles.historyEntry,
                pressed && styles.historyEntryPressed,
              ]}
            >
              <Text numberOfLines={1} style={styles.historyExpression}>
                {displayExpression(item.expression)}
              </Text>
              <Text style={styles.historyResult}>= {formatNumber(item.result)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
      <View style={styles.historyFooter}>
        <View style={styles.historyDot} />
        <Text style={styles.historyFooterText}>Stored for this visit</Text>
      </View>
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const compact = width < 400;
  const [expression, setExpression] = useState("");
  const [lastAnswer, setLastAnswer] = useState(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [status, setStatus] = useState("Type or tap to begin");
  const [statusType, setStatusType] = useState("");
  const [preview, setPreview] = useState("0");

  function setMessage(message, type = "") {
    setStatus(message);
    setStatusType(type);
  }

  function updateExpression(next, evaluated = false) {
    setExpression(next);
    if (!next) {
      setPreview(lastAnswer === null ? "0" : formatNumber(lastAnswer));
      setMessage("Type or tap to begin");
      return;
    }

    try {
      setPreview(formatNumber(parseExpression(next)));
      setMessage(evaluated ? "Answer" : "Preview");
    } catch {
      setPreview("—");
      setMessage("Complete the expression", "error");
    }
  }

  function calculate() {
    try {
      const answer = parseExpression(expression);
      setLastAnswer(answer);
      setHistory((items) => [{ expression, result: answer }, ...items].slice(0, 12));
      const formatted = formatNumber(answer);
      setExpression(formatted);
      setPreview(formatted);
      setJustEvaluated(true);
      setMessage("Answer added to history", "success");
    } catch (error) {
      setPreview("—");
      setMessage(error instanceof Error ? error.message : "Unable to calculate", "error");
    }
  }

  function insert(value) {
    const startsNew = justEvaluated && /[0-9.(]/.test(value);
    const next = `${startsNew ? "" : expression}${value}`;
    setJustEvaluated(false);
    updateExpression(next);
  }

  function clear() {
    setJustEvaluated(false);
    setLastAnswer(null);
    setExpression("");
    setPreview("0");
    setMessage("Type or tap to begin");
  }

  function backspace() {
    setJustEvaluated(false);
    updateExpression(expression.slice(0, -1));
  }

  function changeSign() {
    if (!expression) {
      insert("-");
      return;
    }
    try {
      updateExpression(formatNumber(-parseExpression(expression)));
      setJustEvaluated(false);
    } catch {
      insert("-");
    }
  }

  function handleKey(item) {
    if (item.action === "clear") clear();
    else if (item.action === "equals") calculate();
    else if (item.action === "backspace") backspace();
    else if (item.action === "sign") changeSign();
    else if (item.value === "()") {
      const trimmed = expression.trim();
      const openCount = (trimmed.match(/\(/g) || []).length;
      const closeCount = (trimmed.match(/\)/g) || []).length;
      const last = trimmed.slice(-1);
      const closesGroup = openCount > closeCount && /[\d)%]/.test(last);
      insert(closesGroup ? ")" : "(");
    } else insert(item.value);
  }

  async function copyResult() {
    try {
      const value = expression ? parseExpression(expression) : lastAnswer;
      if (value === null) throw new Error("Nothing to copy yet");
      await Clipboard.setStringAsync(formatNumber(value));
      setMessage("Result copied", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not copy result", "error");
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^[0-9.+\-*/()%]$/.test(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        insert(event.key);
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        event.stopPropagation();
        calculate();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        backspace();
      } else if (event.key === "Escape" || event.key === "Delete") {
        event.preventDefault();
        event.stopPropagation();
        clear();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lime} />
      <View pointerEvents="none" style={styles.decorationTop} />
      <View pointerEvents="none" style={styles.decorationBottom} />
      <View pointerEvents="none" style={styles.decorationStripe} />
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={[styles.calculatorCard, wide && styles.calculatorCardWide]}>
            <View style={styles.display}>
              <View style={styles.readout}>
                <Text numberOfLines={1} style={styles.expression}>
                  {displayExpression(expression)}
                </Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.result}>
                  {preview}
                </Text>
              </View>
              <View style={styles.displayFooter}>
                <View style={styles.tools}>
                  <ToolButton
                    label={showHistory ? "Hide history" : "Show history"}
                    icon="◷"
                    onPress={() => setShowHistory((visible) => !visible)}
                  />
                  <ToolButton label="Copy result" icon="copy" onPress={copyResult} />
                </View>
                <ToolButton label="Delete last character" icon="⌫" onPress={backspace} />
              </View>
              {statusType !== "" && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.status,
                    statusType === "error" && styles.statusError,
                    statusType === "success" && styles.statusSuccess,
                  ]}
                >
                  {status}
                </Text>
              )}
            </View>
            <View style={styles.divider} />
            <View style={styles.keypad}>
              {KEYS.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.keyRow}>
                  {row.map((item) => (
                    <KeyButton
                      key={item.label}
                      item={item}
                      onPress={handleKey}
                      compact={compact}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {showHistory && (
            <HistoryPanel
              history={history}
              onClear={() => setHistory([])}
              onSelect={(source) => {
                setJustEvaluated(false);
                updateExpression(source);
              }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: "100%",
    overflow: "hidden",
    backgroundColor: "#f8f6c9",
  },
  decorationTop: {
    position: "absolute",
    width: 240,
    height: 240,
    top: -153,
    left: -140,
    transform: [{ rotate: "45deg" }],
    backgroundColor: COLORS.lime,
  },
  decorationBottom: {
    position: "absolute",
    width: 230,
    height: 230,
    right: -147,
    top: "29%",
    transform: [{ rotate: "45deg" }],
    backgroundColor: COLORS.lime,
  },
  decorationStripe: {
    position: "absolute",
    width: 205,
    height: 205,
    left: -132,
    bottom: -154,
    transform: [{ rotate: "45deg" }],
    backgroundColor: COLORS.lime,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 14,
  },
  calculatorCard: {
    width: "100%",
    maxWidth: 420,
    minHeight: 610,
    alignSelf: "center",
    padding: 14,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: COLORS.paper,
    shadowColor: "#454c10",
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 10 },
    elevation: 12,
    justifyContent: "flex-end",
  },
  calculatorCardWide: {
    minHeight: 660,
    padding: 16,
  },
  display: {
    height: 235,
    justifyContent: "space-between",
    paddingHorizontal: 3,
    paddingTop: 19,
    paddingBottom: 4,
  },
  readout: {
    alignItems: "stretch",
  },
  expression: {
    minHeight: 27,
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "500",
    textAlign: "right",
  },
  result: {
    color: COLORS.ink,
    fontSize: 38,
    letterSpacing: -1.2,
    fontWeight: "500",
    textAlign: "right",
  },
  displayFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 32,
  },
  tools: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  toolButton: {
    width: 34,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  toolPressed: {
    backgroundColor: "#ededdf",
  },
  toolIcon: {
    color: COLORS.ink,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600",
  },
  copyGlyph: {
    width: 18,
    height: 18,
  },
  copyBack: {
    position: "absolute",
    top: 1,
    left: 1,
    width: 11,
    height: 12,
    borderWidth: 1.4,
    borderColor: COLORS.ink,
    borderRadius: 2,
  },
  copyFront: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 12,
    borderWidth: 1.4,
    borderColor: COLORS.ink,
    borderRadius: 2,
    backgroundColor: COLORS.paper,
  },
  status: {
    marginTop: 2,
    color: "#77796e",
    fontSize: 11,
    textAlign: "right",
  },
  statusError: {
    color: COLORS.error,
  },
  statusSuccess: {
    color: "#697917",
  },
  divider: {
    height: 1,
    marginBottom: 12,
    backgroundColor: "#d8d8d1",
  },
  keypad: {
    gap: 11,
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  key: {
    height: 56,
    width: "23%",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    backgroundColor: COLORS.key,
    alignItems: "center",
    justifyContent: "center",
  },
  keyCompact: {
    height: 55,
  },
  keySpan: {
    width: "48.5%",
  },
  keyFunction: {
    backgroundColor: COLORS.key,
  },
  keyOperator: {
    backgroundColor: COLORS.key,
  },
  keyDark: {
    borderColor: "#20221b",
    backgroundColor: "#20221b",
  },
  keyPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  keyText: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: "600",
  },
  functionText: {
    color: "#74776b",
    fontSize: 16,
  },
  operatorText: {
    color: COLORS.green,
    fontSize: 21,
  },
  darkText: {
    color: COLORS.lime,
    fontSize: 19,
  },
  historyCard: {
    width: "100%",
    minHeight: 170,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
  },
  historyHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: {
    marginBottom: 5,
    color: "#999b8f",
    fontSize: 9,
    letterSpacing: 1,
  },
  historyTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: "600",
  },
  clearHistory: {
    padding: 5,
    borderRadius: 6,
  },
  clearHistoryText: {
    color: "#8e9085",
    fontSize: 11,
  },
  disabledText: {
    opacity: 0.45,
  },
  historyList: {
    maxHeight: 260,
    minHeight: 90,
    marginTop: 12,
  },
  historyContent: {
    flexGrow: 1,
  },
  historyEmpty: {
    paddingVertical: 16,
    color: "#a1a397",
    fontSize: 12,
    lineHeight: 18,
  },
  historyEntry: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 5,
  },
  historyEntryPressed: {
    backgroundColor: "#f8f9f2",
  },
  historyExpression: {
    color: "#77796e",
    fontSize: 11,
  },
  historyResult: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  historyFooter: {
    marginTop: 9,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  historyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#a6c51d",
  },
  historyFooterText: {
    color: "#9a9c91",
    fontSize: 10,
  },
});
