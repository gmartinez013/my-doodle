import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Animated,
  StyleSheet, Keyboard,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { colors } from './theme';

const STRINGS = {
  en: {
    title: '🎨 Color Bot',
    prompt: 'What do you want to color?',
    tapMic: 'Tap the mic and say it!',
    listening: 'Listening...',
    create: 'Create!',
    placeholder: 'or type it here...',
    errorInappropriate: "That one isn't for kids. Try something else!",
    errorGeneral: 'Something went wrong. Try again!',
  },
  es: {
    title: '🎨 Color Bot',
    prompt: '¿Qué quieres colorear?',
    tapMic: '¡Toca el micrófono y dilo!',
    listening: 'Escuchando...',
    create: '¡Crear!',
    placeholder: 'o escríbelo aquí...',
    errorInappropriate: '¡Eso no es para niños! Prueba otra cosa.',
    errorGeneral: '¡Algo salió mal! Inténtalo de nuevo.',
  },
};

const EXAMPLES = {
  en: [
    'a dragon eating a pizza',
    'a cat astronaut floating in space',
    'a dinosaur playing guitar',
    'a robot learning to ride a bicycle',
    'a bear flying a kite',
    'a tiny elephant on a skateboard',
    'a mermaid reading a book underwater',
    'a snail racing a cheetah',
  ],
  es: [
    'un dragón comiendo pizza',
    'un gato astronauta flotando en el espacio',
    'un dinosaurio tocando guitarra',
    'un robot aprendiendo a montar bicicleta',
    'un oso volando una cometa',
    'un elefante pequeño en patineta',
    'una sirena leyendo un libro bajo el agua',
    'un caracol corriendo con un guepardo',
  ],
};

export default function HomeScreen({ lang, error, onToggleLang, onGenerate }) {
  const t = useCallback((key) => STRINGS[lang][key], [lang]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(
      () => setExampleIdx(i => (i + 1) % EXAMPLES[lang].length),
      4000
    );
    return () => clearInterval(timer);
  }, [lang]);

  useEffect(() => {
    if (isListening) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 550, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isListening, pulseAnim]);

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', () => setIsListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal && text) {
      setTranscript('');
      onGenerate(text);
    }
  });

  const toggleListening = useCallback(async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    setTranscript('');
    ExpoSpeechRecognitionModule.start({
      lang: lang === 'es' ? 'es-US' : 'en-US',
      interimResults: true,
    });
  }, [isListening, lang]);

  const handleCreate = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    Keyboard.dismiss();
    setInputText('');
    onGenerate(text);
  }, [inputText, onGenerate]);

  const example = EXAMPLES[lang][exampleIdx % EXAMPLES[lang].length];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.langBtn} onPress={onToggleLang}>
        <Text style={styles.langBtnText}>{lang === 'en' ? 'ES' : 'EN'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('title')}</Text>
      <Text style={styles.prompt}>{t('prompt')}</Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 36 }}>
        <TouchableOpacity
          style={[styles.micBtn, isListening && styles.micBtnActive]}
          onPress={toggleListening}
          activeOpacity={0.85}
        >
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.micHint}>
        {isListening ? t('listening') : t('tapMic')}
      </Text>

      {transcript ? (
        <Text style={styles.transcript} numberOfLines={2}>{transcript}</Text>
      ) : (
        <Text style={styles.example}>"{example}"</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('placeholder')}
          placeholderTextColor={colors.textLight}
          onSubmitEditing={handleCreate}
          returnKeyType="go"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>{t('create')}</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error === 'inappropriate' ? t('errorInappropriate') : t('errorGeneral')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.bg,
  },
  langBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 16 },
  prompt: {
    fontSize: 20,
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  micBtn: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },
  micBtnActive: { backgroundColor: '#E74C3C' },
  micIcon: { fontSize: 68 },
  micHint: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
    fontWeight: '500',
  },
  transcript: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  example: {
    fontSize: 16,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 18,
    textAlign: 'center',
    minHeight: 60,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 28,
    width: '100%',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  createBtnText: { fontSize: 16, fontWeight: '800', color: colors.text },
  errorText: {
    marginTop: 20,
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 16,
  },
});
