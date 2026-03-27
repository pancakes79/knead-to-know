import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

export function SourdoughBoule({ size = 100 }: Props) {
  const s = size / 100; // scale factor

  return (
    <View style={[styles.container, { width: size, height: size * 1.1 }]}>
      {/* Steam lines */}
      <View style={[styles.steamRow, { top: 4 * s, gap: 6 * s }]}>
        <View style={[styles.steam, { width: 3 * s, height: 18 * s, borderRadius: 2 * s }]} />
        <View style={[styles.steam, { width: 3 * s, height: 22 * s, borderRadius: 2 * s, marginTop: -4 * s }]} />
        <View style={[styles.steam, { width: 3 * s, height: 18 * s, borderRadius: 2 * s }]} />
      </View>

      {/* Main loaf body — flat oval */}
      <View style={[styles.loafBody, {
        width: size,
        height: 46 * s,
        borderRadius: 23 * s,
        bottom: 10 * s,
      }]}>
        {/* Top crust — lighter oval sitting on top */}
        <View style={[styles.topCrust, {
          width: size * 0.92,
          height: 36 * s,
          borderRadius: 20 * s,
          top: -14 * s,
        }]}>
          {/* Score marks on top */}
          <View style={[styles.scoreContainer, { bottom: 8 * s, gap: 4 * s }]}>
            <View style={[styles.score, { width: size * 0.32, height: 3 * s, borderRadius: 2 * s }]} />
            <View style={[styles.score, { width: size * 0.38, height: 3 * s, borderRadius: 2 * s }]} />
            <View style={[styles.score, { width: size * 0.32, height: 3 * s, borderRadius: 2 * s }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  steamRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
  },
  steam: {
    backgroundColor: '#C17F24',
    transform: [{ skewX: '-8deg' }],
    opacity: 0.8,
  },
  loafBody: {
    backgroundColor: '#A0681E',
    position: 'absolute',
    alignItems: 'center',
  },
  topCrust: {
    backgroundColor: '#E8A849',
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  score: {
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
});
