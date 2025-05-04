import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PlaylistContext = createContext()

export function PlaylistProvider({ children }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchPlaylists = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error('Error fetching playlists:', error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlaylist = async ({ title, description }) => {
    if (!user) {
      console.error('No user found when trying to create playlist')
      throw new Error('You must be signed in to create a playlist')
    }

    console.log('Creating playlist with user:', user)

    try {
      // First verify the user exists in auth.users
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Error getting auth user:', authError)
        throw authError
      }

      if (!authUser.user) {
        console.error('No auth user found')
        throw new Error('Authentication error: No user found')
      }

      console.log('Auth user verified:', authUser.user)

      // Then create the playlist
      const { data, error } = await supabase
        .from('playlists')
        .insert([
          {
            title,
            description,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating playlist:', error)
        throw error
      }

      console.log('Playlist created successfully:', data)
      setPlaylists((prev) => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error creating playlist:', error.message)
      throw error
    }
  }

  const deletePlaylist = async (id) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      throw error
    }
  }

  const value = {
    playlists,
    loading,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
  }

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylist() {
  const context = useContext(PlaylistContext)
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider')
  }
  return context
} 