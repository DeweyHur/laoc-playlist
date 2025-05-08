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
    Avatar,
    Tooltip,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    Textarea,
} from '@fluentui/react-components'
import {
    PlayRegular,
    PauseRegular,
    ArrowLeftRegular,
    PersonRegular,
    HeartRegular,
    HeartFilled,
    ChatRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { extractVideoId } from '../lib/youtubeUtils'
import { useAuth } from '../contexts/AuthContext'

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
    participantList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalS,
    },
    participantTag: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
    },
    socialActions: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalS,
    },
    avatarGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
    },
    avatar: {
        width: '24px',
        height: '24px',
        fontSize: '12px',
    },
    commentsList: {
        maxHeight: '200px',
        overflowY: 'auto',
    },
    comment: {
        marginBottom: tokens.spacingVerticalXS,
    },
    commentInput: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
    },
})

function RegularPerformanceVideoPage() {
    const styles = useStyles()
    const { id } = useParams()
    const navigate = useNavigate()
    const [performance, setPerformance] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const playerRef = useRef(null)
    const playerInstanceRef = useRef(null)
    const [videoMetadata, setVideoMetadata] = useState({})
    const { user } = useAuth()
    const [videoLikes, setVideoLikes] = useState({})
    const [videoComments, setVideoComments] = useState({})
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [selectedVideoId, setSelectedVideoId] = useState(null)
    const [newComment, setNewComment] = useState('')

    useEffect(() => {
        fetchPerformance()
    }, [id])

    useEffect(() => {
        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
            window.onYouTubeIframeAPIReady = initializePlayer
        } else {
            initializePlayer()
        }

        return () => {
            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.destroy()
                } catch (error) {
                    console.error('Error destroying player:', error)
                }
            }
        }
    }, [])

    useEffect(() => {
        if (window.YT && window.YT.Player) {
            initializePlayer()
        }
    }, [currentVideoIndex, performance])

    const initializePlayer = () => {
        if (playerRef.current && performance?.performance_videos?.[currentVideoIndex]) {
            const videoId = extractVideoId(performance.performance_videos[currentVideoIndex].youtube_url)
            if (videoId) {
                if (playerInstanceRef.current) {
                    playerInstanceRef.current.destroy()
                }
                try {
                    playerInstanceRef.current = new window.YT.Player(playerRef.current, {
                        height: '180',
                        width: '320',
                        videoId,
                        playerVars: {
                            autoplay: isPlaying ? 1 : 0,
                            controls: 1,
                            modestbranding: 1,
                            rel: 0,
                            fs: 0,
                            playsinline: 1
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
                                const nextIndex = currentVideoIndex + 1
                                if (nextIndex < performance?.performance_videos?.length) {
                                    setCurrentVideoIndex(nextIndex)
                                }
                            },
                        },
                    })
                } catch (error) {
                    console.error('Error initializing YouTube player:', error)
                }
            }
        }
    }

    const handlePlayerStateChange = (event) => {
        if (event.data === window.YT.PlayerState.ENDED) {
            const nextIndex = currentVideoIndex + 1
            if (nextIndex < performance?.performance_videos?.length) {
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
        if (nextIndex < performance?.performance_videos?.length) {
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

    const fetchPerformance = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('regular_performances')
                .select(`
                    *,
                    performance_videos (
                        id,
                        youtube_url,
                        title,
                        channel_title,
                        thumbnail_url,
                        duration,
                        performance_video_roles (
                            role,
                            user:user_profiles (
                                id,
                                nickname
                            )
                        )
                    )
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) {
                throw new Error('Performance not found')
            }

            setPerformance(data)
        } catch (error) {
            console.error('Error fetching performance:', error.message)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Helper function to group roles by user
    const groupRolesByUser = (roles) => {
        const userRoles = {}
        roles?.forEach(role => {
            const userId = role.user.id
            if (!userRoles[userId]) {
                userRoles[userId] = {
                    nickname: role.user.nickname,
                    roles: []
                }
            }
            userRoles[userId].roles.push(role.role)
        })
        return userRoles
    }

    const fetchVideoMetadata = async (videoId) => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
            )
            const data = await response.json()
            if (data.items?.[0]) {
                setVideoMetadata(prev => ({
                    ...prev,
                    [videoId]: data.items[0].snippet
                }))
            }
        } catch (error) {
            console.error('Error fetching video metadata:', error)
        }
    }

    useEffect(() => {
        if (performance?.performance_videos) {
            performance.performance_videos.forEach(video => {
                const videoId = extractVideoId(video.youtube_url)
                if (videoId && !videoMetadata[videoId]) {
                    fetchVideoMetadata(videoId)
                }
            })
        }
    }, [performance])

    useEffect(() => {
        if (performance?.performance_videos) {
            fetchVideoLikes()
            fetchVideoComments()
        }
    }, [performance])

    const fetchVideoLikes = async () => {
        try {
            const { data: likes, error } = await supabase
                .from('video_likes')
                .select('video_id')
                .eq('user_id', user?.id)

            if (error) throw error

            const likesMap = {}
            likes?.forEach(like => {
                likesMap[like.video_id] = true
            })
            setVideoLikes(likesMap)
        } catch (error) {
            console.error('Error fetching video likes:', error)
        }
    }

    const fetchVideoComments = async (videoId) => {
        try {
            const { data: comments, error } = await supabase
                .from('video_comments')
                .select(`
                    *,
                    user:user_profiles(nickname)
                `)
                .eq('video_id', videoId)
                .order('created_at', { ascending: false })

            if (error) throw error

            setVideoComments(prev => ({
                ...prev,
                [videoId]: comments
            }))
        } catch (error) {
            console.error('Error fetching video comments:', error)
        }
    }

    const handleLike = async (videoId) => {
        if (!user) {
            navigate('/login')
            return
        }

        try {
            if (videoLikes[videoId]) {
                // Unlike
                const { error } = await supabase
                    .from('video_likes')
                    .delete()
                    .eq('video_id', videoId)
                    .eq('user_id', user.id)

                if (error) throw error
                setVideoLikes(prev => ({
                    ...prev,
                    [videoId]: false
                }))
            } else {
                // Like
                const { error } = await supabase
                    .from('video_likes')
                    .insert([{ video_id: videoId, user_id: user.id }])

                if (error) throw error
                setVideoLikes(prev => ({
                    ...prev,
                    [videoId]: true
                }))
            }
        } catch (error) {
            console.error('Error toggling like:', error)
        }
    }

    const handleComment = async () => {
        if (!user || !selectedVideoId || !newComment.trim()) return

        try {
            const { error } = await supabase
                .from('video_comments')
                .insert([{
                    video_id: selectedVideoId,
                    user_id: user.id,
                    content: newComment.trim()
                }])

            if (error) throw error

            // Fetch updated comments
            await fetchVideoComments(selectedVideoId)
            setNewComment('')
        } catch (error) {
            console.error('Error adding comment:', error)
        }
    }

    const handleCommentsClick = (videoId) => {
        setSelectedVideoId(videoId)
        setIsCommentsOpen(true)
        fetchVideoComments(videoId)
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner label="Loading performance..." />
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
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
                    <Button
                        appearance="subtle"
                        icon={<ArrowLeftRegular />}
                        onClick={() => navigate('/regular-performances')}
                    >
                        Back to Performances
                    </Button>
                    <Title3>{performance.title}</Title3>
                </div>
            </div>

            {performance.description && (
                <Text className={styles.description}>{performance.description}</Text>
            )}

            <div className={styles.videoGrid}>
                {performance.performance_videos?.map((video, index) => {
                    const videoId = extractVideoId(video.youtube_url)
                    const metadata = videoMetadata[videoId]
                    return (
                        <Card
                            key={video.id}
                            className={styles.videoCard}
                            style={{
                                border: index === currentVideoIndex ? `2px solid ${tokens.colorBrandForeground1}` : undefined,
                            }}
                        >
                            <CardPreview>
                                <img
                                    src={video.thumbnail_url}
                                    alt={metadata?.title || video.title}
                                    className={styles.thumbnail}
                                />
                            </CardPreview>
                            <div className={styles.videoInfo}>
                                <Title3>{metadata?.title || video.title}</Title3>
                                <Text className={styles.channelInfo}>{metadata?.channelTitle || video.channel_title}</Text>

                                {/* Video Duration */}
                                <Text className={styles.channelInfo}>
                                    Duration: {video.duration}
                                </Text>

                                {/* Participants */}
                                <div className={styles.participantList}>
                                    {Object.entries(groupRolesByUser(video.performance_video_roles)).map(([userId, userData]) => (
                                        <Tooltip
                                            key={userId}
                                            content={userData.roles.join(', ')}
                                            relationship="label"
                                        >
                                            <div className={styles.participantTag}>
                                                <Avatar
                                                    className={styles.avatar}
                                                    name={userData.nickname}
                                                    size={16}
                                                />
                                                <Text size={200}>{userData.nickname}</Text>
                                            </div>
                                        </Tooltip>
                                    ))}
                                </div>

                                {/* Social Actions */}
                                <div className={styles.socialActions}>
                                    <Button
                                        appearance="subtle"
                                        icon={videoLikes[video.id] ? <HeartFilled /> : <HeartRegular />}
                                        size="small"
                                        onClick={() => handleLike(video.id)}
                                    >
                                        Like
                                    </Button>
                                    <Button
                                        appearance="subtle"
                                        icon={<ChatRegular />}
                                        size="small"
                                        onClick={() => handleCommentsClick(video.id)}
                                    >
                                        Comment
                                    </Button>
                                </div>

                                {/* Play Button */}
                                <Button
                                    appearance="primary"
                                    icon={<PlayRegular />}
                                    onClick={() => {
                                        setCurrentVideoIndex(index)
                                        setIsPlaying(true)
                                    }}
                                    style={{ marginTop: tokens.spacingVerticalM }}
                                >
                                    {index === currentVideoIndex && isPlaying ? 'Playing' : 'Play'}
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Comments Dialog */}
            <Dialog open={isCommentsOpen} onOpenChange={(e, data) => {
                if (!data.open) {
                    setIsCommentsOpen(false)
                    setSelectedVideoId(null)
                    setNewComment('')
                }
            }}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Comments</DialogTitle>
                        <DialogContent>
                            <div className={styles.commentsList}>
                                {videoComments[selectedVideoId]?.map((comment) => (
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

            {/* Floating YouTube Player */}
            {performance.performance_videos?.length > 0 && (
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
                            disabled={currentVideoIndex === performance.performance_videos.length - 1}
                        />
                        <Text className={styles.currentVideoInfo}>
                            {(() => {
                                const currentVideo = performance.performance_videos[currentVideoIndex]
                                const videoId = extractVideoId(currentVideo.youtube_url)
                                return videoMetadata[videoId]?.title || currentVideo.title
                            })()}
                        </Text>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RegularPerformanceVideoPage 