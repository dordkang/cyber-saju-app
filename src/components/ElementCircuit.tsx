import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FiveElement } from '../engine/types';

interface ElementCircuitProps {
  elementsRatio: Record<FiveElement, number>;
}

const ELEMENT_CONFIG: Record<
  FiveElement,
  { label: string; hanja: string; color: string }
> = {
  Wood: { label: '목 (Wood)', hanja: '木', color: '#00FF9D' },
  Fire: { label: '화 (Fire)', hanja: '火', color: '#FF3366' },
  Earth: { label: '토 (Earth)', hanja: '土', color: '#FFB800' },
  Metal: { label: '금 (Metal)', hanja: '金', color: '#E2E8F0' },
  Water: { label: '수 (Water)', hanja: '水', color: '#00E5FF' },
};

export const ElementCircuit: React.FC<ElementCircuitProps> = ({ elementsRatio }) => {
  const elements: FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>[오행 기운 회로]</Text>
      {elements.map((el) => {
        const config = ELEMENT_CONFIG[el];
        const ratio = elementsRatio?.[el] || 0;
        const isDeficient = ratio === 0;

        return (
          <View key={el} style={styles.row}>
            <View style={styles.labelBox}>
              <Text style={[styles.hanjaText, { color: config.color }]}>{config.hanja}</Text>
              <Text style={styles.labelText}>{config.label}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(ratio, 100)}%`,
                    backgroundColor: config.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.ratioText, isDeficient && styles.deficientText]}>
              {ratio.toFixed(1)}% {isDeficient ? '(결핍)' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  title: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelBox: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hanjaText: {
    fontSize: 14,
    fontWeight: '900',
  },
  labelText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 9,
    backgroundColor: '#050914',
    borderRadius: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  ratioText: {
    width: 65,
    textAlign: 'right',
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  deficientText: {
    color: '#EF4444',
  },
});
