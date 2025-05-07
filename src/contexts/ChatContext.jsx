import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);

  useEffect(() => {
    if (user && !hasInitialFetch) {
      fetchMessages();
      fetchLastReadTimestamp();
      setHasInitialFetch(true);
    }
  }, [user, hasInitialFetch]);

  useEffect(() => {
    if (user) {
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          console.log('New message received:', payload.new);
          if (!isOpen) {
            setHasUnread(true);
          }
          // Update messages with the new message
          setMessages(prev => {
            const newMessages = [...prev, payload.new];
            console.log('Updated messages:', newMessages);
            return newMessages;
          });
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isOpen]);

  const fetchLastReadTimestamp = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_read_timestamps')
        .select('last_read_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching last read timestamp:', error);
        return;
      }

      if (data) {
        console.log('Loaded last read timestamp:', new Date(data.last_read_at).toLocaleString());
        setLastReadTimestamp(data.last_read_at);
      }
    } catch (error) {
      console.error('Error in fetchLastReadTimestamp:', error);
    }
  };

  const ensureUserProfile = async () => {
    if (!user) return false;

    try {
      // Check if user profile exists
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
            nickname: user.user_metadata?.name || 'Anonymous'
          }]);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return false;
        }
      } else if (profileError) {
        console.error('Error checking user profile:', profileError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      return false;
    }
  };

  const updateLastReadTimestamp = async (timestamp) => {
    if (!user) return;

    try {
      // Ensure user profile exists first
      const profileExists = await ensureUserProfile();
      if (!profileExists) {
        console.error('Cannot update timestamp: User profile does not exist');
        return;
      }

      // Update state immediately
      console.log('Updating last read timestamp:', new Date(timestamp).toLocaleString());
      setLastReadTimestamp(timestamp);

      // First try to get existing record
      const { data: existingRecord, error: selectError } = await supabase
        .from('chat_read_timestamps')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing timestamp:', selectError);
        return;
      }

      let error;
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('chat_read_timestamps')
          .update({ last_read_at: timestamp })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('chat_read_timestamps')
          .insert([{
            user_id: user.id,
            last_read_at: timestamp,
          }]);
        error = insertError;
      }

      if (error) {
        console.error('Error updating last read timestamp:', error);
        return;
      }
    } catch (error) {
      console.error('Error in updateLastReadTimestamp:', error);
    }
  };

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
    const timestamp = new Date().toISOString();
    updateLastReadTimestamp(timestamp);
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !user) return;

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
            nickname: user.user_metadata?.name || 'Anonymous'
          }]);

        if (insertError) throw insertError;
      } else if (profileError) {
        throw profileError;
      }

      // Now send the message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert([{
          content,
          user_id: user.id,
          channel: 'global',
        }])
        .select(`
          *,
          user:user_profiles(nickname)
        `)
        .single();

      if (messageError) throw messageError;

      // Add the new message to the state immediately
      if (newMessage) {
        console.log('Message sent successfully:', newMessage);
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setHasUnread(false);
      const timestamp = new Date().toISOString();
      updateLastReadTimestamp(timestamp);
    } else {
      // Fetch messages when opening chat
      fetchMessages();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setHasUnread(false);
    const timestamp = new Date().toISOString();
    updateLastReadTimestamp(timestamp);
  };

  const value = {
    messages,
    hasUnread,
    isOpen,
    lastReadTimestamp,
    fetchMessages,
    sendMessage,
    toggleChat,
    closeChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 