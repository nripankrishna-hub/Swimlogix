import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../theme';
import AppButton from './AppButton';

/**
 * Reusable confirmation dialog.
 * Used for the Institution Code confirmation, PIN reveals, approvals and destructive actions.
 */
export default function ConfirmModal({
  visible,
  title,
  message,
  icon = 'help-circle-outline',
  tone = 'primary',
  rows = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  dismissable = true,
}) {
  const toneColor =
    tone === 'danger' ? colors.danger : tone === 'gold' ? colors.goldDark : tone === 'success' ? colors.success : colors.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissable ? onCancel : undefined}>
      <Pressable style={styles.backdrop} onPress={dismissable ? onCancel : undefined}>
        <Pressable style={[styles.sheet, shadow.raised]} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: `${toneColor}18` }]}>
            <Ionicons name={icon} size={26} color={toneColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {rows.length ? (
            <ScrollView style={styles.rows} contentContainerStyle={{ paddingVertical: spacing.xs }}>
              {rows.map((row, i) => (
                <View key={`${row.label}-${i}`} style={styles.row}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.actions}>
            {cancelLabel ? (
              <AppButton title={cancelLabel} variant="outline" onPress={onCancel} style={styles.actionBtn} disabled={loading} />
            ) : null}
            <AppButton
              title={confirmLabel}
              variant={confirmVariant}
              onPress={onConfirm}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, textAlign: 'center' },
  message: { ...typography.bodyMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  rows: { width: '100%', maxHeight: 240, marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.small },
  rowValue: { ...typography.body, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.xl, width: '100%' },
  actionBtn: { flex: 1, marginHorizontal: spacing.xs },
});
