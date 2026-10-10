import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import Screen from '../../components/Screen';
import { Card, Badge, SectionHeader } from '../../components/primitives';
import { SkeletonList, EmptyState, ErrorState } from '../../components/states';
import ConfirmModal from '../../components/ConfirmModal';
import { adminApi } from '../../api/endpoints';
import useAsync from '../../hooks/useAsync';
import { errorMessage } from '../../utils/errors';
import { colors, radius, spacing, typography } from '../../theme';

export default function StudentsScreen({ navigation }) {
  const [statusTab, setStatusTab] = useState('active');
  const [q, setQ] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // Fetch batches for filter
  const { data: batchesData } = useAsync(() => adminApi.listBatches({ limit: 100 }), []);
  const batches = (batchesData && batchesData.items) || [];

  // Fetch students
  const fetchFn = () =>
    adminApi.listStudents({
      limit: 100,
      approvalStatus: 'approved',
      status: statusTab,
      search: q || undefined,
      batchId: selectedBatch || undefined,
    });
  const { data, loading, refreshing, error, run } = useAsync(fetchFn, [statusTab, q, selectedBatch]);
  const items = (data && data.items) || [];

  if (loading && !data && !refreshing) return <Screen><SkeletonList count={4} /></Screen>;
  if (error && !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={() => run()} /></Screen>;

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.head}>
        <SectionHeader title="Students" subtitle="Manage members and filter by status/batch" />
        
        <View style={{ marginBottom: spacing.sm }}>
          <Pressable style={styles.enrollBtn} onPress={() => navigation.navigate('AdminEnrollStudent')}>
            <Text style={styles.enrollBtnT}>+ Enroll New Student</Text>
          </Pressable>
        </View>

        {/* Status Tabs */}
        <View style={styles.tabs}>
          {['active', 'completed', 'discontinued'].map((t) => (
            <Pressable key={t} onPress={() => setStatusTab(t)} style={[styles.tab, statusTab === t && styles.on]}>
              <Text style={[styles.tabT, statusTab === t && styles.onT]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search */}
        <View style={styles.search}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search name, phone, PIN"
            style={styles.in}
            returnKeyType="search"
            onSubmitEditing={() => run().catch(() => {})}
          />
        </View>

        {/* Batch Filter */}
        {batches.length > 0 && (
          <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>Filter by Batch:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                onPress={() => setSelectedBatch(null)}
                style={[styles.filterChip, selectedBatch === null && styles.filterChipOn]}
              >
                <Text style={[styles.filterChipT, selectedBatch === null && styles.filterChipTOn]}>All</Text>
              </Pressable>
              {batches.map(b => (
                <Pressable
                  key={b._id || b.id}
                  onPress={() => setSelectedBatch(b._id || b.id)}
                  style={[styles.filterChip, selectedBatch === (b._id || b.id) && styles.filterChipOn]}
                >
                  <Text style={[styles.filterChipT, selectedBatch === (b._id || b.id) && styles.filterChipTOn]}>
                    {b.name} ({b.level})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, i) => String(it._id || it.id || i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => run({ isRefresh: true })} />}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="No students found" message={`No ${statusTab} students match your filters.`} />
        }
        renderItem={({ item }) => {
          const u = item.user || item.userId || {};
          const b = item.batch || item.batchId || {};
          const id = String(item._id || item.id);
          const rD = item.registrationData || {};
          const stuName = rD.student_name || rD.studentName || rD['Student Name'] || rD.full_name || rD.fullName || rD.name || u.name || 'Student';
          
          return (
            <Card style={styles.card}>
              <View style={styles.top}>
                <View style={styles.av}>
                  <Text style={styles.avT}>{String(stuName).slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.mid}>
                  <Text style={styles.nm}>{stuName}</Text>
                  <Text style={styles.sb}>{u.phone || ''} · PIN {item.assignedPin || '—'}</Text>
                  <Text style={styles.batch}>{b.name ? `${b.name} (${b.level})` : 'No Batch'}</Text>
                </View>
                <Badge label={item.status || 'active'} tone={item.status === 'active' ? 'success' : 'neutral'} />
              </View>
              <View style={styles.row}>
                <Pressable style={styles.b} onPress={() => navigation.navigate('StudentDetail', { studentId: id })}>
                  <Text style={styles.bt}>View & Edit Profile</Text>
                </Pressable>
                <Pressable style={[styles.b, { backgroundColor: '#FDECEC' }]} onPress={() => setDeleteModal(id)}>
                  <Text style={[styles.bt, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          );
        }}
      />
      <ConfirmModal
        visible={!!deleteModal}
        title="Delete Student"
        message="Are you sure you want to permanently delete this student?"
        icon="warning-outline"
        tone="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="primary"
        onConfirm={() => {
          adminApi.deleteStudent(deleteModal)
            .then(() => {
              setDeleteModal(null);
              run();
            })
            .catch(e => {
              alert(e.message || 'Failed to delete');
              setDeleteModal(null);
            });
        }}
        onCancel={() => setDeleteModal(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  enrollBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  enrollBtnT: { color: colors.card, fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', backgroundColor: colors.bgDark, borderRadius: radius.pill, padding: 4, marginVertical: spacing.sm },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.pill },
  on: { backgroundColor: colors.card },
  tabT: { ...typography.small, fontWeight: '700' },
  onT: { color: colors.primary },
  search: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, minHeight: 46, justifyContent: 'center' },
  in: { ...typography.body },
  filterWrap: { marginTop: spacing.md },
  filterLabel: { ...typography.caption, marginBottom: spacing.xs, color: colors.textDim },
  filterScroll: { flexDirection: 'row' },
  filterChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6, marginRight: spacing.sm },
  filterChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipT: { ...typography.small, color: colors.text },
  filterChipTOn: { color: colors.card, fontWeight: '700' },
  list: { padding: spacing.lg },
  card: { marginBottom: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center' },
  av: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F0F3', alignItems: 'center', justifyContent: 'center' },
  avT: { fontWeight: '800', color: colors.primary },
  mid: { flex: 1, marginHorizontal: spacing.sm },
  nm: { ...typography.title },
  sb: { ...typography.small, color: colors.textDim },
  batch: { ...typography.caption, color: colors.primary, marginTop: 2 },
  row: { flexDirection: 'row', marginTop: spacing.md },
  b: { backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, marginRight: spacing.sm },
  bt: { fontWeight: '700', fontSize: 13, color: colors.primary }
});
