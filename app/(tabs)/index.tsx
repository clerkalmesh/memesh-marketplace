import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useChatStore } from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';

export default function ChatsScreen() {
  const router = useRouter();
  const { conversations, getConversations, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    await getConversations();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleChatPress = (conversation) => {
    setSelectedUser(conversation.friend);
    router.push(`/chat/${conversation.friend._id}`);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short' 
      });
    } else if (days > 0) {
      return `${days} hari`;
    } else if (hours > 0) {
      return `${hours} jam`;
    } else if (minutes > 0) {
      return `${minutes} menit`;
    } else {
      return 'Baru saja';
    }
  };

  const getMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'Belum ada pesan';
    
    const { lastMessage } = conversation;
    const isFromMe = lastMessage.senderId !== conversation.friend._id;
    
    let prefix = isFromMe ? 'Anda: ' : '';
    let content = '';
    
    if (lastMessage.text) {
      content = lastMessage.text;
    } else if (lastMessage.image) {
      content = '📷 Gambar';
    } else {
      content = 'Pesan';
    }
    
    // Batasi panjang preview
    if (content.length > 30) {
      content = content.substring(0, 30) + '...';
    }
    
    return prefix + content;
  };

  const renderConversation = ({ item }) => {
    const isOnline = onlineUsers.includes(item.friend._id);
    const hasUnread = item.unreadCount > 0;
    const messagePreview = getMessagePreview(item);

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, hasUnread && styles.unreadItem]} 
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.friend.profilePic ? (
            <Image source={{ uri: item.friend.profilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {item.friend.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.statusDot, isOnline ? styles.online : styles.offline]} />
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.friendName, hasUnread && styles.unreadName]}>
              {item.friend.displayName}
            </Text>
            <Text style={styles.friendId}>@{item.friend.anonymousId}</Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text 
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {messagePreview}
            </Text>
            {item.lastMessage && (
              <Text style={styles.messageTime}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
        </View>
        
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
        
        <Ionicons name="chevron-forward" size={20} color="#ff44aa" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={70} color="#333" />
      <Text style={styles.emptyTitle}>Belum Ada Percakapan</Text>
      <Text style={styles.emptySubtitle}>
        Tambah teman di tab Users untuk memulai chat
      </Text>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/users')}
      >
        <Ionicons name="person-add" size={20} color="#fff" style={styles.addButtonIcon} />
        <Text style={styles.addButtonText}>Cari Teman</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push('/requests')} 
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={24} color="#ff44aa" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={loadConversations} 
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color="#ff44aa" />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.friend._id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#ff44aa"
            colors={['#ff44aa']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff44aa20',
  },
  unreadItem: {
    borderColor: '#ff44aa',
    borderWidth: 1.5,
    backgroundColor: '#1e1e1e',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  defaultAvatar: {
    backgroundColor: '#ff44aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  online: {
    backgroundColor: '#4ade80',
  },
  offline: {
    backgroundColor: '#888',
  },
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  unreadName: {
    fontWeight: 'bold',
    color: '#ff44aa',
  },
  friendId: {
    fontSize: 11,
    color: '#888',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#888',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#fff',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#ff44aa',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chevron: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff44aa',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
  },
  addButtonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});