import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, Animated,
  StyleSheet, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from './theme';

const STRINGS = {
  en: {
    print: '🖨️  Print!',
    printing: 'Opening printer...',
    save: 'Save / Share',
    again: 'Make another!',
    printError: "Couldn't reach a printer. Try Save instead.",
  },
  es: {
    print: '🖨️  ¡Imprimir!',
    printing: 'Abriendo impresora...',
    save: 'Guardar / Compartir',
    again: '¡Hacer otra!',
    printError: 'No se encontró impresora. Intenta Guardar.',
  },
};

export default function ResultScreen({ result, lang, onAgain }) {
  const t = (key) => STRINGS[lang][key];
  const [printing, setPrinting] = useState(false);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const printBounce = useRef(new Animated.Value(1)).current;

  // Slide image up on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const animatePrintBtn = () =>
    Animated.sequence([
      Animated.timing(printBounce, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.spring(printBounce, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();

  const handlePrint = async () => {
    animatePrintBtn();
    setPrinting(true);
    try {
      // expo-print opens native AirPrint on iOS, Android Print on Android
      await Print.printAsync({ uri: result.pdfUrl });
    } catch {
      Alert.alert('', t('printError'));
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.pdfUrl, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save your coloring page',
        });
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Drawing */}
      <Animated.View
        style={[
          styles.imageWrap,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image
          source={{ uri: result.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: printBounce }] }}>
          <TouchableOpacity
            style={[styles.printBtn, printing && styles.printBtnDisabled]}
            onPress={handlePrint}
            disabled={printing}
            activeOpacity={0.85}
          >
            <Text style={styles.printBtnText}>
              {printing ? t('printing') : t('print')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>{t('save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.againBtn} onPress={onAgain} activeOpacity={0.8}>
            <Text style={styles.againBtnText}>{t('again')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  imageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  image: { width: '100%', height: '100%' },
  actions: {
    paddingVertical: 20,
    gap: 12,
  },
  printBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  printBtnDisabled: { opacity: 0.55 },
  printBtnText: { fontSize: 24, fontWeight: '800', color: colors.white },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 17, fontWeight: '700', color: colors.white },
  againBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  againBtnText: { fontSize: 17, fontWeight: '700', color: colors.text },
});
