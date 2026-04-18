import React, { useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/HomeScreen';
import LoadingScreen from './src/LoadingScreen';
import ResultScreen from './src/ResultScreen';
import { generateColoringPage } from './src/api';
import { colors } from './src/theme';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'loading' | 'result'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');

  const handleGenerate = useCallback(async (subject) => {
    setError(null);
    setScreen('loading');
    try {
      const data = await generateColoringPage(subject, lang === 'es' ? 'es-US' : 'en-US');
      setResult(data);
      setScreen('result');
    } catch (err) {
      setScreen('home');
      setError(err.code === 'inappropriate' ? 'inappropriate' : 'general');
    }
  }, [lang]);

  const handleAgain = useCallback(() => {
    setResult(null);
    setError(null);
    setScreen('home');
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {screen === 'home' && (
        <HomeScreen
          lang={lang}
          error={error}
          onToggleLang={() => setLang(l => l === 'en' ? 'es' : 'en')}
          onGenerate={handleGenerate}
        />
      )}
      {screen === 'loading' && <LoadingScreen lang={lang} />}
      {screen === 'result' && (
        <ResultScreen
          result={result}
          lang={lang}
          onAgain={handleAgain}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
