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
    const { isAdmin, isDevelopment, userProfile } = useAuth()
    const [performances, setPerformances] = useState([])
    const [users, setUsers] = useState([])
    const [playlists, setPlaylists] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedPerformance, setEditedPerformance] = useState(null)

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
                    id,
                    title,
                    description,
                    date,
                    location,
                    created_at,
                    updated_at,
                    performance_videos (
                        id,
                        title,
                        performance_video_roles (
                            role,
                            user_profiles (
                                id,
                                nickname
                            )
                        )
                    )
                `)
                .order('date', { ascending: false })

            if (performancesError) {
                console.error('Error in performances fetch:', performancesError)
                throw performancesError
            }

            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles')
                .select('id, nickname')
                .order('nickname')

            if (usersError) {
                console.error('Error in users fetch:', usersError)
                throw usersError
            }

            setPerformances(performancesData || [])
            setUsers(usersData || [])
        } catch (error) {
            console.error('Error caught in fetchData:', error.message)
            console.error('Error stack:', error.stack)
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
                        location: editedPerformance.location,
                    })
                    .eq('id', editedPerformance.id)
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) {
                    console.error('Error in performance update:', error)
                    throw error
                }
            } else {
                // Create new performance
                const result = await supabase
                    .from('regular_performances')
                    .insert({
                        title: editedPerformance.title,
                        description: editedPerformance.description,
                        date: editedPerformance.date,
                        location: editedPerformance.location,
                    })
                    .select()
                    .single();
                data = result.data;
                error = result.error;

                if (error) {
                    console.error('Error in performance creation:', error)
                    throw error
                }
            }

            await fetchData();
            setIsEditing(false)
            setEditedPerformance(null)
        } catch (error) {
            console.error('Error caught in handleSave:', error.message)
            console.error('Error stack:', error.stack)
            setError(error.message)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setEditedPerformance(null)
    }

    const handleOpenVideoDialog = (performance) => {
        navigate(`/regular-performance/admin/${performance.id}/videos`)
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
                    <Input
                        value={editedPerformance.location}
                        onChange={(e) => setEditedPerformance(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Location"
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    <Label>Participants</Label>
                    <Combobox
                        multiselect
                        value={editedPerformance.participants.map(id => users.find(u => u.id === id)?.nickname || '')}
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
                                    {user.nickname || 'Anonymous'}
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
                                    {new Date(performance.date).toLocaleDateString()} - {performance.location}
                                </Text>
                                {performance.description && (
                                    <Text className={styles.description}>{performance.description}</Text>
                                )}
                                {performance.performance_videos?.length > 0 && (
                                    <Text className={styles.channelInfo}>
                                        Participants: {performance.performance_videos
                                            .flatMap(video => video.performance_video_roles || [])
                                            .map(role => role.user_profiles?.nickname || 'Anonymous')
                                            .filter((name, index, self) => self.indexOf(name) === index)
                                            .join(', ')}
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
        </div>
    )
}

export default RegularPerformanceAdminPage 