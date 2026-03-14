import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import LinearGradient from 'react-native-linear-gradient';
import MatrixRain from '../components/MatrixRain';
import AuthService from '../services/auth.service';

const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [signupData, setSignupData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState('');

  const generateIdentity = async () => {
    setShowTerminal(true);
    setIsGenerating(true);

    // Simulasi terminal steps
    setTimeout(async () => {
      try {
        const data = await AuthService.signup();
        await Clipboard.setStringAsync(data.secretKey);
        
        setSignupData(data);
        setStep(2);
        setCopySuccess('Secret key copied to clipboard!');
        
        setTimeout(() => setCopySuccess(''), 3000);
      } catch (error) {
        Alert.alert('Error', 'Failed to generate identity');
      } finally {
        setShowTerminal(false);
        setIsGenerating(false);
      }
    }, 5000);
  };

  const copySecretKey = async () => {
    if (signupData) {
      await Clipboard.setStringAsync(signupData.secretKey);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  if (showTerminal) {
    return (
      <View style={styles.container}>
        <MatrixRain />
        <View style={styles.terminalContainer}>
          <View style={styles.terminal}>
            <View style={styles.terminalHeader}>
              <View style={[styles.dot, styles.redDot]} />
              <View style={[styles.dot, styles.yellowDot]} />
              <View style={[styles.dot, styles.greenDot]} />
              <Text style={styles.terminalTitle}>memesh@identity:~</Text>
            </View>
            <View style={styles.terminalContent}>
              <Text style={styles.terminalLine}>$ generate-identity --secure</Text>
              <Text style={[styles.terminalLine, styles.cyan]}>› initializing identity protocol...</Text>
              <Text style={[styles.terminalLine, styles.yellow]}>› gathering entropy...</Text>
              <Text style={[styles.terminalLine, styles.orange]}>› generating cryptographic salts...</Text>
              <Text style={[styles.terminalLine, styles.purple]}>› deriving key pairs...</Text>
              <Text style={[styles.terminalLine, styles.blue]}>› encrypting identity bundle...</Text>
              <ActivityIndicator color="#FF44AA" style={styles.spinner} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (step === 2 && signupData) {
    return (
      <View style={styles.container}>
        <MatrixRain />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Identity_Generated.sh</Text>
            <Text style={styles.subtitle}>ACCESS MEMESH PROTOCOLS</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Anonymous ID</Text>
                <Text style={styles.infoValue}>{signupData.user.anonymousId}</Text>
              </View>
              <View style={styles.dividerLight} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Display Name</Text>
                <Text style={styles.infoValue}>{signupData.user.displayName}</Text>
              </View>
            </View>

            <View style={styles.secretCard}>
              <View style={styles.secretHeader}>
                <Text style={styles.infoLabel}>Secret Key</Text>
                <TouchableOpacity onPress={copySecretKey} style={styles.copyButton}>
                  <Text style={styles.copyText}>{copySuccess || 'Copy'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.secretBox}>
                <Text style={styles.secretText} selectable>
                  {signupData.secretKey}
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.downloadButton} onPress={() => {}}>
                <Text style={styles.downloadButtonText}>Download Key</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => navigation.replace('Home')}
              >
                <LinearGradient
                  colors={['#AA44FF', '#FF44AA']}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.note}>
              Secret key was automatically copied to clipboard.
            </Text>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Already have an identity? Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MatrixRain />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Identity Mesh-Protocol</Text>
          <Text style={styles.subtitle}>Generate a new anonymous identity</Text>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateIdentity}
            disabled={isGenerating}
          >
            <LinearGradient
              colors={['#AA44FF', '#FF44AA']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {isGenerating ? 'Generating...' : 'Generate Identity'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an identity? Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,68,170,0.4)',
    padding: 32,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF44AA',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,68,170,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(50,50,50,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(170,68,255,0.5)',
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    color: '#AA44FF',
    fontSize: 12,
  },
  infoValue: {
    color: '#FF44AA',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  secretCard: {
    backgroundColor: 'rgba(50,50,50,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(170,68,255,0.5)',
    padding: 12,
    marginBottom: 24,
  },
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyButton: {
    padding: 4,
  },
  copyText: {
    color: '#FF44AA',
    fontSize: 12,
  },
  secretBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(170,68,255,0.3)',
    padding: 8,
  },
  secretText: {
    color: '#FF44AA',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FF44AA',
    alignItems: 'center',
    marginRight: 8,
  },
  downloadButtonText: {
    color: '#FF44AA',
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 1,
    marginLeft: 8,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  note: {
    color: 'rgba(170,68,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  link: {
    color: '#FF44AA',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    width: '100%',
    marginBottom: 24,
  },
  terminalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  terminal: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,68,170,0.4)',
    width: '100%',
    maxWidth: 600,
  },
  terminalHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,68,170,0.3)',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  redDot: {
    backgroundColor: '#FF4444',
  },
  yellowDot: {
    backgroundColor: '#FFD700',
  },
  greenDot: {
    backgroundColor: '#44FF44',
  },
  terminalTitle: {
    color: '#FF44AA',
    fontSize: 12,
    marginLeft: 8,
  },
  terminalContent: {
    padding: 24,
    minHeight: 350,
  },
  terminalLine: {
    color: '#44FF44',
    fontFamily: 'monospace',
    fontSize: 16,
    marginBottom: 4,
  },
  cyan: {
    color: '#00FFFF',
  },
  yellow: {
    color: '#FFD700',
  },
  orange: {
    color: '#FFA500',
  },
  purple: {
    color: '#AA44FF',
  },
  blue: {
    color: '#4444FF',
  },
  spinner: {
    marginTop: 20,
  },
});

export default SignupScreen;