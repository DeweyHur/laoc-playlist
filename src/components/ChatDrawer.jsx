import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
  }
});

const ChatDrawer = ({ isOpen, onClose }) => {
  const styles = useStyles();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      subscribeToMessages();
      setHasUnread(false);
    }
  }, [isOpen]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:user_profiles(nickname)
      `)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        // Fetch the complete message with user profile
        supabase
          .from('messages')
          .select(`
            *,
            user:user_profiles(nickname)
          `)
          .eq('id', payload.new.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              if (isOpen) {
                // If drawer is open, refresh all messages
                fetchMessages();
              } else {
                // If drawer is closed, just add the new message and show notification
                setMessages((current) => [...current, data]);
                setHasUnread(true);
              }
            }
          });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      // First check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user.id,
            email: user.email,
            nickname: user.user_metadata?.name || 'Anonymous'
          }]);

        if (insertError) throw insertError;
      } else if (profileError) {
        throw profileError;
      }

      // Now send the message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          content: newMessage,
          user_id: user.id,
          channel: 'global',
        }]);

      if (messageError) throw messageError;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
            {hasUnread && (
              <Badge color="danger" className="absolute -top-1 -right-2" />
            )}
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
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
          ))}
        </div>
      </DrawerBody>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
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