import { useState, useEffect, useRef } from 'react'
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
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
} from '@fluentui/react-components'
import { 
  EditRegular,
  PlayRegular,
  AddRegular,
  PauseRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'
import CreatePlaylistDrawer from '../components/CreatePlaylistDrawer'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalL,
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
    borderRadius: tokens.borderRadiusSmall,
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
    height: '100vh',
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
  },
  duration: {
    position: 'absolute',
    bottom: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: tokens.colorNeutralForegroundInverted,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  playerContainer: {
    position: 'fixed',
    bottom: tokens.spacingVerticalL,
    right: tokens.spacingHorizontalL,
    width: '320px',
    height: '180px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    zIndex: 1000,
    overflow: 'hidden',
  },
  playerControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacingVerticalS,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentVideoInfo: {
    color: tokens.colorNeutralForegroundInverted,
    padding: `0 ${tokens.spacingHorizontalS}`,
    fontSize: tokens.fontSizeBase200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

function PlaylistPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deletePlaylist } = usePlaylist()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef(null)
  const playerInstanceRef = useRef(null)

  useEffect(() => {
    fetchPlaylists()
  }, [id])

  useEffect(() => {
    // Initialize YouTube Player API
    if (!window.YT) {
      // If YT is not loaded yet, create a global callback
      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      // If YT is already loaded, initialize immediately
      initializePlayer()
    }

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy()
      }
    }
  }, [currentVideoIndex, playlists])

  const initializePlayer = () => {
    if (playerRef.current && playlists[0]?.playlist_videos?.[currentVideoIndex]) {
      const videoId = getVideoId(playlists[0].playlist_videos[currentVideoIndex].youtube_url)
      if (videoId) {
        if (playerInstanceRef.current) {
          playerInstanceRef.current.destroy()
        }
        playerInstanceRef.current = new window.YT.Player(playerRef.current, {
          height: '180',
          width: '320',
          videoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event) => {
              if (isPlaying) {
                event.target.playVideo()
              }
            },
            onStateChange: handlePlayerStateChange,
            onError: (event) => {
              console.error('YouTube Player Error:', event.data)
              // Try to play next video if there's an error
              const nextIndex = currentVideoIndex + 1
              if (nextIndex < playlists[0]?.playlist_videos?.length) {
                setCurrentVideoIndex(nextIndex)
              }
            },
          },
        })
      }
    }
  }

  const getVideoId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handlePlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      // Play next video when current video ends
      const nextIndex = currentVideoIndex + 1
      if (nextIndex < playlists[0]?.playlist_videos?.length) {
        setCurrentVideoIndex(nextIndex)
      } else {
        setIsPlaying(false)
      }
    } else if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true)
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (playerInstanceRef.current) {
      if (isPlaying) {
        playerInstanceRef.current.pauseVideo()
      } else {
        playerInstanceRef.current.playVideo()
      }
    }
  }

  const playNext = () => {
    const nextIndex = currentVideoIndex + 1
    if (nextIndex < playlists[0]?.playlist_videos?.length) {
      setCurrentVideoIndex(nextIndex)
      setIsPlaying(true)
    }
  }

  const playPrevious = () => {
    const prevIndex = currentVideoIndex - 1
    if (prevIndex >= 0) {
      setCurrentVideoIndex(prevIndex)
      setIsPlaying(true)
    }
  }

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      const query = supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            id,
            youtube_url,
            title,
            channel_title,
            thumbnail_url,
            duration
          )
        `)

      if (id) {
        // Fetch single playlist
        const { data, error } = await query
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) {
          throw new Error('Playlist not found')
        }
        setPlaylists([data])
      } else {
        // Fetch all playlists
        const { data, error } = await query
          .order('created_at', { ascending: false })

        if (error) throw error
        setPlaylists(data)
      }
    } catch (error) {
      console.error('Error fetching playlists:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePlaylist(id)
      setPlaylists(playlists.filter(playlist => playlist.id !== id))
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError(error.message)
    }
  }

  const handlePlaylistCreated = (newPlaylist) => {
    setPlaylists([newPlaylist, ...playlists])
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading playlists..." />
      </div>
    )
  }

  if (id && playlists.length === 0) {
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

      {!id && (
        <div className={styles.header}>
          <Title3>My Playlists</Title3>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            Create Playlist
          </Button>
        </div>
      )}

      {id ? (
        // Single playlist view
        playlists.map(playlist => (
          <div key={playlist.id}>
            <div className={styles.header}>
              <Title3>{playlist.title}</Title3>
              {playlist.user_id === user.id && (
                <Button 
                  appearance="primary" 
                  icon={<EditRegular />}
                  onClick={() => navigate(`/playlist/${playlist.id}/edit`)}
                >
                  Edit Playlist
                </Button>
              )}
            </div>

            {playlist.description && (
              <Text className={styles.description}>{playlist.description}</Text>
            )}

            <div className={styles.videoGrid}>
              {playlist.playlist_videos?.map((video, index) => (
                <Card 
                  key={video.id} 
                  className={styles.videoCard}
                  style={{
                    border: index === currentVideoIndex ? `2px solid ${tokens.colorBrandForeground1}` : undefined,
                  }}
                >
                  <CardPreview>
                    <div className={styles.thumbnailContainer}>
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className={styles.thumbnail}
                      />
                      {video.duration && (
                        <div className={styles.duration}>{video.duration}</div>
                      )}
                    </div>
                  </CardPreview>
                  <CardHeader>
                    <Text weight="semibold" className={styles.titleText}>
                      {video.title}
                    </Text>
                    <Text className={styles.channelInfo}>
                      {video.channel_title}
                    </Text>
                  </CardHeader>
                  <CardFooter>
                    <Button
                      appearance="primary"
                      icon={<PlayRegular />}
                      onClick={() => {
                        setCurrentVideoIndex(index)
                        setIsPlaying(true)
                      }}
                    >
                      {index === currentVideoIndex && isPlaying ? 'Playing' : 'Play'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Floating YouTube Player */}
            {playlist.playlist_videos?.length > 0 && (
              <div className={styles.playerContainer}>
                <div ref={playerRef} />
                <div className={styles.playerControls}>
                  <Button
                    appearance="subtle"
                    icon={<PlayRegular />}
                    onClick={playPrevious}
                    disabled={currentVideoIndex === 0}
                  />
                  <Button
                    appearance="subtle"
                    icon={isPlaying ? <PauseRegular /> : <PlayRegular />}
                    onClick={togglePlay}
                  />
                  <Button
                    appearance="subtle"
                    icon={<PlayRegular />}
                    onClick={playNext}
                    disabled={currentVideoIndex === playlist.playlist_videos.length - 1}
                  />
                  <Text className={styles.currentVideoInfo}>
                    {playlist.playlist_videos[currentVideoIndex]?.title}
                  </Text>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        // Playlist list view
        <div className={styles.grid}>
          {playlists.map(playlist => (
            <Card key={playlist.id} className={styles.videoCard}>
              <CardPreview>
                {playlist.playlist_videos?.[0]?.thumbnail_url ? (
                  <img
                    src={playlist.playlist_videos[0].thumbnail_url}
                    alt={playlist.title}
                    className={styles.thumbnail}
                  />
                ) : (
                  <div 
                    className={styles.thumbnail}
                    style={{ 
                      backgroundColor: tokens.colorNeutralBackground3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text>No videos</Text>
                  </div>
                )}
              </CardPreview>
              <CardHeader>
                <Text weight="semibold" className={styles.titleText}>
                  {playlist.title}
                </Text>
                <Text className={styles.channelInfo}>
                  {playlist.playlist_videos?.length || 0} videos
                </Text>
              </CardHeader>
              <CardFooter>
                <Button
                  appearance="primary"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                >
                  View Playlist
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreatePlaylistDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </div>
  )
}

export default PlaylistPage 