import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: () => Promise<string>;
  onImport: (json: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  visible,
  onClose,
  onExport,
  onImport,
  onRefresh,
}) => {
  const [jsonText, setJsonText] = useState('');

  const handleExport = async () => {
    const exported = await onExport();
    setJsonText(exported);
    Alert.alert('백업 완료', '아래 글상자에 전체 백업 데이터가 만들어졌습니다. 복사해서 안전한 곳에 보관해 주세요.');
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      Alert.alert('오류', '복원할 백업 데이터를 붙여넣어 주세요.');
      return;
    }
    Alert.alert(
      '데이터 덮어쓰기 복원',
      '이 기기에 저장된 기존 데이터가 백업본으로 완전히 대체됩니다. 계속 진행하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원 실행',
          style: 'destructive',
          onPress: async () => {
            const success = await onImport(jsonText);
            if (success) {
              onRefresh();
              Alert.alert('복원 성공', '로컬 데이터 복원이 완료되었습니다.');
              onClose();
            } else {
              Alert.alert('복원 실패', '올바른 백업 데이터가 아닙니다. 내용을 다시 확인해 주세요.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>[로컬 DB 백업 & 복원 // 서버비 0원]</Text>
          <Text style={styles.desc}>
            사용자의 사주 프로필과 일기 전체 데이터를 외부 서버 없이 기기 간에 자유롭게 이동할 수 있습니다.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleExport}>
              <Text style={styles.actionBtnText}>1. 백업 데이터 꺼내기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnWarning} onPress={handleImport}>
              <Text style={styles.actionBtnWarningText}>2. 백업 데이터로 복원하기</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="여기에 백업 데이터가 표시됩니다. 복원하려면 보관해 둔 백업 데이터를 붙여넣으세요."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={8}
            value={jsonText}
            onChangeText={setJsonText}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>창 닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 9, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  title: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#00F0FF',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#090D16',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionBtnWarning: {
    flex: 1,
    backgroundColor: '#FFB800',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnWarningText: {
    color: '#090D16',
    fontWeight: 'bold',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#0A0F1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#263859',
    color: '#00FF9D',
    padding: 10,
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  closeBtn: {
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
  },
});
