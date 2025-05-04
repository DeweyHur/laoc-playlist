import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PlaylistContext = createContext()

export function PlaylistProvider({ children }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchPlaylists = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error('Error fetching playlists:', error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  const createPlaylist = async ({ title, description }) => {
    if (!user) return

    try {
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

      if (error) throw error
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