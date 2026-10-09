import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AGENT_STORE, AGENT_TYPES, AgentType } from '../prompts/agents';

interface PersonaPickerModalProps {
  visible: boolean;
  selected: AgentType;
  onClose: () => void;
  onSelect: (agent: AgentType) => void;
}

export const PersonaPickerModal: React.FC<PersonaPickerModalProps> = ({
  visible,
  selected,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />

        <View style={styles.modalBox}>
          <Text style={styles.title}>[인공지능 도사 고르기 · 풀이 말투 선택]</Text>

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            bounces
            contentContainerStyle={styles.listContent}
          >
            {AGENT_TYPES.map((agentKey) => {
              const persona = AGENT_STORE[agentKey];
              const isSelected = agentKey === selected;
              return (
                <Pressable
                  key={agentKey}
                  onPress={() => onSelect(agentKey)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.item,
                    isSelected && styles.itemSelected,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Text style={styles.itemEmoji}>{persona.emoji}</Text>
                  <View style={styles.itemTextBox}>
                    <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                      {persona.name}
                    </Text>
                    <Text style={[styles.itemSubtitle, isSelected && styles.itemSubtitleSelected]}>
                      {persona.title}
                    </Text>
                    <Text style={styles.itemTone} numberOfLines={3}>
                      {persona.tone}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.itemCheck}>●</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    maxHeight: '88%',
    backgroundColor: '#0B1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: '#00F0FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  item: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#131B2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F293D',
  },
  itemSelected: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.14)',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 6,
  },
  itemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  itemEmoji: {
    fontSize: 40,
    width: 56,
    textAlign: 'center',
  },
  itemTextBox: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    color: '#E6EDF3',
    fontSize: 16,
    fontWeight: '900',
  },
  itemNameSelected: {
    color: '#00F0FF',
  },
  itemSubtitle: {
    color: '#BD93F9',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  itemSubtitleSelected: {
    color: '#D6BCFF',
  },
  itemTone: {
    color: '#8B9BB4',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  itemCheck: {
    color: '#00F0FF',
    fontSize: 12,
    marginLeft: 8,
  },
});
