import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MBTI_GRID: readonly string[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

interface MbtiPickerModalProps {
  visible: boolean;
  selected?: string | null;
  innateMbti?: string | null;
  onClose: () => void;
  onSelect: (mbti: string) => void;
}

export const MbtiPickerModal: React.FC<MbtiPickerModalProps> = ({
  visible,
  selected,
  innateMbti,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>[실제 MBTI 보정]</Text>
          <Text style={styles.subtitle}>평소 나를 가장 잘 설명하는 유형을 선택하세요.</Text>

          <View style={styles.grid}>
            {MBTI_GRID.map((type) => {
              const isSelected = selected === type;
              const isInnate = innateMbti === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.cell, isSelected && styles.cellActive]}
                  onPress={() => onSelect(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cellText, isSelected && styles.cellTextActive]}>{type}</Text>
                  {isInnate && <Text style={styles.innateTag}>선천</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>닫기</Text>
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
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    color: '#00F0FF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  cell: {
    width: '23.2%',
    minHeight: 50,
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 2,
    backgroundColor: '#0A0F1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
  },
  cellText: {
    color: '#8B9BB4',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cellTextActive: {
    color: '#00F0FF',
  },
  innateTag: {
    color: '#BD93F9',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
});
