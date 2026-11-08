import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Header } from "../components/Header";
import { CartItemRow } from "../components/CartItemRow";
import { PrimaryButton } from "../components/PrimaryButton";

import { EmptyState } from "../components/EmptyState";
import { useAuth, useCart } from "../store/hooks";
import { confirmDialog } from "../utils/dialog";
import { TabScreenProps } from "../navigation/types";
import { colors, formatPrice, radius } from "../theme";

// Mã giảm giá cố định ở phía client (BT8.C2)
type Coupon = { label: string; discount: (subtotal: number) => number };
const COUPONS: Record<string, Coupon> = {
  SALE10: { label: "Giảm 10%", discount: (t) => Math.round(t * 0.1) },
  GIAM50K: { label: "Giảm 50.000 đ", discount: (t) => Math.min(50000, t) },
};

export function CartScreen({ navigation }: TabScreenProps<"Cart">) {
  const { items, totalPrice, setQty, remove } = useCart();
  const { isLoggedIn } = useAuth();

  // --- mã giảm giá ---
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setAppliedCode(code);
      setCouponError(null);
    } else {
      setAppliedCode(null);
      setCouponError("Mã giảm giá không hợp lệ");
    }
  };

  // Tính lại theo tạm tính hiện tại để giảm giá luôn đúng khi đổi số lượng
  const discount = appliedCode ? COUPONS[appliedCode].discount(totalPrice) : 0;
  const finalTotal = Math.max(0, totalPrice - discount);

  const askRemove = (bookId: number) => {
    const item = items.find((i) => i.bookId === bookId);
    confirmDialog("Xóa sản phẩm", `Xóa "${item?.title ?? "sản phẩm này"}" khỏi giỏ hàng?`, () => remove(bookId));
  };

  const goCheckout = () => {
    if (isLoggedIn) navigation.navigate("Checkout", { total: finalTotal });
    else navigation.navigate("Login", { redirectTo: "Checkout", total: finalTotal });
  };

  return (
    <View style={styles.container}>
      <Header title="🛒 Giỏ hàng" />
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.bookId)}
        renderItem={({ item }) => <CartItemRow item={item} onChangeQty={setQty} onRemove={askRemove} />}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState emoji="🛒" title="Giỏ hàng trống" message="Hãy chọn vài cuốn sách yêu thích nhé." actionLabel="Khám phá sách" onAction={() => navigation.navigate("Home")} />
        }
      />
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.couponInput, couponError ? styles.couponInputError : null]}
              value={couponInput}
              onChangeText={setCouponInput}
              placeholder="Mã giảm giá (SALE10)"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={applyCoupon}
            />
            <Pressable style={styles.couponBtn} onPress={applyCoupon} accessibilityLabel="Áp dụng mã giảm giá">
              <Text style={styles.couponBtnText}>Áp dụng</Text>
            </Pressable>
          </View>
          {appliedCode ? <Text style={styles.couponOk}>Đã áp dụng {appliedCode}: {COUPONS[appliedCode].label}</Text> : null}
          {couponError ? <Text style={styles.couponErr}>{couponError}</Text> : null}

          <View style={styles.line}><Text style={styles.muted}>Tạm tính</Text><Text style={styles.value}>{formatPrice(totalPrice)}</Text></View>
          {discount > 0 && (
            <View style={styles.line}><Text style={styles.muted}>Giảm giá</Text><Text style={styles.discount}>-{formatPrice(discount)}</Text></View>
          )}
          <View style={styles.line}><Text style={styles.total}>Tổng cộng</Text><Text style={styles.total}>{formatPrice(finalTotal)}</Text></View>
          <PrimaryButton title="Thanh toán" onPress={goCheckout} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  footer: { backgroundColor: "#fff", padding: 14, gap: 8, borderTopWidth: 1, borderTopColor: colors.line },
  line: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: colors.muted },
  value: { fontWeight: "700", color: colors.text },
  discount: { fontWeight: "700", color: colors.success },
  total: { fontSize: 17, fontWeight: "800", color: colors.navy },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, color: colors.text, backgroundColor: colors.bg },
  couponInputError: { borderColor: colors.danger },
  couponBtn: { backgroundColor: colors.cyan, borderRadius: radius.md, paddingHorizontal: 16, justifyContent: "center" },
  couponBtnText: { color: "#fff", fontWeight: "800" },
  couponOk: { color: colors.success, fontSize: 13 },
  couponErr: { color: colors.danger, fontSize: 13 },
});
