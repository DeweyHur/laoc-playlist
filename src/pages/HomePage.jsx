import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Title2,
  Title3,
  Text,
  makeStyles,
  tokens,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
} from '@fluentui/react-components'
import { PlayRegular } from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: tokens.spacingVerticalL,
  },
  recentPlaylists: {
    marginBottom: tokens.spacingVerticalXXL,
  },
  playlistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalL,
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
  },
  videoInfo: {
    padding: tokens.spacingVerticalM,
  },
  channelInfo: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
})

function HomePage() {
  const styles = useStyles()
  const navigate = useNavigate()
  const [recentPlaylists, setRecentPlaylists] = useState([])
  const [allVideos, setAllVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            id,
            youtube_url,
            title,
            channel_title,
            thumbnail_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(6)

      if (playlistsError) throw playlistsError

      // Fetch all videos
      const { data: videosData, error: videosError } = await supabase
        .from('playlist_videos')
        .select('*')
        .order('created_at', { ascending: false })

      if (videosError) throw videosError

      setRecentPlaylists(playlistsData)
      setAllVideos(videosData)
    } catch (error) {
      console.error('Error fetching data:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading content..." />
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

      <div className={styles.recentPlaylists}>
        <div className={styles.header}>
          <Title2>Recent Playlists</Title2>
        </div>

        <div className={styles.playlistGrid}>
          {recentPlaylists.map((playlist) => (
            <Card key={playlist.id} className={styles.videoCard}>
              <CardHeader>
                <Title3>{playlist.title}</Title3>
                <Text>{playlist.description || 'No description'}</Text>
              </CardHeader>
              <CardPreview>
                {playlist.playlist_videos?.[0]?.thumbnail_url && (
                  <img
                    src={playlist.playlist_videos[0].thumbnail_url}
                    alt={playlist.title}
                    className={styles.thumbnail}
                  />
                )}
              </CardPreview>
              <CardFooter>
                <Button
                  appearance="primary"
                  icon={<PlayRegular />}
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                >
                  View Playlist
                </Button>
                <Text className={styles.channelInfo}>
                  {playlist.playlist_videos?.length || 0} videos
                </Text>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.header}>
          <Title2>Latest Videos</Title2>
        </div>

        <div className={styles.videoGrid}>
          {allVideos.map((video) => (
            <Card key={video.id} className={styles.videoCard}>
              <CardPreview>
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className={styles.thumbnail}
                />
              </CardPreview>
              <div className={styles.videoInfo}>
                <Title3>{video.title}</Title3>
                <Text className={styles.channelInfo}>{video.channel_title}</Text>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage 