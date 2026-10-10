import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, Keyboard } from 'react-native';
import Screen from '../../components/Screen';
import { moderatorApi } from '../../api/endpoints';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

export default function AttendanceScreen() {
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [studentModal, setStudentModal] = useState(null);
  const inputRef = useRef(null);

  const handleKeyPress = (key) => {
    setMsg('');
    if (key === 'del') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((p) => p + key);
    }
  };

  const submitPin = async () => {
    if (pin.length !== 4) {
      setMsg('Please enter a 4-digit PIN');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await moderatorApi.getStudentByPin(pin);
      setStudentModal(res.student);
    } catch (e) {
      setMsg(errorMessage(e) || 'Student not found');
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  const markAttendance = async () => {
    setBusy(true);
    try {
      const r = await moderatorApi.markByPin({ pin, status: 'present' });
      setMsg(r.message || `Marked present`);
    } catch (e) {
      setMsg(errorMessage(e));
    } finally {
      setBusy(false);
      setPin('');
      setStudentModal(null);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Student PIN</Text>
        <Text style={styles.subtitle}>Mark attendance quickly</Text>

        <Pressable style={styles.pinDisplay} onPress={() => inputRef.current?.focus()}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]}>
               {pin.length > i ? <Text style={styles.pinDotText}>{pin[i]}</Text> : null}
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="number-pad"
            maxLength={4}
            value={pin}
            onChangeText={(t) => { setMsg(''); setPin(t.replace(/[^0-9]/g, '')); }}
            autoFocus
          />
        </Pressable>
        
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}

        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['del', '0', 'ok'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.row}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => {
                    if (key === 'ok') submitPin();
                    else handleKeyPress(key);
                  }}
                  disabled={busy}
                >
                  {key === 'del' ? (
                    <Text style={styles.keyText}>⌫</Text>
                  ) : key === 'ok' ? (
                    <Text style={styles.keyTextOK}>OK</Text>
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      <ConfirmModal
        visible={!!studentModal}
        title="Mark Attendance"
        message={
          studentModal
            ? `Are you sure you want to mark ${studentModal.userId?.name || 'Student'} as present for ${
                studentModal.batchId?.name || 'their batch'
              }?`
            : ''
        }
        confirmLabel="Mark Present"
        cancelLabel="Cancel"
        cancelVariant="outline-danger"
        onConfirm={markAttendance}
        onCancel={() => {
          setStudentModal(null);
          setPin('');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textDim, marginBottom: spacing.xxl, textAlign: 'center' },
  pinDisplay: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, position: 'relative' },
  pinDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  pinDotText: { ...typography.h3, color: colors.card, fontWeight: '700' },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
  msg: { ...typography.body, color: colors.danger, marginBottom: spacing.md, textAlign: 'center', minHeight: 24 },
  keypad: { width: '100%', maxWidth: 320, alignSelf: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  keyPressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  keyText: { ...typography.h2, color: colors.text },
  keyTextOK: { ...typography.h3, color: colors.primary, fontWeight: '700' },
});
