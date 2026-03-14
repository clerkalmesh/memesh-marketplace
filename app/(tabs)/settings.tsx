import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { authUser, updateProfile, logout, signupData } = useAuthStore();
  const [displayName, setDisplayName] = useState(authUser?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await updateProfile({ profilePic: base64Image });
    }
  };

  const handleUpdateProfile = async () => {
    if (displayName !== authUser?.displayName) {
      await updateProfile({ displayName });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {authUser?.profilePic ? (
            <Image source={{ uri: authUser.profilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {authUser?.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor="#888"
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleUpdateProfile} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{authUser?.displayName}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={18} color="#ff44aa" />
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.infoRow}
          onPress={() => copyToClipboard(authUser?.anonymousId || '', 'Anonymous ID')}
        >
          <Ionicons name="id-card" size={18} color="#ff44aa" />
          <Text style={styles.infoLabel}>Anonymous ID:</Text>
          <Text style={styles.infoValue}>{authUser?.anonymousId}</Text>
          <Ionicons name="copy-outline" size={16} color="#888" />
        </TouchableOpacity>
        
        {authUser?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield" size={16} color="#ffaa00" />
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity 
          style={styles.secretKeyRow}
          onPress={() => setShowSecretKey(!showSecretKey)}
        >
          <Ionicons name="key" size={22} color="#ff44aa" />
          <View style={styles.secretKeyInfo}>
            <Text style={styles.secretKeyLabel}>Your Secret Key</Text>
            {showSecretKey && signupData?.secretKey ? (
              <Text style={styles.secretKeyValue} numberOfLines={1} ellipsizeMode="middle">
                {signupData.secretKey}
              </Text>
            ) : (
              <Text style={styles.secretKeyHidden}>••••••••••••••••</Text>
            )}
          </View>
          <Ionicons 
            name={showSecretKey ? "eye-off" : "eye"} 
            size={22} 
            color="#888" 
          />
        </TouchableOpacity>
        
        {signupData?.secretKey && (
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => copyToClipboard(signupData.secretKey!, 'Secret key')}
          >
            <Ionicons name="copy" size={18} color="#fff" />
            <Text style={styles.copyButtonText}>Copy Secret Key</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={18} color="#888" />
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={18} color="#888" />
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {authUser?.createdAt 
              ? new Date(authUser.createdAt).toLocaleDateString() 
              : 'Unknown'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Memesh Protocol v1.0</Text>
        <Text style={styles.footerSubtext}>Anonymous & Secure</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff44aa',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa20',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  defaultAvatar: {
    backgroundColor: '#ff44aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ff44aa',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editContainer: {
    width: '100%',
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff44aa',
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#ff44aa',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffaa0020',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    gap: 4,
  },
  adminText: {
    color: '#ffaa00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa20',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff44aa',
    marginBottom: 15,
  },
  secretKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ff44aa20',
    marginBottom: 10,
  },
  secretKeyInfo: {
    flex: 1,
  },
  secretKeyLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  secretKeyValue: {
    color: '#ff44aa',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  secretKeyHidden: {
    color: '#888',
    fontSize: 16,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff44aa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    margin: 20,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    color: '#ff44aa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
});