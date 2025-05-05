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
} from '@fluentui/react-components'
import {
    EditRegular,
    AddRegular,
    SaveRegular,
    DismissRegular,
    ListRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
})

function RegularPerformanceAdminPage() {
    const styles = useStyles()
    const navigate = useNavigate()
    const { isAdmin, isDevelopment } = useAuth()
    const [performances, setPerformances] = useState([])
    const [playlists, setPlaylists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedPerformance, setEditedPerformance] = useState(null)

    useEffect(() => {
        // Only redirect if not admin and not in development
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
                .select('*')
                .order('date', { ascending: false })

            if (performancesError) throw performancesError

            // Fetch playlists
            const { data: playlistsData, error: playlistsError } = await supabase
                .from('playlists')
                .select('*')
                .order('created_at', { ascending: false })

            if (playlistsError) throw playlistsError

            setPerformances(performancesData || [])
            setPlaylists(playlistsData || [])
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
            location: performance.location || '',
            playlist_id: performance.playlist_id || '',
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
                        location: editedPerformance.location,
                        playlist_id: editedPerformance.playlist_id,
                    })
                    .eq('id', editedPerformance.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            } else {
                // Create new performance
                const result = await supabase
                    .from('regular_performances')
                    .insert({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location: editedPerformance.location,
                        playlist_id: editedPerformance.playlist_id,
                    })
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            setPerformances(performances.map(p =>
                p.id === data.id ? data : p
            ))
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
                                location: '',
                                playlist_id: '',
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
                    <Input
                        value={editedPerformance.location}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Performance location"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Dropdown
                        value={editedPerformance.playlist_id}
                        onOptionSelect={(e, data) => setEditedPerformance(prev => ({ ...prev, playlist_id: data.optionValue }))}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    >
                        <Option value="">Select a playlist</Option>
                        {playlists.map(playlist => (
                            <Option key={playlist.id} value={playlist.id}>
                                {playlist.title}
                            </Option>
                        ))}
                    </Dropdown>
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
                    {performances.map((performance) => {
                        const playlist = playlists.find(p => p.id === performance.playlist_id)
                        return (
                            <Card key={performance.id} className={styles.videoCard}>
                                <CardPreview>
                                    {playlist?.thumbnail_url ? (
                                        <img
                                            src={playlist.thumbnail_url}
                                            alt={performance.title}
                                            className={styles.thumbnail}
                                        />
                                    ) : (
                                        <div className={styles.thumbnail} style={{ backgroundColor: tokens.colorNeutralBackground3 }}>
                                            <ListRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
                                        </div>
                                    )}
                                </CardPreview>
                                <div className={styles.videoInfo}>
                                    <Title3>{performance.title}</Title3>
                                    <Text className={styles.channelInfo}>
                                        {new Date(performance.date).toLocaleDateString()} - {performance.location}
                                    </Text>
                                    {performance.description && (
                                        <Text className={styles.description}>{performance.description}</Text>
                                    )}
                                    {playlist && (
                                        <Text className={styles.channelInfo}>
                                            Playlist: {playlist.title}
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
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default RegularPerformanceAdminPage 