import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MessageBubbleProps {
  message: {
    _id: string;
    text?: string;
    image?: string;
    createdAt: string;
    senderId: string;
    receiverId?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
  };
  isOwnMessage: boolean;
  senderName?: string;
  senderAvatar?: string;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: (message: any) => void;
  showStatus?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName,
  senderAvatar,
  onImagePress,
  onLongPress,
  showStatus = true,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="#888" />;
      case 'sent':
        return <Ionicons name="checkmark-outline" size={14} color="#888" />;
      case 'delivered':
        return <Ionicons name="checkmark-done-outline" size={14} color="#888" />;
      case 'read':
        return <Ionicons name="checkmark-done-outline" size={14} color="#4ade80" />;
      default:
        return null;
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(message);
    }
  };

  const handleImagePress = () => {
    if (message.image && onImagePress) {
      onImagePress(message.image);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={handleLongPress}
      delayLongPress={500}
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      {/* Avatar untuk pesan orang lain */}
      {!isOwnMessage && (
        <View style={styles.avatarContainer}>
          {senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {senderName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Konten pesan */}
      <View style={[styles.contentContainer, isOwnMessage && styles.ownContentContainer]}>
        {/* Nama pengirim (untuk pesan orang lain) */}
        {!isOwnMessage && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        {/* Bubble pesan */}
        <View style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          message.image && styles.imageBubble,
        ]}>
          {/* Gambar jika ada */}
          {message.image && (
            <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
              <Image 
                source={{ uri: message.image }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* Teks jika ada */}
          {message.text && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}>
              {message.text}
            </Text>
          )}

          {/* Waktu dan status */}
          <View style={styles.footer}>
            <Text style={[
              styles.timeText,
              isOwnMessage ? styles.ownTimeText : styles.otherTimeText,
            ]}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && showStatus && (
              <View style={styles.statusContainer}>
                {getStatusIcon()}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    backgroundColor: '#ff44aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    maxWidth: '75%',
  },
  ownContentContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#ff44aa',
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: '500',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    minWidth: 80,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  ownBubble: {
    backgroundColor: '#ff44aa',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#1e1e1e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ff44aa20',
  },
  imageBubble: {
    padding: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#888',
  },
  statusContainer: {
    marginLeft: 2,
  },
});

export default MessageBubble;