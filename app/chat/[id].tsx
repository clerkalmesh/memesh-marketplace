import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import MessageBubble from '../../components/MessageBubble';
import ImageViewer from '../../components/ImageViewer';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    messages, 
    getMessages, 
    sendMessage, 
    selectedUser, 
    subscribeToMessages, 
    unsubscribeFromMessages, 
    sendTyping, 
    sendStopTyping,
    deleteMessage 
  } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  const isOnline = onlineUsers.includes(id as string);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    setupTypingListeners();
    
    return () => {
      unsubscribeFromMessages();
      cleanupTypingListeners();
    };
  }, [id]);

  const loadMessages = async () => {
    setLoading(true);
    await getMessages(id as string);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const setupTypingListeners = () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on('typing', ({ from }) => {
      if (from === id) {
        setPartnerTyping(true);
      }
    });

    socket.on('stopTyping', ({ from }) => {
      if (from === id) {
        setPartnerTyping(false);
      }
    });
  };

  const cleanupTypingListeners = () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off('typing');
      socket.off('stopTyping');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(id as string);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      sendStopTyping(id as string);
    }, 2000);
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
      await sendMessage({
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

    if (isOwnMessage) {
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
                  await deleteMessage(message._id);
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
    
    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        senderName={!isOwnMessage ? selectedUser?.displayName : undefined}
        senderAvatar={!isOwnMessage ? selectedUser?.profilePic : undefined}
        onImagePress={handleImagePress}
        onLongPress={handleMessageLongPress}
        showStatus={isOwnMessage}
      />
    );
  };

  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, styles.typingDotMiddle]} />
        <View style={styles.typingDot} />
      </View>
      <Text style={styles.typingText}>{selectedUser?.displayName} is typing...</Text>
    </View>
  );

  const EmptyChat = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={60} color="#333" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Say hello to {selectedUser?.displayName}!
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ff44aa" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={() => router.push(`/profile/${id}`)}
        >
          <Text style={styles.headerName}>{selectedUser?.displayName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : selectedUser?.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleDateString()}` : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {selectedUser?.profilePic ? (
          <Image source={{ uri: selectedUser.profilePic }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {selectedUser?.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={EmptyChat}
        ListFooterComponent={partnerTyping ? TypingIndicator : null}
      />
      
      {/* Input Area */}
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
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={messageText}
            onChangeText={setMessageText}
            onChange={handleTyping}
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

      {/* Image Viewer Modal */}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#ff44aa',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  online: {
    backgroundColor: '#4ade80',
  },
  offline: {
    backgroundColor: '#888',
  },
  statusText: {
    color: '#888',
    fontSize: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    backgroundColor: '#ff44aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ff44aa20',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888',
    marginHorizontal: 2,
  },
  typingDotMiddle: {
    backgroundColor: '#ff44aa',
  },
  typingText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
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
    maxHeight: 120,
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
});