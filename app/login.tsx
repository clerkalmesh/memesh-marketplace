import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Link } from 'expo-router';
import useAuthStore from '../store/useAuthStore';
import MatrixRain from '../components/MatrixRain';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuthStore();
  const [secretKey, setSecretKey] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [error, setError] = useState('');

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const typeLine = async (line, speed = 30) => {
    let currentText = '';
    for (let i = 0; i < line.length; i++) {
      currentText += line[i];
      setExecutionLogs(prev => [...prev.slice(0, -1), currentText]);
      await delay(speed);
    }
  };

  const runTerminal = async () => {
    setExecutionLogs(['$']);
    await typeLine('$ auth --verify', 50);
    await delay(300);

    const steps = [
      '> establishing secure channel...',
      '> requesting authentication challenge...',
      '> processing challenge response...',
      '> verifying cryptographic signature...',
      '> checking certificate revocation list...',
      '> validating identity permissions...',
      '> comparing secure hash...',
      '> validating credentials...',
      '> decrypting identity token...',
      '> finalizing authentication...',
    ];

    for (const step of steps) {
      setExecutionLogs(prev => [...prev, step]);
      await delay(600);
    }
  };

  const handleSubmit = async () => {
    if (!secretKey.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTerminal(true);
    setError('');

    await runTerminal();

    try {
      await login(secretKey);
      setExecutionLogs(prev => [...prev, '> identity verified...']);
      await delay(600);
      setExecutionLogs(prev => [...prev, '> access granted.']);
      await delay(800);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setExecutionLogs(prev => [...prev, '> access denied.', '> invalid secret key.']);
      setError('Invalid secret key');
      await delay(1000);
      setShowTerminal(false);
    }
  };

  if (showTerminal) {
    return (
      <View style={styles.terminalContainer}>
        <MatrixRain />
        <View style={styles.terminal}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalButtons}>
              <View style={[styles.terminalButton, styles.closeButton]} />
              <View style={[styles.terminalButton, styles.minimizeButton]} />
              <View style={[styles.terminalButton, styles.maximizeButton]} />
            </View>
            <Text style={styles.terminalTitle}>memesh@login:~</Text>
          </View>
          <View style={styles.terminalContent}>
            {executionLogs.map((line, idx) => {
              let color = '#fff';
              if (line.startsWith('$')) color = '#ffaa00';
              else if (line.includes('secure')) color = '#00ffff';
              else if (line.includes('challenge')) color = '#ffff00';
              else if (line.includes('signature')) color = '#ff00ff';
              else if (line.includes('validating')) color = '#00ff00';
              else if (line.includes('access granted')) color = '#00ff00';
              else if (line.includes('access denied')) color = '#ff4444';
              
              return (
                <Text key={idx} style={[styles.terminalLine, { color }]}>
                  {line}
                </Text>
              );
            })}
            <View style={styles.terminalCursor} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MatrixRain />
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="lock-closed" size={50} color="#ff44aa" style={styles.icon} />
          <Text style={styles.title}>Memesh Protocol</Text>
          <Text style={styles.subtitle}>Access via Secret Key</Text>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={secretKey}
                onChangeText={setSecretKey}
                placeholder="Enter your secret key"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.button, isLoggingIn && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>authenticate</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Link href="/signup" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>generate new identity</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ff44aa',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ff44aa',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff44aa30',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff444420',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#ff44aa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ff44aa30',
  },
  dividerText: {
    color: '#888',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff44aa',
  },
  secondaryButtonText: {
    color: '#ff44aa',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  terminal: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ff44aa',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa',
  },
  terminalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  terminalButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  closeButton: {
    backgroundColor: '#ff5f56',
  },
  minimizeButton: {
    backgroundColor: '#ffbd2e',
  },
  maximizeButton: {
    backgroundColor: '#27c93f',
  },
  terminalTitle: {
    color: '#ff44aa',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  terminalContent: {
    padding: 16,
    minHeight: 300,
  },
  terminalLine: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  terminalCursor: {
    width: 10,
    height: 18,
    backgroundColor: '#ff44aa',
    marginTop: 4,
  },
});