import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Input,
  Badge,
  makeStyles,
  tokens,
  Divider,
  Text,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  messageSender: {
    fontWeight: tokens.fontWeightSemibold,
    marginRight: tokens.spacingHorizontalM,
  },
  messageMe: {
    color: tokens.colorBrandForegroundInverted
  },
  messageText: {
    marginRight: tokens.spacingHorizontalM,
  },
  messageTime: {
    fontSize: tokens.fontSize200,
    color: tokens.colorNeutralForeground3,
    marginLeft: tokens.spacingHorizontalM,
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: `${tokens.spacingVerticalM} 0`,
    '&::before, &::after': {
      content: '""',
      flex: 1,
      borderBottom: `1px dashed ${tokens.colorNeutralStroke2}`,
    },
  },
  dividerText: {
    padding: `0 ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSize200,
  }
});

const ChatDrawer = ({ isOpen, onClose }) => {
  const styles = useStyles();
  const [newMessage, setNewMessage] = useState('');
  const [localLastReadTimestamp, setLocalLastReadTimestamp] = useState(null);
  const { user } = useAuth();
  const { messages, lastReadTimestamp, sendMessage } = useChat();

  useEffect(() => {
    if (!isOpen && lastReadTimestamp) {
      console.log('Updating localLastReadTimestamp:', new Date(lastReadTimestamp).toLocaleString());
      setLocalLastReadTimestamp(lastReadTimestamp);
    }
  }, [isOpen, lastReadTimestamp]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage('');
  };

  const renderMessage = (message, index) => {
    const isUnread = localLastReadTimestamp && new Date(message.created_at) > new Date(localLastReadTimestamp);
    const showDivider = isUnread && index > 0 && 
      new Date(messages[index - 1].created_at) <= new Date(localLastReadTimestamp);

    return (
      <div key={message.id}>
        {showDivider && (
          <div className={styles.dividerContainer}>
            <Text className={styles.dividerText}>여기까지 읽으셨습니다.</Text>
          </div>
        )}
        <div
          className={`text-sm ${
            message.user_id === user?.id ? 'text-right' : 'text-left'
          }`}
        >
          <span className={`${styles.messageSender} ${message.user_id === user?.id ? styles.messageMe : ''}`}>
            {message.user?.nickname || 'Anonymous'}
          </span>
          <span className={`${styles.messageText}`}>
            {message.content}
          </span>
          <sub className={`${styles.messageTime}`}>
            {new Date(message.created_at).toLocaleTimeString()}
          </sub>
        </div>
      </div>
    );
  };

  const hasUnreadMessages = messages.some(
    message => localLastReadTimestamp && new Date(message.created_at) > new Date(localLastReadTimestamp)
  );

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(e, data) => onClose()}
      position="end"
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          <div className="relative">
            채팅
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((message, index) => renderMessage(message, index))}
          {messages.length > 0 && !hasUnreadMessages && (
            <div className={styles.dividerContainer}>
              <Text className={styles.dividerText}>모두 확인하셨습니다.</Text>
            </div>
          )}
        </div>
      </DrawerBody>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            type="submit"
            appearance="primary"
          >
            Send
          </Button>
        </div>
      </form>
    </Drawer>
  );
};

export default ChatDrawer; 