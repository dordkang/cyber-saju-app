import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { FiveElement } from '../engine/types';

interface ElementCircuitProps {
  elementsRatio: Record<FiveElement, number>;
}

const ELEMENT_ORDER: readonly FiveElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

const ELEMENT_CONFIG: Record<FiveElement, { label: string; hanja: string; color: string; glow: string }> = {
  Wood: { label: '목', hanja: '木', color: '#00FF9D', glow: 'rgba(0, 255, 157, 0.75)' },
  Fire: { label: '화', hanja: '火', color: '#FF3366', glow: 'rgba(255, 51, 102, 0.75)' },
  Earth: { label: '토', hanja: '土', color: '#FFB800', glow: 'rgba(255, 184, 0, 0.75)' },
  Metal: { label: '금', hanja: '金', color: '#E2E8F0', glow: 'rgba(226, 232, 240, 0.7)' },
  Water: { label: '수', hanja: '水', color: '#00E5FF', glow: 'rgba(0, 229, 255, 0.75)' },
};

/** 네온 발광은 웹의 box-shadow로만 표현한다. 네이티브에서는 단색 막대로 충분하다. */
function glowStyle(glow: string): ViewStyle | null {
  return Platform.OS === 'web' ? ({ boxShadow: `0 0 8px 1px ${glow}` } as unknown as ViewStyle) : null;
}

export const ElementCircuit: React.FC<ElementCircuitProps> = ({ elementsRatio }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>[오행 기운 회로]</Text>
      {ELEMENT_ORDER.map((el) => {
        const config = ELEMENT_CONFIG[el];
        const raw = elementsRatio?.[el];
        const ratio = typeof raw === 'number' && Number.isFinite(raw) ? Math.max(0, raw) : 0;
        const isDeficient = ratio === 0;

        return (
          <View key={el} style={styles.row} accessible accessibilityLabel={`${config.label} ${ratio.toFixed(1)}퍼센트${isDeficient ? ' 결핍' : ''}`}>
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
                  !isDeficient && glowStyle(config.glow),
                ]}
              />
            </View>
            <Text style={[styles.ratioText, isDeficient && styles.deficientText]}>
              {ratio.toFixed(1)}%{isDeficient ? ' 결핍' : ''}
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
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hanjaText: {
    fontSize: 15,
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
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  ratioText: {
    width: 72,
    textAlign: 'right',
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  deficientText: {
    color: '#EF4444',
  },
});
