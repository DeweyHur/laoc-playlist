import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input,
  Title3,
  Text,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalL,
  },
  videoCard: {
    marginBottom: tokens.spacingVerticalL,
    cursor: 'pointer',
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
})

function HomePage() {
  const styles = useStyles()
  const navigate = useNavigate()
  const { user, handleKakaoLogin } = useAuth()
  const { playlists, loading, fetchPlaylists, createPlaylist } = usePlaylist()
  const [newLink, setNewLink] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchPlaylists()
    }
  }, [user, fetchPlaylists])

  const handleAddLink = async () => {
    if (!newLink) return

    try {
      setError(null)
      const videoId = extractId(newLink)
      if (!videoId) {
        setError('Invalid YouTube URL')
        return
      }

      await createPlaylist(newLink)
      setNewLink("")
    } catch (err) {
      console.error('Error adding link:', err)
      setError('Failed to add playlist. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <Spinner label="Loading..." />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      
      <div className={styles.inputGroup}>
        <Input
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="유튜브 링크 붙여넣기"
          style={{ flex: 1 }}
        />
        <Button appearance="primary" onClick={handleAddLink}>
          추가
        </Button>
      </div>
      {playlists.map(playlist => (
        <Card 
          key={playlist.id} 
          className={styles.videoCard}
          onClick={() => navigate(`/playlist/${playlist.id}`)}
        >
          <CardHeader>
            <Text weight="semibold">{playlist.title}</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              {playlist.youtube_url}
            </Text>
          </CardHeader>
          <CardPreview>
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${extractId(playlist.youtube_url)}`}
              frameBorder="0"
              allowFullScreen
            />
          </CardPreview>
        </Card>
      ))}
    </div>
  )
}

const extractId = (url) => {
  if (!url) return ""
  const match = url.match(/v=([^&]+)/)
  return match ? match[1] : ""
}

export default HomePage 