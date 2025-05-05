import { makeStyles, tokens, Card, CardHeader, CardPreview, CardFooter, Text, Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, Textarea } from '@fluentui/react-components'
import { PlayRegular, HeartRegular, HeartFilled, ChatRegular } from '@fluentui/react-icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

const useStyles = makeStyles({
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
  channelInfo: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  likeButton: {
    color: tokens.colorPaletteRedForeground1,
    ':hover': {
      color: tokens.colorPaletteRedForeground2,
    },
  },
  commentButton: {
    color: tokens.colorNeutralForeground1,
  },
  commentsList: {
    marginTop: tokens.spacingVerticalM,
  },
  comment: {
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  commentInput: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
})

function PlaylistCard({ playlist, showSocial = true }) {
  const styles = useStyles()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(playlist.isLiked || false)
  const [likesCount, setLikesCount] = useState(playlist.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(playlist.comments_count || 0)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('playlist_id', playlist.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ playlist_id: playlist.id, user_id: user.id }])

        if (error) throw error
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error.message)
    }
  }

  const handleComment = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!newComment.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          playlist_id: playlist.id,
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
        .eq('playlist_id', playlist.id)
        .order('created_at', { ascending: false })

      if (commentsError) throw commentsError

      setComments(updatedComments)
      setCommentsCount(prev => prev + 1)
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error.message)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_profiles(nickname)
        `)
        .eq('playlist_id', playlist.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error.message)
    }
  }

  const handleCommentsClick = () => {
    setIsCommentsOpen(true)
    fetchComments()
  }

  return (
    <>
      <Card className={styles.videoCard}>
        <div className={styles.cardHeader}>
          <h3>{playlist.title}</h3>
          <p>{playlist.description || 'No description'}</p>
          <Text className={styles.channelInfo}>
            Created by {playlist.user_profile?.nickname || 'Anonymous'}
          </Text>
        </div>
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
        <CardFooter>
          <div className={styles.actionButtons}>
            <Button
              appearance="primary"
              icon={<PlayRegular />}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
            >
              View Playlist
            </Button>
            {showSocial && (
              <>
                <Button
                  appearance="subtle"
                  icon={isLiked ? <HeartFilled /> : <HeartRegular />}
                  onClick={handleLike}
                  className={styles.likeButton}
                >
                  {likesCount}
                </Button>
                <Button
                  appearance="subtle"
                  icon={<ChatRegular />}
                  className={styles.commentButton}
                  onClick={handleCommentsClick}
                >
                  {commentsCount}
                </Button>
              </>
            )}
          </div>
          <Text className={styles.channelInfo}>
            {playlist.playlist_videos?.length || 0} videos
          </Text>
        </CardFooter>
      </Card>

      {/* Comments Dialog */}
      <Dialog open={isCommentsOpen} onOpenChange={(e, data) => {
        if (!data.open) setIsCommentsOpen(false)
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Comments</DialogTitle>
            <DialogContent>
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <Text weight="semibold">{comment.user.nickname}</Text>
                    <Text>{comment.content}</Text>
                  </div>
                ))}
              </div>
              <div className={styles.commentInput}>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                />
                <Button
                  appearance="primary"
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                >
                  Post
                </Button>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  )
}

export default PlaylistCard 