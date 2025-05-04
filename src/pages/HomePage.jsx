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
  Input,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components'
import { 
  PlayRegular,
  HeartRegular,
  HeartFilled,
  ChatRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
  cardHeader: {
    padding: tokens.spacingVerticalM,
    '& h3': {
      margin: 0,
      marginBottom: tokens.spacingVerticalS,
      color: tokens.colorNeutralForeground1,
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
    },
    '& p': {
      margin: 0,
      color: tokens.colorNeutralForeground2,
      fontSize: tokens.fontSizeBase300,
    },
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
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  likeButton: {
    minWidth: 'auto',
    padding: tokens.spacingHorizontalS,
  },
  commentButton: {
    minWidth: 'auto',
    padding: tokens.spacingHorizontalS,
  },
  commentSection: {
    marginTop: tokens.spacingVerticalM,
  },
  commentInput: {
    marginTop: tokens.spacingVerticalS,
  },
  commentList: {
    marginTop: tokens.spacingVerticalM,
  },
  comment: {
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  commentContent: {
    color: tokens.colorNeutralForeground1,
  },
  commentAuthor: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
})

function HomePage() {
  const styles = useStyles()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recentPlaylists, setRecentPlaylists] = useState([])
  const [allVideos, setAllVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('HomePage: Starting to fetch data...')

      // Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('HomePage: Session check:', { session, sessionError })

      // Fetch recent playlists
      console.log('HomePage: Fetching playlists...')
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
          ),
          likes:likes(count),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(6)

      console.log('HomePage: Playlists fetch result:', { playlistsData, playlistsError })

      if (playlistsError) throw playlistsError

      // Fetch user profiles for the playlists
      const userIds = playlistsData?.map(p => p.user_id) || []
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('id, nickname')
        .in('id', userIds)

      if (userProfilesError) throw userProfilesError

      // Fetch likes for the current user
      const { data: userLikes, error: userLikesError } = await supabase
        .from('likes')
        .select('playlist_id')
        .eq('user_id', user?.id)

      if (userLikesError) throw userLikesError

      // Combine playlist data with user profiles and likes
      const playlistsWithUsers = playlistsData?.map(playlist => ({
        ...playlist,
        user_profile: userProfiles?.find(profile => profile.id === playlist.user_id),
        isLiked: userLikes?.some(like => like.playlist_id === playlist.id) || false,
        likes_count: playlist.likes?.[0]?.count || 0,
        comments_count: playlist.comments?.[0]?.count || 0
      })) || []

      // Fetch all videos
      console.log('HomePage: Fetching videos...')
      const { data: videosData, error: videosError } = await supabase
        .from('playlist_videos')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('HomePage: Videos fetch result:', { videosData, videosError })

      if (videosError) throw videosError

      setRecentPlaylists(playlistsWithUsers)
      setAllVideos(videosData)
    } catch (error) {
      console.error('HomePage: Error fetching data:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (playlistId) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const playlist = recentPlaylists.find(p => p.id === playlistId)
      if (playlist.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('user_id', user.id)

        if (error) throw error

        setRecentPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, isLiked: false, likes_count: p.likes_count - 1 }
            : p
        ))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ playlist_id: playlistId, user_id: user.id }])

        if (error) throw error

        setRecentPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, isLiked: true, likes_count: p.likes_count + 1 }
            : p
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error.message)
      setError(error.message)
    }
  }

  const handleComment = async (playlistId) => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!newComment.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          playlist_id: playlistId,
          user_id: user.id,
          content: newComment.trim()
        }])

      if (error) throw error

      // Fetch updated comments
      const { data: updatedComments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_profiles(nickname)
        `)
        .eq('playlist_id', playlistId)
        .order('created_at', { ascending: false })

      if (commentsError) throw commentsError

      setComments(prev => ({
        ...prev,
        [playlistId]: updatedComments
      }))

      // Update comments count
      setRecentPlaylists(prev => prev.map(p => 
        p.id === playlistId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ))

      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error.message)
      setError(error.message)
    }
  }

  const fetchComments = async (playlistId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_profiles(nickname)
        `)
        .eq('playlist_id', playlistId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setComments(prev => ({
        ...prev,
        [playlistId]: data
      }))
    } catch (error) {
      console.error('Error fetching comments:', error.message)
      setError(error.message)
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
              <div className={styles.cardHeader}>
                <h3>{playlist.title}</h3>
                <p>{playlist.description || 'No description'}</p>
                <Text className={styles.channelInfo}>
                  Created by {playlist.user_profile?.nickname || 'Anonymous'}
                </Text>
              </div>
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
                <div className={styles.actionButtons}>
                  <Button
                    appearance="primary"
                    icon={<PlayRegular />}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  >
                    View Playlist
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={playlist.isLiked ? <HeartFilled /> : <HeartRegular />}
                    onClick={() => handleLike(playlist.id)}
                    className={styles.likeButton}
                  >
                    {playlist.likes_count}
                  </Button>
                  <Dialog>
                    <DialogTrigger>
                      <Button
                        appearance="subtle"
                        icon={<ChatRegular />}
                        className={styles.commentButton}
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          fetchComments(playlist.id)
                        }}
                      >
                        {playlist.comments_count}
                      </Button>
                    </DialogTrigger>
                    <DialogSurface>
                      <DialogBody>
                        <DialogTitle>Comments</DialogTitle>
                        <DialogContent>
                          <div className={styles.commentSection}>
                            <Textarea
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className={styles.commentInput}
                            />
                            <Button
                              appearance="primary"
                              onClick={() => handleComment(playlist.id)}
                              disabled={!newComment.trim()}
                            >
                              Post Comment
                            </Button>
                            <div className={styles.commentList}>
                              {comments[playlist.id]?.map((comment) => (
                                <div key={comment.id} className={styles.comment}>
                                  <div className={styles.commentHeader}>
                                    <Text className={styles.commentAuthor}>
                                      {comment.user?.nickname || 'Anonymous'}
                                    </Text>
                                    <Text className={styles.commentAuthor}>
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </Text>
                                  </div>
                                  <Text className={styles.commentContent}>
                                    {comment.content}
                                  </Text>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </DialogBody>
                    </DialogSurface>
                  </Dialog>
                </div>
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