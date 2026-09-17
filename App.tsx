import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { calculateSaju } from './src/engine/calculator';
import { 
  initDatabase, 
  saveUserProfile, 
  getUserProfile, 
  saveDiaryEntry, 
  getDiaryEntries, 
  UserProfile, 
  DiaryEntry 
} from './src/database/db';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    async function setup() {
      try {
        // 1. SQLite DB 및 테이블 초기화
        await initDatabase();

        // 2. 만세력 연산 후 로컬 DB에 프로필 저장
        const birthDate = '1975-06-11';
        const birthTime = '05:00';
        const saju = calculateSaju(1975, 6, 11, 5, 0);

        await saveUserProfile('호스트', birthDate, birthTime, saju);

        // 3. 로컬 DB에서 데이터 조회
        const loadedProfile = await getUserProfile();
        const loadedDiaries = await getDiaryEntries();

        setProfile(loadedProfile);
        setDiaries(loadedDiaries);
        setDbReady(true);
      } catch (e) {
        console.error('DB 초기화 실패:', e);
      }
    }
    setup();
  }, []);

  // 테스트용 일기 추가 함수
  const handleAddSampleDiary = async () => {
    const today = new Date().toISOString().split('T')[0];
    await saveDiaryEntry({
      date: today,
      emotionScore: 4,
      content: '로컬 SQLite 스토리지 구축 및 테스트 성공.',
      aiFeedback: '목(木)의 기운이 균형을 잡아가고 있습니다.'
    });

    const updated = await getDiaryEntries();
    setDiaries(updated);
    Alert.alert('저장 완료', '오늘의 감정 일기가 로컬 SQLite에 저장되었습니다.');
  };

  if (!dbReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.neonText}>로컬 SQLite 스토리지 준비 중...</Text>
      </View>
    );
  }

  const sajuObj = profile ? JSON.parse(profile.sajuData) : null;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={styles.header}>CYBER SAJU ENGINE // DB LAYER</Text>

      {/* 로컬 프로필 영역 (안전 참조 적용) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>[LOCAL PROFILE (SQLite)]</Text>
        <Text style={styles.text}>식별자: #{profile?.id} | 사용자: {profile?.name}</Text>
        <Text style={styles.text}>생년월일: {profile?.birthDate} {profile?.birthTime}</Text>
        
        {/* 원시 데이터 안전 표시 */}
        <View style={styles.dataBox}>
          <Text style={styles.dataText}>
            {sajuObj ? JSON.stringify(sajuObj, null, 2) : '데이터 없음'}
          </Text>
        </View>
      </View>

      {/* 일기 쓰기 테스트 버튼 */}
      <TouchableOpacity style={styles.actionButton} onPress={handleAddSampleDiary}>
        <Text style={styles.buttonText}>+ 오늘 일기 로컬 저장 (Upsert 테스트)</Text>
      </TouchableOpacity>

      {/* 저장된 일기 목록 표시 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>[DAILY DIARY RECORDS ({diaries.length})]</Text>
        {diaries.length === 0 ? (
          <Text style={styles.textMuted}>기록된 일기가 없습니다.</Text>
        ) : (
          diaries.map((item) => (
            <View key={item.id} style={styles.diaryItem}>
              <Text style={styles.diaryDate}>{item.date} (에너지 지수: {item.emotionScore}/5)</Text>
              <Text style={styles.diaryContent}>{item.content}</Text>
              {item.aiFeedback && (
                <Text style={styles.diaryFeedback}>오행 조언: {item.aiFeedback}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#090D16' },
  container: { padding: 20, paddingTop: 60, alignItems: 'center' },
  header: { color: '#00F0FF', fontSize: 18, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
  neonText: { color: '#00F0FF', fontSize: 16 },
  card: { width: '100%', backgroundColor: '#131B2E', borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1F293D' },
  cardTitle: { color: '#8B9BB4', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  text: { color: '#FFFFFF', fontSize: 14, marginVertical: 2 },
  textMuted: { color: '#55657E', fontSize: 13 },
  dataBox: { backgroundColor: '#0b0f19', padding: 10, borderRadius: 6, marginTop: 8 },
  dataText: { color: '#FFB86C', fontSize: 12, fontFamily: 'monospace' },
  actionButton: { width: '100%', backgroundColor: '#00F0FF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#090D16', fontWeight: 'bold', fontSize: 14 },
  diaryItem: { borderBottomWidth: 1, borderBottomColor: '#242F44', paddingBottom: 10, marginBottom: 10 },
  diaryDate: { color: '#00F0FF', fontSize: 13, fontWeight: 'bold' },
  diaryContent: { color: '#E6EDF3', fontSize: 14, marginTop: 4 },
  diaryFeedback: { color: '#BD93F9', fontSize: 12, marginTop: 4 }
});