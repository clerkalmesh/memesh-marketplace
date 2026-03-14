import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import MessageBubble from '../../components/MessageBubble';
import ImageViewer from '../../components/ImageViewer';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export default function GlobalScreen() {
  const { 
    globalMessages, 
    getGlobalMessages, 
    sendGlobalMessage, 
    subscribeToGlobal, 
    unsubscribeFromGlobal,
    deleteGlobalMessage 
  } = useChatStore();
  const { authUser } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isAdmin = authUser?.role === 'admin';

  useEffect(() => {
    loadMessages();
    subscribeToGlobal();
    
    return () => {
      unsubscribeFromGlobal();
    };
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    await getGlobalMessages();
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getGlobalMessages();
    setRefreshing(false);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to send images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage) || sending) return;

    setSending(true);
    try {
      await sendGlobalMessage({
        text: messageText.trim() || undefined,
        image: selectedImage || undefined,
      });
      
      setMessageText('');
      setSelectedImage(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMessageLongPress = (message: any) => {
    const isOwnMessage = message.senderId === authUser?._id;
    const isAdminUser = authUser?.role === 'admin';
    
    const options = [
      {
        text: 'Copy',
        onPress: () => {
          if (message.text) {
            Clipboard.setStringAsync(message.text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Copied!', 'Message copied to clipboard');
          }
        }
      }
    ];

    // Admin bisa hapus pesan siapapun
    if (isAdminUser) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteGlobalMessage(message._id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            ]
          );
        }
      });
    } 
    // User biasa hanya bisa hapus pesan sendiri
    else if (isOwnMessage) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Message',
            'Are you sure you want to delete your message?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteGlobalMessage(message._id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            ]
          );
        }
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Message Options', '', options);
  };

  const handleImagePress = (imageUrl: string) => {
    setViewerImage(imageUrl);
    setViewerVisible(true);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === authUser?._id;
    
    // Format sender name dengan badge admin
    let senderDisplayName = item.senderName;
    if (item.isAdmin) {
      senderDisplayName = `${item.senderName} • Admin`;
    }

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        senderName={!isOwnMessage ? senderDisplayName : undefined}
        senderAvatar={!isOwnMessage ? item.senderProfilePic : undefined}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
        showStatus={false} // Global chat tidak perlu status
      />
    );
  };

  const EmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#333" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        {isAdmin ? 'Be the first to post an announcement!' : 'Waiting for admin announcements...'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff44aa" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Global Chat</Text>
        <View style={styles.headerInfo}>
          <Ionicons name="information-circle" size={20} color="#ff44aa" />
          <Text style={styles.headerSubtitle}>
            {isAdmin ? 'Admin • You can post' : 'Read-only'}
          </Text>
        </View>
        <Text style={styles.messageCount}>
          {globalMessages.length} messages
        </Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={globalMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff44aa" />
        }
        ListEmptyComponent={EmptyChat}
      />
      
      {isAdmin ? (
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={22} color="#ff44aa" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
              <Ionicons name="image" size={24} color="#ff44aa" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Write announcement..."
              placeholderTextColor="#888"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity 
              onPress={handleSend}
              disabled={(!messageText.trim() && !selectedImage) || sending}
              style={[
                styles.sendButton,
                (!messageText.trim() && !selectedImage) && styles.sendButtonDisabled
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.readOnlyContainer}>
          <Ionicons name="lock-closed" size={16} color="#888" />
          <Text style={styles.readOnlyText}>
            Read-only • Only admins can post
          </Text>
        </View>
      )}

      <ImageViewer
        visible={viewerVisible}
        imageUrl={viewerImage}
        onClose={() => setViewerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff44aa',
    marginBottom: 5,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 14,
  },
  messageCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ff44aa',
    backgroundColor: '#1e1e1e',
    padding: 12,
  },
  selectedImageContainer: {
    marginBottom: 10,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ff44aa30',
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#ff44aa',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ff44aa',
    backgroundColor: '#1e1e1e',
    padding: 16,
    gap: 8,
  },
  readOnlyText: {
    color: '#888',
    fontSize: 14,
  },
});