import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from './theme';

const STRINGS = {
  en: 'Making your drawing...',
  es: 'Haciendo tu dibujo...',
};

export default function LoadingScreen({ lang }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.emoji, { transform: [{ rotate: spin }, { translateY: floatAnim }] }]}
      >
        🎨
      </Animated.Text>
      <Text style={styles.text}>{STRINGS[lang]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  emoji: { fontSize: 88 },
  text: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
    marginTop: 28,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
