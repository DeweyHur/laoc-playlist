import { useState, useEffect } from 'react'
import {
    Title3,
    Text,
    makeStyles,
    tokens,
    Button,
    Spinner,
    MessageBar,
    MessageBarBody,
    Input,
    Combobox,
    Listbox,
    Option as ComboboxOption,
} from '@fluentui/react-components'
import {
    AddRegular,
    DismissRegular,
    PersonRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { extractVideoId } from '../lib/youtubeUtils'

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
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
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
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    },
    roleList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalS,
    },
    roleTag: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
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
    channelInfo: {
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalXS,
    },
})

function PerformanceVideoManagePage() {
    const styles = useStyles()
    const navigate = useNavigate()
    const { performanceId } = useParams()
    const { isAdmin, isDevelopment, userProfile } = useAuth()
    const [performance, setPerformance] = useState(null)
    const [videos, setVideos] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [newVideoUrl, setNewVideoUrl] = useState('')
    const [newVideoUser, setNewVideoUser] = useState('')
    const [newVideoRoles, setNewVideoRoles] = useState([])
    const [editingStates, setEditingStates] = useState({})

    useEffect(() => {
        if (!loading && !isAdmin() && !isDevelopment) {
            navigate('/regular-performance')
        }
    }, [loading, isAdmin, isDevelopment, navigate])

    useEffect(() => {
        fetchData()
    }, [performanceId])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch performance
            const { data: performanceData, error: performanceError } = await supabase
                .from('regular_performances')
                .select('*')
                .eq('id', performanceId)
                .single()

            if (performanceError) throw performanceError

            // Fetch videos
            const { data: videosData, error: videosError } = await supabase
                .from('performance_videos')
                .select(`
                    *,
                    roles:performance_video_roles(
                        role,
                        user:user_profiles!performance_video_roles_user_id_fkey(email)
                    )
                `)
                .eq('performance_id', performanceId)
                .order('created_at', { ascending: true })

            if (videosError) throw videosError

            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles_with_email')
                .select('*')
                .order('email')

            if (usersError) throw usersError

            setPerformance(performanceData)
            setVideos(videosData || [])
            setUsers(usersData || [])
        } catch (error) {
            console.error('Error fetching data:', error.message)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddVideo = async () => {
        try {
            const videoId = extractVideoId(newVideoUrl)
            if (!videoId) {
                setError('Invalid YouTube URL')
                return
            }

            // Fetch video metadata from YouTube API
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`)
            const data = await response.json()

            if (!data.items?.[0]) {
                setError('Video not found')
                return
            }

            const video = data.items[0]
            const { snippet, contentDetails } = video

            // Insert video
            const { data: videoData, error: videoError } = await supabase
                .from('performance_videos')
                .insert({
                    performance_id: performanceId,
                    youtube_url: newVideoUrl,
                    title: snippet.title,
                    channel_title: snippet.channelTitle,
                    thumbnail_url: snippet.thumbnails.high.url,
                    duration: contentDetails.duration,
                })
                .select()
                .single()

            if (videoError) throw videoError

            // Add roles if specified
            if (newVideoUser && newVideoRoles.length > 0) {
                const roleInserts = newVideoRoles.map(role => ({
                    video_id: videoData.id,
                    role: role,
                    user_id: newVideoUser,
                }))

                const { error: roleError } = await supabase
                    .from('performance_video_roles')
                    .insert(roleInserts)

                if (roleError) throw roleError
            }

            // Refresh videos
            const { data: updatedVideos, error: fetchError } = await supabase
                .from('performance_videos')
                .select(`
                    *,
                    roles:performance_video_roles(
                        role,
                        user:user_profiles!performance_video_roles_user_id_fkey(email)
                    )
                `)
                .eq('performance_id', performanceId)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError

            setVideos(updatedVideos || [])
            setNewVideoUrl('')
            setNewVideoUser('')
            setNewVideoRoles([])
        } catch (error) {
            console.error('Error adding video:', error.message)
            setError(error.message)
        }
    }

    const handleAddRole = async (videoId) => {
        try {
            const editingState = editingStates[videoId]
            if (!editingState?.user || editingState?.roles.length === 0) {
                setError('Please specify both user and at least one role')
                return
            }

            // Find the user ID from the email
            const selectedUser = users.find(u => u.email === editingState.user)
            if (!selectedUser) {
                throw new Error('User not found')
            }

            // Check if performer already exists for this video
            const { data: existingRoles, error: checkError } = await supabase
                .from('performance_video_roles')
                .select('*')
                .eq('video_id', videoId)
                .eq('user_id', selectedUser.id)

            if (checkError) throw checkError

            if (existingRoles && existingRoles.length > 0) {
                // Delete existing roles for this user
                const { error: deleteError } = await supabase
                    .from('performance_video_roles')
                    .delete()
                    .eq('video_id', videoId)
                    .eq('user_id', selectedUser.id)

                if (deleteError) throw deleteError
            }

            // Insert new roles
            const roleInserts = editingState.roles.map(role => ({
                video_id: videoId,
                role: role,
                user_id: selectedUser.id,
            }))

            const { error } = await supabase
                .from('performance_video_roles')
                .insert(roleInserts)

            if (error) throw error

            // Refresh videos
            const { data: updatedVideos, error: fetchError } = await supabase
                .from('performance_videos')
                .select(`
                    *,
                    roles:performance_video_roles(
                        role,
                        user:user_profiles!performance_video_roles_user_id_fkey(email)
                    )
                `)
                .eq('performance_id', performanceId)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError

            setVideos(updatedVideos || [])
            // Clear the editing state for this video
            setEditingStates(prev => {
                const newState = { ...prev }
                delete newState[videoId]
                return newState
            })
        } catch (error) {
            console.error('Error updating roles:', error.message)
            setError(error.message)
        }
    }

    // Helper function to group roles by user
    const groupRolesByUser = (roles) => {
        const userRoles = {}
        roles.forEach(role => {
            const email = role.user.email
            if (!userRoles[email]) {
                userRoles[email] = []
            }
            userRoles[email].push(role.role)
        })
        return userRoles
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner label="Loading videos..." />
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
                <Title3>Manage Videos - {performance?.title}</Title3>
                <Button
                    appearance="secondary"
                    onClick={() => navigate('/regular-performance/admin')}
                >
                    Back to Performances
                </Button>
            </div>

            <div className={styles.form}>
                <Input
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="YouTube URL"
                />
                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Combobox
                        value={users.find(u => u.id === newVideoUser)?.display_name || ''}
                        onOptionSelect={(e, data) => setNewVideoUser(data.optionValue)}
                        placeholder="Select User"
                        style={{ flex: 1 }}
                    >
                        <Listbox>
                            {users.map(user => (
                                <ComboboxOption key={user.id} value={user.id}>
                                    {user.display_name}
                                </ComboboxOption>
                            ))}
                        </Listbox>
                    </Combobox>
                    <Combobox
                        value={newVideoRoles.join(', ')}
                        onOptionSelect={(e, data) => {
                            const role = data.optionValue
                            if (!newVideoRoles.includes(role)) {
                                setNewVideoRoles([...newVideoRoles, role])
                            }
                        }}
                        placeholder="Select Roles"
                        style={{ flex: 1 }}
                    >
                        <Listbox>
                            <ComboboxOption value="Drum">Drum</ComboboxOption>
                            <ComboboxOption value="Guitar">Guitar</ComboboxOption>
                            <ComboboxOption value="Bass">Bass</ComboboxOption>
                            <ComboboxOption value="Vocal">Vocal</ComboboxOption>
                            <ComboboxOption value="Keyboard">Keyboard</ComboboxOption>
                        </Listbox>
                    </Combobox>
                </div>
                {newVideoUser && newVideoRoles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                            <Text weight="semibold">
                                {users.find(u => u.id === newVideoUser)?.display_name}:
                            </Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS }}>
                                {newVideoRoles.map(role => (
                                    <div key={role} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: tokens.spacingHorizontalXS,
                                        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
                                        backgroundColor: tokens.colorNeutralBackground3,
                                        borderRadius: tokens.borderRadiusMedium,
                                    }}>
                                        <Text>{role}</Text>
                                        <Button
                                            appearance="subtle"
                                            icon={<DismissRegular />}
                                            onClick={() => setNewVideoRoles(newVideoRoles.filter(r => r !== role))}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={handleAddVideo}
                >
                    Add Video
                </Button>
            </div>

            <div className={styles.videoList}>
                {videos.map((video) => (
                    <div key={video.id} className={styles.videoItem}>
                        <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            style={{ width: '120px', borderRadius: tokens.borderRadiusSmall }}
                        />
                        <div style={{ flex: 1 }}>
                            <Title3>{video.title}</Title3>
                            <Text className={styles.channelInfo}>{video.channel_title}</Text>
                            <div className={styles.roleList}>
                                {Object.entries(groupRolesByUser(video.roles || [])).map(([email, roles]) => (
                                    <div key={email} className={styles.roleTag}>
                                        <PersonRegular />
                                        <Text>{email}: {roles.join(', ')}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
                            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                                <Combobox
                                    value={users.find(u => u.email === editingStates[video.id]?.user)?.display_name || ''}
                                    onOptionSelect={(e, data) => {
                                        const userId = data.optionValue
                                        const selectedUser = users.find(u => u.id === userId)
                                        const existingRoles = video.roles?.filter(role => role.user.email === selectedUser.email) || []
                                        setEditingStates(prev => ({
                                            ...prev,
                                            [video.id]: {
                                                ...prev[video.id],
                                                user: selectedUser.email,
                                                roles: existingRoles.map(role => role.role)
                                            }
                                        }))
                                    }}
                                    placeholder="Select User"
                                    style={{ flex: 1 }}
                                >
                                    <Listbox>
                                        {users.map(user => (
                                            <ComboboxOption key={user.id} value={user.id}>
                                                {user.display_name}
                                            </ComboboxOption>
                                        ))}
                                    </Listbox>
                                </Combobox>
                                <Combobox
                                    value={(editingStates[video.id]?.roles || []).join(', ')}
                                    onOptionSelect={(e, data) => {
                                        const role = data.optionValue
                                        setEditingStates(prev => ({
                                            ...prev,
                                            [video.id]: {
                                                ...prev[video.id],
                                                roles: prev[video.id].roles.includes(role)
                                                    ? prev[video.id].roles.filter(r => r !== role)
                                                    : [...prev[video.id].roles, role]
                                            }
                                        }))
                                    }}
                                    placeholder="Select Roles"
                                    style={{ flex: 1 }}
                                >
                                    <Listbox>
                                        <ComboboxOption value="Drum">Drum</ComboboxOption>
                                        <ComboboxOption value="Guitar">Guitar</ComboboxOption>
                                        <ComboboxOption value="Bass">Bass</ComboboxOption>
                                        <ComboboxOption value="Vocal">Vocal</ComboboxOption>
                                        <ComboboxOption value="Keyboard">Keyboard</ComboboxOption>
                                    </Listbox>
                                </Combobox>
                            </div>
                            {editingStates[video.id]?.user && editingStates[video.id]?.roles?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                                        <Text weight="semibold">
                                            {users.find(u => u.email === editingStates[video.id]?.user)?.display_name}:
                                        </Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS }}>
                                            {editingStates[video.id]?.roles.map(role => (
                                                <div key={role} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: tokens.spacingHorizontalXS,
                                                    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
                                                    backgroundColor: tokens.colorNeutralBackground3,
                                                    borderRadius: tokens.borderRadiusMedium,
                                                }}>
                                                    <Text>{role}</Text>
                                                    <Button
                                                        appearance="subtle"
                                                        icon={<DismissRegular />}
                                                        onClick={() => {
                                                            setEditingStates(prev => ({
                                                                ...prev,
                                                                [video.id]: {
                                                                    ...prev[video.id],
                                                                    roles: prev[video.id].roles.filter(r => r !== role)
                                                                }
                                                            }))
                                                        }}
                                                        size="small"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        appearance="secondary"
                                        icon={<AddRegular />}
                                        onClick={() => handleAddRole(video.id)}
                                    >
                                        {editingStates[video.id]?.user && video.roles?.some(role => role.user.email === editingStates[video.id].user)
                                            ? 'Edit Performer'
                                            : 'Add Performer'
                                        }
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default PerformanceVideoManagePage 