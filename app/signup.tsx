import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, Link } from 'expo-router';
import useAuthStore from '../store/useAuthStore';
import MatrixRain from '../components/MatrixRain';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

export default function SignUpScreen() {
  const router = useRouter();
  const { signup, signupData, clearSignupData, isSigningUp } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showTerminal, setShowTerminal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const typeLine = async (line, speed = 40) => {
    let currentText = '';
    for (let i = 0; i < line.length; i++) {
      currentText += line[i];
      setExecutionLogs(prev => [...prev.slice(0, -1), currentText]);
      await delay(speed);
    }
  };

  const runTerminal = async () => {
    setExecutionLogs(['$']);
    await typeLine('$ generate-identity --secure', 50);
    await delay(300);

    const steps = [
      '> initializing identity protocol...',
      '> gathering entropy...',
      '> generating cryptographic salts...',
      '> deriving key pairs (4096-bit RSA)...',
      '> encrypting identity bundle...',
      '> hashing with PBKDF2...',
      '> signing identity certificate...',
      '> validating signature...',
      '> persisting to secure store...',
      '> finalizing...',
    ];

    for (const step of steps) {
      setExecutionLogs(prev => [...prev, step]);
      await delay(600);
    }
  };

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError('');
    setShowTerminal(true);
    
    await runTerminal();

    try {
      const data = await signup();
      setExecutionLogs(prev => [...prev, '> secret key generated.']);
      await delay(600);
      setExecutionLogs(prev => [...prev, '> identity created successfully.']);
      await delay(800);

      if (data?.secretKey) {
        await Clipboard.setStringAsync(data.secretKey);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setStep(2);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Failed to generate identity');
      setExecutionLogs(prev => [...prev, '> generation failed.']);
      await delay(800);
    } finally {
      setShowTerminal(false);
    }
  };

  const copySecretKey = async () => {
    if (!signupData?.secretKey) return;
    await Clipboard.setStringAsync(signupData.secretKey);
    setCopySuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const continueToSystem = () => {
    clearSignupData();
    router.replace('/(tabs)');
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
            <Text style={styles.terminalTitle}>memesh@identity:~</Text>
          </View>
          <View style={styles.terminalContent}>
            {executionLogs.map((line, idx) => {
              let color = '#fff';
              if (line.startsWith('$')) color = '#ffaa00';
              else if (line.includes('initializing')) color = '#00ffff';
              else if (line.includes('entropy')) color = '#ffff00';
              else if (line.includes('key pairs')) color = '#ff00ff';
              else if (line.includes('encrypting')) color = '#0000ff';
              else if (line.includes('hashing')) color = '#ff69b4';
              else if (line.includes('signing')) color = '#ff00ff';
              else if (line.includes('validating')) color = '#00ff00';
              else if (line.includes('identity created')) color = '#00ff00';
              
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

  if (step === 2 && signupData) {
    return (
      <View style={styles.container}>
        <MatrixRain />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Ionicons name="checkmark-circle" size={60} color="#ff44aa" style={styles.successIcon} />
            <Text style={styles.title}>Identity Generated</Text>
            <Text style={styles.subtitle}>Save your secret key securely</Text>
            
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Anonymous ID</Text>
                <Text style={styles.infoValue}>{signupData.anonymousId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Display Name</Text>
                <Text style={styles.infoValue}>Anonymous</Text>
              </View>
            </View>
            
            <View style={styles.secretBox}>
              <View style={styles.secretHeader}>
                <Text style={styles.secretLabel}>Secret Key</Text>
                <TouchableOpacity onPress={copySecretKey} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={18} color="#ff44aa" />
                  <Text style={styles.copyText}>{copySuccess ? 'Copied!' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.secretKey} numberOfLines={3} ellipsizeMode="middle">
                {signupData.secretKey}
              </Text>
            </View>
            
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#ffaa00" />
              <Text style={styles.warningText}>
                This key will not be shown again. Store it safely!
              </Text>
            </View>
            
            <TouchableOpacity onPress={continueToSystem} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Enter Memesh</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
            
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an identity? Log in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MatrixRain />
      
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="key" size={50} color="#ff44aa" style={styles.icon} />
          <Text style={styles.title}>Create Identity</Text>
          <Text style={styles.subtitle}>Generate a new anonymous identity</Text>
          
          <TouchableOpacity 
            style={[styles.generateButton, isSigningUp && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Identity</Text>
            )}
          </TouchableOpacity>
          
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Already have an identity? Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
  successIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
  generateButton: {
    backgroundColor: '#ff44aa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff44aa30',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
  },
  infoValue: {
    color: '#ff44aa',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  secretBox: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff44aa30',
    marginBottom: 16,
  },
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secretLabel: {
    color: '#888',
    fontSize: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: '#ff44aa',
    fontSize: 12,
  },
  secretKey: {
    color: '#ff44aa',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffaa0020',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    color: '#ffaa00',
    fontSize: 12,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#ff44aa',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#ff444420',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: '#ff44aa',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
    minHeight: 350,
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