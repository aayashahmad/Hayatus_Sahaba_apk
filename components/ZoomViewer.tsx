import { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../constants/theme";
import { scanUrl, scanUrlHd } from "../constants/book";

const ASPECT = 953 / 1348;
const MIN = 1;
const MAX = 5;

type Props = {
  visible: boolean;
  vol: number;
  page: number;
  last: number;
  onClose: () => void;
  onPage: (page: number) => void;
};

export function ZoomViewer({ visible, vol, page, last, onClose, onPage }: Props) {
  const { width: sw, height: sh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [hdLoaded, setHdLoaded] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);

  // Fit the page inside the screen.
  const imgW = Math.min(sw, sh * ASPECT);
  const imgH = imgW / ASPECT;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = (animated = true) => {
    const t = (v: number) => (animated ? withTiming(v, { duration: 220 }) : v);
    scale.value = t(1); tx.value = t(0); ty.value = t(0);
    savedScale.value = 1; savedTx.value = 0; savedTy.value = 0;
    setZoomPct(100);
  };

  useEffect(() => {
    setHdLoaded(false);
    reset(false);
  }, [vol, page, visible]);

  const clampT = (t: number, s: number, size: number, screen: number) => {
    "worklet";
    const max = Math.max(0, (size * s - screen) / 2);
    return Math.min(max, Math.max(-max, t));
  };

  const report = (s: number) => setZoomPct(Math.round(s * 100));

  const settle = () => {
    "worklet";
    const s = Math.min(MAX, Math.max(MIN, scale.value));
    const x = clampT(tx.value, s, imgW, sw);
    const y = clampT(ty.value, s, imgH, sh);
    scale.value = withTiming(s);
    tx.value = withTiming(x);
    ty.value = withTiming(y);
    savedScale.value = s; savedTx.value = x; savedTy.value = y;
    runOnJS(report)(s);
  };

  const startFx = useSharedValue(0);
  const startFy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      startFx.value = e.focalX - sw / 2;
      startFy.value = e.focalY - sh / 2;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX * 1.2, Math.max(MIN * 0.8, savedScale.value * e.scale));
      const ratio = next / savedScale.value;
      // Keep the point under the fingers fixed, and follow the fingers if they move together.
      const fx = e.focalX - sw / 2;
      const fy = e.focalY - sh / 2;
      tx.value = fx - (startFx.value - savedTx.value) * ratio;
      ty.value = fy - (startFy.value - savedTy.value) * ratio;
      scale.value = next;
    })
    .onEnd(settle);

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(settle);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1.05) {
        scale.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0);
        savedScale.value = 1; savedTx.value = 0; savedTy.value = 0;
        runOnJS(report)(1);
      } else {
        const s = 2.5;
        const fx = e.x - sw / 2;
        const fy = e.y - sh / 2;
        const x = clampT(-fx * (s - 1), s, imgW, sw);
        const y = clampT(-fy * (s - 1), s, imgH, sh);
        scale.value = withTiming(s); tx.value = withTiming(x); ty.value = withTiming(y);
        savedScale.value = s; savedTx.value = x; savedTy.value = y;
        runOnJS(report)(s);
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const zoomBy = (factor: number) => {
    const s = Math.min(MAX, Math.max(MIN, savedScale.value * factor));
    const x = clampT(savedTx.value * (s / savedScale.value), s, imgW, sw);
    const y = clampT(savedTy.value * (s / savedScale.value), s, imgH, sh);
    scale.value = withTiming(s); tx.value = withTiming(x); ty.value = withTiming(y);
    savedScale.value = s; savedTx.value = x; savedTy.value = y;
    setZoomPct(Math.round(s * 100));
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={gesture}>
          <View style={styles.stage}>
            <Animated.View style={[{ width: imgW, height: imgH }, animStyle]}>
              <Animated.Image source={{ uri: scanUrl(vol, page) }} style={styles.img} resizeMode="contain" />
              <Animated.Image
                source={{ uri: scanUrlHd(vol, page) }}
                style={[styles.img, StyleSheet.absoluteFill, { opacity: hdLoaded ? 1 : 0 }]}
                resizeMode="contain"
                onLoad={() => setHdLoaded(true)}
              />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={styles.title}>Volume {vol} · Page {page}</Text>
          <View style={styles.iconBtn}>
            {!hdLoaded ? <ActivityIndicator size="small" color={C.gold} /> : <Ionicons name="checkmark" size={18} color={C.gold} />}
          </View>
        </View>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={[styles.iconBtn, page <= 1 && styles.dim]} disabled={page <= 1} onPress={() => onPage(page - 1)}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <View style={styles.zoomGroup}>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => zoomBy(1 / 1.5)}>
              <Ionicons name="remove" size={20} color={C.ink} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => reset()} style={styles.pctBtn}>
              <Text style={styles.pct}>{zoomPct}%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn} onPress={() => zoomBy(1.5)}>
              <Ionicons name="add" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.iconBtn, page >= last && styles.dim]} disabled={page >= last} onPress={() => onPage(page + 1)}>
            <Ionicons name="chevron-forward" size={22} color={C.ink} />
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: "#0c1a16" },
  stage:     { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  img:       { width: "100%", height: "100%", backgroundColor: "#fff" },
  topBar:    { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 8, backgroundColor: "rgba(12,26,22,0.85)" },
  title:     { color: C.gold, fontSize: 15, fontWeight: "600" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10, backgroundColor: "rgba(12,26,22,0.85)" },
  iconBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  dim:       { opacity: 0.35 },
  zoomGroup: { flexDirection: "row", alignItems: "center", backgroundColor: C.panel, borderRadius: 22, borderWidth: 1, borderColor: C.line },
  zoomBtn:   { width: 44, height: 42, alignItems: "center", justifyContent: "center" },
  pctBtn:    { minWidth: 60, alignItems: "center" },
  pct:       { color: C.gold, fontSize: 14, fontWeight: "700" },
});
