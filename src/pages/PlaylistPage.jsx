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
  Input,
  Textarea,
} from '@fluentui/react-components'
import { 
  EditRegular,
  PlayRegular,
  AddRegular,
  PauseRegular,
  SaveRegular,
  DismissRegular,
  SparkleRegular,
  ReOrderDotsHorizontalRegular,
} from '@fluentui/react-icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'
import CreatePlaylistDrawer from '../components/CreatePlaylistDrawer'
import PlaylistCard from '../components/PlaylistCard'
import AddVideoDrawer from '../components/AddVideoDrawer'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlaylist, setEditedPlaylist] = useState(null)
  const playerRef = useRef(null)
  const playerInstanceRef = useRef(null)
  const [orderedVideos, setOrderedVideos] = useState([])
  const [isAddVideoDrawerOpen, setIsAddVideoDrawerOpen] = useState(false)

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

  useEffect(() => {
    if (playlists[0]?.playlist_videos) {
      setOrderedVideos(playlists[0].playlist_videos)
    }
  }, [playlists])

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
            duration,
            "order"
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
        // Sort videos by order
        data.playlist_videos = data.playlist_videos.sort((a, b) => a.order - b.order)
        setPlaylists([data])
      } else {
        // Fetch only user's playlists
        const { data, error } = await query
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        // Sort videos by order for each playlist
        data.forEach(playlist => {
          if (playlist.playlist_videos) {
            playlist.playlist_videos.sort((a, b) => a.order - b.order)
          }
        })
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

  const generateKoreanName = () => {
    const prefixes = [
      '불타는', '폭발하는', '전설의', '꿈꾸는', '날아가는', '빛나는', '달리는', '춤추는', '노래하는', '웃는',
      '미친', '미치도록', '완전', '완벽한', '최고의', '최강의', '최고급', '최상의', '최고의', '최고급',
      '매력적인', '매혹적인', '환상적인', '환상의', '환상적인', '환상의', '환상적인', '환상의', '환상적인', '환상의'
    ]
    
    const nouns = [
      '비트', '리듬', '멜로디', '하모니', '음악', '노래', '음악회', '콘서트', '공연', '음악여행',
      '파티', '축제', '축하', '축하의', '축하의', '축하의', '축하의', '축하의', '축하의', '축하의',
      '무대', '무대의', '무대에서', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의'
    ]
    
    const suffixes = [
      '파티', '축제', '축하', '축하의', '축하의', '축하의', '축하의', '축하의', '축하의', '축하의',
      '무대', '무대의', '무대에서', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의', '무대에서의',
      '쇼', '쇼의', '쇼에서', '쇼에서의', '쇼에서의', '쇼에서의', '쇼에서의', '쇼에서의', '쇼에서의', '쇼에서의'
    ]
    
    const emojis = ['🔥', '✨', '💫', '🌟', '⭐', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '🎼']
    
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    // Sometimes add a second emoji
    const secondEmoji = Math.random() > 0.5 ? emojis[Math.floor(Math.random() * emojis.length)] : ''
    
    // Sometimes add a third word
    const thirdWord = Math.random() > 0.7 ? ` ${nouns[Math.floor(Math.random() * nouns.length)]}` : ''
    
    return `${randomEmoji} ${randomPrefix} ${randomNoun}${thirdWord} ${randomSuffix} ${secondEmoji}`
  }

  const handleEdit = () => {
    if (playlists[0]) {
      setEditedPlaylist({
        title: playlists[0].title,
        description: playlists[0].description || '',
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .update({
          title: editedPlaylist.title,
          description: editedPlaylist.description,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setPlaylists([data])
      setIsEditing(false)
      setEditedPlaylist(null)
    } catch (error) {
      console.error('Error updating playlist:', error.message)
      setError(error.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedPlaylist(null)
  }

  const handleGenerateName = () => {
    if (editedPlaylist) {
      setEditedPlaylist(prev => ({
        ...prev,
        title: generateKoreanName()
      }))
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const items = Array.from(orderedVideos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setOrderedVideos(items)

    // Update the order of all affected videos in the database
    try {
      const updates = items.map((video, index) => ({
        id: video.id,
        order: index
      }))

      const { error } = await supabase
        .from('playlist_videos')
        .upsert(updates)

      if (error) throw error
    } catch (error) {
      console.error('Error updating video order:', error.message)
      setError('Failed to update video order. Please try again.')
      // Revert the order in the UI if the update fails
      setOrderedVideos(playlists[0].playlist_videos)
    }
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
              {isEditing ? (
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flex: 1 }}>
                  <Input
                    value={editedPlaylist.title}
                    onChange={(e) => setEditedPlaylist(prev => ({ ...prev, title: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <Button
                    appearance="subtle"
                    icon={<SparkleRegular />}
                    onClick={handleGenerateName}
                    title="Generate Korean Name"
                  />
                </div>
              ) : (
                <Title3>{playlist.title}</Title3>
              )}
              {playlist.user_id === user.id && (
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                  {isEditing ? (
                    <>
                      <Button 
                        appearance="primary" 
                        icon={<AddRegular />}
                        onClick={() => setIsAddVideoDrawerOpen(true)}
                      >
                        Add Video
                      </Button>
                      <Button 
                        appearance="primary" 
                        icon={<SaveRegular />}
                        onClick={handleSave}
                      >
                        Save
                      </Button>
                      <Button 
                        appearance="secondary" 
                        icon={<DismissRegular />}
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      appearance="primary" 
                      icon={<EditRegular />}
                      onClick={handleEdit}
                    >
                      Edit Playlist
                    </Button>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <Textarea
                value={editedPlaylist.description}
                onChange={(e) => setEditedPlaylist(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter playlist description"
                style={{ marginBottom: tokens.spacingVerticalL }}
              />
            ) : (
              playlist.description && (
                <Text className={styles.description}>{playlist.description}</Text>
              )
            )}

            <div className={styles.videoGrid}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="videos">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={styles.videoGrid}
                    >
                      {orderedVideos.map((video, index) => (
                        <Draggable
                          key={video.id}
                          draggableId={video.id}
                          index={index}
                          isDragDisabled={!isEditing}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <Card 
                                className={styles.videoCard}
                                style={{
                                  border: index === currentVideoIndex ? `2px solid ${tokens.colorBrandForeground1}` : undefined,
                                }}
                              >
                                <CardPreview>
                                  <div className={styles.thumbnailContainer}>
                                    {isEditing && (
                                      <div
                                        {...provided.dragHandleProps}
                                        style={{
                                          position: 'absolute',
                                          top: tokens.spacingVerticalS,
                                          left: tokens.spacingHorizontalS,
                                          zIndex: 1,
                                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                          padding: tokens.spacingVerticalXS,
                                          borderRadius: tokens.borderRadiusSmall,
                                          cursor: 'grab',
                                        }}
                                      >
                                        <ReOrderDotsHorizontalRegular />
                                      </div>
                                    )}
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
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
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

            <AddVideoDrawer
              isOpen={isAddVideoDrawerOpen}
              onClose={() => setIsAddVideoDrawerOpen(false)}
              playlistId={playlist.id}
              onVideoAdded={(newVideo) => {
                setOrderedVideos([...orderedVideos, newVideo])
              }}
            />
          </div>
        ))
      ) : (
        // Playlist list view
        <div className={styles.grid}>
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              showSocial={true}
            />
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