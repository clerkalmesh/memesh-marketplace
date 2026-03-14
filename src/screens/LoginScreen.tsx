import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MatrixRain from '../components/MatrixRain';
import AuthService from '../services/auth.service';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [anonymousId, setAnonymousId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!anonymousId.trim() || !secretKey.trim()) {
      setError('Anonymous ID dan Secret Key harus diisi');
      return;
    }

    setIsExecuting(true);
    setError('');

    try {
      const user = await AuthService.login(anonymousId.trim(), secretKey.trim());
      if (user) {
        navigation.replace('Home');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <View style={styles.container}>
      <MatrixRain />
      
      {isExecuting ? (
        <View style={styles.terminalContainer}>
          <View style={styles.terminal}>
            <View style={styles.terminalHeader}>
              <View style={[styles.dot, styles.redDot]} />
              <View style={[styles.dot, styles.yellowDot]} />
              <View style={[styles.dot, styles.greenDot]} />
              <Text style={styles.terminalTitle}>memesh@login:~</Text>
            </View>
            <View style={styles.terminalContent}>
              <Text style={styles.terminalLine}>$ auth --verify</Text>
              <Text style={styles.terminalLine}>› establishing secure channel...</Text>
              <Text style={styles.terminalLine}>› requesting authentication...</Text>
              <Text style={styles.terminalLine}>› verifying cryptographic signature...</Text>
              <Text style={styles.terminalLine}>› validating credentials...</Text>
              <ActivityIndicator color="#FF44AA" style={styles.spinner} />
            </View>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>MEMESH PROTOCOLS</Text>
            <Text style={styles.subtitle}>Access via Anonymous ID & Secret Key</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Anonymous ID</Text>
              <TextInput
                style={styles.input}
                placeholder="MESH-XXXXXX"
                placeholderTextColor="#666"
                value={anonymousId}
                onChangeText={setAnonymousId}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Secret Key</Text>
              <TextInput
                style={styles.input}
                placeholder="64 karakter hex"
                placeholderTextColor="#666"
                value={secretKey}
                onChangeText={setSecretKey}
                secureTextEntry
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <LinearGradient
                colors={['#AA44FF', '#FF44AA']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>AUTHENTICATE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupButtonText}>GENERATE NEW IDENTITY</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#AA44FF',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    color: '#FF44AA',
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#333',
  },
  errorContainer: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4444',
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    marginBottom: 16,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#AA44FF',
  },
  dividerText: {
    color: '#AA44FF',
    marginHorizontal: 16,
    fontSize: 12,
  },
  signupButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FF44AA',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FF44AA',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  spinner: {
    marginTop: 20,
  },
});

export default LoginScreen;