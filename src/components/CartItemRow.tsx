import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CartItem } from "../types";
import { useDebounce } from "../hooks/useDebounce";
import { colors, formatPrice, radius } from "../theme";

interface Props {
  item: CartItem;
  onChangeQty: (bookId: number, quantity: number) => void;
  onRemove: (bookId: number) => void;
}

// Số lượng giữ ở state cục bộ để nút phản hồi ngay, "lắng" 300ms rồi mới ghi lên store.
export function CartItemRow({ item, onChangeQty, onRemove }: Props) {
  const [qty, setQty] = useState(item.quantity);
  const debouncedQty = useDebounce(qty, 300);

  // qty đã đứng yên 300ms và khác store → đẩy lên store
  useEffect(() => {
    if (debouncedQty !== item.quantity) onChangeQty(item.bookId, debouncedQty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQty]);

  // store đổi từ nơi khác → đồng bộ lại số hiển thị
  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  const canDec = qty > 1;
  const canInc = qty < item.stock;

  return (
    <View style={styles.row}>
      <View style={[styles.cover, { backgroundColor: item.color }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        <View style={styles.stepperRow}>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepBtn, !canDec && styles.disabled]}
              disabled={!canDec}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              accessibilityLabel="Giảm"
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable
              style={[styles.stepBtn, !canInc && styles.disabled]}
              disabled={!canInc}
              onPress={() => setQty((q) => Math.min(item.stock, q + 1))}
              accessibilityLabel="Tăng"
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.stock}>Còn {item.stock}</Text>
        </View>
      </View>
      <Pressable onPress={() => onRemove(item.bookId)} hitSlop={8} accessibilityLabel="Xóa khỏi giỏ">
        <Text style={styles.trash}>🗑️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.md, padding: 10, marginHorizontal: 12, marginVertical: 5, gap: 10 },
  cover: { width: 54, height: 72, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 26 },
  info: { flex: 1, gap: 2 },
  title: { fontWeight: "700", color: colors.text },
  price: { color: colors.indigo, fontWeight: "800" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.35 },
  stepText: { fontSize: 18, fontWeight: "800", color: colors.navy, lineHeight: 22 },
  qty: { minWidth: 28, textAlign: "center", fontWeight: "800", color: colors.navy, fontSize: 16 },
  stock: { color: colors.muted, fontSize: 12 },
  trash: { fontSize: 22 },
});
