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
    Card,
    CardHeader,
    CardPreview,
    CardFooter,
    Input,
    Textarea,
    Dropdown,
    Option,
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Label,
    Combobox,
    Listbox,
    Option as ComboboxOption,
} from '@fluentui/react-components'
import {
    EditRegular,
    AddRegular,
    SaveRegular,
    DismissRegular,
    ListRegular,
    VideoRegular,
    PersonRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { extractVideoId } from '../lib/youtubeUtils'
import LocationAutocomplete from '../components/LocationAutocomplete'

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
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    videoList: {
        marginTop: tokens.spacingVerticalL,
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
})

function RegularPerformanceAdminPage() {
    const styles = useStyles()
    const navigate = useNavigate()
    const { isAdmin, isDevelopment } = useAuth()
    const [performances, setPerformances] = useState([])
    const [locations, setLocations] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedPerformance, setEditedPerformance] = useState(null)
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
    const [selectedPerformance, setSelectedPerformance] = useState(null)
    const [videos, setVideos] = useState([])
    const [newVideoUrl, setNewVideoUrl] = useState('')
    const [newVideoRole, setNewVideoRole] = useState('')
    const [newVideoUser, setNewVideoUser] = useState('')
    const [selectedLocation, setSelectedLocation] = useState(null)

    useEffect(() => {
        if (!loading && !isAdmin() && !isDevelopment) {
            navigate('/regular-performance')
        }
    }, [loading, isAdmin, isDevelopment, navigate])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch performances
            const { data: performancesData, error: performancesError } = await supabase
                .from('regular_performances')
                .select(`
                    *,
                    location:locations(name),
                    participants:performance_participants_with_users(*)
                `)
                .order('date', { ascending: false })

            if (performancesError) throw performancesError

            // Fetch locations
            const { data: locationsData, error: locationsError } = await supabase
                .from('locations')
                .select('*')
                .order('name')

            if (locationsError) throw locationsError

            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles_with_email')
                .select('*')
                .order('email')

            if (usersError) throw usersError

            setPerformances(performancesData || [])
            setLocations(locationsData || [])
            setUsers(usersData || [])
        } catch (error) {
            console.error('Error fetching data:', error.message)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (performance) => {
        setEditedPerformance({
            id: performance.id,
            title: performance.title,
            description: performance.description || '',
            date: performance.date,
            location_id: performance.location_id || '',
            participants: performance.participants?.map(p => p.user.id) || [],
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            let data, error;

            if (editedPerformance.id) {
                // Update existing performance
                const result = await supabase
                    .from('regular_performances')
                    .update({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location_id: editedPerformance.location_id,
                    })
                    .eq('id', editedPerformance.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) throw error;

                // Update participants
                const { error: participantsError } = await supabase
                    .from('performance_participants')
                    .delete()
                    .eq('performance_id', editedPerformance.id);

                if (participantsError) throw participantsError;

                if (editedPerformance.participants.length > 0) {
                    const { error: insertError } = await supabase
                        .from('performance_participants')
                        .insert(
                            editedPerformance.participants.map(userId => ({
                                performance_id: editedPerformance.id,
                                user_id: userId,
                            }))
                        );

                    if (insertError) throw insertError;
                }
            } else {
                // Create new performance
                const result = await supabase
                    .from('regular_performances')
                    .insert({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location_id: editedPerformance.location_id,
                    })
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) throw error;

                // Add participants
                if (editedPerformance.participants.length > 0) {
                    const { error: insertError } = await supabase
                        .from('performance_participants')
                        .insert(
                            editedPerformance.participants.map(userId => ({
                                performance_id: data.id,
                                user_id: userId,
                            }))
                        );

                    if (insertError) throw insertError;
                }
            }

            await fetchData();
            setIsEditing(false)
            setEditedPerformance(null)
        } catch (error) {
            console.error('Error updating performance:', error.message)
            setError(error.message)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditedPerformance(null)
    }

    const handleOpenVideoDialog = async (performance) => {
        setSelectedPerformance(performance)
        setIsVideoDialogOpen(true)

        // Fetch videos for this performance
        const { data, error } = await supabase
            .from('performance_videos')
            .select(`
                *,
                roles:performance_video_roles(
                    role,
                    user:users(email)
                )
            `)
            .eq('performance_id', performance.id)
            .order('created_at', { ascending: true })

        if (error) {
            setError(error.message)
            return
        }

        setVideos(data || [])
    }

    const handleAddVideo = async () => {
        try {
            const videoId = extractVideoId(newVideoUrl)
            if (!videoId) {
                setError('Invalid YouTube URL')
                return
            }

            // Fetch video metadata from YouTube API
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`)
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
                    performance_id: selectedPerformance.id,
                    youtube_url: newVideoUrl,
                    title: snippet.title,
                    channel_title: snippet.channelTitle,
                    thumbnail_url: snippet.thumbnails.high.url,
                    duration: contentDetails.duration,
                })
                .select()
                .single()

            if (videoError) throw videoError

            // Add role if specified
            if (newVideoRole && newVideoUser) {
                const { error: roleError } = await supabase
                    .from('performance_video_roles')
                    .insert({
                        video_id: videoData.id,
                        role: newVideoRole,
                        user_id: newVideoUser,
                    })

                if (roleError) throw roleError
            }

            // Refresh videos
            const { data: updatedVideos, error: fetchError } = await supabase
                .from('performance_videos')
                .select(`
                    *,
                    roles:performance_video_roles(
                        role,
                        user:users(email)
                    )
                `)
                .eq('performance_id', selectedPerformance.id)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError

            setVideos(updatedVideos || [])
            setNewVideoUrl('')
            setNewVideoRole('')
            setNewVideoUser('')
        } catch (error) {
            console.error('Error adding video:', error.message)
            setError(error.message)
        }
    }

    const handleAddRole = async (videoId) => {
        try {
            if (!newVideoRole || !newVideoUser) {
                setError('Please specify both role and user')
                return
            }

            const { error } = await supabase
                .from('performance_video_roles')
                .insert({
                    video_id,
                    role: newVideoRole,
                    user_id: newVideoUser,
                })

            if (error) throw error

            // Refresh videos
            const { data: updatedVideos, error: fetchError } = await supabase
                .from('performance_videos')
                .select(`
                    *,
                    roles:performance_video_roles(
                        role,
                        user:users(email)
                    )
                `)
                .eq('performance_id', selectedPerformance.id)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError

            setVideos(updatedVideos || [])
            setNewVideoRole('')
            setNewVideoUser('')
        } catch (error) {
            console.error('Error adding role:', error.message)
            setError(error.message)
        }
    }

    const handleLocationSelect = async (location) => {
        try {
            // Check if location already exists
            const { data: existingLocation } = await supabase
                .from('locations')
                .select('*')
                .eq('place_id', location.place_id)
                .single()

            if (existingLocation) {
                setSelectedLocation(existingLocation)
                setEditedPerformance(prev => ({
                    ...prev,
                    location_id: existingLocation.id
                }))
                return
            }

            // Create new location
            const { data: newLocation, error } = await supabase
                .from('locations')
                .insert({
                    name: location.name,
                    place_id: location.place_id,
                    address: location.address,
                    lat: location.lat,
                    lng: location.lng
                })
                .select()
                .single()

            if (error) throw error

            setSelectedLocation(newLocation)
            setEditedPerformance(prev => ({
                ...prev,
                location_id: newLocation.id
            }))
        } catch (error) {
            console.error('Error saving location:', error.message)
            setError(error.message)
        }
    }

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner label="Loading performances..." />
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
                <Title3>정모 플레이리스트 관리</Title3>
                {!isEditing && (
                    <Button
                        appearance="primary"
                        icon={<AddRegular />}
                        onClick={() => {
                            setEditedPerformance({
                                title: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0],
                                location_id: '',
                                participants: [],
                            })
                            setIsEditing(true)
                        }}
                    >
                        Add Performance
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className={styles.form}>
                    <Input
                        value={editedPerformance.title}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Performance title"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Textarea
                        value={editedPerformance.description}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Performance description"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Input
                        type="date"
                        value={editedPerformance.date}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, date: e.target.value }))}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <LocationAutocomplete
                        value={selectedLocation?.name || ''}
                        onChange={(value) => setSelectedLocation(prev => ({ ...prev, name: value }))}
                        onSelect={handleLocationSelect}
                    />
                    <Label>Participants</Label>
                    <Combobox
                        multiselect
                        value={editedPerformance.participants.map(id => users.find(u => u.id === id)?.display_name || '')}
                        onOptionSelect={(e, data) => {
                            const userId = data.optionValue
                            setEditedPerformance(prev => ({
                                ...prev,
                                participants: prev.participants.includes(userId)
                                    ? prev.participants.filter(id => id !== userId)
                                    : [...prev.participants, userId],
                            }))
                        }}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    >
                        <Listbox>
                            {users.map(user => (
                                <ComboboxOption key={user.id} value={user.id}>
                                    {user.display_name}
                                </ComboboxOption>
                            ))}
                        </Listbox>
                    </Combobox>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
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
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    {performances.map((performance) => (
                        <Card key={performance.id} className={styles.videoCard}>
                            <CardPreview>
                                <div className={styles.thumbnail} style={{ backgroundColor: tokens.colorNeutralBackground3 }}>
                                    <ListRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
                                </div>
                            </CardPreview>
                            <div className={styles.videoInfo}>
                                <Title3>{performance.title}</Title3>
                                <Text className={styles.channelInfo}>
                                    {new Date(performance.date).toLocaleDateString()} - {performance.location?.name}
                                </Text>
                                {performance.description && (
                                    <Text className={styles.description}>{performance.description}</Text>
                                )}
                                {performance.participants?.length > 0 && (
                                    <Text className={styles.channelInfo}>
                                        Participants: {performance.participants.map(p => p.user_email).join(', ')}
                                    </Text>
                                )}
                            </div>
                            <CardFooter>
                                <Button
                                    appearance="primary"
                                    icon={<EditRegular />}
                                    onClick={() => handleEdit(performance)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    appearance="secondary"
                                    icon={<VideoRegular />}
                                    onClick={() => handleOpenVideoDialog(performance)}
                                >
                                    Manage Videos
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isVideoDialogOpen} onOpenChange={(e, data) => setIsVideoDialogOpen(data.open)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Manage Videos - {selectedPerformance?.title}</DialogTitle>
                        <DialogContent>
                            <div className={styles.form}>
                                <Input
                                    value={newVideoUrl}
                                    onChange={(e) => setNewVideoUrl(e.target.value)}
                                    placeholder="YouTube URL"
                                    style={{ marginBottom: tokens.spacingVerticalM }}
                                />
                                <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                                    <Combobox
                                        value={newVideoRole}
                                        onOptionSelect={(e, data) => setNewVideoRole(data.optionValue)}
                                        placeholder="Role"
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
                                    <Combobox
                                        value={users.find(u => u.id === newVideoUser)?.display_name || ''}
                                        onOptionSelect={(e, data) => setNewVideoUser(data.optionValue)}
                                        placeholder="User"
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
                                </div>
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
                                                {video.roles?.map((role) => (
                                                    <div key={role.id} className={styles.roleTag}>
                                                        <PersonRegular />
                                                        <Text>{role.role}: {role.user.email}</Text>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                                            <Combobox
                                                value={newVideoRole}
                                                onOptionSelect={(e, data) => setNewVideoRole(data.optionValue)}
                                                placeholder="Role"
                                            >
                                                <Listbox>
                                                    <ComboboxOption value="Drum">Drum</ComboboxOption>
                                                    <ComboboxOption value="Guitar">Guitar</ComboboxOption>
                                                    <ComboboxOption value="Bass">Bass</ComboboxOption>
                                                    <ComboboxOption value="Vocal">Vocal</ComboboxOption>
                                                    <ComboboxOption value="Keyboard">Keyboard</ComboboxOption>
                                                </Listbox>
                                            </Combobox>
                                            <Combobox
                                                value={users.find(u => u.id === newVideoUser)?.display_name || ''}
                                                onOptionSelect={(e, data) => setNewVideoUser(data.optionValue)}
                                                placeholder="User"
                                            >
                                                <Listbox>
                                                    {users.map(user => (
                                                        <ComboboxOption key={user.id} value={user.id}>
                                                            {user.display_name}
                                                        </ComboboxOption>
                                                    ))}
                                                </Listbox>
                                            </Combobox>
                                            <Button
                                                appearance="secondary"
                                                icon={<AddRegular />}
                                                onClick={() => handleAddRole(video.id)}
                                            >
                                                Add Role
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                appearance="secondary"
                                onClick={() => setIsVideoDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    )
}

export default RegularPerformanceAdminPage 