import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useChatStore } from '../../store/useChatStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export default function RequestsScreen() {
  const { friendRequests, getFriendRequests, acceptFriendRequest, rejectFriendRequest } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getFriendRequests();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getFriendRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    await acceptFriendRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectFriendRequest(requestId);
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        {item.userId.profilePic ? (
          <Image source={{ uri: item.userId.profilePic }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.userId.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.userId.displayName}</Text>
          <Text style={styles.userId}>@{item.userId.anonymousId}</Text>
          <Text style={styles.requestTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAccept(item._id)}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleReject(item._id)}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="person-add-outline" size={64} color="#333" />
      <Text style={styles.emptyTitle}>No Friend Requests</Text>
      <Text style={styles.emptySubtitle}>
        When someone adds you as a friend, you'll see it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friend Requests</Text>
      </View>
      
      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item._id}
        renderItem={renderRequest}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff44aa" />
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff44aa20',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#ff44aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 10,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4ade80',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});