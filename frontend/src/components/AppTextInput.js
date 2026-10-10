import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Labelled text field with icon, inline validation error and optional secure toggle.
 * Drop-in compatible with Formik's `Field` render prop.
 */
export default function AppTextInput({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  icon,
  error,
  touched,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  maxLength,
  multiline = false,
  editable = true,
  helper,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  style,
  ...rest
}) {
  const [hidden, setHidden] = useState(secure);
  const showError = Boolean(error && touched);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          multiline && styles.multilineField,
          { borderColor: showError ? colors.danger : colors.border },
          !editable && styles.disabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={19}
            color={showError ? colors.danger : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, multiline && styles.multilineInput]}
          {...rest}
        />

        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} style={styles.rightIcon}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {showError ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs + 2, textTransform: 'uppercase' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  multilineField: { minHeight: 96, alignItems: 'flex-start', paddingVertical: spacing.sm },
  disabled: { backgroundColor: colors.bgDark },
  leftIcon: { marginRight: spacing.sm },
  rightIcon: { paddingLeft: spacing.sm },
  input: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  multilineInput: { minHeight: 76, textAlignVertical: 'top' },
  error: { ...typography.small, color: colors.danger, marginTop: spacing.xs },
  helper: { ...typography.small, marginTop: spacing.xs },
});
