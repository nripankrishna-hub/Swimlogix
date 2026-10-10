import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/AppButton';
import ConfirmModal from '../../components/ConfirmModal';
import { Card, StatTile, SectionHeader, Badge } from '../../components/primitives';
import { SkeletonList, ErrorState } from '../../components/states';
import { superAdminApi } from '../../api/endpoints';
import useAsync, { useReloadOnFocus } from '../../hooks/useAsync';
import { useAuth } from '../../contexts/AuthContext';
import { errorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { colors, gradients, radius, spacing, typography } from '../../theme';

export default function SuperAdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { data, loading, refreshing, error, run } = useAsync(() => superAdminApi.stats(), []);
  
  const [actionModal, setActionModal] = React.useState(null); // { id, name, action: 'suspend' | 'renew' }
  const [busy, setBusy] = React.useState(false);

  useReloadOnFocus(run);

  const handleQuickAction = async () => {
    if (!actionModal) return;
    setBusy(true);
    try {
      if (actionModal.action === 'suspend') {
        await superAdminApi.updateInstitution(actionModal.id, { status: 'suspended' });
      } else if (actionModal.action === 'renew') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await superAdminApi.updateInstitution(actionModal.id, { status: 'active', subscriptionValidity: nextYear.toISOString() });
      }
      setActionModal(null);
      run(); // refresh data
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.contentPad}>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={errorMessage(error)} onRetry={() => run()} />
      </SafeAreaView>
    );
  }

  const inst = data.institutions || {};
  const expiring = data.expiringInstitutions || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => run({ isRefresh: true })} />}
      >
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Welcome back</Text>
              <Text style={styles.heroName}>{user?.name || 'Developer'}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="code-slash" size={14} color={colors.amber} />
              <Text style={styles.heroBadgeText}>SUPER ADMIN</Text>
            </View>
          </View>
          <Text style={styles.heroInstitution}>Platform Operations</Text>
        </LinearGradient>

        <View style={styles.contentPad}>
          <SectionHeader title="Platform overview" />
          <View style={styles.stats}>
            <StatTile label="Institutions" value={String(inst.total || 0)} icon="business-outline" />
            <StatTile label="Active" value={String(inst.active || 0)} icon="checkmark-circle-outline" tone="success" />
            <StatTile label="Expiring soon" value={String(inst.expiringSoon || 0)} icon="time-outline" tone="warning" />
          </View>

          <SectionHeader title="Expiring licences" actionLabel="View all" onAction={() => navigation.navigate('Institutions')} />
          {expiring.length === 0 ? (
             <Card style={{ marginBottom: spacing.sm }}>
               <Text style={styles.meta}>No licences are expiring soon.</Text>
             </Card>
          ) : (
            expiring.map((e) => (
              <Card key={String(e._id)} style={{ marginBottom: spacing.sm }}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{e.name}</Text>
                    <Text style={styles.meta}>{e.code} · valid till {formatDate(e.subscriptionValidity)}</Text>
                  </View>
                  <Badge label={e.status || 'active'} tone="warning" />
                </View>
                <View style={styles.cardActions}>
                  <AppButton 
                    title="Suspend" 
                    variant="ghost" 
                    size="sm" 
                    icon="ban-outline" 
                    fullWidth={false}
                    onPress={() => setActionModal({ id: e._id, name: e.name, action: 'suspend' })} 
                    style={{ flex: 1, marginRight: spacing.xs }}
                  />
                  <AppButton 
                    title="Renew Licence" 
                    variant="outline" 
                    size="sm" 
                    icon="refresh-outline" 
                    fullWidth={false}
                    onPress={() => setActionModal({ id: e._id, name: e.name, action: 'renew' })} 
                    style={{ flex: 1, marginLeft: spacing.xs }}
                  />
                </View>
              </Card>
            ))
          )}

          <View style={{ height: spacing.md }} />
          
          <SectionHeader title="Register" />
          <Card>
            <Text style={[styles.meta, { marginBottom: spacing.md }]}>
              Onboard a new institution and set up the first administrator account with a temporary password.
            </Text>
            <AppButton 
              title="Create New Institution" 
              variant="primary" 
              icon="add-circle-outline" 
              onPress={() => navigation.navigate('CreateInstitution')} 
            />
          </Card>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!actionModal}
        title={actionModal?.action === 'suspend' ? 'Suspend Institution' : 'Renew Licence'}
        message={
          actionModal?.action === 'suspend'
            ? `Are you sure you want to suspend ${actionModal?.name}? This will revoke access for all their users.`
            : `Are you sure you want to renew the licence for ${actionModal?.name} for 1 year?`
        }
        icon={actionModal?.action === 'suspend' ? 'ban-outline' : 'refresh-outline'}
        tone={actionModal?.action === 'suspend' ? 'danger' : 'primary'}
        confirmLabel={actionModal?.action === 'suspend' ? 'Suspend' : 'Renew'}
        loading={busy}
        onCancel={() => setActionModal(null)}
        onConfirm={handleQuickAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl * 2 },
  contentPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroGreeting: { ...typography.small, color: 'rgba(255,255,255,0.8)' },
  heroName: { ...typography.h1, color: colors.textOnPrimary },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  heroBadgeText: { color: colors.amber, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  heroInstitution: { ...typography.title, color: 'rgba(255,255,255,0.95)', marginTop: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActions: { flexDirection: 'row', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  cardTitle: { ...typography.title },
  meta: { ...typography.small, marginTop: 2, color: colors.textMuted },
});
