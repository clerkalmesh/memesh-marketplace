import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MatrixRain from '../components/MatrixRain';
import AuthService from '../services/auth.service';
import { User } from '../types/user.types';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const formatAnonymousId = (id: string) => {
    if (id.length > 15) {
      return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
    }
    return id;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <MatrixRain />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF44AA" size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MatrixRain />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerDot} />
          <View style={styles.headerContent}>
            <Text style={styles.headerPath}>
              memesh@{user?.anonymousId || 'unknown'}:~
            </Text>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.displayName || 'Anonymous'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ANONYMOUS ID</Text>
            <Text style={[styles.infoValue, styles.pinkText]}>
              {formatAnonymousId(user?.anonymousId || 'N/A')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DISPLAY NAME</Text>
            <Text style={[styles.infoValue, styles.purpleText]}>
              {user?.displayName || 'Anonymous'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>STATUS</Text>
            <Text style={[styles.infoValue, styles.greenText]}>ONLINE</Text>
          </View>
        </View>

        {/* Terminal Simulation */}
        <View style={styles.terminalCard}>
          <Text style={styles.terminalLine}>$ whoami</Text>
          <Text style={styles.terminalOutput}>› {user?.anonymousId || 'unknown'}</Text>
          <Text style={styles.terminalLine}>$ pwd</Text>
          <Text style={styles.terminalOutput}>›/home/memesh/secure</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#AA44FF', '#FF44AA']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.logoutText}>LOGOUT</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.version}>
          memesh@v1.0.0 • secure channel • 30d session
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,68,170,0.4)',
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(68,255,68,0.8)',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerPath: {
    color: '#FF44AA',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(170,68,255,0.4)',
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  pinkText: {
    color: '#FF44AA',
  },
  purpleText: {
    color: '#AA44FF',
  },
  greenText: {
    color: '#44FF44',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  terminalCard: {
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,68,170,0.4)',
    padding: 16,
    marginBottom: 24,
  },
  terminalLine: {
    color: '#FFD700',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
  terminalOutput: {
    color: '#44FF44',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 8,
  },
  logoutButton: {
    width: '100%',
    marginBottom: 16,
  },
  gradientButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  version: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default HomeScreen;