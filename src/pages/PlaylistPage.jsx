import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  videoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  videoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  thumbnail: {
    width: '120px',
    height: '68px',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusSmall,
  },
  videoInfo: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
})

function PlaylistPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playlists, deletePlaylist } = usePlaylist()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPlaylist()
  }, [id])

  const fetchPlaylist = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            *,
            video:youtube_videos (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setPlaylist(data)
    } catch (error) {
      console.error('Error fetching playlist:', error.message)
      setError('Failed to load playlist. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlaylist(id)
      navigate('/')
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError('Failed to delete playlist. Please try again later.')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Loading playlist..." />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error">
          <MessageBarBody>Playlist not found</MessageBarBody>
        </MessageBar>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.header}>
        <Title3>{playlist.title}</Title3>
        {user?.id === playlist.user_id && (
          <Button appearance="subtle" onClick={handleDelete}>
            Delete Playlist
          </Button>
        )}
      </div>

      <div className={styles.videoList}>
        {playlist.playlist_videos?.map(({ video }) => (
          <div key={video.id} className={styles.videoItem}>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className={styles.thumbnail}
            />
            <div className={styles.videoInfo}>
              <Text weight="semibold">{video.title}</Text>
              <Text size={200}>{video.channel_title}</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlaylistPage 